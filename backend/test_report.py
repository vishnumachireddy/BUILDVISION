from services.report import generate_pdf_report
import os

project_data = {
    "name": "Test Project",
    "lat": 17.385,
    "lon": 78.486,
    "area_sqft": 1500,
    "floors": 2,
    "bhk_type": "3BHK",
    "total_cost": 4500000,
    "materials": {
        "cement_bags": 675,
        "steel_kg": 5250,
        "bricks_count": 13500,
        "sand_tons": 6,
        "aggregate_tons": 8.4,
        "paint_liters": 120,
        "flooring_sqft": 1350
    },
    "costs": {
        "material_cost": 2500000,
        "labor_cost": 1500000,
        "finishing_cost": 500000,
        "total_cost": 4500000
    }
}

output_file = "test_report.pdf"
try:
    generate_pdf_report(project_data, output_file)
    if os.path.exists(output_file):
        print(f"PDF generated successfully: {output_file}")
        # Clean up
        os.remove(output_file)
    else:
        print("PDF generation failed: File not found")
except Exception as e:
    print(f"PDF generation failed with error: {str(e)}")
