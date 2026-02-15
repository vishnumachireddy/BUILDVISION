import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_boq_generation():
    print("\n--- Testing BOQ Generation (Dynamic Rates) ---")
    # Approx 50ft x 50ft plot in Mumbai
    lat, lng = 19.0760, 72.8777
    delta = 0.00014 # ~15m
    payload = {
        "coordinates": [
            [lat, lng], 
            [lat + delta, lng], 
            [lat + delta, lng + delta], 
            [lat, lng + delta], 
            [lat, lng]
        ],
        "floors": 1,
        "state": "Maharashtra",
        "district": "Mumbai",
        "quality_mode": "Premium"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/generate-plan", json=payload)
        data = response.json()
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            cost = data['cost_estimate']
            print(f"Total Cost: {cost['total_estimated_cost']}")
            print(f"Detected Location: {cost['location_detected']}")
            print(f"Rate Updated: {cost['rate_updated']}")
            print(f"Quality: {cost['quality_mode']}")
            
            assert cost['location_detected'] == "Maharashtra, Mumbai"
            assert cost['quality_mode'] == "Premium"
        else:
            print(f"Error: {data}")
    except Exception as e:
        print(f"Connection Failed: {e}")

def test_rate_update():
    print("\n--- Testing Material Rate Update ---")
    payload = {
        "state": "Maharashtra",
        "district": "Mumbai",
        "rates": {
            "cement_bag": 550,
            "steel_kg": 85
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/update-material-rate", json=payload)
        print(f"Update Status: {response.status_code}")
        print(f"Update Response: {response.json()}")
        
        # Verify update
        boq_payload = {
            "coordinates": [
                [lat, lng], 
                [lat + delta, lng], 
                [lat + delta, lng + delta], 
                [lat, lng + delta], 
                [lat, lng]
            ],
            "floors": 1,
            "state": "Maharashtra",
            "district": "Mumbai"
        }
        boq_resp = requests.post(f"{BASE_URL}/generate-plan", json=boq_payload)
        boq_data = boq_resp.json()
        print(f"New Total Cost: {boq_data['cost_estimate']['total_estimated_cost']}")
    except Exception as e:
        print(f"Update Failed: {e}")

if __name__ == "__main__":
    test_boq_generation()
    test_rate_update()
