import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ScreenId, H2HEvent, RekapItem, H2HMember, SheetsSyncStatus, GraceStatusPayload, YouTubeArchiveItem, H2HProfile } from '../types';
import {
  MAX_SAVING,
  XP_PER_LEVEL,
  MAPEL_DEFAULT,
  EVENTS,
  MEMBER,
  BADGES,
} from '../data/constants';
import {
  getLocalDate,
  getTanggalSenin,
  getTanggalMingguTerakhir,
  isHariMinggu,
  simpanFotoMemberDB,
  ambilFotoMemberDB,
  hapusFotoMemberDB,
} from '../utils/storage';
import {
  suaraKlik,
  suaraHadiah,
  suaraHappyBirthday,
  ucapkanTeks,
} from '../utils/audio';
import { spawnConfettiCSS } from '../utils/confetti';
import {
  isSheetsConfigured,
  getSheetsConfig,
  saveSheetsConfig,
  syncRekapList,
  pullDataFromSheets,
  testGasConnection,
  testLiveReadWrite,
  getOfflineQueue,
} from '../services/sheetsSync';
import {
  CatalogStats,
  fetchBestCatalogFromMirrors,
  filterAndProcessCatalog,
  ambilDariLocalStorageAman,
} from '../services/videoCatalogService';

export interface RewardModalData {
  show: boolean;
  icon: string;
  title: string;
  sub: string;
  reward: string;
  onPlayAgain?: () => void;
}

export interface AppContextType {
  screen: ScreenId;
  go: (id: ScreenId) => void;
  selectedDay: string;
  pilihHari: (h: string) => void;
  ubahHari: () => void;
  saving: number;
  addSaving: (m: number) => void;
  todayRewards: Record<string, number>;
  addTodayReward: (key: string, m: number) => void;
  currentMode: number;
  setCurrentMode: (m: number) => void;
  currentMapel: string;
  setCurrentMapel: (m: string) => void;
  currentJumlah: number;
  setCurrentJumlah: (j: number) => void;
  currentWaktu: string;
  setCurrentWaktu: (w: string) => void;
  currentMetode: string;
  setCurrentMetode: (m: string) => void;
  userXP: number;
  userLevel: number;
  userStreak: number;
  userBadges: string[];
  addXP: (amount: number) => void;
  cekBadge: (id: string) => void;
  kuotaSekarang: Record<string, number>;
  riwayatMapelMingguIni: Record<string, number>;
  potongKuota: (namaMapel: string) => boolean;
  tutupMinggu: () => void;
  mapelMingguGratis: string;
  currentTema: string;
  applyTema: (id: string) => void;
  tampilanFoto: string;
  setTampilanFoto: (mode: string) => void;
  fotoLatarCustom: string;
  setFotoLatarCustom: (src: string) => void;
  fotoAvatar: string;
  setFotoAvatar: (src: string) => void;
  fotoGrup: string;
  setFotoGrup: (src: string) => void;
  memberCustomPhotos: Record<string, string>;
  memberOfficialPhotos: Record<string, string>;
  h2hProfile: H2HProfile | null;
  saveMemberPhoto: (id: string, src: string) => Promise<void>;
  resetMemberPhoto: (id: string) => Promise<void>;
  rekapList: RekapItem[];
  catatRekap: (item: RekapItem) => void;
  resetRekap: () => void;
  sheetsSyncStatus: SheetsSyncStatus;
  lastSyncTime: string | null;
  syncErrorMessage: string | null;
  offlineQueueCount: number;
  syncToSheets: (force?: boolean) => Promise<{ success: boolean; message: string }>;
  pullFromSheets: () => Promise<{ success: boolean; message: string }>;
  testSheetsConn: (customUrl?: string, customToken?: string) => Promise<{
    success: boolean;
    message: string;
    spreadsheetTitle?: string;
    probeId?: string;
    testTabMissing?: boolean;
  }>;
  updateSheetsConfig: (url: string, token: string) => void;
  battery: string;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  rewardModal: RewardModalData;
  setRewardModal: React.Dispatch<React.SetStateAction<RewardModalData>>;
  closeRewardModal: () => void;
  eventModal: { show: boolean; event: H2HEvent | null; umur: number };
  closeEventModal: () => void;
  levelUpModal: { show: boolean; level: number };
  closeLevelUpModal: () => void;
  goodbyeModal: boolean;
  setGoodbyeModal: (open: boolean) => void;
  lightbox: { show: boolean; src: string };
  openLightbox: (src: string) => void;
  closeLightbox: () => void;
  videoModal: { show: boolean; src: string; title: string; isYouTube: boolean; youtubeId?: string };
  videoQueue: YouTubeArchiveItem[];
  currentVideoIndex: number;
  openVideoPlayer: (src: string, title?: string, isYouTube?: boolean, youtubeId?: string, queue?: YouTubeArchiveItem[], index?: number) => void;
  navigateVideo: (direction: -1 | 1) => void;
  closeVideoPlayer: () => void;
  activeGameMode: 'waktu' | 'seru';
  setActiveGameMode: (mode: 'waktu' | 'seru') => void;
  catalogVideos: YouTubeArchiveItem[];
  catalogShorts: YouTubeArchiveItem[];
  catalogStats: CatalogStats | null;
  catalogLastCheckedAt: Date | null;
  catalogLastRefreshedAt: Date | null;
  catalogLoading: boolean;
  catalogRefreshing: boolean;
  refreshCatalog: (manual?: boolean) => Promise<{ status: 'updated' | 'unchanged' | 'failed'; message: string; source?: string }>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<ScreenId>('s-hari');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [saving, setSaving] = useState<number>(0);
  const [todayRewards, setTodayRewards] = useState<Record<string, number>>({});
  const [currentMode, setCurrentMode] = useState<number>(1);
  const [currentMapel, setCurrentMapel] = useState<string>('');
  const [currentJumlah, setCurrentJumlah] = useState<number>(0);
  const [currentWaktu, setCurrentWaktu] = useState<string>('');
  const [currentMetode, setCurrentMetode] = useState<string>('');
  const [activeGameMode, setActiveGameMode] = useState<'waktu' | 'seru'>('waktu');

