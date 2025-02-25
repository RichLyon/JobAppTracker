import requests

def test_ollama_connection():
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "qwen2.5:14b",
                "prompt": "Hello, are you working?",
                "stream": False
            }
        )
        response.raise_for_status()
        result = response.json().get("response", "")
        print("Ollama connection successful!")
        print(f"Response: {result}")
        return True
    except Exception as e:
        print(f"Error connecting to Ollama: {e}")
        return False

if __name__ == "__main__":
    test_ollama_connection()
