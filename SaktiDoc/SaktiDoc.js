/**
 * ============================================================================
 * SAKTIDOC ULTIMATE - SCRIPT UTAMA
 * ============================================================================
 * Aplikasi Pembuat Surat Digital dengan 200+ Template
 * @version 3.0.0
 * ============================================================================
 */

window.app = app;
if (typeof app.Trace !== 'function') { app.Trace = function(msg) { console.log(msg); }; }

var progressOverlay = null;
var halamanAktif = "dashboard";
var modulSaatIni = null;
var templateDataSaatIni = null;
var indeksVersiAktif = 0;
var kategoriAktif = "all";

function showMaterialProgress(message) {
    if (progressOverlay) hideMaterialProgress();
    progressOverlay = document.createElement('div');
    progressOverlay.className = 'md-progress';
    progressOverlay.innerHTML = '<div class="md-progress-spinner"></div><div>' + (message || 'Memuat...') + '</div>';
    document.body.appendChild(progressOverlay);
}

function hideMaterialProgress() {
    if (progressOverlay) { progressOverlay.remove(); progressOverlay = null; }
}

app.ShowProgress = function(msg) { showMaterialProgress(msg); };
app.HideProgress = function() { hideMaterialProgress(); };

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function fileExists(path) {
    try { var content = app.ReadFile(path); return content !== null && content !== ""; }
    catch(e) { return false; }
}

function getStoragePath(subfolder) {
    var basePath = "";
    try {
        if (typeof app.GetPrivateFolder === 'function') basePath = app.GetPrivateFolder() + "/SaktiDoc/";
        else if (typeof app.GetLocalPath === 'function') basePath = app.GetLocalPath() + "/SaktiDoc/";
        else basePath = "/sdcard/SaktiDoc/";
    } catch(e) { basePath = "/sdcard/SaktiDoc/"; }
    try { app.MakeFolder(basePath); } catch(e) {}
    if (subfolder) {
        var fullPath = basePath + subfolder + "/";
        try { app.MakeFolder(fullPath); } catch(e) {}
        return fullPath;
    }
    return basePath;
}

function getTemplatePath(idModul, file) {
    var basePath = getStoragePath("");
    var modulPath = basePath + idModul + "/";
    try { app.MakeFolder(modulPath); } catch(e) {}
    return modulPath + file;
}

// ========== DATA KATEGORI ==========
var kategoriSurat = [
    { id: 'all', nama: 'Semua', icon: '📋' },
    { id: 'sk', nama: 'Surat Keterangan', icon: '📜' },
    { id: 'resmi', nama: 'Surat Resmi', icon: '🏛️' },
    { id: 'perusahaan', nama: 'Perusahaan/Bisnis', icon: '🏢' },
    { id: 'sekolah', nama: 'Pendidikan/Sekolah', icon: '🎓' },
    { id: 'komunitas', nama: 'Komunitas/Sosial', icon: '👥' },
    { id: 'hukum', nama: 'Hukum/Perdata', icon: '⚖️' },
    { id: 'desa', nama: 'Desa/Kelurahan', icon: '🏘️' },
    { id: 'agama', nama: 'Keagamaan', icon: '🕌' },
    { id: 'kesehatan', nama: 'Kesehatan', icon: '🏥' },
    { id: 'pemerintah', nama: 'Pemerintahan', icon: '🏛️' },
    { id: 'keuangan', nama: 'Keuangan/Bank', icon: '💰' }
];

