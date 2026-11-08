import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MAPEL } from '../data/constants';
import { isHariMinggu } from '../utils/storage';
import { suaraKlik } from '../utils/audio';
import { bukaWA } from '../utils/whatsapp';

export const MapelScreen: React.FC = () => {
  const {
    go,
    setCurrentMapel,
    kuotaSekarang,
    riwayatMapelMingguIni,
    mapelMingguGratis,
    showToast,
  } = useApp();

  const [waktuSisaDetik, setWaktuSisaDetik] = useState<number>(0);
  const [menunggu, setMenunggu] = useState<boolean>(false);
  const [cobaKirimUlang, setCobaKirimUlang] = useState<number>(0);

  const todaySunday = isHariMinggu();

  useEffect(() => {
    const isMenunggu = localStorage.getItem('menungguSoal') === 'true';
    const batas = parseInt(localStorage.getItem('waktuBatasTunggu') || '0', 10);
    const coba = parseInt(localStorage.getItem('cobaKirimUlang') || '0', 10);
    setCobaKirimUlang(coba);

    if (isMenunggu && batas > Date.now()) {
      setMenunggu(true);
      const sisa = Math.max(0, Math.floor((batas - Date.now()) / 1000));
      setWaktuSisaDetik(sisa);

      const interval = setInterval(() => {
        const curSisa = Math.max(0, Math.floor((batas - Date.now()) / 1000));
        setWaktuSisaDetik(curSisa);
        if (curSisa <= 0) {
          clearInterval(interval);
          setMenunggu(false);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else if (isMenunggu && batas <= Date.now()) {
      setMenunggu(false);
      setWaktuSisaDetik(0);
    }
  }, []);

  const handleKirimUlang = () => {
    suaraKlik();
    if (cobaKirimUlang >= 3) {
      showToast('😴 Mami mungkin istirahat. Coba lagi nanti ya');
      return;
    }
    const nextCoba = cobaKirimUlang + 1;
    setCobaKirimUlang(nextCoba);
    const batasBaru = Date.now() + 30 * 60 * 1000;
    localStorage.setItem('cobaKirimUlang', String(nextCoba));
    localStorage.setItem('waktuBatasTunggu', String(batasBaru));
    setMenunggu(true);
    setWaktuSisaDetik(30 * 60);

    // Pakai kembali rincian lengkap dari permintaan pertama.
    // Pesan singkat hanya menjadi cadangan untuk sesi aplikasi versi lama.
    const pesanLengkap = localStorage.getItem('pesanPermintaanHTML');
    const pesan =
      pesanLengkap ||
      '💖 BELAJAR BARENG MAMI 💖\n\n' +
        'Mami, tolong kirim file HTML soal untuk Grace ya 💖\n' +
        '⏳ Grace tunggu 30 menit ya Mami...\n\n' +
        '✍️ Dari Grace 💖';
    bukaWA(pesan, showToast);
    showToast(`📤 Permintaan dikirim ulang ke Mami (${nextCoba}/3)`);
  };

  const handleSelectMapel = (nama: string) => {
    suaraKlik();
    setCurrentMapel(nama);
    go('s-soal');
  };

  const mm = Math.floor(waktuSisaDetik / 60);
  const ss = waktuSisaDetik % 60;
  const timerText = `${mm < 10 ? '0' : ''}${mm}:${ss < 10 ? '0' : ''}${ss}`;

  return (
    <div className="screen">
      <div className="head">💖 Pilih Mata Pelajaran</div>

      {/* Banners */}
      {menunggu && waktuSisaDetik > 0 ? (
        <div className="banner-kunci">
          ⏳ Tunggu Mami kirim soal.
          <span className="timer-kecil">{timerText}</span>
          <button className="btn-kirim-ulang" onClick={handleKirimUlang}>
            📤 Kirim Ulang ke Mami
          </button>
        </div>
      ) : localStorage.getItem('menungguSoal') === 'true' ? (
        <div className="banner-kunci">
          😢 Mami belum kirim soal. Kirim ulang permintaan ya 💙<br />
          <span style={{ fontSize: '11px', opacity: 0.8 }}>
            Percobaan: {cobaKirimUlang}/3
          </span>
          <button className="btn-kirim-ulang" onClick={handleKirimUlang}>
            📤 Kirim Ulang ke Mami
          </button>
        </div>
      ) : todaySunday ? (
        <div className="banner-minggu">
          🌸 <b>Sesi Latihan Hari Minggu</b><br />
          Pilih 1 mapel, tanpa cair/bonus.<br />
          Mapel gratis: <b>{mapelMingguGratis}</b> 💙
        </div>
      ) : null}

      {/* Mapel List */}
      <div id="mapelList">
        {MAPEL.map((m) => {
          const limit = kuotaSekarang[m.nama] || 3;
          const pakai = riwayatMapelMingguIni[m.nama] || 0;
          const sisa = limit - pakai;
          const warnaKuota =
            sisa <= 0
              ? { color: '#FF5252', fontWeight: 900 }
              : { color: '#FFD700', fontWeight: 900 };

          const isSundayFree = todaySunday && m.nama === mapelMingguGratis;
          const isLocked = !isSundayFree && (sisa <= 0 || menunggu);

          return (
            <div
              key={m.nama}
              className="opt-item"
              style={{
                opacity: isLocked ? 0.5 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
              }}
              onClick={() => {
                if (!isLocked) handleSelectMapel(m.nama);
              }}
            >
              <div className="o-icon">{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="o-title">{m.nama}</div>
                <div className="o-sub" style={warnaKuota}>
                  Kuota: {pakai} / {limit}
                </div>
              </div>
              {isSundayFree ? (
                <div style={{ fontSize: '20px' }}>🎁</div>
              ) : isLocked ? (
                <div style={{ fontSize: '20px' }}>🔒</div>
              ) : null}
            </div>
          );
        })}
      </div>

      <button
        className="btn-s"
        onClick={() => {
          suaraKlik();
          go('s-mode');
        }}
      >
        ← Kembali
      </button>
    </div>
  );
};
