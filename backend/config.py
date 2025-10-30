"""Configuration for SnapFold OCR Backend"""

# Ollama Configuration
OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2-vision:11b"  # Vision model for image analysis

# Custom Prompts
PROMPTS = {
    "ocr": "Extract all text from this image. Return only the text content.",
    "general": "Describe what you see in this image in detail.",
}

# FastAPI Configuration
API_HOST = "0.0.0.0"
API_PORT = 8000
DEBUG = True

# CORS
ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:8080", "*"]
