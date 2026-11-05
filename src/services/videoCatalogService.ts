import { YouTubeArchiveItem } from '../types/index';

export interface RawCatalogData {
  schemaVersion?: number;
  updatedAt: string;
  channel?: {
    name?: string;
    id?: string;
    url?: string;
  };
  videos: any[];
  shorts: any[];
}

export interface CatalogStats {
  updatedAt?: string;
  totalLoaded: number;
  totalFiltered31d: number;
  totalRejectedOld: number;
  totalRejectedInvalid: number;
  sourceFile: string;
  isLiveGitHub: boolean;
}

export interface ProcessedCatalogResult {
  videos: YouTubeArchiveItem[];
  shorts: YouTubeArchiveItem[];
  stats: CatalogStats;
}

// v5 sengaja memisahkan cache dari v4 agar katalog lama yang tidak memiliki Shorts terbaru
// tidak terus diprioritaskan hanya karena timestamp lokalnya lebih baru.
const STORAGE_KEY_CATALOG = 'bbm_cached_h2h_archive_v5';
const STORAGE_KEY_FETCH_TIME = 'bbm_cached_h2h_archive_fetch_time_v5';

// Mirror endpoints disusun tanpa header kustom non-safelisted agar tidak memicu HTTP OPTIONS Preflight
export const MIRROR_SOURCES = [
  {
    name: 'GitHub Pages',
    url: 'https://synowl.github.io/Bbm-hybrid-preview/data/h2h-archive.json',
  },
  {
    name: 'GitHub API Raw',
    url: 'https://api.github.com/repos/SynOwl/Bbm-hybrid-preview/contents/data/h2h-archive.json?ref=fix%2Frestore-missing-h2h-shorts',
    headers: { Accept: 'application/vnd.github.raw+json' },
  },
  {
    name: 'jsDelivr CDN',
    url: 'https://cdn.jsdelivr.net/gh/SynOwl/Bbm-hybrid-preview@fix/restore-missing-h2h-shorts/data/h2h-archive.json',
  },
  {
    name: 'raw.githubusercontent.com',
    url: 'https://raw.githubusercontent.com/SynOwl/Bbm-hybrid-preview/fix/restore-missing-h2h-shorts/data/h2h-archive.json',
  },
];

/**
 * Validasi ketat format tanggal ISO: menolak string kosong, bukan string, atau nilai tanggal tidak valid
 */
export function isValidIsoDate(dateStr: unknown): boolean {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) {
    return false;
  }
  const time = new Date(dateStr).getTime();
  return !isNaN(time) && time > 0;
}

/**
 * Validasi ketat struktur JSON katalog
 */
export function validateCatalogStructure(json: any): json is RawCatalogData {
  if (!json || typeof json !== 'object') return false;
  if (!isValidIsoDate(json.updatedAt)) return false;
  if (!Array.isArray(json.videos) || !Array.isArray(json.shorts)) return false;
  return true;
}

export type CatalogFetchStatus = 'updated' | 'unchanged' | 'failed';

export interface CatalogFetchResult {
  status: CatalogFetchStatus;
  data: RawCatalogData;
  source: string;
  isNewer: boolean;
  message: string;
}

export interface MirrorDiagnosticLog {
  name: string;
  url: string;
  status: number | string;
  durationMs: number;
  success: boolean;
  error?: string;
  updatedAt?: string;
  shortsCount?: number;
  hasId1: boolean;
  hasId2: boolean;
}

export interface BrowserCatalogDiagnostics {
  timestamp: string;
  localStorageCache: {
    exists: boolean;
    updatedAt: string | null;
    fetchTime: string | null;
    videosCount: number;
    shortsCount: number;
    hasId1: boolean;
    hasId2: boolean;
  };
  mirrors: MirrorDiagnosticLog[];
  masterTimeoutTriggered: boolean;
  selection: {
    selectedSource: string;
    status: CatalogFetchStatus;
    updatedAt: string;
    cachedTime: number;
    bestOnlineTime: number;
    comparison: string;
    hasId1: boolean;
    hasId2: boolean;
  } | null;
  processing: {
    totalShortsLoaded: number;
    totalShortsFiltered31d: number;
    hasId1: boolean;
    hasId2: boolean;
    id1Index: number;
    id2Index: number;
  } | null;
}

