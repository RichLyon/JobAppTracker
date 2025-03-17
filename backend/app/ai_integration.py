import requests
import os
import yaml
from fastapi import HTTPException
from app.database import get_user_information
import litellm
from litellm import completion
from typing import Optional, Dict, List, Literal
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load LLM config from YAML file
def load_llm_config():
    config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "llm_config.yaml")
    try:
        with open(config_path, 'r') as file:
            return yaml.safe_load(file)
    except Exception as e:
        print(f"Error loading LLM config: {e}")
        # Return default config if file not found or invalid
        return {
            "default_provider": "ollama",
            "models": {
                "ollama": "qwen2.5:14b",
                "openai": "gpt-4o",
                "anthropic": "claude-3-5-sonnet-latest"
            },
            "api": {
                "ollama": {
                    "url": "http://localhost:11434/api/generate"
                }
            }
        }

# Load configuration
LLM_CONFIG = load_llm_config()

# Get API URL from config
OLLAMA_API_URL = LLM_CONFIG["api"]["ollama"]["url"]

# Default models for each provider
DEFAULT_MODELS = LLM_CONFIG["models"]

class LLMSettings:
    """Class to handle LLM provider settings and configuration"""
    
    def __init__(self):
        # Get default provider from config
        self.provider = LLM_CONFIG["default_provider"]
        self.models = DEFAULT_MODELS.copy()
        
        # Load API keys from environment variables
        self.api_keys = {
            "openai": os.getenv("OPENAI_API_KEY", ""),
            "anthropic": os.getenv("ANTHROPIC_API_KEY", "")
        }
    
    def update_settings(self, 
                        provider: Optional[str] = None, 
                        openai_api_key: Optional[str] = None,
                        anthropic_api_key: Optional[str] = None,
                        openai_model: Optional[str] = None,
                        anthropic_model: Optional[str] = None,
                        ollama_model: Optional[str] = None):
        """Update LLM provider settings"""
        if provider:
            self.provider = provider
        
        # Update API keys in memory and in .env file
        if openai_api_key:
            self.api_keys["openai"] = openai_api_key
            # We're not updating the .env file here to keep changes temporary
            # os.environ["OPENAI_API_KEY"] = openai_api_key
        
        if anthropic_api_key:
            self.api_keys["anthropic"] = anthropic_api_key
            # os.environ["ANTHROPIC_API_KEY"] = anthropic_api_key
            
        if openai_model:
            self.models["openai"] = openai_model
            
        if anthropic_model:
            self.models["anthropic"] = anthropic_model
            
        if ollama_model:
            self.models["ollama"] = ollama_model
    
    def get_current_model(self):
        """Get the current model based on selected provider"""
        return self.models.get(self.provider, DEFAULT_MODELS[self.provider])
    
    def get_settings(self):
        """Get all LLM settings"""
        return {
            "provider": self.provider,
            "models": self.models,
            "api_keys": {
                # Mask API keys for security
                "openai": bool(self.api_keys["openai"]),
                "anthropic": bool(self.api_keys["anthropic"])
            }
        }

# Initialize global settings
llm_settings = LLMSettings()

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

def check_openai_availability():
    """
    Check if OpenAI API is available with the current API key
    
    Returns:
        tuple: (available (bool), error message (str or None))
    """
    api_key = llm_settings.api_keys["openai"] or os.getenv("OPENAI_API_KEY", "")
    
    if not api_key:
        return False, "OpenAI API key not configured"
    
    try:
        # Set the API key for the check
        os.environ["OPENAI_API_KEY"] = api_key
        
        # Use litellm to test the connection with a minimal prompt
        litellm.completion(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "test"}],
            max_tokens=10
        )
        return True, None
    except Exception as e:
        return False, str(e)
    finally:
        # Restore original environment variable if it was changed temporarily
        if "OPENAI_API_KEY" in os.environ and os.environ["OPENAI_API_KEY"] != api_key:
            os.environ["OPENAI_API_KEY"] = api_key

def check_anthropic_availability():
    """
    Check if Anthropic API is available with the current API key
    
    Returns:
        tuple: (available (bool), error message (str or None))
    """
    api_key = llm_settings.api_keys["anthropic"] or os.getenv("ANTHROPIC_API_KEY", "")
    
    if not api_key:
        return False, "Anthropic API key not configured"
    
    try:
        # Set the API key for the check
        os.environ["ANTHROPIC_API_KEY"] = api_key
        
        # Use litellm to test the connection with a minimal prompt
        litellm.completion(
            model="anthropic/claude-3-haiku-20240307",
            messages=[{"role": "user", "content": "test"}],
            max_tokens=10
        )
        return True, None
    except Exception as e:
        return False, str(e)
    finally:
        # Restore original environment variable if it was changed temporarily
        if "ANTHROPIC_API_KEY" in os.environ and os.environ["ANTHROPIC_API_KEY"] != api_key:
            os.environ["ANTHROPIC_API_KEY"] = api_key

