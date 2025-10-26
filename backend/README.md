# SnapFold OCR Backend

FastAPI backend for the SnapFold OCR Electron app. Handles image processing with local Ollama models.

## Setup

### Prerequisites
- Python 3.8+
- Ollama installed and running (`ollama serve`)

### Installation

1. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Start Ollama (in another terminal):**
```bash
ollama serve
```

3. **Pull a vision model (first time only):**
```bash
ollama pull llava
```

### Running the Backend

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /health
```
Returns status of backend and Ollama connection.

### Process Single Frame
```
POST /process-frame
Content-Type: application/json

{
  "image_data": "base64_encoded_image_or_data_uri",
  "prompt": "What do you see?",
  "model": "llava"
}
```

### Process Multiple Frames
```
POST /process-frames-batch
Content-Type: application/json

[
  {
    "image_data": "...",
    "prompt": "...",
    "model": "llava"
  },
  ...
]
```