var daftarModul = [
    { id: 'sk_kerja', nama: 'Surat Keterangan Kerja', icon: '💼', kategori: 'sk' },
    { id: 'sk_domisili', nama: 'Surat Keterangan Domisili', icon: '📍', kategori: 'sk' },
    { id: 'sk_usaha', nama: 'Surat Keterangan Usaha', icon: '🏪', kategori: 'sk' },
    { id: 'sk_penghasilan', nama: 'Surat Keterangan Penghasilan', icon: '💰', kategori: 'sk' },
    { id: 'sk_sakit', nama: 'Surat Keterangan Sakit', icon: '🏥', kategori: 'kesehatan' },
    { id: 'sk_sehat', nama: 'Surat Keterangan Sehat', icon: '🩺', kategori: 'kesehatan' },
    { id: 'sk_berkelakuan_baik', nama: 'SK Berkelakuan Baik', icon: '👮', kategori: 'sk' },
    { id: 'sk_tidak_mampu', nama: 'SK Tidak Mampu', icon: '🤝', kategori: 'sk' },
    { id: 'sk_kehilangan', nama: 'SK Kehilangan', icon: '🔍', kategori: 'sk' },
    { id: 'sk_kelahiran', nama: 'SK Kelahiran', icon: '🍼', kategori: 'sk' },
    { id: 'sk_kematian', nama: 'SK Kematian', icon: '🕊️', kategori: 'sk' },
    { id: 'sk_izin_orangtua', nama: 'Surat Izin Orang Tua', icon: '🏡', kategori: 'sk' },
    { id: 'surat_kuasa', nama: 'Surat Kuasa', icon: '✍️', kategori: 'resmi' },
    { id: 'surat_pernyataan', nama: 'Surat Pernyataan', icon: '📜', kategori: 'resmi' },
    { id: 'surat_tugas', nama: 'Surat Tugas', icon: '📋', kategori: 'resmi' },
    { id: 'surat_rekomendasi', nama: 'Surat Rekomendasi', icon: '⭐', kategori: 'resmi' },
    { id: 'surat_permohonan', nama: 'Surat Permohonan', icon: '🙏', kategori: 'resmi' },
    { id: 'sp_pengangkatan', nama: 'SP Pengangkatan Karyawan', icon: '👔', kategori: 'perusahaan' },
    { id: 'sp_permohonan_cuti', nama: 'SP Permohonan Cuti', icon: '🏖️', kategori: 'perusahaan' },
    { id: 'sp_resign', nama: 'Surat Pengunduran Diri', icon: '🚪', kategori: 'perusahaan' },
    { id: 'sp_pengalaman_kerja', nama: 'Surat Pengalaman Kerja', icon: '🏆', kategori: 'perusahaan' },
    { id: 'sp_teguran', nama: 'Surat Teguran', icon: '⚠️', kategori: 'perusahaan' },
    { id: 'sp_kontrak_kerja', nama: 'Kontrak Kerja', icon: '📃', kategori: 'perusahaan' },
    { id: 'sp_lamaran_kerja', nama: 'Surat Lamaran Kerja', icon: '📄', kategori: 'perusahaan' },
    { id: 'sekolah_magang', nama: 'Surat Permohonan Magang', icon: '🎓', kategori: 'sekolah' },
    { id: 'sekolah_izin', nama: 'Surat Izin Sekolah', icon: '🏫', kategori: 'sekolah' },
    { id: 'sekolah_lulus', nama: 'SK Lulus', icon: '🎉', kategori: 'sekolah' },
    { id: 'sekolah_beasiswa', nama: 'Surat Permohonan Beasiswa', icon: '💰', kategori: 'sekolah' },
    { id: 'komunitas_undangan_rapat', nama: 'Undangan Rapat', icon: '📅', kategori: 'komunitas' },
    { id: 'komunitas_undangan_kegiatan', nama: 'Undangan Kegiatan', icon: '🎉', kategori: 'komunitas' },
    { id: 'komunitas_duka_cita', nama: 'Surat Duka Cita', icon: '🌹', kategori: 'komunitas' },
    { id: 'komunitas_somasi', nama: 'Surat Somasi', icon: '⚖️', kategori: 'komunitas' },
    { id: 'perjanjian_jual_beli', nama: 'Perjanjian Jual Beli', icon: '🏠', kategori: 'hukum' },
    { id: 'perjanjian_sewa', nama: 'Perjanjian Sewa Menyewa', icon: '🔑', kategori: 'hukum' },
    { id: 'desa_domisili_perusahaan', nama: 'Domisili Perusahaan', icon: '🏢', kategori: 'desa' },
    { id: 'desa_nikah', nama: 'Surat Rekomendasi Nikah', icon: '💑', kategori: 'desa' },
    { id: 'desa_bansos', nama: 'Surat Bantuan Sosial', icon: '🤝', kategori: 'desa' },
    { id: 'agama_nikah', nama: 'Surat Nikah (Dispensasi)', icon: '💍', kategori: 'agama' },
    { id: 'kes_rujukan', nama: 'Surat Rujukan RS', icon: '🏥', kategori: 'kesehatan' },
    { id: 'kes_bpjs', nama: 'SK BPJS', icon: '💳', kategori: 'kesehatan' }
];

