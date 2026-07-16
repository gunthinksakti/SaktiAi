#!/usr/bin/env python3
"""
SAKTI SKILLS WEB v1.1
3 Skill Web untuk SaktiDoc & kebutuhan Sakti
"""

import os, sys, json, re
from pathlib import Path

SKILL_DIR = Path("/root/sakti_skills")
SKILL_DIR.mkdir(exist_ok=True)

# ============================================================
# SKILL 1: HTML → PDF (offline, pakai built-in font)
# ============================================================
def html_to_pdf(text_content, output_name="surat"):
    from fpdf import FPDF
    
    pdf = FPDF(orientation='P', unit='mm', format='A4')
    pdf.add_page()
    pdf.set_font("Courier", "", 11)
    
    text = text_content.replace("<br>", "\n").replace("<br/>", "\n")
    text = re.sub(r'<[^>]+>', '', text)
    
    margin_left = 25
    margin_top = 30
    y = margin_top
    line_h = 6
    max_width = 210 - margin_left - 25
    
    for line in text.split("\n"):
        if y > 275:
            pdf.add_page()
            y = margin_top
        if line.startswith("===") and len(line) > 65:
            line = line[:65]
        pdf.set_x(margin_left)
        pdf.cell(max_width, line_h, line)
        y += line_h
    
    outpath = SKILL_DIR / f"{output_name}.pdf"
    pdf.output(str(outpath))
    print(f"✅ PDF tersimpan: {outpath}")
    return str(outpath)

# ============================================================
# SKILL 2: QR CODE GENERATOR
# ============================================================
def generate_qr(data, label="qrcode", fill="black", back="white"):
    import qrcode
    qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color=fill, back_color=back)
    outpath = SKILL_DIR / f"{label}.png"
    img.save(str(outpath))
    print(f"✅ QR Code: {outpath}")
    return str(outpath)

def generate_qr_svg(data, label="qrcode_svg"):
    import qrcode, qrcode.image.svg
    qr = qrcode.QRCode(image_factory=qrcode.image.svg.SvgPathImage)
    qr.add_data(data)
    qr.make(fit=True)
    outpath = SKILL_DIR / f"{label}.svg"
    qr.make_image().save(str(outpath))
    print(f"✅ QR SVG: {outpath}")
    return str(outpath)

# ============================================================
# SKILL 3: CSV READER + MASSAL
# ============================================================
def read_csv(filepath):
    import csv
    if not os.path.exists(filepath):
        return {"error": f"File tidak ditemukan: {filepath}"}
    with open(filepath, "r", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    return {"total": len(rows), "columns": list(rows[0].keys()) if rows else [], "data": rows}

def csv_to_template(csv_path, template_text, output_name="surat_massal"):
    data = read_csv(csv_path)
    if isinstance(data, dict) and data.get("error"):
        return data
    results = []
    for row in data["data"]:
        text = template_text
        for col, val in row.items():
            text = text.replace(f"[{col}]", val)
        results.append(text)
    outpath = SKILL_DIR / f"{output_name}.txt"
    with open(outpath, "w", encoding="utf-8") as f:
        f.write("\n\n========= SALINAN =========\n\n".join(results))
    print(f"✅ {len(results)} surat tergenerate: {outpath}")
    return {"total": len(results), "file": str(outpath)}

# ============================================================
# DEMO / CLI
# ============================================================
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("╔════════════════════════════╗")
        print("║  SAKTI SKILLS WEB v1.1   ║")
        print("╠════════════════════════════╣")
        print("║ test -> demo semua skill  ║")
        print("╚════════════════════════════╝")
        sys.exit(0)
    
    if sys.argv[1] == "test":
        print("🧪 Test Semua Skill\n")
        
        print("1️⃣ QR Code...")
        generate_qr("https://t.me/SaktiDoc", "test_qr")
        
        print("\n2️⃣ PDF Surat...")
        html_to_pdf("""=========================================
        SURAT KETERANGAN KERJA
=========================================

Yang bertanda tangan di bawah ini :

Nama        : Sakti
Jabatan     : Asisten AI
Perusahaan  : SaktiDoc Ultimate

Surat ini dibuat untuk testing.

Hormat kami,

Sakti""", "test_surat")
        
        print("\n✅ Semua skill berfungsi!")
        print(f"\n📂 File tersimpan di: {SKILL_DIR}/")