// Objek diagnostik runtime yang dapat diakses di console browser via window.__BBM_DIAGNOSTICS__
let latestDiagnostics: BrowserCatalogDiagnostics = {
  timestamp: new Date().toISOString(),
  localStorageCache: {
    exists: false,
    updatedAt: null,
    fetchTime: null,
    videosCount: 0,
    shortsCount: 0,
    hasId1: false,
    hasId2: false,
  },
  mirrors: [],
  masterTimeoutTriggered: false,
  selection: null,
  processing: null,
};

export function getLatestDiagnostics(): BrowserCatalogDiagnostics {
  return latestDiagnostics;
}

if (typeof window !== 'undefined') {
  (window as any).__BBM_DIAGNOSTICS__ = latestDiagnostics;
}

/**
 * Mengambil data dari satu mirror dengan timeout lokal dan pembatalan dari parent master signal
 */
async function fetchSingleMirror(
  mirror: { name: string; url: string; headers?: Record<string, string> },
  nonce: string,
  parentSignal: AbortSignal,
  diagnosticLogs: MirrorDiagnosticLog[]
): Promise<{ data: RawCatalogData; source: string; timestamp: number }> {
  const sep = mirror.url.includes('?') ? '&' : '?';
  const targetUrl = `${mirror.url}${sep}_t=${nonce}`;

  const localController = new AbortController();
  const onParentAbort = () => localController.abort();
  parentSignal.addEventListener('abort', onParentAbort);
  const timeoutId = setTimeout(() => localController.abort(), 4500); // 4.5s per mirror
  const startTime = performance.now();

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: mirror.headers || {}, // Tanpa Cache-Control/Pragma agar tidak memicu CORS Preflight OPTIONS
      signal: localController.signal,
    });

    const elapsed = Math.round(performance.now() - startTime);

    if (!res.ok) {
      diagnosticLogs.push({
        name: mirror.name,
        url: mirror.url,
        status: res.status,
        durationMs: elapsed,
        success: false,
        error: `HTTP ${res.status}`,
        hasId1: false,
        hasId2: false,
      });
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!validateCatalogStructure(json)) {
      diagnosticLogs.push({
        name: mirror.name,
        url: mirror.url,
        status: res.status,
        durationMs: elapsed,
        success: false,
        error: 'JSON struktur/updatedAt tidak valid',
        hasId1: false,
        hasId2: false,
      });
      throw new Error('Struktur JSON tidak valid atau updatedAt tidak berformat tanggal ISO');
    }

    const hasId1 = Array.isArray(json.shorts) && json.shorts.some((s: any) => s && s.id === 'KLUCXIGvx0c');
    const hasId2 = Array.isArray(json.shorts) && json.shorts.some((s: any) => s && s.id === 'nl-YbxNFlGk');

    diagnosticLogs.push({
      name: mirror.name,
      url: mirror.url,
      status: res.status,
      durationMs: elapsed,
      success: true,
      updatedAt: json.updatedAt,
      shortsCount: json.shorts?.length || 0,
      hasId1,
      hasId2,
    });

    const catalogTime = new Date(json.updatedAt).getTime();
    return { data: json, source: mirror.name, timestamp: catalogTime };
  } catch (err: any) {
    const elapsed = Math.round(performance.now() - startTime);
    const existing = diagnosticLogs.find((l) => l.name === mirror.name);
    if (!existing) {
      diagnosticLogs.push({
        name: mirror.name,
        url: mirror.url,
        status: err.name === 'AbortError' ? 'TIMEOUT / ABORTED' : 'FETCH_ERROR',
        durationMs: elapsed,
        success: false,
        error: err.message,
        hasId1: false,
        hasId2: false,
      });
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    parentSignal.removeEventListener('abort', onParentAbort);
  }
}