// ========== DASHBOARD ==========
function OnStart() {
    initFavorit();
    setKategoriDropdownValue();
    renderTemplateGrid();
    setTimeout(function() {
        var splash = document.getElementById("splashScreen");
        if(splash) { splash.style.opacity = "0"; splash.style.visibility = "hidden"; }
    }, 1500);
}

function initFavorit() {
    if (!localStorage.getItem("saktidoc_fav")) localStorage.setItem("saktidoc_fav", JSON.stringify([]));
}

function setKategoriDropdownValue() {
    var dropdown = document.getElementById("kategoriDropdown");
    if (dropdown) dropdown.value = kategoriAktif;
}

function pilihKategoriDropdown(kategoriId) {
    kategoriAktif = kategoriId;
    filterTemplate();
}

function toggleFavorit(e, idModul) {
    e.stopPropagation();
    var favs = JSON.parse(localStorage.getItem("saktidoc_fav"));
    var index = favs.indexOf(idModul);
    if (index > -1) { favs.splice(index, 1); app.ShowPopup("⭐ Dihapus dari favorit"); }
    else { favs.push(idModul); app.ShowPopup("⭐ Ditambahkan ke favorit"); }
    localStorage.setItem("saktidoc_fav", JSON.stringify(favs));
    renderTemplateGrid();
}

function renderTemplateGrid() {
    var favs = JSON.parse(localStorage.getItem("saktidoc_fav")) || [];
    var grid = document.getElementById("templateGrid");
    var resultCount = document.getElementById("resultCount");
    var totalCount = document.getElementById("totalCount");
    if(!grid) return;
    
    var searchText = document.getElementById("searchBox") ? document.getElementById("searchBox").value.toLowerCase() : "";
    var filtered = [];
    for (var i = 0; i < daftarModul.length; i++) {
        var modul = daftarModul[i];
        var matchKategori = (kategoriAktif === "all" || modul.kategori === kategoriAktif);
        var matchSearch = (searchText === "" || modul.nama.toLowerCase().indexOf(searchText) > -1);
        if (matchKategori && matchSearch) filtered.push(modul);
    }
    
    // Sort by favorit
    filtered.sort(function(a, b) {
        return (favs.includes(b.id) ? 1 : 0) - (favs.includes(a.id) ? 1 : 0);
    });
    
    grid.innerHTML = "";
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state">📭 Tidak ada surat yang ditemukan<br>Coba kata kunci lain atau pilih kategori berbeda</div>';
        if (resultCount) resultCount.innerText = "(0 surat)";
        if (totalCount) totalCount.innerText = daftarModul.length + " Surat";
        return;
    }
    
    for (var i = 0; i < filtered.length; i++) {
        var modul = filtered[i];
        var favClass = favs.includes(modul.id) ? "fav-active" : "";
        var favStar = favs.includes(modul.id) ? "★" : "☆";
        var cardHtml = '<div class="menu-card" onclick="bukaModulSurat(\'' + modul.id + '\')">' +
            '<div class="card-header-actions">' +
            '<div class="menu-icon-container">' + modul.icon + '</div>' +
            '<span class="btn-fav ' + favClass + '" onclick="toggleFavorit(event, \'' + modul.id + '\')">' + favStar + '</span>' +
            '</div>' +
            '<span class="menu-label">' + escapeHtml(modul.nama) + '</span>' +
            '</div>';
        grid.innerHTML += cardHtml;
    }
    if (resultCount) resultCount.innerText = "(" + filtered.length + " surat)";
    if (totalCount) totalCount.innerText = daftarModul.length + " Surat";
}

