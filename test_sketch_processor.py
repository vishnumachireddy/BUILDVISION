import sys
import os

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.sketch_processor import SketchProcessor
import numpy as np
import cv2

def test_fallback():
    processor = SketchProcessor()
    
    # Create a dummy image (white background with a black rectangle)
    img = np.ones((500, 500, 3), dtype=np.uint8) * 255
    cv2.rectangle(img, (100, 100), (400, 400), (0, 0, 0), 2)
    
    # Encode to bytes
    _, buffer = cv2.imencode('.png', img)
    image_bytes = buffer.tobytes()
    
    print("Testing processing without OCR...")
    try:
        result = processor.process_sketch(image_bytes)
        print("Success!")
        print(f"Detected Rooms: {result['metrics']['detected_rooms']}")
        print(f"Raw Text Extraction: {result['raw_text']}")
        for room in result['rooms']:
            print(f"Found: {room['name']} ({room['width_ft']}x{room['length_ft']})")
    except Exception as e:
        print(f"Failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_fallback()