/**
 * Mengambil katalog dari seluruh mirror secara paralel dan memilih data dengan updatedAt TERBARU.
 * Dilengkapi batas waktu keseluruhan (master timeout 5 detik) dan pembatalan request gantung.
 */
export async function fetchBestCatalogFromMirrors(): Promise<CatalogFetchResult> {
  const nonce = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let rawCacheFromStorage: any = null;
  let cacheFetchTime: string | null = null;
  if (typeof localStorage !== 'undefined') {
    try {
      const rawStr = localStorage.getItem(STORAGE_KEY_CATALOG);
      cacheFetchTime = localStorage.getItem(STORAGE_KEY_FETCH_TIME);
      if (rawStr) rawCacheFromStorage = JSON.parse(rawStr);
    } catch {}
  }

  const existingCache = ambilDariLocalStorageAman();
  const cachedTime = existingCache ? new Date(existingCache.updatedAt).getTime() : 0;

  const storageDiag = {
    exists: Boolean(rawCacheFromStorage),
    updatedAt: rawCacheFromStorage?.updatedAt || null,
    fetchTime: cacheFetchTime,
    videosCount: rawCacheFromStorage?.videos?.length || 0,
    shortsCount: rawCacheFromStorage?.shorts?.length || 0,
    hasId1: Array.isArray(rawCacheFromStorage?.shorts) && rawCacheFromStorage.shorts.some((s: any) => s && s.id === 'KLUCXIGvx0c'),
    hasId2: Array.isArray(rawCacheFromStorage?.shorts) && rawCacheFromStorage.shorts.some((s: any) => s && s.id === 'nl-YbxNFlGk'),
  };

  const mirrorDiagnostics: MirrorDiagnosticLog[] = [];
  let masterTimeoutTriggered = false;
  const masterController = new AbortController();
  const masterTimeout = setTimeout(() => {
    masterTimeoutTriggered = true;
    masterController.abort();
  }, 5000);

  let successfulCandidates: Array<{ data: RawCatalogData; source: string; timestamp: number }> = [];
  try {
    const results = await Promise.allSettled(
      MIRROR_SOURCES.map((m) => fetchSingleMirror(m, nonce, masterController.signal, mirrorDiagnostics))
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value && r.value.timestamp > 0) successfulCandidates.push(r.value);
    }
  } finally {
    clearTimeout(masterTimeout);
    masterController.abort();
  }

  successfulCandidates.sort((a, b) => b.timestamp - a.timestamp);
  const bestOnline = successfulCandidates[0];
  let fetchResult: CatalogFetchResult;

  if (bestOnline) {
    const onlineHasId1 = bestOnline.data.shorts.some((s: any) => s?.id === 'KLUCXIGvx0c');
    const onlineHasId2 = bestOnline.data.shorts.some((s: any) => s?.id === 'nl-YbxNFlGk');
    const cacheHasId1 = Boolean(existingCache?.shorts?.some((s: any) => s?.id === 'KLUCXIGvx0c'));
    const cacheHasId2 = Boolean(existingCache?.shorts?.some((s: any) => s?.id === 'nl-YbxNFlGk'));
    const onlineRepairsMissingShorts =
      (onlineHasId1 && !cacheHasId1) || (onlineHasId2 && !cacheHasId2);

    if (bestOnline.timestamp > cachedTime || onlineRepairsMissingShorts) {
      simpanKeLocalStorageAman(bestOnline.data);
      fetchResult = {
        status: 'updated',
        data: bestOnline.data,
        source: bestOnline.source,
        isNewer: true,
        message: onlineRepairsMissingShorts
          ? `Katalog diperbaiki dari ${bestOnline.source}; Shorts yang hilang dipulihkan.`
          : `Katalog berhasil diperbarui dari ${bestOnline.source}.`,
      };
    } else {
      const effectiveData = (existingCache && cachedTime > bestOnline.timestamp) ? existingCache : bestOnline.data;
      const effectiveSource = (existingCache && cachedTime > bestOnline.timestamp)
        ? `Penyimpanan Lokal HP (Lebih baru dari ${bestOnline.source})`
        : bestOnline.source;
      fetchResult = {
        status: 'unchanged',
        data: effectiveData,
        source: effectiveSource,
        isNewer: false,
        message: (existingCache && cachedTime > bestOnline.timestamp)
          ? `Katalog lokal di HP sudah lebih baru daripada ${bestOnline.source}.`
          : `Katalog sudah merupakan versi paling baru dari ${bestOnline.source}.`,
      };
    }
  } else if (existingCache) {
    fetchResult = {
      status: 'failed',
      data: existingCache,
      source: 'Penyimpanan Lokal HP (Cadangan)',
      isNewer: false,
      message: 'Semua mirror gagal diakses. Menampilkan data tersimpan di HP.',
    };
  } else {
    const bundled = await fetchBundledBackup();
    if (bundled) {
      fetchResult = {
        status: 'failed',
        data: bundled,
        source: 'Arsip Bundel APK (Cadangan Terakhir)',
        isNewer: false,
        message: 'Tidak ada koneksi internet. Menggunakan arsip bundel lokal.',
      };
    } else {
      throw new Error('Tidak ada katalog valid yang berhasil dimuat dari jaringan maupun penyimpanan lokal.');
    }
  }

  const hasId1InSelected = Array.isArray(fetchResult.data.shorts) && fetchResult.data.shorts.some((s: any) => s && s.id === 'KLUCXIGvx0c');
  const hasId2InSelected = Array.isArray(fetchResult.data.shorts) && fetchResult.data.shorts.some((s: any) => s && s.id === 'nl-YbxNFlGk');

  latestDiagnostics = {
    timestamp: new Date().toISOString(),
    localStorageCache: storageDiag,
    mirrors: mirrorDiagnostics,
    masterTimeoutTriggered,
    selection: {
      selectedSource: fetchResult.source,
      status: fetchResult.status,
      updatedAt: fetchResult.data.updatedAt,
      cachedTime,
      bestOnlineTime: bestOnline ? bestOnline.timestamp : 0,
      comparison: bestOnline
        ? (bestOnline.timestamp > cachedTime
            ? 'ONLINE_LEBIH_BARU'
            : (bestOnline.timestamp === cachedTime ? 'SAMA_PERSIS' : 'CACHE_LOKAL_LEBIH_BARU'))
        : 'TIDAK_ADA_ONLINE',
      hasId1: hasId1InSelected,
      hasId2: hasId2InSelected,
    },
    processing: latestDiagnostics.processing,
  };

  if (typeof window !== 'undefined') {
    (window as any).__BBM_DIAGNOSTICS__ = latestDiagnostics;
    console.group('🔍 [DIAGNOSTIK BROWSER BBM x H2H] fetchBestCatalogFromMirrors');
    console.log('1. LocalStorage Browser:', storageDiag);
    console.table(mirrorDiagnostics);
    console.log('2. Master Timeout Terpicu?', masterTimeoutTriggered);
    console.log('3. Sumber Terpilih:', fetchResult.source, fetchResult.status);
    console.log('4. ID Shorts Terpilih:', { hasId1: hasId1InSelected, hasId2: hasId2InSelected });
    console.groupEnd();
  }

  return fetchResult;
}