  const [userXP, setUserXP] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [userStreak, setUserStreak] = useState<number>(1);
  const [userBadges, setUserBadges] = useState<string[]>([]);

  const [kuotaSekarang, setKuotaSekarang] = useState<Record<string, number>>({});
  const [riwayatMapelMingguIni, setRiwayatMapelMingguIni] = useState<Record<string, number>>({});
  const [mingguSudahDitutup, setMingguSudahDitutup] = useState<string>('');
  const [mapelMingguGratis] = useState<string>('Matematika');

  const [currentTema, setCurrentTema] = useState<string>('h2h');
  const [tampilanFoto, setTampilanFotoState] = useState<string>('cover');
  const [fotoLatarCustom, setFotoLatarCustomState] = useState<string>('');
  const [fotoAvatar, setFotoAvatarState] = useState<string>('');
  const [fotoGrup, setFotoGrupState] = useState<string>(
    'https://hips.hearstapps.com/hmg-prod/images/eee8b03c-98a3-4740-b83b-b0953f98fd68.png?crop=0.492xw%3A0.984xh%3B0.00489xw%2C0.00977xh&resize=1200%3A%2A'
  );
  const [memberCustomPhotos, setMemberCustomPhotos] = useState<Record<string, string>>({});
  const [memberOfficialPhotos, setMemberOfficialPhotos] = useState<Record<string, string>>({});
  const [h2hProfile, setH2HProfile] = useState<H2HProfile | null>(null);

