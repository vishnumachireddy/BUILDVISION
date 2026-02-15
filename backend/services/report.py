import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from io import BytesIO
import requests
from groq import Groq

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "gsk_placeholder") # Should be provided via env
client = Groq(api_key=GROQ_API_KEY)

def get_osm_static_map(lat: float, lon: float, zoom: int = 17, size_x: int = 600, size_y: int = 400):
    """
    Fetch a satellite/map image from OSM (via staticmap service or similar)
    Since OSM doesn't have a direct static API like Google, we use a public instance 
    or just return a placeholder link for demo.
    """
    # Using a free static map service for OSM
    map_url = f"https://static-maps.yandex.ru/1.x/?ll={lon},{lat}&z={zoom}&l=sat&size={size_x},{size_y}"
    try:
        response = requests.get(map_url)
        if response.status_code == 200:
            return BytesIO(response.content)
    except:
        return None
    return None

def generate_ai_summary(project_data: dict):
    """
    Use Groq to generate a professional executive summary.
    """
    if "placeholder" in GROQ_API_KEY:
        return "This is a professional AI-generated summary placeholder. (Groq API Key not configured)"
    
    prompt = f"""
    Act as a professional civil engineer. Generate a 3-sentence executive summary for a construction project:
    - Area: {project_data['area_sqft']} sqft
    - Floors: {project_data['floors']}
    - Type: {project_data['bhk_type']}
    - Estimate Cost: ₹{project_data['total_cost']}
    Ensure it sounds authoritative and helpful.
    """
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Summary generation unavailable: {str(e)}"

def generate_pdf_report(project_data: dict, output_path: str):
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph(f"ConstructIQ - Project Report: {project_data['name']}", styles['Title']))
    elements.append(Spacer(1, 12))

    # AI Summary
    summary = generate_ai_summary(project_data)
    elements.append(Paragraph("Executive Summary", styles['Heading2']))
    elements.append(Paragraph(summary, styles['Normal']))
    elements.append(Spacer(1, 12))

    # Map Snapshot
    elements.append(Paragraph("Site Snapshot (Satellite View)", styles['Heading2']))
    map_img_data = get_osm_static_map(project_data['lat'], project_data['lon'])
    if map_img_data:
        img = Image(map_img_data, width=400, height=250)
        elements.append(img)
    else:
        elements.append(Paragraph("[Satellite Map Unavailable]", styles['Normal']))
    elements.append(Spacer(1, 12))

    # Bill of Quantities (Table)
    elements.append(Paragraph("Material Estimate", styles['Heading2']))
    data = [["Material", "Quantity", "Unit"]]
    for k, v in project_data['materials'].items():
        unit = "Bags" if "cement" in k else "Kg" if "steel" in k else "Tons" if "sand" in k or "aggregate" in k else "Liters" if "paint" in k else "SqFt"
        data.append([k.replace("_", " ").title(), str(v), unit])

    t = Table(data, colWidths=[150, 100, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 12))

    # Cost Breakdown
    elements.append(Paragraph("Cost Breakdown", styles['Heading2']))
    cost_data = [["Category", "Cost (₹)"]]
    for k, v in project_data['costs'].items():
        if k != "total_cost":
            cost_data.append([k.replace("_", " ").title(), f"{v:,.2f}"])
    cost_data.append([Paragraph("<b>Total Estimated Cost</b>", styles['Normal']), f"<b>{project_data['costs']['total_cost']:,.2f}</b>"])
    
    ct = Table(cost_data, colWidths=[150, 100])
    ct.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    elements.append(ct)
    elements.append(Spacer(1, 24))

    # Soil Advisory
    if project_data.get('soil_advisory'):
        elements.append(Paragraph("Geotechnical Advisory (Soil)", styles['Heading2']))
        soil = project_data['soil_advisory']
        advisory_text = [
            f"<b>Soil Profile:</b> {soil.get('soil_type', 'Selected Profile')}",
            f"<b>Max Recommended Storeys:</b> {soil.get('safe_floors')}",
            f"<b>Foundation Type:</b> {soil.get('foundation')}",
            f"<b>Risk Level:</b> {soil.get('risk')}",
            f"<b>Notes:</b> {soil.get('note')}"
        ]
        for line in advisory_text:
            elements.append(Paragraph(line, styles['Normal']))
            elements.append(Spacer(1, 4))
        
        elements.append(Spacer(1, 12))
        elements.append(Paragraph("<b>Disclaimer:</b> Site-specific soil testing by certified engineer required.", 
                                 ParagraphStyle('Disclaimer', parent=styles['Normal'], textColor=colors.red)))

    doc.build(elements)
    return output_path
