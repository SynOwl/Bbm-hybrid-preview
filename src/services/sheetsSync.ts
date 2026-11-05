import { RekapItem, SheetsConfig, GraceStatusPayload } from '../types';

const STORAGE_KEYS = {
  WEBAPP_URL: 'gas_webapp_url',
  TOKEN: 'gas_token',
  SYNC_QUEUE: 'bbm_sheets_sync_queue',
  LAST_SYNC_TIME: 'bbm_sheets_last_sync_time',
  LAST_SYNC_STATUS: 'bbm_sheets_last_sync_status',
  LAST_SYNC_ERROR: 'bbm_sheets_last_sync_error',
};

/**
 * Mengambil konfigurasi URL & TOKEN Google Apps Script yang tersimpan
 * Prioritas: LocalStorage pengguna > Environment Variables
 */
export function getSheetsConfig(): SheetsConfig {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env || {} : {};
  const urlFromEnv = (metaEnv.VITE_GAS_WEBAPP_URL as string) || '';
  const tokenFromEnv = (metaEnv.VITE_GAS_TOKEN as string) || '';

  let url = '';
  let token = '';

  try {
    url = (localStorage.getItem(STORAGE_KEYS.WEBAPP_URL) || urlFromEnv).trim();
    token = (localStorage.getItem(STORAGE_KEYS.TOKEN) || tokenFromEnv).trim();
  } catch {
    url = urlFromEnv.trim();
    token = tokenFromEnv.trim();
  }

  return { webAppUrl: url, token };
}

/**
 * Menyimpan konfigurasi URL & TOKEN ke LocalStorage browser
 */
export function saveSheetsConfig(url: string, token: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WEBAPP_URL, url.trim());
    localStorage.setItem(STORAGE_KEYS.TOKEN, token.trim());
  } catch {}
}

/**
 * Memeriksa apakah konfigurasi Google Sheets sudah terpasang
 */
export function isSheetsConfigured(): boolean {
  const config = getSheetsConfig();
  return Boolean(
    config.webAppUrl &&
    config.webAppUrl.startsWith('https://script.google.com/') &&
    config.token
  );
}

/**
 * Mengambil antrean data yang belum tersinkronisasi
 */
export function getOfflineQueue(): RekapItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Menambahkan item rekap ke antrean offline jika belum tersinkron
 */
export function addToOfflineQueue(item: RekapItem): void {
  try {
    const queue = getOfflineQueue();
    // Hindari duplikasi dalam antrean
    const exists = queue.some((q) => q.id === item.id);
    if (!exists) {
      queue.push(item);
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    }
  } catch {}
}

/**
 * Membersihkan antrean setelah berhasil dikirim
 */
export function removeFromOfflineQueue(ids: string[]): void {
  try {
    const idSet = new Set(ids);
    const queue = getOfflineQueue().filter((item) => !item.id || !idSet.has(item.id));
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch {}
}

/**
 * Mengirim request ke Google Apps Script Web App tanpa memicu preflight CORS terblokir.
 * Google Apps Script Web Apps memerlukan Content-Type: text/plain agar browser
 * tidak mengirimkan request OPTIONS (preflight) yang sering ditolak Google.
 */
async function sendToGas(payload: Record<string, unknown>): Promise<any> {
  const { webAppUrl, token } = getSheetsConfig();

  if (!webAppUrl || !webAppUrl.startsWith('https://script.google.com/')) {
    throw new Error('URL Google Apps Script belum diisi atau tidak valid.');
  }

  const fullPayload = {
    ...payload,
    token: payload.token || token,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout

  try {
    const res = await fetch(webAppUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow', // Penting untuk menangani 302 redirect khas Google Apps Script
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(fullPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Google Apps Script merespons dengan HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Koneksi ke Google Apps Script kehabisan waktu (timeout 18 detik).');
    }
    throw err;
  }
}

/**
 * Menguji koneksi ke Google Apps Script Web App dengan diagnostik cerdas
 */
export async function testGasConnection(customUrl?: string, customToken?: string): Promise<{
  success: boolean;
  message: string;
  spreadsheetTitle?: string;
}> {
  const url = (customUrl ?? getSheetsConfig().webAppUrl).trim();
  const token = (customToken ?? getSheetsConfig().token).trim();

  if (!url || !url.startsWith('https://script.google.com/')) {
    return {
      success: false,
      message: 'Format URL Web App harus diawali dengan https://script.google.com/macros/s/.../exec',
    };
  }

  if (!token) {
    return {
      success: false,
      message: 'Token autentikasi rahasia belum diisi.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'ping', token }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const rawText = await res.text();

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      if (rawText.includes('<html') || rawText.includes('<!DOCTYPE') || rawText.includes('accounts.google.com')) {
        return {
          success: false,
          message: 'Google Apps Script meminta login Google. Pastikan setelan deployment di Apps Script: "Who has access" dipilih "Anyone" (Siapa saja).',
        };
      }
      return {
        success: false,
        message: 'Respons dari Google Apps Script bukan format JSON valid.',
      };
    }

    if (data && data.success) {
      return {
        success: true,
        message: data.message || `Terhubung ke ${data.spreadsheetTitle || 'Google Sheets'}!`,
        spreadsheetTitle: data.spreadsheetTitle,
      };
    }

    if (data && (data.error === 'UNAUTHORIZED' || data.message?.includes('Token'))) {
      return {
        success: false,
        message: 'Token autentikasi ditolak. Periksa kembali token rahasia yang dimasukkan.',
      };
    }

    return {
      success: false,
      message: data.message || data.error || 'Token atau respons ditolak oleh Google Apps Script.',
    };
  } catch (err: any) {
    // Coba fallback dengan metode GET
    try {
      const getUrl = `${url}?action=ping&token=${encodeURIComponent(token)}`;
      const getRes = await fetch(getUrl, { mode: 'cors', redirect: 'follow' });
      const getText = await getRes.text();
      const getData = JSON.parse(getText);
      if (getData && getData.success) {
        return {
          success: true,
          message: getData.message || `Terhubung melalui GET ke ${getData.spreadsheetTitle || 'Google Sheets'}!`,
          spreadsheetTitle: getData.spreadsheetTitle,
        };
      }
    } catch {
      // Abaikan fallback jika tetap gagal
    }

    return {
      success: false,
      message: err.message || 'Gagal tersambung ke URL Google Apps Script. Periksa izin Web App dan koneksi internet.',
    };
  }
}

/**
 * Menguji koneksi nyata DAN operasi tulis-baca langsung ke spreadsheet menggunakan probe test
 */
export async function testLiveReadWrite(customUrl?: string, customToken?: string): Promise<{
  success: boolean;
  message: string;
  spreadsheetTitle?: string;
  probeId?: string;
  testTabMissing?: boolean;
}> {
  const ping = await testGasConnection(customUrl, customToken);
  if (!ping.success) return ping;

  const url = (customUrl ?? getSheetsConfig().webAppUrl).trim();
  const token = (customToken ?? getSheetsConfig().token).trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'test_write_read', token }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        message: 'Gagal memproses respons JSON saat uji coba tulis-baca.',
      };
    }

    if (data && data.success && data.verified && data.rolledBack) {
      const sheetName = data.spreadsheetTitle || ping.spreadsheetTitle || 'Progres Belajar Grace';
      return {
        success: true,
        spreadsheetTitle: sheetName,
        probeId: data.probeId,
        message: `Uji tulis-baca dan rollback terverifikasi 100%! Probe ID ${data.probeId} berhasil ditulis dan dihapus kembali dari tab BBM_Integration_Test.`,
      };
    }

    if (data && data.error === 'TEST_TAB_NOT_FOUND') {
      return {
        success: false,
        testTabMissing: true,
        spreadsheetTitle: data.spreadsheetTitle || ping.spreadsheetTitle,
        message: data.message || 'Tab uji "BBM_Integration_Test" belum tersedia di spreadsheet. Sesuai aturan keamanan, tab tidak dibuat otomatis.',
      };
    }

    return {
      success: false,
      message: data.message || data.error || 'Uji coba tulis-baca ditolak oleh Google Apps Script.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Ping berhasil, namun uji tulis-baca gagal: ${err.message}`,
    };
  }
}

