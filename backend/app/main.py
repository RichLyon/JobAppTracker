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
    JobApplicationStatistics,
    LLMSettingsUpdate,
    LLMSettingsResponse,
    LLMAvailabilityCheckRequest,
    LLMAvailabilityResponse
)
from app.file_handler import save_uploaded_file, RESUME_FOLDER, COVER_LETTER_FOLDER
from app.ai_integration import (
    check_ollama_availability,
    check_provider_availability,
    llm_settings
)
from app.utils import update_env_file
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

# AI service status endpoints
@app.get("/api/ollama/status")
async def ollama_status():
    """Check if Ollama is available"""
    available, error = check_ollama_availability()
    if available:
        return {"status": "available"}
    else:
        return {"status": "unavailable", "error": error}

@app.get("/api/llm/settings", response_model=LLMSettingsResponse)
async def get_llm_settings():
    """Get current LLM settings"""
    return llm_settings.get_settings()

@app.post("/api/llm/settings", response_model=LLMSettingsResponse)
async def update_llm_settings(settings: LLMSettingsUpdate):
    """Update LLM settings"""
    # Extract settings from the request
    update_args = {}
    
    # Only include non-None values
    if settings.provider is not None:
        update_args["provider"] = settings.provider
    if settings.openai_api_key is not None:
        update_args["openai_api_key"] = settings.openai_api_key
    if settings.anthropic_api_key is not None:
        update_args["anthropic_api_key"] = settings.anthropic_api_key
    if settings.openai_model is not None:
        update_args["openai_model"] = settings.openai_model
    if settings.anthropic_model is not None:
        update_args["anthropic_model"] = settings.anthropic_model
    if settings.ollama_model is not None:
        update_args["ollama_model"] = settings.ollama_model
    
    # Update settings in memory
    llm_settings.update_settings(**update_args)
    
    # Save API keys to .env file if provided
    if settings.openai_api_key is not None or settings.anthropic_api_key is not None:
        update_env_file(
            openai_api_key=settings.openai_api_key if settings.openai_api_key is not None else None,
            anthropic_api_key=settings.anthropic_api_key if settings.anthropic_api_key is not None else None
        )
    
    # Return updated settings
    return llm_settings.get_settings()

@app.post("/api/llm/check-availability", response_model=LLMAvailabilityResponse)
async def check_llm_availability(request: LLMAvailabilityCheckRequest):
    """Check if a specific LLM provider is available"""
    available, error = check_provider_availability(request.provider)
    return {
        "provider": request.provider,
        "available": available,
        "error": error if not available else None
    }

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
        notes=application.notes,
        resume_path=None,
        cover_letter_path=None,
        uploaded_resume_path=application.uploaded_resume_path
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
@app.get("/api/resumes")
async def list_resumes():
    """List all available resumes"""
    if not os.path.exists(RESUME_FOLDER):
        os.makedirs(RESUME_FOLDER, exist_ok=True)
        return {"resumes": []}
    
    resumes = []
    for filename in os.listdir(RESUME_FOLDER):
        if filename.endswith(".docx"):
            filepath = os.path.join(RESUME_FOLDER, filename)
            # Get file creation/modification time for sorting
            file_stats = os.stat(filepath)
            resumes.append({
                "filename": filename,
                "path": filepath,
                "created_at": datetime.datetime.fromtimestamp(file_stats.st_ctime).isoformat()
            })
    
    # Sort by creation time, newest first
    resumes.sort(key=lambda x: x["created_at"], reverse=True)
    return {"resumes": resumes}

@app.post("/api/resumes/upload")
async def upload_resume(resume: UploadFile = File(...)):
    """Upload a resume file"""
    filepath = await save_uploaded_file(resume, RESUME_FOLDER)
    return {"filename": os.path.basename(filepath), "path": filepath}

