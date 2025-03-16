import os
import sqlite3
import datetime
from fastapi import HTTPException
from contextlib import contextmanager

# Constants
DB_PATH = "job_applications.db"
RESUME_FOLDER = "resumes"
COVER_LETTER_FOLDER = "cover_letters"

# Ensure folders exist
os.makedirs(RESUME_FOLDER, exist_ok=True)
os.makedirs(COVER_LETTER_FOLDER, exist_ok=True)

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def setup_database():
    """Set up the database tables if they don't exist"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Create job applications table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS job_applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL,
            position TEXT NOT NULL,
            date_applied TEXT NOT NULL,
            job_description TEXT,
            status TEXT NOT NULL,
            salary_info TEXT,
            contact_info TEXT,
            application_url TEXT,
            notes TEXT,
            resume_path TEXT,
            cover_letter_path TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        ''')
        
        # Create user information table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_information (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            email TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        ''')
        
        conn.commit()

def add_job_application(company_name, position, date_applied, job_description, status, 
                       salary_info=None, contact_info=None, application_url=None, notes=None,
                       resume_path=None, cover_letter_path=None):
    """Add a new job application to the database"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        cursor.execute('''
        INSERT INTO job_applications (
            company_name, position, date_applied, job_description, status,
            salary_info, contact_info, application_url, notes,
            resume_path, cover_letter_path, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            company_name, position, date_applied, job_description, status,
            salary_info, contact_info, application_url, notes,
            resume_path, cover_letter_path, now, now
        ))
        
        job_id = cursor.lastrowid
        conn.commit()
        
        return job_id

def update_job_application(job_id, **kwargs):
    """Update an existing job application"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Add updated_at timestamp
        kwargs['updated_at'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Build the SET clause for the SQL query
        set_clause = ", ".join([f"{key} = ?" for key in kwargs.keys()])
        values = list(kwargs.values())
        values.append(job_id)  # For the WHERE clause
        
        cursor.execute(f'''
        UPDATE job_applications
        SET {set_clause}
        WHERE id = ?
        ''', values)
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Job application with ID {job_id} not found")
        
        conn.commit()
        return True

def get_all_job_applications():
    """Get all job applications"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM job_applications ORDER BY date_applied DESC')
        rows = cursor.fetchall()
        
        applications = []
        for row in rows:
            applications.append(dict(row))
        
        return applications

def get_job_application(job_id):
    """Get a specific job application by ID"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM job_applications WHERE id = ?', (job_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Job application with ID {job_id} not found")
        
        return dict(row)

def delete_job_application(job_id):
    """Delete a job application and its associated files"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Get file paths before deletion
        cursor.execute('SELECT resume_path, cover_letter_path FROM job_applications WHERE id = ?', (job_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Job application with ID {job_id} not found")
        
        # Delete from database
        cursor.execute('DELETE FROM job_applications WHERE id = ?', (job_id,))
        
        conn.commit()
        
        # Delete associated files if they exist
        if row:
            resume_path, cover_letter_path = row
            if resume_path and os.path.exists(resume_path):
                os.remove(resume_path)
            if cover_letter_path and os.path.exists(cover_letter_path):
                os.remove(cover_letter_path)
        
        return True

def save_user_information(full_name, address, phone, email):
    """Save or update user information"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Check if user information already exists
        cursor.execute('SELECT COUNT(*) FROM user_information')
        count = cursor.fetchone()[0]
        
        if count > 0:
            # Update existing record
            cursor.execute('''
            UPDATE user_information
            SET full_name = ?, address = ?, phone = ?, email = ?, updated_at = ?
            WHERE id = 1
            ''', (full_name, address, phone, email, now))
        else:
            # Insert new record
            cursor.execute('''
            INSERT INTO user_information (
                full_name, address, phone, email, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            ''', (full_name, address, phone, email, now, now))
        
        conn.commit()
        return True

def get_user_information():
    """Get user information"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM user_information LIMIT 1')
        row = cursor.fetchone()
        
        return dict(row) if row else {"full_name": "", "address": "", "phone": "", "email": ""}
