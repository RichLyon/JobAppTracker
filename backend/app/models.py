from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

# Helper function to get current timestamp
def get_current_timestamp():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Base Models
class UserBase(BaseModel):
    full_name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: str

class JobApplicationBase(BaseModel):
    company_name: str
    position: str
    date_applied: str
    job_description: Optional[str] = None
    status: str
    salary_info: Optional[str] = None
    contact_info: Optional[str] = None
    application_url: Optional[str] = None
    notes: Optional[str] = None

# Request Models
class UserCreate(UserBase):
    pass

class JobApplicationCreate(JobApplicationBase):
    pass

class JobApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    position: Optional[str] = None
    date_applied: Optional[str] = None
    job_description: Optional[str] = None
    status: Optional[str] = None
    salary_info: Optional[str] = None
    contact_info: Optional[str] = None
    application_url: Optional[str] = None
    notes: Optional[str] = None
    resume_path: Optional[str] = None
    cover_letter_path: Optional[str] = None

# Response Models
class User(UserBase):
    id: int
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True

class JobApplication(JobApplicationBase):
    id: int
    resume_path: Optional[str] = None
    cover_letter_path: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True

# Additional specialized models
class ResumeCustomizationRequest(BaseModel):
    job_id: Optional[int] = None
    job_description: Optional[str] = None

class CoverLetterGenerationRequest(BaseModel):
    job_id: Optional[int] = None
    company_name: Optional[str] = None
    position: Optional[str] = None
    job_description: Optional[str] = None

class DocumentResponse(BaseModel):
    document_path: str
    content_preview: str

class StatusUpdateRequest(BaseModel):
    status: str

class JobApplicationStatistics(BaseModel):
    total_applications: int
    status_counts: dict
    recent_applications: List[JobApplication]
    applications_by_month: dict
