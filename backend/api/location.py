from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional

router = APIRouter()

class LocationResponse(BaseModel):
    state: str
    district: str

# Structured dataset as requested
pin_database = {
    "516360": {"state": "Andhra Pradesh", "district": "Kadapa"},
    "600001": {"state": "Tamil Nadu", "district": "Chennai"},
    "500001": {"state": "Telangana", "district": "Hyderabad"},
    "400001": {"state": "Maharashtra", "district": "Mumbai"},
    "560001": {"state": "Karnataka", "district": "Bangalore"},
    "530001": {"state": "Andhra Pradesh", "district": "Visakhapatnam"},
    "520001": {"state": "Andhra Pradesh", "district": "Vijayawada"},
    "506001": {"state": "Telangana", "district": "Warangal"}
}

@router.get("/detect-location/{pin_code}", response_model=LocationResponse)
def detect_location(pin_code: str):
    if pin_code in pin_database:
        return pin_database[pin_code]
    raise HTTPException(status_code=404, detail="Invalid PIN or not available.")