function filterTemplate() { renderTemplateGrid(); }

function gantiTab(namaTab) {
    var tabTemplates = document.getElementById("tabContentTemplates");
    var tabRiwayat = document.getElementById("tabContentRiwayat");
    var navTemplates = document.getElementById("navTemplates");
    var navRiwayat = document.getElementById("navRiwayat");
    if (namaTab === 'templates') {
        tabTemplates.style.display = "block"; tabRiwayat.style.display = "none";
        navTemplates.classList.add("nav-item-active"); navRiwayat.classList.remove("nav-item-active");
        renderTemplateGrid();
    } else {
        tabTemplates.style.display = "none"; tabRiwayat.style.display = "block";
        navTemplates.classList.remove("nav-item-active"); navRiwayat.classList.add("nav-item-active");
        var infoContainer = document.getElementById("infoContainer");
        if (infoContainer) {
            var favs = JSON.parse(localStorage.getItem("saktidoc_fav") || "[]").length;
            infoContainer.innerHTML = '<div style="padding:20px;text-align:center;line-height:1.8;">' +
                '<div style="font-size:48px;margin-bottom:10px;">📄</div>' +
                '<div style="font-size:24px;font-weight:bold;color:var(--md-primary);">SaktiDoc Ultimate</div>' +
                '<div style="font-size:12px;color:var(--md-on-surface-variant);">v3.0.0</div><br>' +
                '📋 Total: <strong>' + daftarModul.length + '</strong> surat<br>' +
                '⭐ Favorit: <strong>' + favs + '</strong> surat<br>' +
                '💾 Offline + PDF Export<br>' +
                '💰 Pay-Per-Use Ready<br><br>' +
                '© 2024 SaktiDoc Ultimate<br>Made with ❤️ for Indonesia</div>';
        }
    }
}

function isiSaldo() {
    app.ShowPopup("💰 Fitur Pay-Per-Use akan segera aktif!\nHubungi admin untuk isi saldo.");
}

// ========== BUKA MODUL SURAT ==========
function bukaModulSurat(idModul) {
    app.ShowProgress("Memuat template...");
    modulSaatIni = idModul;
    indeksVersiAktif = 0;
    var pathTemplateJson = getTemplatePath(idModul, "template.json");
    try {
        var isiTemplate = app.ReadFile(pathTemplateJson);
        if (isiTemplate && isiTemplate.length > 0) {
            templateDataSaatIni = JSON.parse(isiTemplate);
            app.HideProgress();
            renderEditorLangsungTerproteksi();
        } else {
            buatTemplateDefaultSederhana(idModul, pathTemplateJson);
        }
    } catch(e) {
        buatTemplateDefaultSederhana(idModul, pathTemplateJson);
    }
}

function buatTemplateDefaultSederhana(idModul, pathTemplateJson) {
    app.ShowProgress("Membuat template baru...");
    var modulInfo = null;
    for (var i = 0; i < daftarModul.length; i++) {
        if (daftarModul[i].id === idModul) { modulInfo = daftarModul[i]; break; }
    }
    var namaModul = modulInfo ? modulInfo.nama.toUpperCase() : idModul.replace(/_/g, ' ').toUpperCase();
    var iconModul = modulInfo ? modulInfo.icon : "📄";
    var kontenDefault = "=========================================\n        " + namaModul + "\n=========================================\n\nYang bertanda tangan di bawah ini :\n\nNama\t\t: [Nama Lengkap]\nNIK\t\t: [NIK]\nTempat/Tgl Lahir\t: [Tempat Lahir], [Tanggal Lahir]\nPekerjaan\t: [Pekerjaan]\nAlamat\t\t: [Alamat Lengkap]\n\nDengan ini menerangkan / menyatakan bahwa :\n\n[Isi Pernyataan / Keterangan]\n\nDemikian surat ini dibuat dengan sebenar-benarnya.\n\n[Kota], [Tanggal]\n\nYang bersangkutan,\n\n\n[Nama Lengkap]";
    var defaultTemplate = {
        id: idModul, nama: namaModul, icon: iconModul,
        templates: [{ nama_versi: "Versi Standar", ornamen: false, margin_atas: 30, margin_kiri: 25, konten: kontenDefault }]
    };
    var basePath = getStoragePath("");
    var modulFolder = basePath + idModul + "/";
    app.MakeFolder(modulFolder);
    app.WriteFile(pathTemplateJson, JSON.stringify(defaultTemplate, null, 2));
    templateDataSaatIni = defaultTemplate;
    app.HideProgress();
    renderEditorLangsungTerproteksi();
}

