from fastapi import APIRouter, UploadFile, File, HTTPException
from services.sketch_processor import SketchProcessor
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()
processor = SketchProcessor()

class Position(BaseModel):
    x: int
    y: int

class Room(BaseModel):
    id: int
    name: str
    width_ft: float
    length_ft: float
    color: str
    position: Position

class SketchAnalysisResponse(BaseModel):
    rooms: List[Room]
    wall_thickness_in: int
    raw_text: str
    metrics: dict

@router.post("/sketch/analyze", response_model=SketchAnalysisResponse)
async def analyze_sketch(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        content = await file.read()
        analysis = processor.process_sketch(content)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
