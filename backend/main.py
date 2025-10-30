import base64
import requests
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import io
from PIL import Image

app = FastAPI(title="SnapFold OCR Backend")

# Allow CORS for Electron app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama config
OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2-vision:11b"  # or your preferred model


class OllamaRequest(BaseModel):
    image_data: str  # base64 encoded image
    prompt: str = "What do you see in this image?"
    model: str = DEFAULT_MODEL


class OllamaResponse(BaseModel):
    response: str
    model: str
    prompt: str


@app.get("/")
async def root():
    return {"message": "SnapFold OCR Backend", "status": "running"}


@app.get("/health")
async def health_check():
    """Check if backend and Ollama are running"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
        ollama_status = "ok" if response.status_code == 200 else "error"
    except:
        ollama_status = "offline"

    return {
        "backend": "ok",
        "ollama": ollama_status,
        "ollama_url": OLLAMA_BASE_URL,
    }


@app.post("/process-frame")
async def process_frame(request: OllamaRequest) -> OllamaResponse:
    """
    Process a single frame with Ollama.

    Args:
        image_data: base64 encoded image
        prompt: Custom prompt for the model
        model: Ollama model to use (default: llama3.2-vision:11b)
    """
    try:
        # Decode base64 image
        if request.image_data.startswith("data:image"):
            # Handle data URI format
            image_data = request.image_data.split(",")[1]
        else:
            image_data = request.image_data

        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))

        # Re-encode to base64 for Ollama
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

    try:
        # Call Ollama API
        ollama_response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": request.model,
                "prompt": request.prompt,
                "images": [image_base64],
                "stream": False,
            },
            timeout=90,
        )

        if ollama_response.status_code != 200:
            raise HTTPException(
                status_code=ollama_response.status_code,
                detail=f"Ollama error: {ollama_response.text}",
            )

        result = ollama_response.json()

        return OllamaResponse(
            response=result.get("response", ""),
            model=request.model,
            prompt=request.prompt,
        )

    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Ollama service not running. Make sure Ollama is started with 'ollama serve'",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing frame: {str(e)}")


@app.post("/process-frames-batch")
async def process_frames_batch(frames: list[OllamaRequest]) -> list[OllamaResponse]:
    """
    Process multiple frames at once.
    """
    results = []
    for frame_request in frames:
        try:
            result = await process_frame(frame_request)
            results.append(result)
        except HTTPException as e:
            results.append(
                OllamaResponse(
                    response=f"Error: {e.detail}",
                    model=frame_request.model,
                    prompt=frame_request.prompt,
                )
            )
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
