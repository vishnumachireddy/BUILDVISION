import requests
import json

def test_generate_plan():
    url = "http://localhost:8000/api/generate-plan"
    payload = {
        "coordinates": [
            [17.3850, 78.4867],
            [17.3850, 78.4870],
            [17.3853, 78.4870],
            [17.3853, 78.4867],
            [17.3850, 78.4867]
        ],
        "floors": 1
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            layout = data.get("layout_plan", {})
            rooms = layout.get("rooms", [])
            walls = layout.get("walls", [])
            print(f"Success! Rooms: {len(rooms)}, Walls: {len(walls)}")
            if len(rooms) == 0:
                print("WARNING: Zero rooms returned!")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    test_generate_plan()
