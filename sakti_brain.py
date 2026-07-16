"""
SAKTI BRAIN — Hybrid Dispatcher
SaktiDoc Tasks: Generate surat, olah data, bikin PDF
"""
import os, sys, json, re
from jinja2 import Template

# ─── TEMPLATE SURAT ───
TEMPLATES = {
    "sk_kerja": {
        "title": "SURAT KETERANGAN KERJA",
        "content": """
{{ kop_surat }}

Nomor    : {{ nomor }}
Tanggal  : {{ tanggal }}

Yang bertanda tangan di bawah ini:
Nama     : {{ penandatangan }}
Jabatan  : {{ jabatan }}

Menerangkan bahwa:
Nama     : {{ nama }}
Tempat   : {{ tempat_lahir }}
Tanggal Lahir : {{ tgl_lahir }}
Pekerjaan     : {{ pekerjaan }}

Benar yang bersangkutan adalah karyawan {{ perusahaan }}
sejak {{ tanggal_masuk }}.

Demikian surat ini dibuat untuk keperluan {{ keperluan }}.

{{ kota }}, {{ tanggal_terbit }}

{{ penandatangan }}
"""
    },
    "sk_usaha": {
        "title": "SURAT KETERANGAN USAHA",
        "content": """
{{ kop_surat }}

Nomor    : {{ nomor }}
Tanggal  : {{ tanggal }}

Yang bertanda tangan di bawah ini:
Nama     : {{ penandatangan }}
Jabatan  : {{ jabatan }}

Menerangkan bahwa:
Nama     : {{ nama }}
Alamat   : {{ alamat }}
Bidang Usaha : {{ bidang_usaha }}

Benar yang bersangkutan memiliki usaha {{ nama_usaha }}
yang beralamat di {{ alamat_usaha }}.

Demikian surat ini dibuat untuk keperluan {{ keperluan }}.

{{ kota }}, {{ tanggal_terbit }}

{{ penandatangan }}
"""
    },
    "surat_izin": {
        "title": "SURAT IZIN",
        "content": """
{{ kop_surat }}

Nomor    : {{ nomor }}
Tanggal  : {{ tanggal }}

Yang bertanda tangan di bawah ini:
Nama     : {{ penandatangan }}
Jabatan  : {{ jabatan }}

Memberikan izin kepada:
Nama     : {{ nama }}
Untuk    : {{ keperluan }}
Mulai    : {{ tanggal_mulai }}
Sampai   : {{ tanggal_selesai }}

Demikian surat izin ini dibuat untuk dipergunakan sebagaimana mestinya.

{{ kota }}, {{ tanggal_terbit }}

{{ penandatangan }}
"""
    }
}

# ─── DEFAULT DATA ───
DEFAULT = {
    "kop_surat": "PT. CONTOH PERUSAHAAN\nJl. Raya No. 1, Jakarta",
    "kota": "Jakarta",
    "tanggal": "9 Juli 2026",
    "tanggal_terbit": "9 Juli 2026",
    "penandatangan": "Hormat Kami",
    "jabatan": "Direktur",
    "perusahaan": "PT. Contoh Perusahaan"
}

# ─── FUNGSI UTAMA ───
def detect_intent(text):
    """Deteksi apa yang diminta: ringan atau berat"""
    text_lower = text.lower()
    
    ringan = ["halo", "hai", "apa kabar", "siapa", "terima kasih", "makasih", "selamat"]
    for kata in ringan:
        if kata in text_lower:
            return "ringan"
    
    berat = ["bikin", "buat", "generate", "surat", "pdf", "template", "kirim", "export",
             "cari", "data", "csv", "olah", "proses", "analisis"]
    for kata in berat:
        if kata in text_lower:
            return "berat"
    
    return "ringan"

def extract_surat_type(text):
    """Cari jenis surat dari teks"""
    text_lower = text.lower()
    if "kerja" in text_lower: return "sk_kerja"
    if "usaha" in text_lower: return "sk_usaha"
    if "izin" in text_lower: return "surat_izin"
    return None

def extract_data(text):
    """Coba ekstrak data dari input user"""
    data = {}
    
    # Cari nama
    m = re.search(r'nama[:\s]+(\w+(?:\s+\w+){0,3})', text, re.IGNORECASE)
    if m: data["nama"] = m.group(1).strip()
    
    return data

def generate_surat(jenis, data=None):
    """Generate surat dari template"""
    if jenis not in TEMPLATES:
        return f"Jenis surat '{jenis}' tidak tersedia. Pilihan: {', '.join(TEMPLATES.keys())}"
    
    template_data = {**DEFAULT, **({"nama": "Nama Tidak Diketahui"} if data is None else data)}
    if data:
        template_data.update(data)
    
    tpl = Template(TEMPLATES[jenis]["content"])
    hasil = tpl.render(**template_data)
    return hasil

def process(text):
    """Main function — dipanggil dari chat"""
    intent = detect_intent(text)
    
    if intent == "ringan":
        return None  # serahkan ke Kai
    
    # Berat — cek apakah generate surat
    jenis = extract_surat_type(text)
    if jenis:
        data = extract_data(text)
        hasil = generate_surat(jenis, data)
        return f"📄 **{TEMPLATES[jenis]['title']}**\n\n```\n{hasil}\n```"
    
    # Berat lainnya
    return None  # fallback ke Kai

if __name__ == "__main__":
    # Test
    test = sys.argv[1] if len(sys.argv) > 1 else "bikin surat kerja nama Budi"
    result = process(test)
    if result:
        print(result)
    else:
        print("RINGAN — serahkan ke Kai")
