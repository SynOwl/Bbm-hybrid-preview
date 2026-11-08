import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { suaraBenar, suaraKlik } from '../utils/audio';

export const TungguScreen: React.FC = () => {
  const { go } = useApp();
  const [sisaDetik, setSisaDetik] = useState<number>(30 * 60);

  useEffect(() => {
    let batas = parseInt(localStorage.getItem('waktuBatasTunggu') || '0', 10);
    if (!batas || batas <= Date.now()) {
      batas = Date.now() + 30 * 60 * 1000;
      localStorage.setItem('waktuBatasTunggu', String(batas));
    }

    const update = () => {
      const s = Math.max(0, Math.floor((batas - Date.now()) / 1000));
      setSisaDetik(s);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSkip = () => {
    suaraBenar();
    localStorage.removeItem('menungguSoal');
    localStorage.removeItem('waktuBatasTunggu');
    localStorage.removeItem('cobaKirimUlang');
    if (window.confirm('Mami sudah kirim soal? Langsung ke halaman Upload ya 💖')) {
      go('s-upload');
    }
  };

  const m = Math.floor(sisaDetik / 60);
  const s = sisaDetik % 60;
  const mm = (m < 10 ? '0' : '') + m;
  const ss = (s < 10 ? '0' : '') + s;
  const persen = (sisaDetik / (30 * 60)) * 100;

  let statusText = '⏰ Mami lagi nyiapin soal...';
  if (sisaDetik <= 0) {
    statusText = '😢 Mami belum kirim soal. Kirim ulang ya 💙';
  } else if (sisaDetik <= 60) {
    statusText = '⏰ Hampir selesai... 1 menit lagi!';
  } else if (sisaDetik <= 10 * 60) {
    statusText = `⏳ Sebentar lagi... ${m} menit lagi`;
  }

  return (
    <div className="screen">
      <div className="head">💖 Tunggu Soal dari Mami</div>
      <div className="info" style={{ textAlign: 'center', padding: '24px' }}>
        <div style={{ fontSize: '64px', marginBottom: '12px' }}>⏳</div>
        <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>
          Mami sedang siapkan soal...
        </div>
        <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '20px' }}>
          Sabar ya Grace 💖
        </div>

        <div
          style={{
            background: 'rgba(0,0,0,.35)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 800, opacity: 0.85, marginBottom: '8px' }}>
            SISA WAKTU
          </div>
          <div className="timer-big" style={{ color: sisaDetik <= 0 ? '#F44336' : '#FFD54F' }}>
            {mm}:{ss}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '8px' }}>
            dari 30 menit
          </div>
        </div>

        <div className="progress-bar" style={{ height: '12px' }}>
          <div
            className="progress-fill"
            style={{
              width: `${persen}%`,
              background: 'linear-gradient(90deg,#FFD54F,#FF9800,#F44336)',
            }}
          />
        </div>

        <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '16px', opacity: 0.9 }}>
          {statusText}
        </div>
      </div>

      <button
        className="btn-p"
        style={{ background: 'linear-gradient(135deg,#25D366,#1BAF52)' }}
        onClick={handleSkip}
      >
        ✅ Mami Sudah Kirim Soal!
      </button>

      <button
        className="btn-s"
        onClick={() => {
          suaraKlik();
          go('s-upload');
        }}
      >
        📤 Atau Buka Upload Manual
      </button>

      <button
        className="btn-s back-button-floating"
        onClick={() => {
          suaraKlik();
          go('s-dash');
        }}
      >
        ← Kembali ke Menu
      </button>
    </div>
  );
};
