import requests
from fastapi import HTTPException

# Constants
OLLAMA_API_URL = "http://localhost:11434/api/generate"

def check_ollama_availability():
    """
    Check if Ollama API is available
    
    Returns:
        tuple: (available (bool), error message (str or None))
    """
    try:
        response = requests.get("http://localhost:11434/api/version")
        response.raise_for_status()
        return True, None
    except Exception as e:
        return False, str(e)

def generate_text_with_ollama(prompt, model="qwen2.5:14b"):
    """
    Generate text using Ollama API
    
    Args:
        prompt: The prompt to send to Ollama
        model: The model to use (default: qwen2.5:14b)
        
    Returns:
        str: The generated text
    """
    # Check if Ollama is available
    available, error = check_ollama_availability()
    if not available:
        raise HTTPException(
            status_code=503, 
            detail=f"Ollama is not available. Please make sure Ollama is running. Details: {error}"
        )
    
    try:
        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            }
        )
        response.raise_for_status()
        return response.json().get("response", "")
    except Exception as e:
        error_msg = str(e)
        if "404" in error_msg:
            raise HTTPException(
                status_code=503,
                detail="The API endpoint was not found. Please check if Ollama is running correctly and the API URL is correct."
            )
        elif "Connection refused" in error_msg:
            raise HTTPException(
                status_code=503,
                detail="Connection refused. Please make sure Ollama is running."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Error generating text with Ollama: {error_msg}"
            )

def generate_resume_suggestions(job_description: str) -> str:
    """
    Generate resume tailoring suggestions based on a job description
    
    Args:
        job_description: The job description to analyze
        
    Returns:
        str: Tailoring suggestions for the resume
    """
    prompt = f"""
    I have a job description and need to customize my resume for it.
    
    Job Description:
    {job_description}
    
    Please analyze this job description and provide specific suggestions on how I should tailor my resume.
    Focus on:
    1. Skills to emphasize
    2. Experience to highlight
    3. Achievements that would be most relevant
    4. Keywords to include
    
    Format your response as specific, actionable bullet points I can use to modify my resume.
    """
    
    return generate_text_with_ollama(prompt)

def generate_cover_letter(job_description: str, company_name: str, position: str, resume_text: str) -> str:
    """
    Generate a cover letter based on job description and resume
    
    Args:
        job_description: The job description
        company_name: The company name
        position: The position being applied for
        resume_text: Text content of the resume
        
    Returns:
        str: Generated cover letter text
    """
    prompt = f"""
    Write a professional cover letter for a {position} position at {company_name}.
    
    Job Description:
    {job_description}
    
    My Resume:
    {resume_text}
    
    The cover letter should:
    1. Be professionally formatted
    2. Highlight relevant skills and experience from my resume that match the job requirements
    3. Show enthusiasm for the role and company
    4. Include a strong opening and closing
    5. Be approximately 300-400 words
    6. Only mention skills and experience that are actually in my resume
    7. Specifically mention the company name ({company_name}) and position ({position})
    8. Reference specific requirements or qualifications from the job description
    
    Write the complete cover letter text, ready to be used.
    """
    
    return generate_text_with_ollama(prompt)
