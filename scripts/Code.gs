/**
 * =====================================================================
 * BELAJAR BARENG MAMI 💖 (BBM) - GOOGLE APPS SCRIPT WEB APP CONNECTOR
 * TARGET SPREADSHEET: "Progres Belajar Grace"
 * =====================================================================
 * ATURAN KEAMANAN & ISOLASI TAB (STRICT ISOLATION):
 * 1. Tab A dan Tab B dilindungi secara mutlak (Protected).
 *    Integrasi BBM TIDAK BOLEH membaca, menulis, mengubah, menghapus,
 *    atau memformat data pada Tab A, Tab B, maupun tab lain di luar tab resmi BBM.
 * 2. Tab baru TIDAK DIBUAT OTOMATIS saat aplikasi berjalan untuk mencegah
 *    perubahan struktur spreadsheet tanpa izin pengguna.
 * 3. Tab resmi BBM yang diizinkan:
 *    - "BBM_Rekap_Aktivitas" : Menyimpan riwayat belajar & bonus Grace
 *    - "BBM_Status_Grace"    : Menyimpan status snapshot Grace (Level, XP, Streak, Badges)
 *    - "BBM_Integration_Test": Khusus uji tulis-baca live dengan mekanisme rollback
 * 4. Setiap penulisan WAJIB melalui validasi header baris 1 yang ketat.
 */

// Token rahasia default (dapat diganti di Script Properties dengan key "AUTH_TOKEN")
var DEFAULT_TOKEN = "BBM_GRACE_MAMI_2025";

// Daftar tab resmi BBM yang diizinkan (Whitelist)
var TAB_NAMES = {
  REKAP: "BBM_Rekap_Aktivitas",
  STATUS: "BBM_Status_Grace",
  TEST: "BBM_Integration_Test"
};

// Struktur header wajib per tab (Strict Header Validation)
var EXPECTED_HEADERS = {
  REKAP: [
    "ID Transaksi",
    "Waktu Sesi",
    "Jenis",
    "Mapel / Nama Kegiatan",
    "Jumlah Soal",
    "Skor Nilai",
    "Menit Bonus",
    "Waktu Sinkronisasi"
  ],
  STATUS: [
    "Terakhir Diperbarui",
    "Level",
    "XP",
    "Streak (Hari)",
    "Tabungan Waktu (Menit)",
    "Lencana Terbuka",
    "Catatan"
  ],
  TEST: [
    "ID Probe",
    "Waktu Uji",
    "Status Probe",
    "Keterangan"
  ]
};

/**
 * Mengambil token autentikasi yang sah (dari Script Properties atau default).
 */
function getValidToken() {
  try {
    var propToken = PropertiesService.getScriptProperties().getProperty("AUTH_TOKEN");
    if (propToken && propToken.trim().length > 0) {
      return propToken.trim();
    }
  } catch (err) {
    // Abaikan jika PropertiesService tidak tersedia
  }
  return DEFAULT_TOKEN;
}

/**
 * Handler GET request untuk pengujian koneksi dan penarikan data
 */
function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var clientToken = params.token || "";
    var action = params.action || "ping";

    if (!validasiToken(clientToken)) {
      return jsonResponse({
        success: false,
        error: "UNAUTHORIZED",
        message: "Token autentikasi tidak valid atau belum diisi."
      });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return jsonResponse({
        success: false,
        error: "NO_ACTIVE_SPREADSHEET",
        message: "Spreadsheet aktif tidak ditemukan. Pastikan Apps Script terpasang di Google Sheets."
      });
    }

    var sheetTitle = ss.getName();

    if (action === "ping") {
      return jsonResponse({
        success: true,
        action: "ping",
        message: "PONG - Terhubung ke spreadsheet \"" + sheetTitle + "\"",
        spreadsheetTitle: sheetTitle,
        timestamp: new Date().toISOString()
      });
    }

    if (action === "pull_all" || action === "pull_rekap") {
      var pullResult = ambilSemuaDataBBM(ss);
      return jsonResponse({
        success: true,
        action: action,
        data: pullResult.data,
        notices: pullResult.notices,
        spreadsheetTitle: sheetTitle,
        timestamp: new Date().toISOString()
      });
    }

    return jsonResponse({
      success: false,
      error: "UNKNOWN_ACTION",
      message: "Action GET tidak dikenali: " + action
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: "SERVER_ERROR",
      message: error.toString()
    });
  }
}

