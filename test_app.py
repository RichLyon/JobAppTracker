import sqlite3
import os
import datetime
from main import add_job_application, get_job_application, update_job_application, delete_job_application

def test_database_operations():
    print("Testing database operations...")
    
    # Ensure the database exists
    if not os.path.exists("job_applications.db"):
        print("Database not found. Please run the main application first.")
        return False
    
    # Test adding a job application
    print("\n1. Adding a sample job application...")
    job_id = add_job_application(
        company_name="Test Company",
        position="Software Developer",
        date_applied=datetime.datetime.now().strftime("%Y-%m-%d"),
        job_description="This is a test job description for a software developer position.",
        status="Applied",
        salary_info="$100,000 - $120,000",
        contact_info="recruiter@testcompany.com",
        application_url="https://testcompany.com/careers",
        notes="This is a test note."
    )
    print(f"Job application added with ID: {job_id}")
    
    # Test retrieving a job application
    print("\n2. Retrieving the job application...")
    job = get_job_application(job_id)
    if job:
        print(f"Retrieved job application: {job['company_name']} - {job['position']}")
        print(f"Status: {job['status']}")
    else:
        print("Failed to retrieve job application.")
        return False
    
    # Test updating a job application
    print("\n3. Updating the job application status...")
    update_job_application(job_id, status="Interviewing")
    job = get_job_application(job_id)
    if job and job['status'] == "Interviewing":
        print(f"Updated job application status to: {job['status']}")
    else:
        print("Failed to update job application status.")
        return False
    
    # Test deleting a job application
    print("\n4. Deleting the job application...")
    success = delete_job_application(job_id)
    if success:
        print(f"Deleted job application with ID: {job_id}")
        # Verify deletion
        job = get_job_application(job_id)
        if job is None:
            print("Verified job application was deleted.")
        else:
            print("Failed to verify job application deletion.")
            return False
    else:
        print("Failed to delete job application.")
        return False
    
    print("\nAll database operations completed successfully!")
    return True

if __name__ == "__main__":
    test_database_operations()
