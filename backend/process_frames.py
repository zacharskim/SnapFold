"""
Process poker hand frames and extract data using Ollama.
Reads PNG files from frames/ folder and extracts structured JSON.
"""

import os
import json
import base64
import requests
from pathlib import Path
from typing import Optional, Dict, Any

# Configuration
FRAMES_DIR = Path("../frames")
OUTPUT_DIR = Path("../extracted_hands")
OLLAMA_API_URL = "http://localhost:8000/process-frame"
MODEL = "llama3.2-vision:11b"
TIMEOUT_SECONDS = 120  # Wait up to 2 minutes per frame

# Create output directory if it doesn't exist
OUTPUT_DIR.mkdir(exist_ok=True)

def encode_image_to_base64(image_path: str) -> str:
    """Encode an image file to base64 string."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

def extract_poker_data_from_frame(image_path: str) -> Optional[Dict[str, Any]]:
    """
    Send frame to Ollama and extract poker hand data as JSON.

    Args:
        image_path: Path to PNG frame

    Returns:
        Extracted data as dict, or None if extraction failed
    """
    try:
        # Encode image
        image_base64 = encode_image_to_base64(image_path)

        # Create extraction prompt
        prompt = """Extract all poker hand information from this screenshot and return ONLY valid JSON (no other text).

Return JSON with these fields:
{
  "hand_id": "hand number if visible",
  "game_type": "Holdem/Omaha/etc",
  "stakes": "blind amounts like $0.01/$0.02",
  "timestamp": "date/time if visible",
  "table_name": "table name if visible",
  "max_seats": "6-max/9-max/etc or number",
  "button_seat": "button seat number if visible",
  "players": [{"seat": 1, "name": "player name", "stack": "stack amount"}],
  "current_street": "Pre-flop/Flop/Turn/River/Showdown/Summary/Unknown",
  "board_cards": ["4c", "8d", "6c"],
  "hole_cards": ["Tc", "7c"],
  "actions": ["action descriptions"],
  "showdown_info": "who showed what, results",
  "winner": "winner name and hand description",
  "pots": "pot amounts and rake",
  "raw_text": "any readable text from the screenshot"
}

If a field is not visible or cannot be determined, use null. Return ONLY the JSON object."""

        # Call Ollama API
        payload = {
            "image_data": f"data:image/png;base64,{image_base64}",
            "prompt": prompt,
            "model": MODEL
        }

        response = requests.post(OLLAMA_API_URL, json=payload, timeout=TIMEOUT_SECONDS)

        if response.status_code != 200:
            print(f"  [ERROR] API error: {response.status_code}")
            return None

        result = response.json()
        response_text = result.get("response", "")

        # Parse JSON from response
        try:
            # Try to find JSON in the response (Ollama might include extra text)
            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1

            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                extracted_data = json.loads(json_str)
                return extracted_data
            else:
                print(f"  [ERROR] No JSON found in response")
                return None

        except json.JSONDecodeError as e:
            print(f"  [ERROR] JSON parse error: {e}")
            return None

    except requests.exceptions.ConnectionError:
        print(f"  [ERROR] Connection error - is the API running?")
        return None
    except Exception as e:
        print(f"  [ERROR] {e}")
        return None

def process_all_frames():
    """Process all PNG frames in frames/ directory."""

    if not FRAMES_DIR.exists():
        print(f"[ERROR] Frames directory not found: {FRAMES_DIR}")
        return

    # Get all PNG files sorted by frame number
    frame_files = sorted(FRAMES_DIR.glob("frame_*.png"),
                        key=lambda x: int(x.stem.split("_")[1]))

    if not frame_files:
        print(f"[ERROR] No frame_*.png files found in {FRAMES_DIR}")
        return

    print(f"Found {len(frame_files)} frames to process")
    print(f"Output will be saved to {OUTPUT_DIR}\n")

    successful = 0
    failed = 0

    for i, frame_path in enumerate(frame_files):
        frame_num = frame_path.stem.split("_")[1]
        print(f"[{i+1}/{len(frame_files)}] Processing frame_{frame_num}.png...", end=" ")

        # Extract data
        extracted_data = extract_poker_data_from_frame(str(frame_path))

        if extracted_data:
            # Save to JSON file
            output_file = OUTPUT_DIR / f"frame_{frame_num}_extracted.json"
            with open(output_file, "w") as f:
                json.dump(extracted_data, f, indent=2)
            print("[OK] Saved")
            successful += 1
        else:
            print("[SKIP] Skipped")
            failed += 1

    print(f"\n{'='*50}")
    print(f"Processing complete!")
    print(f"[OK] Successful: {successful}")
    print(f"[SKIP] Failed/Skipped: {failed}")
    print(f"Extracted data saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    process_all_frames()