/**
 * Handler POST request untuk menyimpan data rekap, status Grace, dan pengujian
 */
function doPost(e) {
  try {
    var payload = {};

    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        if (e.parameter) {
          payload = e.parameter;
        } else {
          return jsonResponse({
            success: false,
            error: "INVALID_JSON",
            message: "Format payload bukan JSON valid: " + parseErr.toString()
          });
        }
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    } else {
      return jsonResponse({
        success: false,
        error: "EMPTY_BODY",
        message: "Permintaan POST tidak menyertakan data (payload kosong)."
      });
    }

    var clientToken = payload.token || (e && e.parameter ? e.parameter.token : "");
    if (!validasiToken(clientToken)) {
      return jsonResponse({
        success: false,
        error: "UNAUTHORIZED",
        message: "Token autentikasi tidak valid atau tidak cocok."
      });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return jsonResponse({
        success: false,
        error: "NO_ACTIVE_SPREADSHEET",
        message: "Spreadsheet aktif tidak ditemukan. Pastikan Apps Script terpasang di Google Sheets."
      });
    }

    var sheetTitle = ss.getName();
    var action = payload.action || "ping";

    if (action === "ping") {
      return jsonResponse({
        success: true,
        action: "ping",
        message: "PONG - Terhubung ke spreadsheet \"" + sheetTitle + "\"",
        spreadsheetTitle: sheetTitle,
        timestamp: new Date().toISOString()
      });
    }

    // Uji Tulis, Baca, dan Rollback nyata pada tab khusus BBM_Integration_Test
    if (action === "test_write_read") {
      var testRes = jalankanUjiTulisBacaRollback(ss);
      return jsonResponse(testRes);
    }

    if (action === "push_rekap") {
      var items = payload.items || [];
      if (!Array.isArray(items) || items.length === 0) {
        return jsonResponse({
          success: true,
          action: "push_rekap",
          added: 0,
          confirmedIds: [],
          spreadsheetTitle: sheetTitle,
          message: "Tidak ada item rekap baru yang dikirim."
        });
      }

      var result = simpanRekapBBM(ss, items);
      return jsonResponse({
        success: true,
        action: "push_rekap",
        added: result.added,
        skipped: result.skipped,
        confirmedIds: result.confirmedIds,
        totalInSheet: result.totalInSheet,
        spreadsheetTitle: sheetTitle,
        message: result.added + " data rekap berhasil disimpan ke tab " + TAB_NAMES.REKAP
      });
    }

    if (action === "push_status") {
      var status = payload.status || {};
      simpanStatusBBM(ss, status);
      return jsonResponse({
        success: true,
        action: "push_status",
        spreadsheetTitle: sheetTitle,
        message: "Status progres Grace berhasil diperbarui di tab " + TAB_NAMES.STATUS,
        timestamp: new Date().toISOString()
      });
    }

    if (action === "sync_all") {
      var rekapRes = { added: 0, skipped: 0, confirmedIds: [], totalInSheet: 0 };
      if (Array.isArray(payload.items) && payload.items.length > 0) {
        rekapRes = simpanRekapBBM(ss, payload.items);
      }
      if (payload.status) {
        simpanStatusBBM(ss, payload.status);
      }
      var latestPull = ambilSemuaDataBBM(ss);
      return jsonResponse({
        success: true,
        action: "sync_all",
        rekapSaved: rekapRes.added,
        confirmedIds: rekapRes.confirmedIds,
        latestData: latestPull.data,
        spreadsheetTitle: sheetTitle,
        message: "Sinkronisasi ke tab BBM berhasil!",
        timestamp: new Date().toISOString()
      });
    }

    if (action === "pull_all" || action === "pull_rekap") {
      var pullRes = ambilSemuaDataBBM(ss);
      return jsonResponse({
        success: true,
        action: action,
        data: pullRes.data,
        notices: pullRes.notices,
        spreadsheetTitle: sheetTitle,
        timestamp: new Date().toISOString()
      });
    }

    return jsonResponse({
      success: false,
      error: "UNKNOWN_ACTION",
      message: "Action POST tidak dikenali: " + action
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: "OPERATION_ERROR",
      message: error.message || error.toString()
    });
  }
}

