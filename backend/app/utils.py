import os
from dotenv import load_dotenv

def update_env_file(openai_api_key=None, anthropic_api_key=None):
    """
    Update the .env file with provided API keys
    
    Args:
        openai_api_key: OpenAI API key to save
        anthropic_api_key: Anthropic API key to save
    """
    # Get the path to the .env file in the root directory
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    env_path = os.path.join(root_dir, '.env')
    
    # Load existing variables
    load_dotenv(env_path)
    
    # Read existing .env file if it exists
    env_contents = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_contents[key] = value
    
    # Update API keys if provided
    if openai_api_key is not None:
        env_contents['OPENAI_API_KEY'] = openai_api_key
    
    if anthropic_api_key is not None:
        env_contents['ANTHROPIC_API_KEY'] = anthropic_api_key
    
    # Write the updated .env file
    with open(env_path, 'w') as f:
        for key, value in env_contents.items():
            f.write(f"{key}={value}\n")