// ========== EDITOR ==========
function formatTeksKeEditorIsian(teksMentah) {
    if (!teksMentah) return "";
    var teksAman = escapeHtml(teksMentah);
    var hasil = teksAman.replace(/\[(.*?)\]/g, function(match, isiKurung) {
        var isiBersih = escapeHtml(isiKurung);
        return '<span class="input-langsung" contenteditable="true" data-placeholder="' + isiBersih + '">' + isiKurung + '</span>';
    });
    hasil = hasil.replace(/\n/g, '<br>');
    return hasil;
}

function gantiVersiTemplate(indeksBaru) {
    indeksVersiAktif = parseInt(indeksBaru);
    var targetVersi = templateDataSaatIni.templates[indeksVersiAktif];
    var editorKertas = document.getElementById("kertasEditorModul");
    if(editorKertas && targetVersi) editorKertas.innerHTML = formatTeksKeEditorIsian(targetVersi.konten);
}

function renderEditorLangsungTerproteksi() {
    var formPage = document.getElementById("formView");
    if (!formPage || !templateDataSaatIni) return;
    var idModul = templateDataSaatIni.id || "unknown";
    var namaModul = templateDataSaatIni.nama || "Dokumen";
    var arrayTemplates = templateDataSaatIni.templates || [];
    var versiAktif = arrayTemplates[indeksVersiAktif] || arrayTemplates[0] || { konten: "", ornamen: false };
    var kontenVisualHtml = formatTeksKeEditorIsian(versiAktif.konten);
    var dropdownHtml = '';
    if (arrayTemplates.length > 1) {
        dropdownHtml = '<select class="select-versi" onchange="gantiVersiTemplate(this.value)">';
        for (var v = 0; v < arrayTemplates.length; v++) {
            var selected = (v === indeksVersiAktif) ? "selected" : "";
            dropdownHtml += '<option value="' + v + '" ' + selected + '>📄 ' + escapeHtml(arrayTemplates[v].nama_versi) + '</option>';
        }
        dropdownHtml += '</select>';
    } else if (arrayTemplates.length === 1) {
        dropdownHtml = '<div style="flex:1;text-align:center;font-weight:500;padding:12px;">📄 ' + escapeHtml(arrayTemplates[0].nama_versi) + '</div>';
    }
    var html = '<div class="editor-container">' +
        '<div style="display:flex;width:100%;gap:12px;margin-bottom:16px;align-items:center;flex-wrap:wrap;">' +
        '<button class="btn-kembali" onclick="kembaliKeDashboard()">← Kembali</button>' +
        dropdownHtml + '</div>' +
        '<div style="display:flex;width:100%;gap:12px;margin-bottom:20px;flex-wrap:wrap;">' +
        '<button class="btn-simpan-template" onclick="simpanTemplateModul(\'' + idModul + '\')">💾 Simpan</button>' +
        '<button class="btn-simpan-pdf" onclick="simpanDokumen(\'' + escapeHtml(namaModul) + '\', ambilTeksEditor())">📄 PDF</button>' +
        '</div>' +
        '<div class="preview-a4">' +
        '<div id="kertasEditorModul" class="kertas-dokumen-full" contenteditable="false">' + kontenVisualHtml + '</div>' +
        '</div>' +
        '<div class="editor-tip">⚡ Ketuk kotak biru untuk mengisi data</div>' +
        '</div>';
    document.getElementById("dashboardView").style.display = "none";
    document.getElementById("bottomNav").style.display = "none";
    formPage.style.display = "block";
    formPage.innerHTML = html;
}