/**
 * Validasi apakah token klien cocok dengan token rahasia
 */
function validasiToken(token) {
  var valid = getValidToken();
  if (!valid || !token) return false;
  return token.toString().trim() === valid.toString().trim();
}

/**
 * Validasi & Ambil Tab Resmi BBM (Strict Whitelist + Header Validation).
 * PENTING: Fungsi ini TIDAK membuat tab baru secara otomatis (insertSheet dilarang).
 * PENTING: Tab A dan Tab B dilindungi secara mutlak.
 */
function validasiDanDapatkanTabBBM(ss, namaTabTarget, expectedHeaders) {
  if (!ss) throw new Error("Spreadsheet aktif tidak tersedia.");

  // Pastikan tab target hanya tab yang diizinkan dalam daftar resmi BBM
  var isAllowed = false;
  for (var k in TAB_NAMES) {
    if (TAB_NAMES[k] === namaTabTarget) {
      isAllowed = true;
      break;
    }
  }

  if (!isAllowed) {
    throw new Error("AKSES DITOLAK: Tab \"" + namaTabTarget + "\" bukan tab resmi BBM. Tab historis terlindungi dari akses.");
  }

  var sheet = ss.getSheetByName(namaTabTarget);
  if (!sheet) {
    throw new Error("TAB_TIDAK_DITEMUKAN: Tab \"" + namaTabTarget + "\" belum ada di spreadsheet. Sesuai aturan, tab tidak dibuat otomatis. Harap siapkan tab terlebih dahulu.");
  }

  // Validasi baris header 1
  if (sheet.getLastRow() === 0) {
    throw new Error("HEADER_KOSONG: Tab \"" + namaTabTarget + "\" tidak memiliki baris header.");
  }

  var actualHeaders = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
  for (var i = 0; i < expectedHeaders.length; i++) {
    var actual = String(actualHeaders[i] || "").trim().toLowerCase();
    var expected = String(expectedHeaders[i]).trim().toLowerCase();
    if (actual !== expected) {
      throw new Error(
        "HEADER_TIDAK_COCOK: Header kolom " + (i + 1) + " pada tab \"" + namaTabTarget +
        "\" harus \"" + expectedHeaders[i] + "\", namun ditemukan \"" + actualHeaders[i] +
        "\". Operasi ditolak untuk melindungi integritas data."
      );
    }
  }

  return sheet;
}

/**
 * Uji Tulis, Baca, dan Rollback nyata menggunakan tab khusus BBM_Integration_Test.
 * - Memeriksa keberadaan tab BBM_Integration_Test (tidak dibuat otomatis).
 * - Menulis 1 baris uji dengan probeId unik.
 * - Membaca kembali baris tersebut untuk membuktikan data tersimpan nyata.
 * - Menghapus kembali HANYA baris probe tersebut (clean rollback).
 */