/**
 * Simpan katalog dengan penanganan kuota localStorage yang aman
 */
function simpanKeLocalStorageAman(data: RawCatalogData): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY_FETCH_TIME, new Date().toISOString());
  } catch (err: any) {
    console.warn('Gagal menyimpan katalog ke localStorage:', err.message);
  }
}

/**
 * Ambil cache lokal hanya jika struktur data masih valid
 */
export function ambilDariLocalStorageAman(): RawCatalogData | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATALOG);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (validateCatalogStructure(parsed)) return parsed;
    localStorage.removeItem(STORAGE_KEY_CATALOG);
    return null;
  } catch {
    return null;
  }
}

/**
 * Pengambilan berkas bundel lokal cadangan dengan try/finally timeout
 */
async function fetchBundledBackup(): Promise<RawCatalogData | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`data/h2h-archive.json?_t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (res.ok) {
      const data = await res.json();
      if (validateCatalogStructure(data)) return data;
    }
  } catch {
    // Abaikan jika tidak tersedia
  } finally {
    clearTimeout(timeoutId);
  }
  return null;
}

/**
 * Memfilter katalog sesuai aturan 31 hari, memilah Video dan Shorts, serta mengurutkan berdasarkan tanggal terbaru.
 */
export function filterAndProcessCatalog(
  raw: RawCatalogData,
  sourceName: string
): ProcessedCatalogResult {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
  let totalRejectedOld = 0;
  let totalRejectedInvalid = 0;

  const processCategory = (items: any[], forceShort: boolean): YouTubeArchiveItem[] => {
    const list: YouTubeArchiveItem[] = [];
    (Array.isArray(items) ? items : []).forEach((x) => {
      if (!x || !x.id || typeof x.id !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(x.id)) {
        totalRejectedInvalid++;
        return;
      }
      if (!isValidIsoDate(x.published)) {
        totalRejectedInvalid++;
        return;
      }
      const pub = new Date(x.published);
      if (pub.getTime() < cutoff.getTime() || pub.getTime() > now.getTime() + 86400000) {
        totalRejectedOld++;
        return;
      }
      const isShort = Boolean(x.isShort === true || x.kind === 'short' || forceShort);
      list.push({
        id: x.id,
        title: x.title_id || x.title || 'Video Hearts2Hearts',
        thumbnail: x.thumbnail || `https://img.youtube.com/vi/${x.id}/hqdefault.jpg`,
        published: pub,
        rawPublished: x.published,
        isShort,
      });
    });
    list.sort((a, b) => b.published.getTime() - a.published.getTime());
    return list;
  };

  const videos = processCategory(raw.videos, false);
  const shorts = processCategory(raw.shorts, true);
  const hasId1InProcessed = shorts.some((s) => s.id === 'KLUCXIGvx0c');
  const hasId2InProcessed = shorts.some((s) => s.id === 'nl-YbxNFlGk');
  latestDiagnostics = {
    ...latestDiagnostics,
    processing: {
      totalShortsLoaded: raw.shorts?.length || 0,
      totalShortsFiltered31d: shorts.length,
      hasId1: hasId1InProcessed,
      hasId2: hasId2InProcessed,
      id1Index: shorts.findIndex((s) => s.id === 'KLUCXIGvx0c'),
      id2Index: shorts.findIndex((s) => s.id === 'nl-YbxNFlGk'),
    },
  };
  if (typeof window !== 'undefined') {
    (window as any).__BBM_DIAGNOSTICS__ = latestDiagnostics;
    console.log('4. Hasil filterAndProcessCatalog:', latestDiagnostics.processing);
  }

  const stats: CatalogStats = {
    updatedAt: raw.updatedAt,
    totalLoaded: (raw.videos?.length || 0) + (raw.shorts?.length || 0),
    totalFiltered31d: videos.length + shorts.length,
    totalRejectedOld,
    totalRejectedInvalid,
    sourceFile: sourceName,
    isLiveGitHub: sourceName !== 'Penyimpanan Lokal HP',
  };
  return { videos, shorts, stats };
}