function ambilTeksEditor() {
    var editor = document.getElementById("kertasEditorModul");
    if (!editor) return "";
    var kloningan = editor.cloneNode(true);
    var inputs = kloningan.getElementsByClassName("input-langsung");
    while(inputs.length > 0) {
        var teksUser = inputs[0].innerText || inputs[0].textContent;
        var placeholder = inputs[0].getAttribute("data-placeholder");
        if (!teksUser || teksUser.trim() === placeholder || teksUser.trim() === "") teksUser = "_______________________";
        var teksNode = document.createTextNode(teksUser);
        inputs[0].parentNode.replaceChild(teksNode, inputs[0]);
    }
    return kloningan.innerText || kloningan.textContent;
}

function simpanTemplateModul(idModul) {
    var teksBaru = ambilTeksEditor();
    if (teksBaru && templateDataSaatIni) {
        templateDataSaatIni.templates[indeksVersiAktif].konten = teksBaru;
        var pathFile = getTemplatePath(idModul, "template.json");
        app.WriteFile(pathFile, JSON.stringify(templateDataSaatIni, null, 2));
        app.ShowPopup("✓ Template berhasil disimpan!");
    } else { app.ShowPopup("✗ Gagal menyimpan template"); }
}

function kembaliKeDashboard() {
    document.getElementById("formView").style.display = "none";
    document.getElementById("dashboardView").style.display = "block";
    document.getElementById("bottomNav").style.display = "flex";
    halamanAktif = "dashboard";
    renderTemplateGrid();
}

// ========== PDF ==========
function simpanDokumen(namaFile, isiTeks) {
    if (!isiTeks || isiTeks.trim() === "") { app.ShowPopup("✗ Tidak ada konten"); return; }
    app.ShowProgress("Menyusun PDF...");
    setTimeout(function() {
        try {
            var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            doc.setFont("courier"); doc.setFontSize(11);
            var currentVersi = templateDataSaatIni.templates[indeksVersiAktif] || {};
            var marginKiri = currentVersi.margin_kiri || 25;
            var marginAtas = currentVersi.margin_atas || 30;
            var koordinatY = marginAtas;
            var tinggiBaris = 6;
            var lebarMaksimalCetak = 210 - marginKiri - 25;
            var baris = isiTeks.split("\n");
            for (var i = 0; i < baris.length; i++) {
                var teks = baris[i];
                var potongan = doc.splitTextToSize(teks, lebarMaksimalCetak);
                for (var j = 0; j < potongan.length; j++) {
                    if (koordinatY > 277) { doc.addPage(); koordinatY = marginAtas; }
                    doc.text(potongan[j], marginKiri, koordinatY);
                    koordinatY += tinggiBaris;
                }
            }
            var direktori = getStoragePath("PDF");
            app.MakeFolder(direktori);
            var now = new Date();
            var timestamp = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,'0') + "-" + String(now.getDate()).padStart(2,'0');
            var cleanFileName = namaFile.replace(/[^a-zA-Z0-9]/g, '_');
            var pathFile = direktori + cleanFileName + "_" + timestamp + ".pdf";
            var dataUri = doc.output('datauristring');
            var base64 = dataUri.split(',')[1];
            app.WriteFile(pathFile, base64, "Base64");
            app.HideProgress();
            app.OpenFile(pathFile, "application/pdf", "Buka PDF");
        } catch(e) { app.HideProgress(); app.Alert("Error: " + e.message); }
    }, 500);
}

// ========== EXPOSE ==========
window.OnStart = OnStart;
window.renderEditorLangsungTerproteksi = renderEditorLangsungTerproteksi;
window.kembaliKeDashboard = kembaliKeDashboard;
window.ambilTeksEditor = ambilTeksEditor;
window.simpanDokumen = simpanDokumen;
window.simpanTemplateModul = simpanTemplateModul;
window.gantiVersiTemplate = gantiVersiTemplate;
window.bukaModulSurat = bukaModulSurat;
window.toggleFavorit = toggleFavorit;
window.filterTemplate = filterTemplate;
window.gantiTab = gantiTab;
window.pilihKategoriDropdown = pilihKategoriDropdown;
window.isiSaldo = isiSaldo;