/**
 * Sinkronisasi data rekap dan antrean offline ke Google Sheets dengan per-transaction confirmation
 */
export async function syncRekapList(
  items: RekapItem[],
  graceStatus?: GraceStatusPayload
): Promise<{
  success: boolean;
  syncedCount: number;
  confirmedIds: string[];
  message: string;
}> {
  if (!isSheetsConfigured()) {
    // Masukkan ke offline queue agar tidak hilang
    items.filter((x) => !x.synced).forEach(addToOfflineQueue);
    return {
      success: false,
      syncedCount: 0,
      confirmedIds: [],
      message: 'Google Sheets belum dikonfigurasi. Data tetap aman di antrean offline.',
    };
  }

  // Gabungkan item yang belum tersinkron dengan antrean offline
  const offlineQueue = getOfflineQueue();
  const combined = [...offlineQueue];

  items.forEach((item) => {
    if (!item.synced && !combined.some((c) => c.id === item.id)) {
      combined.push(item);
    }
  });

  if (combined.length === 0 && !graceStatus) {
    return {
      success: true,
      syncedCount: 0,
      confirmedIds: [],
      message: 'Semua data rekap sudah tersinkron dengan Google Sheets.',
    };
  }

  try {
    const response = await sendToGas({
      action: 'sync_all',
      items: combined,
      status: graceStatus,
    });

    if (response && response.success) {
      // HANYA hapus item dari antrean yang secara spesifik dikonfirmasi oleh server
      const confirmedIds: string[] = Array.isArray(response.confirmedIds)
        ? response.confirmedIds
        : (combined.map((x) => x.id).filter(Boolean) as string[]);

      removeFromOfflineQueue(confirmedIds);

      const count = response.rekapSaved ?? confirmedIds.length;
      return {
        success: true,
        syncedCount: count,
        confirmedIds: confirmedIds,
        message: response.message || `Berhasil menyimpan ${count} aktivitas ke Google Sheets!`,
      };
    }

    throw new Error(response.message || 'Gagal menyimpan ke Google Sheets');
  } catch (err: any) {
    // Pastikan semua item tetap aman di offline queue
    combined.forEach(addToOfflineQueue);
    throw err;
  }
}

/**
 * Menarik seluruh riwayat data dari Google Sheets
 */
export async function pullDataFromSheets(): Promise<{
  success: boolean;
  rekap?: RekapItem[];
  status?: GraceStatusPayload;
  message?: string;
}> {
  if (!isSheetsConfigured()) {
    return {
      success: false,
      message: 'Google Sheets belum dikonfigurasi.',
    };
  }

  try {
    const response = await sendToGas({ action: 'pull_all' });
    if (response && response.success && response.data) {
      return {
        success: true,
        rekap: response.data.rekap || [],
        status: response.data.status,
      };
    }
    return {
      success: false,
      message: response.message || 'Gagal membaca data dari Google Sheets.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menghubungi Google Apps Script.',
    };
  }
}
