export function getLocalDate(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function isHariMinggu(): boolean {
  return new Date().getDay() === 0;
}

export function getTanggalMingguTerakhir(): string {
  const now = new Date();
  const selisih = now.getDay(); // 0 if Sunday
  const minggu = new Date(now);
  minggu.setDate(now.getDate() - selisih);
  return (
    minggu.getFullYear() +
    '-' +
    String(minggu.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(minggu.getDate()).padStart(2, '0')
  );
}

export function getTanggalSenin(): string {
  const now = new Date();
  const selisih = (now.getDay() + 6) % 7;
  const senin = new Date(now);
  senin.setDate(now.getDate() - selisih);
  return (
    senin.getFullYear() +
    '-' +
    String(senin.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(senin.getDate()).padStart(2, '0')
  );
}

// ===== INDEXED DB FOR MEMBER PHOTOS =====
let dbPromise: Promise<IDBDatabase> | null = null;

export function bukaDbFotoMember(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak tersedia'));
      return;
    }
    const req = indexedDB.open('H2HMemberPhotos', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Gagal membuka DB'));
  });
  return dbPromise;
}

export async function simpanFotoMemberDB(id: string, value: string): Promise<boolean> {
  try {
    const db = await bukaDbFotoMember();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').put(value, id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    try {
      localStorage.setItem('fotoH2H_' + id, value);
      return true;
    } catch {
      return false;
    }
  }
}

export async function ambilFotoMemberDB(id: string): Promise<string> {
  try {
    const db = await bukaDbFotoMember();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readonly');
      const req = tx.objectStore('photos').get(id);
      req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : '');
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      return localStorage.getItem('fotoH2H_' + id) || '';
    } catch {
      return '';
    }
  }
}

export async function hapusFotoMemberDB(id: string): Promise<boolean> {
  try {
    const db = await bukaDbFotoMember();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    try {
      localStorage.removeItem('fotoH2H_' + id);
      return true;
    } catch {
      return false;
    }
  }
}

// ===== DETEKSI MAPEL DARI HTML SOAL =====
export function deteksiMapelDariHTML(htmlText: string): string | null {
  const teks = htmlText.toLowerCase();
  const titleMatch = teks.match(/<title>(.*?)<\/title>/i);
  const h1Match = teks.match(/<h1>(.*?)<\/h1>/i);
  const h2Match = teks.match(/<h2>(.*?)<\/h2>/i);
  let teksUtama = '';
  if (titleMatch) teksUtama += ' ' + titleMatch[1];
  if (h1Match) teksUtama += ' ' + h1Match[1];
  if (h2Match) teksUtama += ' ' + h2Match[1];

  const daftarMapel = [
    { nama: 'Matematika', kunci: ['matematika', 'math'] },
    { nama: 'PJOK', kunci: ['pjok', 'olahraga', 'basket', 'bola basket', 'sepak bola'] },
    { nama: 'B. Indonesia', kunci: ['b. indonesia', 'bahasa indonesia'] },
    { nama: 'B. Inggris', kunci: ['b. inggris', 'bahasa inggris', 'english'] },
    { nama: 'IPAS', kunci: ['ipas', 'sains', 'ipa'] },
    { nama: 'PABD', kunci: ['pabd', 'alkitab', 'agama'] },
    { nama: 'Pem. Literasi', kunci: ['literasi', 'pahlawan'] },
    { nama: 'POTEK', kunci: ['potek', 'komputer'] },
    { nama: 'PPKn', kunci: ['ppkn', 'pancasila'] },
    { nama: 'SBdP', kunci: ['sbdp', 'seni budaya', 'menggambar'] },
  ];

  for (let i = 0; i < daftarMapel.length; i++) {
    for (let j = 0; j < daftarMapel[i].kunci.length; j++) {
      if (teksUtama.includes(daftarMapel[i].kunci[j])) return daftarMapel[i].nama;
    }
  }
  for (let i = 0; i < daftarMapel.length; i++) {
    for (let j = 0; j < daftarMapel[i].kunci.length; j++) {
      if (teks.includes(daftarMapel[i].kunci[j])) return daftarMapel[i].nama;
    }
  }
  return null;
}

export function hitungUsiaMember(tanggal: string): string {
  const p = tanggal.split(' ');
  const bln: Record<string, number> = {
    Januari: 0, Februari: 1, Maret: 2, April: 3, Mei: 4, Juni: 5,
    Juli: 6, Agustus: 7, September: 8, Oktober: 9, November: 10, Desember: 11,
  };
  const d = parseInt(p[0], 10);
  const m = bln[p[1]];
  const y = parseInt(p[2], 10);
  if (m === undefined || isNaN(y)) return '—';
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() < m || (now.getMonth() === m && now.getDate() < d)) age--;
  return age + ' tahun';
}