function jalankanUjiTulisBacaRollback(ss) {
  var sheetTest = ss.getSheetByName(TAB_NAMES.TEST);
  if (!sheetTest) {
    return {
      success: false,
      error: "TEST_TAB_NOT_FOUND",
      message: "Tab uji \"" + TAB_NAMES.TEST + "\" belum tersedia di spreadsheet. Sesuai aturan keamanan, tab tidak dibuat otomatis. Silakan buat tab \"" + TAB_NAMES.TEST + "\" dengan header: [ID Probe, Waktu Uji, Status Probe, Keterangan] untuk mengaktifkan pengujian tulis-baca nyata."
    };
  }

  // Validasi header tab uji
  try {
    validasiDanDapatkanTabBBM(ss, TAB_NAMES.TEST, EXPECTED_HEADERS.TEST);
  } catch (hdrErr) {
    return {
      success: false,
      error: "TEST_HEADER_MISMATCH",
      message: hdrErr.message
    };
  }

  var probeId = "PROBE_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
  var probeTime = new Date().toISOString();
  var rowData = [probeId, probeTime, "PENDING", "Uji tulis-baca BBM"];

  // 1. TULIS (Write)
  sheetTest.appendRow(rowData);
  var lastRow = sheetTest.getLastRow();

  // 2. BACA KEMBALI (Read Verification)
  var readBack = sheetTest.getRange(lastRow, 1, 1, 4).getValues()[0];
  var readId = String(readBack[0] || "").trim();

  if (readId !== probeId) {
    return {
      success: false,
      error: "VERIFY_FAILED",
      message: "Data yang terbaca (" + readId + ") tidak cocok dengan ID probe (" + probeId + ")."
    };
  }

  // 3. ROLLBACK (Hapus HANYA baris probe milik sendiri)
  var deleted = false;
  var currentLastRow = sheetTest.getLastRow();
  for (var r = currentLastRow; r >= 2; r--) {
    var val = String(sheetTest.getRange(r, 1).getValue() || "").trim();
    if (val === probeId) {
      sheetTest.deleteRow(r);
      deleted = true;
      break;
    }
  }

  return {
    success: true,
    action: "test_write_read",
    probeId: probeId,
    verified: true,
    rolledBack: deleted,
    spreadsheetTitle: ss.getName(),
    message: "Verifikasi tulis-baca nyata dan rollback berhasil 100% pada tab \"" + TAB_NAMES.TEST + "\"."
  };
}

/**
 * Menyimpan daftar rekap belajar ke tab BBM_Rekap_Aktivitas.
 * - Mengembalikan daftar confirmedIds untuk setiap transaksi yang berhasil disimpan / deduplikasi.
 */
function simpanRekapBBM(ss, items) {
  var sheet = validasiDanDapatkanTabBBM(ss, TAB_NAMES.REKAP, EXPECTED_HEADERS.REKAP);

  var existingIds = {};
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < idValues.length; i++) {
      var idStr = String(idValues[i][0] || "").trim();
      if (idStr) existingIds[idStr] = true;
    }
  }

  var nowSync = new Date().toISOString();
  var rowsToAppend = [];
  var confirmedIds = [];
  var addedCount = 0;
  var skippedCount = 0;

  for (var j = 0; j < items.length; j++) {
    var item = items[j];
    var itemId = (item.id || item.waktu || ("rekap_" + Date.now() + "_" + j)).toString();

    // Jika sudah ada di sheet, tandai sebagai terkonfirmasi (deduplikasi aman)
    if (existingIds[itemId]) {
      skippedCount++;
      confirmedIds.push(itemId);
      continue;
    }

    var row = [
      itemId,
      item.waktu || nowSync,
      item.jenis || "Belajar",
      item.nama || item.mapel || "Kegiatan",
      typeof item.jumlahSoal === "number" ? item.jumlahSoal : "",
      typeof item.skor === "number" ? item.skor : "",
      typeof item.menit === "number" ? item.menit : "",
      nowSync
    ];

    rowsToAppend.push(row);
    existingIds[itemId] = true;
    confirmedIds.push(itemId);
    addedCount++;
  }

  if (rowsToAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, EXPECTED_HEADERS.REKAP.length).setValues(rowsToAppend);
  }

  return {
    added: addedCount,
    skipped: skippedCount,
    confirmedIds: confirmedIds,
    totalInSheet: sheet.getLastRow() - 1
  };
}

