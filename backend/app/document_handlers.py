import os
from docx import Document
from docx.shared import Pt
import datetime
from fastapi import HTTPException

from app.ai_integration import generate_resume_suggestions, generate_cover_letter
from app.file_handler import get_document_text

# Constants
RESUME_FOLDER = "resumes"
COVER_LETTER_FOLDER = "cover_letters"

def create_custom_resume(base_resume_path, job_description, output_path=None):
    """
    Create a customized resume based on job description using AI suggestions
    
    Args:
        base_resume_path: Path to the base resume file
        job_description: Job description to customize for
        output_path: Optional custom output path
        
    Returns:
        tuple: (output_path, tailoring_suggestions)
    """
    if not os.path.exists(base_resume_path):
        raise HTTPException(status_code=404, detail="Resume file not found")
    
    # Generate tailoring suggestions using Ollama
    tailoring_suggestions = generate_resume_suggestions(job_description)
    
    try:
        # Load the base resume
        doc = Document(base_resume_path)
        
        # Add tailoring suggestions at the end
        # Check if the style exists in the document
        try:
            doc.add_heading("Tailoring Suggestions", level=1)
        except KeyError:
            # If the style doesn't exist, use a paragraph with manual formatting
            p = doc.add_paragraph("Tailoring Suggestions")
            p.runs[0].bold = True
            p.runs[0].font.size = Pt(16)  # Approximate size for Heading 1
        
        doc.add_paragraph(tailoring_suggestions)
        
        # Save the customized resume
        if not output_path:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = os.path.join(RESUME_FOLDER, f"custom_resume_{timestamp}.docx")
        
        doc.save(output_path)
        return output_path, tailoring_suggestions
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating custom resume: {str(e)}")

def create_cover_letter(job_description, company_name, position, resume_path, output_path=None):
    """
    Create a cover letter based on job description, company, position and resume
    
    Args:
        job_description: Job description text
        company_name: Company name
        position: Position title
        resume_path: Path to the resume file
        output_path: Optional custom output path
        
    Returns:
        tuple: (output_path, cover_letter_text)
    """
    if not os.path.exists(resume_path):
        raise HTTPException(status_code=404, detail="Resume file not found")
    
    # Extract resume content
    resume_text = get_document_text(resume_path)
    
    # Generate cover letter using Ollama
    cover_letter_text = generate_cover_letter(job_description, company_name, position, resume_text)
    
    try:
        # Create a new document
        doc = Document()
        
        # Add date
        doc.add_paragraph(datetime.datetime.now().strftime("%B %d, %Y"))
        doc.add_paragraph()
        
        # Add company info placeholders
        doc.add_paragraph("Hiring Manager")
        doc.add_paragraph(f"{company_name}")
        doc.add_paragraph("Company Address")
        doc.add_paragraph("City, State ZIP")
        doc.add_paragraph()
        
        # Add greeting
        doc.add_paragraph("Dear Hiring Manager,")
        
        # Add cover letter content
        paragraphs = cover_letter_text.split('\n\n')
        for para in paragraphs:
            if para.strip():
                doc.add_paragraph(para.strip())
        
        # Add closing
        doc.add_paragraph()
        doc.add_paragraph("Sincerely,")
        doc.add_paragraph()
        doc.add_paragraph("[Your Name]")
        
        # Save the cover letter
        if not output_path:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = os.path.join(COVER_LETTER_FOLDER, f"cover_letter_{timestamp}.docx")
        
        doc.save(output_path)
        return output_path, cover_letter_text
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating cover letter: {str(e)}")
