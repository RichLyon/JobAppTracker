import os
import shutil
import datetime
from fastapi import UploadFile, HTTPException
from docx import Document
import tempfile

# Constants
RESUME_FOLDER = "resumes"
COVER_LETTER_FOLDER = "cover_letters"

# Ensure folders exist
os.makedirs(RESUME_FOLDER, exist_ok=True)
os.makedirs(COVER_LETTER_FOLDER, exist_ok=True)

async def save_uploaded_file(file: UploadFile, folder: str) -> str:
    """
    Save an uploaded file to the specified folder
    
    Args:
        file: The uploaded file
        folder: The folder to save to (RESUME_FOLDER or COVER_LETTER_FOLDER)
        
    Returns:
        str: The path to the saved file
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Create a unique filename
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Get original file extension
    original_filename = file.filename
    extension = os.path.splitext(original_filename)[1]
    
    if extension.lower() != '.docx':
        raise HTTPException(status_code=400, detail="Only .docx files are supported")
    
    filename = f"{timestamp}_{original_filename}"
    filepath = os.path.join(folder, filename)
    
    # Save the uploaded file
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            # Read the content in chunks and write to the temp file
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Move the temp file to the final destination
        shutil.move(temp_file_path, filepath)
        
        return filepath
    except Exception as e:
        # Clean up if there's an error
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")

def get_document_text(doc_path: str) -> str:
    """
    Extract text content from a DOCX file
    
    Args:
        doc_path: Path to the DOCX file
        
    Returns:
        str: Text content of the document
    """
    try:
        doc = Document(doc_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading document: {str(e)}")
