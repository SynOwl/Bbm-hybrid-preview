export type ScreenId =
  | 's-hari'
  | 's-dash'
  | 's-upload'
  | 's-soal-view'
  | 's-mode'
  | 's-mapel'
  | 's-soal'
  | 's-metode'
  | 's-rincian'
  | 's-tunggu'
  | 's-main'
  | 's-mancing'
  | 's-sasaran'
  | 's-kotak'
  | 's-roda'
  | 's-bebek'
  | 's-bola'
  | 's-klaim'
  | 's-ai'
  | 's-ai-aman'
  | 's-laporan'
  | 's-badge'
  | 's-rekap'
  | 's-aturan'
  | 's-tema'
  | 's-grup'
  | 's-video'
  | 's-member';

export type GameTipe =
  | 'mancing'
  | 'sasaran'
  | 'kotak'
  | 'roda'
  | 'bebek'
  | 'bola'
  | 'hitung'
  | 'pola'
  | 'angka'
  | 'urutan'
  | 'kata'
  | 'teka';

export interface MapelItem {
  nama: string;
  icon: string;
}

export interface SoalOption {
  soal: number;
  waktu: string;
}

export interface TemaItem {
  id: string;
  nama: string;
  emoji: string;
}

export interface AIMapel {
  nama: string;
  icon: string;
  pesan: string;
}

export interface H2HEvent {
  type: 'member' | 'anniv';
  id: string;
  tgl: string; // MM-DD
  nama: string;
  emoji: string;
  tahun: number;
}

export interface H2HMember {
  photoUrl?: string;
  photoGallery?: string[];
  id: string;
  nama: string;
  hangul: string;
  namaLengkap: string;
  tgl: string;
  tempat: string;
  kebangsaan: string;
  emoji: string;
  posisi: string;
  warna: string;
  makanan: string;
  hobi: string;
  hewan: string;
  julukan: string;
  fun: string;
}

export interface BadgeItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
}

export interface RekapItem {
  id?: string;
  jenis: 'Belajar' | 'Bonus';
  mapel?: string;
  nama?: string;
  jumlahSoal?: number;
  skor?: number;
  menit?: number;
  waktu?: string;
  synced?: boolean;
}

export type SheetsSyncStatus = 'unconfigured' | 'idle' | 'syncing' | 'synced' | 'error';

export interface SheetsConfig {
  webAppUrl: string;
  token: string;
}

export interface GraceStatusPayload {
  level: number;
  xp: number;
  streak: number;
  saving: number;
  badges: string[];
  updatedAt: string;
}

export interface YouTubeArchiveItem {
  id: string;
  title: string;
  thumbnail: string;
  published: Date;
  rawPublished?: string;
  isShort?: boolean;
}

export interface LocalVideoItem {
  judul: string;
  video: string;
  thumb?: string;
  label: string;
  folder: string;
}


export interface H2HProfile {
  schemaVersion: number;
  updatedAt: string;
  source: string;
  sourceUrl: string;
  group: {
    name: string;
    hangul: string;
    logoUrl: string;
    groupPhotoUrl: string;
    photoGallery?: string[];
    debutDate: string;
    agency: string;
    memberCount: number;
    fandom: string;
    summary: string;
    concept: string;
    history: Array<{ year: string; items: string[] }>;
    discography: Array<{ title: string; description: string }>;
  };
  members: H2HMember[];
}