@app.post("/api/resumes/customize", response_model=DocumentResponse)
async def customize_resume(
    resume: Optional[UploadFile] = File(None),
    job_id: Optional[int] = Form(None),
    job_description: Optional[str] = Form(None),
    resume_path: Optional[str] = Form(None),
    company_name: Optional[str] = Form(None),
    position: Optional[str] = Form(None)
):
    """Customize a resume based on job description"""
    try:
        # Log incoming request data for debugging
        print(f"DEBUG - Customize Resume Request Parameters:")
        print(f"  job_id: {job_id}")
        print(f"  job_description length: {len(job_description) if job_description else 0}")
        print(f"  resume_path: {resume_path}")
        print(f"  Resume file provided: {resume is not None}")
        print(f"  company_name: {company_name}")
        print(f"  position: {position}")
        
        # Check if we have the necessary data
        if not job_description and not job_id:
            raise HTTPException(status_code=400, detail="Either job_id or job_description is required")
        
        # Get job details if job_id is provided
        if job_id:
            job = get_job_application(job_id)
            job_description = job["job_description"]
            # Use job details for company/position if not explicitly provided
            if not company_name:
                company_name = job["company_name"]
            if not position:
                position = job["position"]
            # Use the resume associated with the job if available and no new resume provided
            if not resume and not resume_path:
                resume_path = job.get("resume_path")
        
        # If a new resume was uploaded, use that
        if resume:
            print(f"DEBUG - Processing uploaded resume file: {resume.filename}")
            resume_path = await save_uploaded_file(resume, RESUME_FOLDER)
            print(f"DEBUG - Resume saved to: {resume_path}")
        
        if not resume_path:
            raise HTTPException(status_code=400, detail="No resume provided. Please upload a resume.")
        
        # Create the customized resume
        print(f"DEBUG - Creating custom resume with path: {resume_path}")
        output_path, suggestions = create_custom_resume(
            resume_path, 
            job_description, 
            company_name, 
            position
        )
        
        return {
            "document_path": output_path,
            "content_preview": suggestions
        }
    except Exception as e:
        print(f"ERROR - Exception in customize_resume: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error customizing resume: {str(e)}")

@app.get("/api/resumes/{filename}")
async def download_resume(filename: str):
    """Download a resume file"""
    file_path = os.path.join(RESUME_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume not found")
    return FileResponse(file_path, filename=filename)

@app.delete("/api/resumes/{filename}")
async def delete_resume(filename: str):
    """Delete a resume file"""
    file_path = os.path.join(RESUME_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume not found")
    
    try:
        os.remove(file_path)
        return {"message": f"Resume {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting resume: {str(e)}")

# Cover Letter Endpoints
@app.post("/api/cover-letters/generate", response_model=DocumentResponse)
async def generate_cover_letter_endpoint(
    resume: Optional[UploadFile] = File(None),
    job_id: Optional[int] = Form(None),
    company_name: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    resume_path: Optional[str] = Form(None)
):
    """Generate a cover letter based on job details and resume"""
    try:
        # Log incoming request data for debugging
        print(f"DEBUG - Generate Cover Letter Request Parameters:")
        print(f"  job_id: {job_id}")
        print(f"  company_name: {company_name}")
        print(f"  position: {position}")
        print(f"  job_description length: {len(job_description) if job_description else 0}")
        print(f"  resume_path: {resume_path}")
        print(f"  Resume file provided: {resume is not None}")
        
        # Check if we have the necessary data
        if not job_id and (not company_name or not position or not job_description):
            raise HTTPException(
                status_code=400, 
                detail="Either job_id or (company_name, position, and job_description) are required"
            )
        
        # Get job details if job_id is provided
        if job_id:
            job = get_job_application(job_id)
            company_name = job["company_name"]
            position = job["position"]
            job_description = job["job_description"]
            # Use the resume associated with the job if available and no new resume provided
            if not resume and not resume_path:
                resume_path = job.get("resume_path")
        
        # If a new resume was uploaded, use that
        if resume:
            print(f"DEBUG - Processing uploaded resume file: {resume.filename}")
            resume_path = await save_uploaded_file(resume, RESUME_FOLDER)
            print(f"DEBUG - Resume saved to: {resume_path}")
        
        if not resume_path:
            raise HTTPException(status_code=400, detail="No resume provided. Please upload a resume.")
        
        # Create the cover letter
        output_path, cover_letter_text = create_cover_letter(
            job_description, company_name, position, resume_path
        )
        
        # If this is for an existing job, update the cover letter path
        if job_id:
            update_job_application(job_id, cover_letter_path=output_path)
        
        return {
            "document_path": output_path,
            "content_preview": cover_letter_text
        }
    except Exception as e:
        print(f"ERROR - Exception in generate_cover_letter: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error generating cover letter: {str(e)}")

@app.get("/api/cover-letters/{filename}")
async def download_cover_letter(filename: str):
    """Download a cover letter file"""
    file_path = os.path.join(COVER_LETTER_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return FileResponse(file_path, filename=filename)