def check_provider_availability(provider: str = None):
    """
    Check if the specified LLM provider is available
    
    Args:
        provider: The LLM provider to check (default: current provider)
        
    Returns:
        tuple: (available (bool), error message (str or None))
    """
    if provider is None:
        provider = llm_settings.provider
        
    if provider == "ollama":
        return check_ollama_availability()
    elif provider == "openai":
        return check_openai_availability()
    elif provider == "anthropic":
        return check_anthropic_availability()
    else:
        return False, f"Unknown provider: {provider}"

def generate_text_with_ollama(prompt, model=None):
    """
    Generate text using Ollama API
    
    Args:
        prompt: The prompt to send to Ollama
        model: The model to use (default: current Ollama model in settings)
        
    Returns:
        str: The generated text
    """
    if model is None:
        model = llm_settings.models["ollama"]
        
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

def generate_text_with_litellm(prompt, provider=None, model=None):
    """
    Generate text using LiteLLM with specified provider
    
    Args:
        prompt: The prompt to send to the LLM
        provider: The provider to use (default: current provider in settings)
        model: The model to use (default: current model for the provider in settings)
        
    Returns:
        str: The generated text
    """
    if provider is None:
        provider = llm_settings.provider
        
    if model is None:
        model = llm_settings.models[provider]
    
    # Check if provider is available
    available, error = check_provider_availability(provider)
    if not available:
        raise HTTPException(
            status_code=503,
            detail=f"{provider.capitalize()} is not available. Details: {error}"
        )
    
    try:
        # Use direct Ollama API for Ollama provider
        if provider == "ollama":
            return generate_text_with_ollama(prompt, model)
            
        # Use LiteLLM for cloud providers with API keys from settings or environment
        if provider == "openai":
            api_key = llm_settings.api_keys["openai"] or os.getenv("OPENAI_API_KEY", "")
            os.environ["OPENAI_API_KEY"] = api_key
            litellm_model = f"openai/{model}"
        elif provider == "anthropic":
            api_key = llm_settings.api_keys["anthropic"] or os.getenv("ANTHROPIC_API_KEY", "")
            os.environ["ANTHROPIC_API_KEY"] = api_key
            litellm_model = f"anthropic/{model}"
        else:
            raise ValueError(f"Unsupported provider: {provider}")
        
        # Call LiteLLM completion
        response = litellm.completion(
            model=litellm_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        # Extract response text
        return response.choices[0].message.content
    except Exception as e:
        error_msg = str(e)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating text with {provider}: {error_msg}"
        )

def generate_text(prompt):
    """
    Generate text using the currently configured LLM provider
    
    Args:
        prompt: The prompt to send to the LLM
        
    Returns:
        str: The generated text
    """
    return generate_text_with_litellm(prompt)

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
    
    return generate_text(prompt)

def generate_cover_letter(
    job_description: str, 
    company_name: str, 
    position: str, 
    resume_text: str,
    applicant_name: str = '',
    applicant_email: str = '',
    applicant_phone: str = '',
    applicant_address: str = ''
) -> str:
    """
    Generate a cover letter based on job description and resume
    
    Args:
        job_description: The job description
        company_name: The company name
        position: The position being applied for
        resume_text: Text content of the resume
        applicant_name: Applicant's full name (optional, will pull from profile if not provided)
        applicant_email: Applicant's email (optional, will pull from profile if not provided)
        applicant_phone: Applicant's phone number (optional, will pull from profile if not provided)
        applicant_address: Applicant's address (optional, will pull from profile if not provided)
        
    Returns:
        str: Generated cover letter text
    """
    # Get today's date formatted as Month Day, Year
    today_date = __import__('datetime').datetime.now().strftime("%B %d, %Y")
    
    # Get user information from profile if not provided
    if not all([applicant_name, applicant_email, applicant_phone, applicant_address]):
        user_info = get_user_information()
        applicant_name = applicant_name or user_info.get('full_name', '')
        applicant_email = applicant_email or user_info.get('email', '')
        applicant_phone = applicant_phone or user_info.get('phone', '')
        applicant_address = applicant_address or user_info.get('address', '')
    
    # Build contact info section
    contact_info = ""
    if applicant_name:
        contact_info += f"Name: {applicant_name}\n"
    if applicant_email:
        contact_info += f"Email: {applicant_email}\n"
    if applicant_phone:
        contact_info += f"Phone: {applicant_phone}\n"
    if applicant_address:
        contact_info += f"Address: {applicant_address}\n"
    
    prompt = f"""
    Write a professional cover letter for a {position} position at {company_name}.
    
    Today's date is: {today_date}
    
    My contact information:
    {contact_info}
    
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
    9. Use {today_date} as the date in the cover letter
    10. Include my name ({applicant_name}) at the appropriate spots
    11. Include my name, email, phone number, and address at the top of the cover letter.
    12. Include a closing with my name.
    
    IMPORTANT: ONLY output the exact text of the cover letter itself, the contact info, and sign off. DO NOT include any explanations, notes, or other text outside the cover letter.
    """
    
    return generate_text(prompt)
