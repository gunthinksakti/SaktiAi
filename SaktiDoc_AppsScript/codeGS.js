// VARIABEL PENGATUR
var ss = SpreadsheetApp.getActiveSpreadsheet();

// FUNGSI UTAMA YANG DIPANGGIL LOADER
function doPost(e) {
  var params = JSON.parse(e.postData.contents);
  var aksi = params.aksi;
  
  if (aksi === "ambil_template") return prosesAmbilTemplate(params);
  if (aksi === "cetak_docs_pdf") return prosesCetakDocsPdf(params);
  if (aksi === "ambil_arsip_user") return prosesAmbilArsipUser(params);
  if (aksi === "optimasi_ai_gemini") return prosesAsistenGeminiAI(params);
  
  return buatResponsJson({ sukses: false, error: "AKSI_TIDAK_DIKENALI" });
}

// LOGIKA PENGAMBILAN TEMPLATE
function prosesAmbilTemplate(params) {
  var sheetTemplate = ss.getSheetByName("Templates");
  var sheetUser = ss.getSheetByName("Users");
  var dataTemplate = sheetTemplate.getDataRange().getValues();
  var dataUser = sheetUser.getDataRange().getValues();
  
  var deviceId = params.device_id || "Aplikasi_Web_Akses";
  var sisaKoinUser = 0;
  
  for (var i = 1; i < dataUser.length; i++) {
    if (dataUser[i][0].toString() === deviceId) {
      sisaKoinUser = Number(dataUser[i][2]);
      break;
    }
  }
  
  var katalogMap = {};
  for (var j = 1; j < dataTemplate.length; j++) {
    var idSurat = dataTemplate[j][0], namaSurat = dataTemplate[j][1], iconSurat = dataTemplate[j][2] || "📄";
    var namaVersi = dataTemplate[j][3], kontenTeks = dataTemplate[j][4], tarifKoin = Number(dataTemplate[j][5]);
    
    if (!katalogMap[idSurat]) katalogMap[idSurat] = { id: idSurat, nama: namaSurat, icon: iconSurat, templates: [] };
    katalogMap[idSurat].templates.push({ nama_versi: namaVersi, konten: kontenTeks, harga_koin: tarifKoin });
  }
  
  var listKatalog = [];
  for (var key in katalogMap) listKatalog.push(katalogMap[key]);
  
  return buatResponsJson({ sukses: true, sisa_koin: sisaKoinUser, data: listKatalog });
}

// LOGIKA CETAK PDF
function prosesCetakDocsPdf(params) {
  var sheetTemplate = ss.getSheetByName("Templates");
  var sheetUser = ss.getSheetByName("Users");
  var dataTemplate = sheetTemplate.getDataRange().getValues();
  
  var idSurat = params.id_surat, namaVersi = params.nama_versi, teksKonten = params.teks_konten, deviceId = params.device_id;
  var hargaKoinWajib = 0, namaSuratAsli = "Dokumen";
  
  for (var i = 1; i < dataTemplate.length; i++) {
    if (dataTemplate[i][0] === idSurat && dataTemplate[i][3] === namaVersi) {
      hargaKoinWajib = Number(dataTemplate[i][5]);
      namaSuratAsli = dataTemplate[i][1];
      break;
    }
  }
  
  var dataUser = sheetUser.getDataRange().getValues();
  var barisUser = -1, saldoKoinSekarang = 0;
  for (var j = 1; j < dataUser.length; j++) {
    if (dataUser[j][0].toString() === deviceId) {
      saldoKoinSekarang = Number(dataUser[j][2]);
      barisUser = j + 1; break;
    }
  }
  
  if (saldoKoinSekarang < hargaKoinWajib) return buatResponsJson({ sukses: false, error: "KOIN_HABIS" });
  
  var namaFileFinal = namaSuratAsli.replace(/[^a-zA-Z0-9]/g, '_') + "_" + new Date().getTime();
  var doc = DocumentApp.create(namaFileFinal);
  doc.getBody().setText(teksKonten);
  doc.saveAndClose();
  
  var filePdf = DriveApp.getFileById(doc.getId()).getAs(MimeType.PDF);
  var fileFinal = DriveApp.createFile(filePdf).setName(namaFileFinal + ".pdf");
  fileFinal.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  
  var sisaKoinBaru = saldoKoinSekarang - hargaKoinWajib;
  sheetUser.getRange(barisUser, 3).setValue(sisaKoinBaru);
  
  return buatResponsJson({ sukses: true, sisa_koin: sisaKoinBaru, url: fileFinal.getDownloadUrl() });
}

// LOGIKA AI GEMINI
function prosesAsistenGeminiAI(params) {
  try {
    var tokenApiKey = "AIzaSyCSBHAMDD2N48JQ_mqNQ9tXIHSmXE7O3L4"; 
    var response = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + tokenApiKey, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ contents: [{ parts: [{ text: "Rapikan surat ini: " + params.teks_surat }] }] })
    });
    var hasil = JSON.parse(response.getContentText());
    return buatResponsJson({ sukses: true, data: hasil.candidates[0].content.parts[0].text });
  } catch(err) {
    return buatResponsJson({ sukses: false, error: err.message });
  }
}

function buatResponsJson(objek) {
  return ContentService.createTextOutput(JSON.stringify(objek)).setMimeType(ContentService.MimeType.JSON);
}