/**
 * Menyimpan status terbaru Grace ke tab BBM_Status_Grace pada baris 2.
 */
function simpanStatusBBM(ss, status) {
  var sheet = validasiDanDapatkanTabBBM(ss, TAB_NAMES.STATUS, EXPECTED_HEADERS.STATUS);

  var nowIso = status.updatedAt || new Date().toISOString();
  var badgesStr = Array.isArray(status.badges) ? status.badges.join(", ") : (status.badges || "");

  var rowData = [
    nowIso,
    status.level || 1,
    status.xp || 0,
    status.streak || 1,
    status.saving || 0,
    badgesStr,
    "Status snapshot aplikasi BBM"
  ];

  if (sheet.getLastRow() >= 2) {
    sheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

/**
 * Membaca data HANYA dari tab BBM_Rekap_Aktivitas dan BBM_Status_Grace.
 * PENTING: Tab A dan Tab B sama sekali tidak disentuh atau dibaca.
 */
function ambilSemuaDataBBM(ss) {
  var rekapList = [];
  var statusGrace = null;
  var notices = [];

  // 1. Baca rekap dari BBM_Rekap_Aktivitas jika tab tersedia
  var rekapSheet = ss.getSheetByName(TAB_NAMES.REKAP);
  if (!rekapSheet) {
    notices.push("Tab \"" + TAB_NAMES.REKAP + "\" belum tersedia.");
  } else {
    try {
      validasiDanDapatkanTabBBM(ss, TAB_NAMES.REKAP, EXPECTED_HEADERS.REKAP);
      if (rekapSheet.getLastRow() > 1) {
        var rows = rekapSheet.getRange(2, 1, rekapSheet.getLastRow() - 1, EXPECTED_HEADERS.REKAP.length).getValues();
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
          rekapList.push({
            id: String(r[0]),
            waktu: String(r[1]),
            jenis: String(r[2]),
            mapel: String(r[3]),
            nama: String(r[3]),
            jumlahSoal: r[4] !== "" ? Number(r[4]) : undefined,
            skor: r[5] !== "" ? Number(r[5]) : undefined,
            menit: r[6] !== "" ? Number(r[6]) : undefined,
            synced: true
          });
        }
      }
    } catch (err) {
      notices.push("Gagal membaca " + TAB_NAMES.REKAP + ": " + err.message);
    }
  }

  // 2. Baca status dari BBM_Status_Grace jika tab tersedia
  var statusSheet = ss.getSheetByName(TAB_NAMES.STATUS);
  if (!statusSheet) {
    notices.push("Tab \"" + TAB_NAMES.STATUS + "\" belum tersedia.");
  } else {
    try {
      validasiDanDapatkanTabBBM(ss, TAB_NAMES.STATUS, EXPECTED_HEADERS.STATUS);
      if (statusSheet.getLastRow() >= 2) {
        var sRow = statusSheet.getRange(2, 1, 1, 6).getValues()[0];
        statusGrace = {
          updatedAt: String(sRow[0]),
          level: Number(sRow[1]) || 1,
          xp: Number(sRow[2]) || 0,
          streak: Number(sRow[3]) || 1,
          saving: Number(sRow[4]) || 0,
          badges: String(sRow[5] || "").split(",").map(function(b) { return b.trim(); }).filter(Boolean)
        };
      }
    } catch (err) {
      notices.push("Gagal membaca " + TAB_NAMES.STATUS + ": " + err.message);
    }
  }

  return {
    data: {
      rekap: rekapList,
      status: statusGrace
    },
    notices: notices
  };
}

/**
 * Output helper untuk JSON dengan format standar
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