  const [rekapList, setRekapList] = useState<RekapItem[]>([]);
  const [sheetsSyncStatus, setSheetsSyncStatus] = useState<SheetsSyncStatus>(() => {
    return isSheetsConfigured() ? 'idle' : 'unconfigured';
  });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem('bbm_sheets_last_sync_time');
    } catch {
      return null;
    }
  });
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => getOfflineQueue().length);
  const [battery, setBattery] = useState<string>('100%');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [rewardModal, setRewardModal] = useState<RewardModalData>({
    show: false,
    icon: '🎉',
    title: '',
    sub: '',
    reward: '',
  });

  const [eventModal, setEventModal] = useState<{ show: boolean; event: H2HEvent | null; umur: number }>({
    show: false,
    event: null,
    umur: 0,
  });

  const [levelUpModal, setLevelUpModal] = useState<{ show: boolean; level: number }>({
    show: false,
    level: 1,
  });

  const [goodbyeModal, setGoodbyeModal] = useState<boolean>(false);
  const [lightbox, setLightbox] = useState<{ show: boolean; src: string }>({ show: false, src: '' });
  const [videoModal, setVideoModal] = useState<{
    show: boolean;
    src: string;
    title: string;
    isYouTube: boolean;
    youtubeId?: string;
  }>({
    show: false,
    src: '',
    title: '',
    isYouTube: false,
  });
  const [videoQueue, setVideoQueue] = useState<YouTubeArchiveItem[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(-1);

  // Katalog YouTube & Shorts: Inisialisasi instan dari cache lokal jika tersedia
  const [catalogVideos, setCatalogVideos] = useState<YouTubeArchiveItem[]>(() => {
    const cached = ambilDariLocalStorageAman();
    return cached ? filterAndProcessCatalog(cached, 'Penyimpanan Lokal').videos : [];
  });
  const [catalogShorts, setCatalogShorts] = useState<YouTubeArchiveItem[]>(() => {
    const cached = ambilDariLocalStorageAman();
    return cached ? filterAndProcessCatalog(cached, 'Penyimpanan Lokal').shorts : [];
  });
  const [catalogStats, setCatalogStats] = useState<CatalogStats | null>(() => {
    const cached = ambilDariLocalStorageAman();
    return cached ? filterAndProcessCatalog(cached, 'Penyimpanan Lokal').stats : null;
  });
  const [catalogLoading, setCatalogLoading] = useState<boolean>(() => {
    return ambilDariLocalStorageAman() === null;
  });
  const [catalogRefreshing, setCatalogRefreshing] = useState<boolean>(false);
  const [catalogLastCheckedAt, setCatalogLastCheckedAt] = useState<Date | null>(null);
  // Waktu refresh katalog terakhir yang berhasil, mengikuti jam perangkat dan bertahan setelah aplikasi dibuka ulang.
  const [catalogLastRefreshedAt, setCatalogLastRefreshedAt] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem('bbm_catalog_last_successful_refresh_v1');
      if (!saved) return null;
      const parsed = new Date(saved);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  });
  const lastCatalogFetchRef = useRef<number>(0);
  const inFlightFetchRef = useRef<Promise<{ status: 'updated' | 'unchanged' | 'failed'; message: string; source?: string }> | null>(null);

  // Referensi layar aktif agar polling katalog 5 menit hanya berjalan saat halaman Video terbuka.
  const activeScreenRef = useRef<ScreenId>(screen);
  useEffect(() => {
    activeScreenRef.current = screen;
  }, [screen]);

  const refreshCatalog = useCallback(async (manual = false): Promise<{ status: 'updated' | 'unchanged' | 'failed'; message: string; source?: string }> => {
    // 1. Proteksi konkurensi (Koreksi 2): Jika sedang ada proses fetch yang berjalan, hindari request duplikat!
    if (inFlightFetchRef.current) {
      if (manual) {
        setCatalogRefreshing(true);
        try {
          return await inFlightFetchRef.current;
        } finally {
          setCatalogRefreshing(false);
        }
      }
      return inFlightFetchRef.current;
    }

    const now = Date.now();
    // 2. Debounce untuk panggilan otomatis (background): jika baru saja fetch < 5 menit lalu, lewati
    if (!manual && now - lastCatalogFetchRef.current < 5 * 60 * 1000) {
      return { status: 'unchanged', message: 'Katalog baru saja diperiksa.' };
    }

    if (manual) {
      setCatalogRefreshing(true);
    } else if (catalogVideos.length === 0 && catalogShorts.length === 0) {
      setCatalogLoading(true);
    }

    const runFetch = async (): Promise<{ status: 'updated' | 'unchanged' | 'failed'; message: string; source?: string }> => {
      try {
        const best = await fetchBestCatalogFromMirrors();
        const processed = filterAndProcessCatalog(best.data, best.source);
        setCatalogVideos(processed.videos);
        setCatalogShorts(processed.shorts);
        setCatalogStats(processed.stats);
        if (best.status === 'updated' || best.status === 'unchanged') {
          const refreshedAt = new Date();
          lastCatalogFetchRef.current = refreshedAt.getTime();
          setCatalogLastRefreshedAt(refreshedAt);
          try {
            localStorage.setItem('bbm_catalog_last_successful_refresh_v1', refreshedAt.toISOString());
          } catch {
            // Timestamp tetap ditampilkan selama sesi aktif jika penyimpanan lokal tidak tersedia.
          }
        }
        return { status: best.status, message: best.message, source: best.source };
      } catch (err: any) {
        console.warn('Auto-update katalog gagal:', err.message);
        if (catalogVideos.length === 0 && catalogShorts.length === 0) {
          const cached = ambilDariLocalStorageAman();
          if (cached) {
            const processed = filterAndProcessCatalog(cached, 'Penyimpanan Lokal HP (Cadangan)');
            setCatalogVideos(processed.videos);
            setCatalogShorts(processed.shorts);
            setCatalogStats(processed.stats);
          }
        }
        return { status: 'failed', message: err.message || 'Katalog gagal dimuat.' };
      } finally {
        setCatalogLastCheckedAt(new Date());
        setCatalogLoading(false);
        setCatalogRefreshing(false);
        inFlightFetchRef.current = null;
      }
    };

    const promise = runFetch();
    inFlightFetchRef.current = promise;
    return promise;
  }, [catalogVideos.length, catalogShorts.length]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2500);
  };

  const go = (id: ScreenId) => {
    setScreen(id);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };

  // Pemantauan baterai: peringatan 25%, 20%, 15%, 10%, 5% saat tidak dicas,
  // serta pengingat cabut charger ketika penuh. Berjalan selama halaman BBM aktif.
  useEffect(() => {
    type BatteryManagerLike = {
      level: number;
      charging: boolean;
      addEventListener: (type: 'levelchange' | 'chargingchange', listener: () => void) => void;
      removeEventListener: (type: 'levelchange' | 'chargingchange', listener: () => void) => void;
    };
    type BatteryNavigator = Navigator & { getBattery?: () => Promise<BatteryManagerLike> };

    let disposed = false;
    let manager: BatteryManagerLike | null = null;
    let lastAlertedThreshold: number | null = null;
    let fullAlertShown = false;
    let previousCharging: boolean | null = null;

    try {
      const savedThreshold = Number(localStorage.getItem('bbm_battery_last_alert_threshold'));
      if ([25, 20, 15, 10, 5].includes(savedThreshold)) lastAlertedThreshold = savedThreshold;
      fullAlertShown = localStorage.getItem('bbm_battery_full_alert_shown') === '1';
    } catch {
      // Tetap jalankan pemantauan tanpa penyimpanan lintas sesi.
    }

    const sendBatteryNotice = (message: string) => {
      showToast(message);
      // Notifikasi sistem hanya dipakai jika izin sebelumnya sudah diberikan.
      // Tidak memunculkan permintaan izin otomatis kepada anak.
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('BBM x H2H', { body: message, tag: 'bbm-battery-alert' });
        } catch {
          // Toast dalam aplikasi tetap menjadi jalur utama.
        }
      }
    };

    const updateBattery = () => {
      if (!manager || disposed) return;
      const percent = Math.max(0, Math.min(100, Math.round(manager.level * 100)));
      setBattery(percent + '%');

      if (previousCharging !== null && manager.charging !== previousCharging && manager.charging) {
        lastAlertedThreshold = null;
        fullAlertShown = false;
        try {
          localStorage.removeItem('bbm_battery_last_alert_threshold');
          localStorage.removeItem('bbm_battery_full_alert_shown');
        } catch {}
      }
      if (previousCharging !== null && manager.charging !== previousCharging && !manager.charging) {
        fullAlertShown = false;
        try { localStorage.removeItem('bbm_battery_full_alert_shown'); } catch {}
      }
      previousCharging = manager.charging;

      if (manager.charging) {
        if (percent >= 100 && !fullAlertShown) {
          fullAlertShown = true;
          try { localStorage.setItem('bbm_battery_full_alert_shown', '1'); } catch {}
          sendBatteryNotice('🔋 Baterai sudah 100%! Cabut charger, ya.');
        }
        return;
      }

      const threshold = [25, 20, 15, 10, 5].find((value) => percent <= value);
      if (threshold !== undefined && (lastAlertedThreshold === null || threshold < lastAlertedThreshold)) {
        lastAlertedThreshold = threshold;
        try { localStorage.setItem('bbm_battery_last_alert_threshold', String(threshold)); } catch {}
        sendBatteryNotice(`🔋 Baterai tinggal ${percent}% (batas ${threshold}%). Yuk, cas perangkat.`);
      }
    };

    const batteryNavigator = typeof navigator !== 'undefined' ? navigator as BatteryNavigator : null;
    if (batteryNavigator?.getBattery) {
      batteryNavigator.getBattery()
        .then((batteryManager) => {
          if (disposed) return;
          manager = batteryManager;
          updateBattery();
          manager.addEventListener('levelchange', updateBattery);
          manager.addEventListener('chargingchange', updateBattery);
        })
        .catch(() => setBattery('🔋'));
    } else {
      setBattery('🔋');
    }

    return () => {
      disposed = true;
      if (manager) {
        manager.removeEventListener('levelchange', updateBattery);
        manager.removeEventListener('chargingchange', updateBattery);
      }
    };
  }, []);

  // Initialize data on mount
  useEffect(() => {
    try {
      const savedTema = localStorage.getItem('temaH2H') || 'h2h';
      setCurrentTema(savedTema);
      document.body.setAttribute('data-tema', savedTema);

      const savedTampilan = localStorage.getItem('tampilanFoto') || 'cover';
      setTampilanFotoState(savedTampilan);

      const savedBg = localStorage.getItem('fotoLatarCustom') || '';
      setFotoLatarCustomState(savedBg);

      const savedAvatar = localStorage.getItem('fotoAvatar') || '';
      setFotoAvatarState(savedAvatar);

      const savedGrup = localStorage.getItem('fotoGrupH2H');
      if (savedGrup) setFotoGrupState(savedGrup);

      const today = getLocalDate();
      const rDate = localStorage.getItem('rewardsDate') || '';
      const sDay = localStorage.getItem('selectedDay') || '';
      const sDate = localStorage.getItem('selectedDate') || '';

      if (rDate !== today) {
        setSaving(0);
        setTodayRewards({});
        localStorage.setItem('tabunganWaktu', '0');
        localStorage.setItem('todayRewards', '{}');
        localStorage.setItem('rewardsDate', today);
      } else {
        const sav = parseInt(localStorage.getItem('tabunganWaktu') || '0', 10);
        setSaving(sav);
        const tr = JSON.parse(localStorage.getItem('todayRewards') || '{}');
        setTodayRewards(tr);
      }

      const xp = parseInt(localStorage.getItem('userXP') || '0', 10);
      const lvl = parseInt(localStorage.getItem('userLevel') || '1', 10);
      const strk = parseInt(localStorage.getItem('userStreak') || '1', 10);
      const bgs = JSON.parse(localStorage.getItem('userBadges') || '[]');
      setUserXP(xp);
      setUserLevel(lvl);
      setUserStreak(strk);
      setUserBadges(bgs);

      // Streak check
      const lastOpen = localStorage.getItem('lastOpenDate') || '';
      const yd = new Date();
      yd.setDate(yd.getDate() - 1);
      const yDate =
        yd.getFullYear() +
        '-' +
        String(yd.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(yd.getDate()).padStart(2, '0');

      if (lastOpen !== today) {
        let newStreak = strk;
        if (lastOpen === yDate) newStreak = strk + 1;
        else newStreak = 1;
        setUserStreak(newStreak);
        localStorage.setItem('userStreak', String(newStreak));
        localStorage.setItem('lastOpenDate', today);
      }

      // Quota reset check
      const senin = getTanggalSenin();
      const mingguLalu = getTanggalMingguTerakhir();
      const mDitutup = localStorage.getItem('mingguSudahDitutup') || '';
      setMingguSudahDitutup(mDitutup);

      let curK: Record<string, number> = JSON.parse(localStorage.getItem('kuotaSekarang') || '{}');
      let curR: Record<string, number> = JSON.parse(localStorage.getItem('riwayatMapelMingguIni') || '{}');

      // Reset mingguan ditangani oleh pemeriksaan waktu yang juga berjalan saat
      // aplikasi kembali aktif, bukan hanya ketika aplikasi pertama dibuka.

      MAPEL_DEFAULT.forEach((m) => {
        if (typeof curK[m] !== 'number') curK[m] = 3;
      });
      setKuotaSekarang(curK);
      setRiwayatMapelMingguIni(curR);

      // Rekap
      const rkp = JSON.parse(localStorage.getItem('bbm_rekap_mingguan_v2') || '[]');
      setRekapList(rkp);

      // Member custom photos from DB
      MEMBER.forEach((m) => {
        ambilFotoMemberDB(m.id).then((saved) => {
          if (saved) {
            setMemberCustomPhotos((prev) => ({ ...prev, [m.id]: saved }));
          }
        });
      });

      // Events check
      const now = new Date();
      const bln = String(now.getMonth() + 1).padStart(2, '0');
      const tgl = String(now.getDate()).padStart(2, '0');
      const todayMMDD = bln + '-' + tgl;
      const foundEvent = EVENTS.find((e) => e.tgl === todayMMDD);

      if (foundEvent && localStorage.getItem('eventShownDate') !== today) {
        const umur = now.getFullYear() - foundEvent.tahun;
        setEventModal({ show: true, event: foundEvent, umur });
        localStorage.setItem('eventShownDate', today);
        if (foundEvent.type === 'member') {
          setCurrentTema(foundEvent.id);
          document.body.setAttribute('data-tema', foundEvent.id);
        }
        suaraHappyBirthday();
        spawnConfettiCSS(foundEvent.id);
      }

      // Check default screen
      if (sDate === today && sDay) {
        setSelectedDay(sDay);
        setScreen('s-dash');
      } else {
        setScreen('s-hari');
      }
    } catch {
      // Ignore
    }
  }, []);

  // Pemeriksaan otomatis untuk pergantian hari/minggu dan pembaruan foto resmi.
  // Tidak mengubah tema, foto custom, data YouTube, atau penyimpanan progres.
  useEffect(() => {
    let lastPhotoRefresh = 0;
    let disposed = false;

    const refreshOfficialPhotos = async (force = false) => {
      const nowMs = Date.now();
      // Hindari request berulang saat event focus/visibility terjadi berdekatan.
      if (!force && nowMs - lastPhotoRefresh < 60_000) return;
      lastPhotoRefresh = nowMs;
      try {
        const response = await fetch(`data/h2h-profile.json?t=${nowMs}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (disposed || !data || !Array.isArray(data.members) || data.members.length !== 8 || !data.group) {
          throw new Error('Katalog profil H2H tidak lengkap.');
        }
        setH2HProfile(data as H2HProfile);
        const map: Record<string, string> = {};
        data.members.forEach((member: { id?: string; photoUrl?: string }) => {
          if (member?.id && member?.photoUrl) map[member.id] = member.photoUrl;
        });
        setMemberOfficialPhotos(map);
        // Foto pilihan pengguna tidak pernah ditimpa oleh foto grup dari katalog.
        if (!localStorage.getItem('fotoGrupH2H') && data.group.groupPhotoUrl) {
          setFotoGrupState(data.group.groupPhotoUrl);
        }
      } catch {
        // Pertahankan profil yang sudah tampil; file foto lama tetap menjadi fallback.
        try {
          const legacyResponse = await fetch(`data/h2h-members.json?t=${nowMs}`, { cache: 'no-store' });
          if (!legacyResponse.ok) return;
          const legacy = await legacyResponse.json();
          if (disposed || !Array.isArray(legacy.members)) return;
          const map: Record<string, string> = {};
          legacy.members.forEach((member: { id?: string; photoUrl?: string }) => {
            if (member?.id && member?.photoUrl) map[member.id] = member.photoUrl;
          });
          setMemberOfficialPhotos((previous) => ({ ...map, ...previous }));
        } catch {
          // Data yang sudah tampil tetap dipakai jika jaringan gagal.
        }
      }
    };

    const checkCalendarState = () => {
      try {
        const today = getLocalDate();
        const rewardDate = localStorage.getItem('rewardsDate') || '';
        if (rewardDate !== today) {
          localStorage.setItem('tabunganWaktu', '0');
          localStorage.setItem('todayRewards', '{}');
          localStorage.setItem('rewardsDate', today);
          setSaving(0);
          setTodayRewards({});
        }

        const lastOpen = localStorage.getItem('lastOpenDate') || '';
        if (lastOpen !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
          const previousStreak = Number.parseInt(localStorage.getItem('userStreak') || '1', 10) || 1;
          const nextStreak = lastOpen === yesterdayKey ? previousStreak + 1 : 1;
          localStorage.setItem('userStreak', String(nextStreak));
          localStorage.setItem('lastOpenDate', today);
          setUserStreak(nextStreak);
        }

        const now = new Date();
        if (now.getDay() === 1) {
          const sundayKey = getTanggalMingguTerakhir();
          const closedWeek = localStorage.getItem('mingguSudahDitutup') || '';
          if (closedWeek !== sundayKey) {
            const resetQuota: Record<string, number> = {};
            MAPEL_DEFAULT.forEach((subject) => { resetQuota[subject] = 3; });
            localStorage.setItem('kuotaSekarang', JSON.stringify(resetQuota));
            localStorage.setItem('riwayatMapelMingguIni', '{}');
            localStorage.setItem('mingguSudahDitutup', sundayKey);
            setKuotaSekarang(resetQuota);
            setRiwayatMapelMingguIni({});
            setMingguSudahDitutup(sundayKey);
          }
        }

        // Event yang jatuh pada hari ini tetap bisa muncul jika aplikasi melewati
        // tengah malam dalam keadaan terbuka, tetapi hanya sekali per tanggal.
        const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const eventToday = EVENTS.find((event) => event.tgl === monthDay);
        if (eventToday && localStorage.getItem('eventShownDate') !== today) {
          localStorage.setItem('eventShownDate', today);
          setEventModal({ show: true, event: eventToday, umur: now.getFullYear() - eventToday.tahun });
          suaraHappyBirthday();
          spawnConfettiCSS(eventToday.id);
        }
      } catch {
        // Pemeriksaan otomatis tidak boleh menghentikan aplikasi.
      }
    };

    const onResume = () => {
      checkCalendarState();
      void refreshOfficialPhotos();
      void refreshCatalog(false);
    };
    const onOnline = () => {
      void refreshOfficialPhotos(true);
      void refreshCatalog(false);
    };

    checkCalendarState();
    void refreshOfficialPhotos(true);
    void refreshCatalog(false);
    const intervalId = window.setInterval(checkCalendarState, 60_000);
    const profileIntervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshOfficialPhotos();
    }, 15 * 60 * 1000);
    const catalogIntervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshCatalog(false);
      }
    }, 15 * 60 * 1000);
    // Saat pengguna sedang membuka Video, periksa katalog lebih sering (setiap 5 menit).
    // Pemeriksaan hanya berjalan ketika tab aplikasi terlihat; debounce 5 menit dan
    // proteksi in-flight di refreshCatalog mencegah request yang bertumpuk.
    const videoCatalogIntervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible' && activeScreenRef.current === 's-video') {
        void refreshCatalog(false);
      }
    }, 5 * 60 * 1000);
    window.addEventListener('focus', onResume);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onResume);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      window.clearInterval(profileIntervalId);
      window.clearInterval(catalogIntervalId);
      window.clearInterval(videoCatalogIntervalId);
      window.removeEventListener('focus', onResume);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onResume);
    };
  }, []);

  // Sync background styling with theme and custom photo
  useEffect(() => {
    document.body.setAttribute('data-tema', currentTema);
    try {
      localStorage.setItem('temaH2H', currentTema);
    } catch {}

    const styles: Record<string, { size: string; repeat: string; pos: string }> = {
      cover: { size: 'cover', repeat: 'no-repeat', pos: 'center' },
      full: { size: '100% 100%', repeat: 'no-repeat', pos: 'center' },
      grid: { size: '80px 80px', repeat: 'repeat', pos: 'top left' },
      center: { size: 'auto', repeat: 'no-repeat', pos: 'center' },
      fit: { size: 'contain', repeat: 'no-repeat', pos: 'center' },
      stretch: { size: '100% 100%', repeat: 'no-repeat', pos: 'center' },
      off: { size: 'cover', repeat: 'no-repeat', pos: 'center' },
    };

    const s = styles[tampilanFoto] || styles.cover;

    if (tampilanFoto === 'off' || !fotoLatarCustom) {
      document.body.classList.remove('has-custom-bg');
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundPosition = '';
    } else {
      document.body.classList.add('has-custom-bg');
      document.body.style.backgroundImage = `url(${fotoLatarCustom})`;
      document.body.style.backgroundSize = s.size;
      document.body.style.backgroundRepeat = s.repeat;
      document.body.style.backgroundPosition = s.pos;
    }
  }, [currentTema, tampilanFoto, fotoLatarCustom]);

  const pilihHari = (h: string) => {
    suaraKlik();
    setSelectedDay(h);
    const today = getLocalDate();
    try {
      localStorage.setItem('selectedDay', h);
      localStorage.setItem('selectedDate', today);
    } catch {}
    go('s-dash');
    showToast(`📅 ${h}`);
  };

  const ubahHari = () => {
    suaraKlik();
    setSelectedDay('');
    try {
      localStorage.removeItem('selectedDay');
      localStorage.removeItem('selectedDate');
    } catch {}
    go('s-hari');
  };

  const addSaving = (m: number) => {
    if (saving >= MAX_SAVING) {
      showToast('Tabungan penuh 🎉');
      return;
    }
    const nextVal = Math.min(MAX_SAVING, saving + m);
    setSaving(nextVal);
    try {
      localStorage.setItem('tabunganWaktu', String(nextVal));
      localStorage.setItem('bbm_grace_status_updated_at', new Date().toISOString());
    } catch {}
    addXP(m);
  };

  const addTodayReward = (key: string, m: number) => {
    const next = { ...todayRewards, [key]: (todayRewards[key] || 0) + m };
    setTodayRewards(next);
    try {
      localStorage.setItem('todayRewards', JSON.stringify(next));
      localStorage.setItem('rewardsDate', getLocalDate());
    } catch {}
  };

  const addXP = (amount: number) => {
    const newXP = userXP + amount;
    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
    const naikLevel = newLevel > userLevel;
    setUserXP(newXP);
    try {
      localStorage.setItem('userXP', String(newXP));
      localStorage.setItem('userLevel', String(newLevel));
      localStorage.setItem('bbm_grace_status_updated_at', new Date().toISOString());
    } catch {}

    if (naikLevel) {
      setUserLevel(newLevel);
      setTimeout(() => {
        setLevelUpModal({ show: true, level: newLevel });
        spawnConfettiCSS('levelup');
        ucapkanTeks(`Selamat Grace! Kamu naik ke level ${newLevel}`);
      }, 400);
    }
  };

  const cekBadge = (id: string) => {
    if (userBadges.includes(id)) return;
    const b = BADGES.find((x) => x.id === id);
    if (!b) return;
    const nextBadges = [...userBadges, id];
    setUserBadges(nextBadges);
    try {
      localStorage.setItem('userBadges', JSON.stringify(nextBadges));
      localStorage.setItem('bbm_grace_status_updated_at', new Date().toISOString());
    } catch {}
    showToast(`🏆 Badge Baru: ${b.title}!`);
    suaraHadiah();
    spawnConfettiCSS('badge');
  };

  const potongKuota = (namaMapel: string): boolean => {
    if (!namaMapel) return false;
    const riwayat = { ...riwayatMapelMingguIni };
    const pakai = (riwayat[namaMapel] || 0) + 1;
    riwayat[namaMapel] = pakai;
    setRiwayatMapelMingguIni(riwayat);
    try {
      localStorage.setItem('riwayatMapelMingguIni', JSON.stringify(riwayat));
    } catch {}

    // Bonus +30 menit if first time this week and not Sunday
    if (pakai === 1 && !isHariMinggu()) {
      addSaving(30);
      showToast('🎉 Bonus +30 menit karena mapel pertama minggu ini!');
    }
    return true;
  };

  const tutupMinggu = () => {
    const mTerakhir = getTanggalMingguTerakhir();
    if (mingguSudahDitutup === mTerakhir) return;
    const resetK: Record<string, number> = {};
    MAPEL_DEFAULT.forEach((m) => {
      resetK[m] = 3;
    });
    setKuotaSekarang(resetK);
    setRiwayatMapelMingguIni({});
    setMingguSudahDitutup(mTerakhir);
    try {
      localStorage.setItem('kuotaSekarang', JSON.stringify(resetK));
      localStorage.setItem('riwayatMapelMingguIni', '{}');
      localStorage.setItem('mingguSudahDitutup', mTerakhir);
    } catch {}
  };

  const applyTema = (id: string) => {
    setCurrentTema(id);
    document.body.setAttribute('data-tema', id);
    try {
      localStorage.setItem('temaH2H', id);
    } catch {}
  };

  const setTampilanFoto = (mode: string) => {
    suaraKlik();
    setTampilanFotoState(mode);
    try {
      localStorage.setItem('tampilanFoto', mode);
    } catch {}
    showToast(`🖼️ Tampilan: ${mode}`);
  };

  const setFotoLatarCustom = (src: string) => {
    setFotoLatarCustomState(src);
    try {
      localStorage.setItem('fotoLatarCustom', src);
    } catch {}
  };

  const setFotoAvatar = (src: string) => {
    setFotoAvatarState(src);
    try {
      localStorage.setItem('fotoAvatar', src);
    } catch {}
  };

  const setFotoGrup = (src: string) => {
    setFotoGrupState(src);
    try {
      localStorage.setItem('fotoGrupH2H', src);
    } catch {}
  };

  const saveMemberPhoto = async (id: string, src: string) => {
    await simpanFotoMemberDB(id, src);
    setMemberCustomPhotos((prev) => ({ ...prev, [id]: src }));
    showToast(`✅ Foto ${id} tersimpan aman di HP Grace`);
  };

  const resetMemberPhoto = async (id: string) => {
    await hapusFotoMemberDB(id);
    setMemberCustomPhotos((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    showToast(`✅ Foto resmi ${id} dipakai lagi`);
  };

  const buildGraceStatus = useCallback((): GraceStatusPayload => {
    return {
      level: userLevel,
      xp: userXP,
      streak: userStreak,
      saving: saving,
      badges: userBadges,
      updatedAt: new Date().toISOString(),
    };
  }, [userLevel, userXP, userStreak, saving, userBadges]);

  const syncToSheets = async (_force = false): Promise<{ success: boolean; message: string }> => {
    if (!isSheetsConfigured()) {
      setSheetsSyncStatus('unconfigured');
      return { success: false, message: 'Google Sheets belum dikonfigurasi.' };
    }

    setSheetsSyncStatus('syncing');
    setSyncErrorMessage(null);

    try {
      const graceStatus = buildGraceStatus();
      const result = await syncRekapList(rekapList, graceStatus);

      if (result.success) {
        const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(nowStr);
        setSheetsSyncStatus('synced');
        setOfflineQueueCount(getOfflineQueue().length);
        try {
          localStorage.setItem('bbm_sheets_last_sync_time', nowStr);
        } catch {}

        // HANYA tandai transaksi yang ID-nya secara spesifik terkonfirmasi oleh Apps Script
        const confirmedSet = new Set(result.confirmedIds || []);
        setRekapList((prev) => {
          const updated = prev.map((x) => (x.id && confirmedSet.has(x.id) ? { ...x, synced: true } : x));
          try {
            localStorage.setItem('bbm_rekap_mingguan_v2', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        return { success: true, message: result.message };
      } else {
        setSheetsSyncStatus('error');
        setSyncErrorMessage(result.message);
        setOfflineQueueCount(getOfflineQueue().length);
        return { success: false, message: result.message };
      }
    } catch (err: any) {
      const msg = err.message || 'Koneksi terputus. Data tetap tersimpan aman di HP Grace.';
      setSheetsSyncStatus('error');
      setSyncErrorMessage(msg);
      setOfflineQueueCount(getOfflineQueue().length);
      return { success: false, message: msg };
    }
  };

  const pullFromSheets = async (): Promise<{ success: boolean; message: string }> => {
    if (!isSheetsConfigured()) {
      return { success: false, message: 'Google Sheets belum dikonfigurasi.' };
    }

    setSheetsSyncStatus('syncing');
    setSyncErrorMessage(null);

    try {
      const res = await pullDataFromSheets();
      if (res.success && res.rekap) {
        setRekapList((prev) => {
          const existingIds = new Set(prev.map((p) => p.id).filter(Boolean));
          const newItems = res.rekap!.filter((r) => !r.id || !existingIds.has(r.id));
          const merged = [...prev, ...newItems];
          try {
            localStorage.setItem('bbm_rekap_mingguan_v2', JSON.stringify(merged));
          } catch {}
          return merged;
        });

        // Tangani pembaruan status Grace dengan aturan resolusi konflik berbasis waktu
        if (res.status && res.status.updatedAt) {
          const sheetsTime = new Date(res.status.updatedAt).getTime();
          const localTimeStr = localStorage.getItem('bbm_grace_status_updated_at') || '';
          const localTime = localTimeStr ? new Date(localTimeStr).getTime() : 0;

          // Hanya terapkan status dari Sheets jika timestamp valid dan LEBIH BARU daripada status lokal
          if (!isNaN(sheetsTime) && sheetsTime > localTime) {
            if (typeof res.status.level === 'number' && res.status.level >= 1) {
              setUserLevel(res.status.level);
              try { localStorage.setItem('userLevel', String(res.status.level)); } catch {}
            }
            if (typeof res.status.xp === 'number' && res.status.xp >= 0) {
              setUserXP(res.status.xp);
              try { localStorage.setItem('userXP', String(res.status.xp)); } catch {}
            }
            if (typeof res.status.streak === 'number' && res.status.streak >= 1) {
              setUserStreak(res.status.streak);
              try { localStorage.setItem('userStreak', String(res.status.streak)); } catch {}
            }
            if (typeof res.status.saving === 'number' && res.status.saving >= 0) {
              setSaving(res.status.saving);
              try { localStorage.setItem('tabunganWaktu', String(res.status.saving)); } catch {}
            }
            if (Array.isArray(res.status.badges) && res.status.badges.length > 0) {
              setUserBadges(res.status.badges);
              try { localStorage.setItem('userBadges', JSON.stringify(res.status.badges)); } catch {}
            }
            try { localStorage.setItem('bbm_grace_status_updated_at', res.status.updatedAt); } catch {}
          }
        }

        const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(nowStr);
        setSheetsSyncStatus('synced');
        return {
          success: true,
          message: `Berhasil memuat ${res.rekap.length} data dari Google Sheets.`,
        };
      }
      throw new Error(res.message || 'Gagal memuat data dari spreadsheet');
    } catch (err: any) {
      setSheetsSyncStatus('error');
      setSyncErrorMessage(err.message);
      return { success: false, message: err.message };
    }
  };

  const testSheetsConn = async (customUrl?: string, customToken?: string) => {
    return testLiveReadWrite(customUrl, customToken);
  };

  const updateSheetsConfig = (url: string, token: string) => {
    saveSheetsConfig(url, token);
    const configured = isSheetsConfigured();
    setSheetsSyncStatus(configured ? 'idle' : 'unconfigured');
    setOfflineQueueCount(getOfflineQueue().length);
    showToast(configured ? '⚙️ Konfigurasi Google Sheets disimpan!' : '⚠️ Konfigurasi belum lengkap');
  };

  const catatRekap = (item: RekapItem) => {
    const uniqueId = item.id || `rekap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const itemWithTime: RekapItem = {
      ...item,
      id: uniqueId,
      waktu: item.waktu || new Date().toISOString(),
      synced: false,
    };
    const nextList = [...rekapList, itemWithTime];
    setRekapList(nextList);
    try {
      localStorage.setItem('bbm_rekap_mingguan_v2', JSON.stringify(nextList));
    } catch {}

    // Otomatis sinkronkan di latar belakang jika Google Sheets terhubung
    if (isSheetsConfigured()) {
      setSheetsSyncStatus('syncing');
      syncRekapList(nextList, buildGraceStatus())
        .then((res) => {
          if (res.success) {
            const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            setLastSyncTime(nowStr);
            setSheetsSyncStatus('synced');
            setOfflineQueueCount(getOfflineQueue().length);
            const confirmedSet = new Set(res.confirmedIds || []);
            setRekapList((prev) => {
              const updated = prev.map((x) => (x.id && confirmedSet.has(x.id) ? { ...x, synced: true } : x));
              try {
                localStorage.setItem('bbm_rekap_mingguan_v2', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          } else {
            setSheetsSyncStatus('error');
            setSyncErrorMessage(res.message);
            setOfflineQueueCount(getOfflineQueue().length);
          }
        })
        .catch((err) => {
          setSheetsSyncStatus('error');
          setSyncErrorMessage(err.message);
          setOfflineQueueCount(getOfflineQueue().length);
        });
    } else {
      setOfflineQueueCount(getOfflineQueue().length);
    }
  };

  const resetRekap = () => {
    setRekapList([]);
    try {
      localStorage.removeItem('bbm_rekap_mingguan_v2');
    } catch {}
    showToast('🧹 Rekap direset');
  };

  const closeRewardModal = () => {
    setRewardModal((prev) => ({ ...prev, show: false }));
  };

  const closeEventModal = () => {
    setEventModal((prev) => ({ ...prev, show: false }));
  };

  const closeLevelUpModal = () => {
    setLevelUpModal((prev) => ({ ...prev, show: false }));
  };

  const openLightbox = (src: string) => {
    setLightbox({ show: true, src });
  };

  const closeLightbox = () => {
    setLightbox({ show: false, src: '' });
  };

  const openVideoPlayer = (src: string, title?: string, isYouTube = false, youtubeId?: string, queue: YouTubeArchiveItem[] = [], index = -1) => {
    setVideoQueue(queue);
    setCurrentVideoIndex(index);
    setVideoModal({ show: true, src, title: title || 'Video H2H', isYouTube, youtubeId });
  };

  const navigateVideo = (direction: -1 | 1) => {
    const nextIndex = currentVideoIndex + direction;
    if (nextIndex < 0 || nextIndex >= videoQueue.length) return;
    const next = videoQueue[nextIndex];
    setCurrentVideoIndex(nextIndex);
    setVideoModal({
      show: true,
      src: `https://www.youtube.com/watch?v=${next.id}`,
      title: next.title,
      isYouTube: true,
      youtubeId: next.id,
    });
  };

  const closeVideoPlayer = () => {
    setVideoModal({ show: false, src: '', title: '', isYouTube: false });
    setVideoQueue([]);
    setCurrentVideoIndex(-1);
  };

  return (
    <AppContext.Provider
      value={{
        screen,
        go,
        selectedDay,
        pilihHari,
        ubahHari,
        saving,
        addSaving,
        todayRewards,
        addTodayReward,
        currentMode,
        setCurrentMode,
        currentMapel,
        setCurrentMapel,
        currentJumlah,
        setCurrentJumlah,
        currentWaktu,
        setCurrentWaktu,
        currentMetode,
        setCurrentMetode,
        userXP,
        userLevel,
        userStreak,
        userBadges,
        addXP,
        cekBadge,
        kuotaSekarang,
        riwayatMapelMingguIni,
        potongKuota,
        tutupMinggu,
        mapelMingguGratis,
        currentTema,
        applyTema,
        tampilanFoto,
        setTampilanFoto,
        fotoLatarCustom,
        setFotoLatarCustom,
        fotoAvatar,
        setFotoAvatar,
        fotoGrup,
        setFotoGrup,
        memberCustomPhotos,
        memberOfficialPhotos,
        h2hProfile,
        saveMemberPhoto,
        resetMemberPhoto,
        rekapList,
        catatRekap,
        resetRekap,
        sheetsSyncStatus,
        lastSyncTime,
        syncErrorMessage,
        offlineQueueCount,
        syncToSheets,
        pullFromSheets,
        testSheetsConn,
        updateSheetsConfig,
        battery,
        toastMessage,
        showToast,
        rewardModal,
        setRewardModal,
        closeRewardModal,
        eventModal,
        closeEventModal,
        levelUpModal,
        closeLevelUpModal,
        goodbyeModal,
        setGoodbyeModal,
        lightbox,
        openLightbox,
        closeLightbox,
        videoModal,
        videoQueue,
        currentVideoIndex,
        openVideoPlayer,
        navigateVideo,
        closeVideoPlayer,
        activeGameMode,
        setActiveGameMode,
        catalogVideos,
        catalogShorts,
        catalogStats,
        catalogLastCheckedAt,
        catalogLastRefreshedAt,
        catalogLoading,
        catalogRefreshing,
        refreshCatalog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
