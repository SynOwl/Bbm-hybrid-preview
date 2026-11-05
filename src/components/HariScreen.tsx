import React from 'react';
import { useApp } from '../context/AppContext';

export const HariScreen: React.FC = () => {
  const { pilihHari } = useApp();
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="screen">
      <div className="greet">
        <span className="icons">💖🩵💖</span>
        <h1>Hai Grace!</h1>
        <p>Hari ini hari apa ya?</p>
        <div className="date">{todayFormatted}</div>
      </div>

      <div className="card-opt rekomendasi" onClick={() => pilihHari('Hari Sekolah')}>
        <div className="badge">⭐ Rekomendasi</div>
        <span className="opt-icon">🏫</span>
        <div className="opt-title">Hari Sekolah</div>
        <div className="opt-sub">Senin–Jumat</div>
      </div>

      <div className="card-opt" onClick={() => pilihHari('Hari Libur')}>
        <span className="opt-icon">🎈</span>
        <div className="opt-title">Hari Libur</div>
        <div className="opt-sub">Tanggal merah / libur</div>
      </div>

      <div className="card-opt" onClick={() => pilihHari('Kegiatan Gereja')}>
        <span className="opt-icon">⛪</span>
        <div className="opt-title">Kegiatan Gereja</div>
        <div className="opt-sub">Cukup 1 mapel, kunci 7 jam</div>
      </div>
    </div>
  );
};
