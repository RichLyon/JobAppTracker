import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List, Optional
import datetime
import collections

from app.database import (
    setup_database, 
    add_job_application, 
    update_job_application,
    get_all_job_applications, 
    get_job_application, 
    delete_job_application,
    save_user_information, 
    get_user_information
)
from app.models import (
    UserCreate, 
    JobApplicationCreate, 
    JobApplicationUpdate,
    User, 
    JobApplication, 
    ResumeCustomizationRequest,
    CoverLetterGenerationRequest, 
    DocumentResponse,
    StatusUpdateRequest,
    JobApplicationStatistics
)
from app.file_handler import save_uploaded_file, RESUME_FOLDER, COVER_LETTER_FOLDER
from app.ai_integration import check_ollama_availability
from app.document_handlers import create_custom_resume, create_cover_letter

# Create FastAPI app
app = FastAPI(
    title="Job Application Tracker API",
    description="API for managing job applications, resumes, and cover letters",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    setup_database()

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Check if the API is running"""
    return {"status": "ok", "timestamp": datetime.datetime.now().isoformat()}

# AI service check endpoint
@app.get("/api/ollama/status")
async def ollama_status():
    """Check if Ollama is available"""
    available, error = check_ollama_availability()
    if available:
        return {"status": "available"}
    else:
        return {"status": "unavailable", "error": error}

# User Information Endpoints
@app.post("/api/user", response_model=User)
async def create_or_update_user(user: UserCreate):
    """Create or update user information"""
    save_user_information(user.full_name, user.address, user.phone, user.email)
    return get_user_information()

@app.get("/api/user", response_model=User)
async def read_user():
    """Get user information"""
    return get_user_information()

# Job Application Endpoints
@app.post("/api/applications", response_model=JobApplication)
async def create_job_application(application: JobApplicationCreate):
    """Create a new job application"""
    job_id = add_job_application(
        company_name=application.company_name,
        position=application.position,
        date_applied=application.date_applied,
        job_description=application.job_description,
        status=application.status,
        salary_info=application.salary_info,
        contact_info=application.contact_info,
        application_url=application.application_url,
        notes=application.notes
    )
    return get_job_application(job_id)

@app.get("/api/applications", response_model=List[JobApplication])
async def read_job_applications(
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """
    Get all job applications with optional filtering
    
    - status: Filter by application status
    - search: Search in company name, position, job description
    - limit: Maximum number of results to return
    - offset: Number of results to skip
    """
    applications = get_all_job_applications()
    
    # Apply filters if provided
    if status:
        applications = [app for app in applications if app["status"] == status]
    
    if search:
        search = search.lower()
        filtered_apps = []
        for app in applications:
            if (search in app["company_name"].lower() or 
                search in app["position"].lower() or 
                (app["job_description"] and search in app["job_description"].lower())):
                filtered_apps.append(app)
        applications = filtered_apps
    
    # Apply pagination
    total = len(applications)
    applications = applications[offset:offset + limit]
    
    return applications

@app.get("/api/applications/{job_id}", response_model=JobApplication)
async def read_job_application(job_id: int):
    """Get a specific job application by ID"""
    return get_job_application(job_id)

@app.put("/api/applications/{job_id}", response_model=JobApplication)
async def update_job_application_endpoint(job_id: int, application: JobApplicationUpdate):
    """Update an existing job application"""
    # Filter out None values
    update_data = {k: v for k, v in application.dict().items() if v is not None}
    update_job_application(job_id, **update_data)
    return get_job_application(job_id)

@app.patch("/api/applications/{job_id}/status", response_model=JobApplication)
async def update_application_status(job_id: int, status_update: StatusUpdateRequest):
    """Update the status of a job application"""
    update_job_application(job_id, status=status_update.status)
    return get_job_application(job_id)

@app.delete("/api/applications/{job_id}")
async def delete_job_application_endpoint(job_id: int):
    """Delete a job application"""
    delete_job_application(job_id)
    return {"message": f"Job application with ID {job_id} deleted successfully"}

@app.get("/api/applications/stats/summary", response_model=JobApplicationStatistics)
async def get_application_statistics():
    """Get statistics about job applications"""
    applications = get_all_job_applications()
    
    # Calculate statistics
    status_counts = collections.Counter(app["status"] for app in applications)
    
    # Get applications by month
    applications_by_month = {}
    for app in applications:
        month = app["date_applied"][:7]  # YYYY-MM format
        if month in applications_by_month:
            applications_by_month[month] += 1
        else:
            applications_by_month[month] = 1
    
    # Sort applications by date, most recent first
    applications.sort(key=lambda x: x["date_applied"], reverse=True)
    recent_applications = applications[:5]  # Get 5 most recent
    
    return {
        "total_applications": len(applications),
        "status_counts": dict(status_counts),
        "recent_applications": recent_applications,
        "applications_by_month": applications_by_month
    }

# Resume Endpoints
@app.post("/api/resumes/upload")
async def upload_resume(resume: UploadFile = File(...)):
    """Upload a resume file"""
    filepath = await save_uploaded_file(resume, RESUME_FOLDER)
    return {"filename": os.path.basename(filepath), "path": filepath}

@app.post("/api/resumes/customize", response_model=DocumentResponse)
async def customize_resume(request: ResumeCustomizationRequest, resume: Optional[UploadFile] = None):
    """Customize a resume based on job description"""
    # Check if we have the necessary data
    if not request.job_description and not request.job_id:
        raise HTTPException(status_code=400, detail="Either job_id or job_description is required")
    
    # Get job details if job_id is provided
    if request.job_id:
        job = get_job_application(request.job_id)
        job_description = job["job_description"]
        # Use the resume associated with the job if available
        resume_path = job.get("resume_path")
    else:
        job_description = request.job_description
        resume_path = None
    
    # If a new resume was uploaded, use that
    if resume:
        resume_path = await save_uploaded_file(resume, RESUME_FOLDER)
    
    if not resume_path:
        raise HTTPException(status_code=400, detail="No resume provided. Please upload a resume.")
    
    # Create the customized resume
    output_path, suggestions = create_custom_resume(resume_path, job_description)
    
    return {
        "document_path": output_path,
        "content_preview": suggestions
    }

@app.get("/api/resumes/{filename}")
async def download_resume(filename: str):
    """Download a resume file"""
    file_path = os.path.join(RESUME_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume not found")
    return FileResponse(file_path, filename=filename)

# Cover Letter Endpoints
@app.post("/api/cover-letters/generate", response_model=DocumentResponse)
async def generate_cover_letter_endpoint(
    request: CoverLetterGenerationRequest,
    resume: Optional[UploadFile] = None
):
    """Generate a cover letter based on job details and resume"""
    # Check if we have the necessary data
    if not request.job_id and (not request.company_name or not request.position or not request.job_description):
        raise HTTPException(
            status_code=400, 
            detail="Either job_id or (company_name, position, and job_description) are required"
        )
    
    # Get job details if job_id is provided
    if request.job_id:
        job = get_job_application(request.job_id)
        company_name = job["company_name"]
        position = job["position"]
        job_description = job["job_description"]
        # Use the resume associated with the job if available
        resume_path = job.get("resume_path")
    else:
        company_name = request.company_name
        position = request.position
        job_description = request.job_description
        resume_path = None
    
    # If a new resume was uploaded, use that
    if resume:
        resume_path = await save_uploaded_file(resume, RESUME_FOLDER)
    
    if not resume_path:
        raise HTTPException(status_code=400, detail="No resume provided. Please upload a resume.")
    
    # Create the cover letter
    output_path, cover_letter_text = create_cover_letter(
        job_description, company_name, position, resume_path
    )
    
    # If this is for an existing job, update the cover letter path
    if request.job_id:
        update_job_application(request.job_id, cover_letter_path=output_path)
    
    return {
        "document_path": output_path,
        "content_preview": cover_letter_text
    }

@app.get("/api/cover-letters/{filename}")
async def download_cover_letter(filename: str):
    """Download a cover letter file"""
    file_path = os.path.join(COVER_LETTER_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return FileResponse(file_path, filename=filename)
