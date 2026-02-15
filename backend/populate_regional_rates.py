import json
import os

RATE_FILE = r"c:\Users\DESIGNER ADMIN\Videos\Open Innovation Kavach\OpenI\ConstructIQ\backend\data\material_rates.json"

def populate_districts():
    with open(RATE_FILE, "r") as f:
        data = json.load(f)

    # Andhra Pradesh (26 Districts)
    ap_districts = [
        "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", 
        "Prakasam", "Srikakulam", "Nellore", "Visakhapatnam", 
        "Vizianagaram", "West Godavari", "YSR Kadapa", "Parvathipuram Manyam", 
        "Alluri Sitharama Raju", "Anakapalli", "Kakinada", "Konaseema", "Eluru", 
        "NTR", "Bapatla", "Palnadu", "Nandyal", "Sri Sathya Sai", "Annamayya", "Tirupati"
    ]

    # Telangana (33 Districts)
    tg_districts = [
        "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", 
        "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", 
        "Khammam", "Kumuram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", 
        "Medak", "Medchal–Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", 
        "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", 
        "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", 
        "Wanaparthy", "Warangal", "Hanamkonda", "Yadadri Bhuvanagiri"
    ]

    def get_mock_rates(is_metro=False):
        base = {
            "cement": 420, "steel": 78, "sand": 1600, "aggregate": 1200, "bricks": 12, "labor_index": 1.05
        }
        if is_metro:
            base = {
                "cement": 460, "steel": 84, "sand": 1900, "aggregate": 1450, "bricks": 15, "labor_index": 1.25
            }
        base["last_updated"] = "2026-02-15"
        return base

    data["Andhra Pradesh"] = {d: get_mock_rates(d in ["Visakhapatnam", "Vijayawada", "Tirupati"]) for d in ap_districts}
    data["Telangana"] = {d: get_mock_rates(d in ["Hyderabad", "Rangareddy", "Warangal"]) for d in tg_districts}

    with open(RATE_FILE, "w") as f:
        json.dump(data, f, indent=2)
    print("Populated AP and Telangana districts successfully.")

if __name__ == "__main__":
    populate_districts()
