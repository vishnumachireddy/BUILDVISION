import requests

def test_v4_features():
    base_url = "http://localhost:8000/api"
    
    print("--- 1. Testing PIN Detection ---")
    pins = ["516360", "600001", "999999"]
    for pin in pins:
        r = requests.get(f"{base_url}/detect-location/{pin}")
        print(f"PIN {pin}: Status {r.status_code}, Data: {r.json()}")

    print("\n--- 2. Testing Soil Multiplier Impact ---")
    # Base case: Normal Red Soil (multiplier 1.05)
    payload_normal = {
        "plot_type": "Rectangle",
        "dimensions": {"length": 40, "width": 30},
        "requirements": {"bedrooms": 2, "bathrooms": 1},
        "floors": 1,
        "state": "Maharashtra",
        "district": "Mumbai",
        "quality_mode": "Standard",
        "soil_type": "Normal Red Soil"
    }
    r_normal = requests.post(f"{base_url}/generate-parametric-plan", json=payload_normal)
    cost_normal = r_normal.json()['cost_estimate']['total_estimated_cost']
    print(f"Normal Soil Cost: INR {cost_normal}")

    # Case 2: Black Cotton Soil (multiplier 1.25)
    payload_black = payload_normal.copy()
    payload_black["soil_type"] = "Black Cotton Soil"
    r_black = requests.post(f"{base_url}/generate-parametric-plan", json=payload_black)
    cost_black = r_black.json()['cost_estimate']['total_estimated_cost']
    print(f"Black Cotton Soil Cost: INR {cost_black}")

    increase = cost_black - cost_normal
    print(f"Cost Difference: INR {increase:.2f} (Expected increase due to foundation multiplier)")

    if cost_black > cost_normal:
        print("PASS: Soil multiplier correctly impacts total cost.")
    else:
        print("FAIL: No cost impact detected.")

    print("\n--- 3. Testing Multi-Floor Propagation ---")
    payload_3f = payload_normal.copy()
    payload_3f["floors"] = 3
    r_3f = requests.post(f"{base_url}/generate-parametric-plan", json=payload_3f)
    if r_3f.status_code == 200:
        data = r_3f.json()
        returned_floors = data['layout_plan'].get('floor_count')
        print(f"Requested Floors: 3, Returned floor_count: {returned_floors}")
        if returned_floors == 3:
            print("PASS: floor_count correctly propagated in response.")
        else:
            print(f"FAIL: floor_count mismatch. Got {returned_floors}")
    else:
        print(f"ERROR: Plan generation failed with status {r_3f.status_code}")

if __name__ == "__main__":
    test_v4_features()
