import json
import os
from typing import Dict, Any

RATE_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "material_rates.json")

def load_rates() -> Dict[str, Any]:
    if not os.path.exists(RATE_FILE):
        return {}
    with open(RATE_FILE, "r") as f:
        return json.load(f)

def save_rates(rates: Dict[str, Any]):
    os.makedirs(os.path.dirname(RATE_FILE), exist_ok=True)
    with open(RATE_FILE, "w") as f:
        json.dump(rates, f, indent=2)

def get_material_rates(state: str = None, district: str = None) -> Dict[str, float]:
    rates = load_rates()
    default_rates = rates.get("National_Default", {
        "cement": 400.0,
        "steel": 75.0,
        "sand": 1500.0,
        "aggregate": 1200.0,
        "bricks": 10.0,
        "labor_index": 1.0
    })

    if not state or state not in rates:
        return default_rates
    
    state_rates = rates[state]
    if not district or district not in state_rates:
        # If district not found, try to average or just return state default if exists
        # For simplicity, returning first district or default
        return default_rates

    return state_rates[district]

def update_district_rate(state: str, district: str, new_rates: Dict[str, float]):
    rates = load_rates()
    if state not in rates:
        rates[state] = {}
    
    if district not in rates[state]:
        rates[state][district] = {}
    
    rates[state][district].update(new_rates)
    rates[state][district]["last_updated"] = "2026-02-15" # Should ideally be current date
    save_rates(rates)
    return True
