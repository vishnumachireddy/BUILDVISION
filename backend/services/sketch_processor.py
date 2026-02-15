import cv2
import numpy as np
import pytesseract
import re
from PIL import Image
import io

class SketchProcessor:
    def __init__(self):
        # Tesseract path configuration might be needed if not in PATH
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        pass

    def process_sketch(self, image_bytes):
        # Convert bytes to OpenCV image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Invalid image data")

        # 1. Image Preprocessing (Grayscale, Blur, Threshold)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        # Using adaptive threshold to handle pencil sketch variation
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                     cv2.THRESH_BINARY_INV, 11, 2)

        # 2. OCR for Room Names and Dimensions (with Robust Fallback)
        ocr_text = ""
        rooms_detected = []
        try:
            ocr_text = pytesseract.image_to_string(gray)
            rooms_detected = self.parse_ocr(ocr_text)
        except Exception as e:
            print(f"OCR warning (skipping text recognition): {e}")
            ocr_text = "OCR unavailable (using geometry detection only)"

        # 3. Room Segmentation (Contour Detection)
        # We use a copy of thresh for finding contours
        contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        layout_rooms = []
        colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#0ea5e9', '#6366f1']
        
        # Filter and sort contours (top-left to bottom-right heuristically)
        valid_contours = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            if w > 40 and h > 40: # Noise filter
                valid_contours.append((x, y, w, h, cnt))
        
        # Sort by Y then X to give somewhat predictable numbering
        valid_contours.sort(key=lambda b: (b[1], b[0]))

        for i, (x, y, w, h, cnt) in enumerate(valid_contours):
            # Default room naming and scaling
            name = f"Room {i+1}"
            width_ft = round(w / 40, 1)  # Refined heuristic: 40px = 1ft
            length_ft = round(h / 40, 1)
            
            # Map OCR results to contours if available (crue positional matching)
            # In a production system, we'd use ROI intersection, but for now we fallback
            if i < len(rooms_detected):
                name = rooms_detected[i]['name']
                if 'width' in rooms_detected[i]:
                    width_ft = rooms_detected[i]['width']
                    length_ft = rooms_detected[i]['length']

            layout_rooms.append({
                "id": i,
                "name": name,
                "width_ft": width_ft,
                "length_ft": length_ft,
                "color": colors[i % len(colors)],
                "position": {"x": int(x), "y": int(y)}
            })

        # Final structured response
        return {
            "rooms": layout_rooms,
            "wall_thickness_in": 9,
            "raw_text": ocr_text,
            "metrics": {
                "detected_rooms": len(layout_rooms),
                "total_area_sqft": sum(r['width_ft'] * r['length_ft'] for r in layout_rooms)
            }
        }


    def parse_ocr(self, text):
        # Simple regex to find room names and dimensions like "Bedroom 12x14"
        results = []
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line: continue
            
            # Match "Name WxL" or "Name W x L"
            match = re.search(r'([a-zA-Z\s]+)\s+(\d+)\s*[xX]\s*(\d+)', line)
            if match:
                results.append({
                    "name": match.group(1).strip(),
                    "width": float(match.group(2)),
                    "length": float(match.group(3))
                })
            elif len(line) > 3: # Fallback just for room names
                results.append({"name": line})
        return results
