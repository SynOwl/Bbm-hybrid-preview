import React from 'react';
import { useApp } from '../context/AppContext';
import { suaraKlik } from '../utils/audio';

export const AturanScreen: React.FC = () => {
  const { go } = useApp();

  return (
    <div className="screen">
      <div className="head">💖 📋 Aturan & Sistem</div>

      <div className="info">
        <b>🎯 KETENTUAN DASAR</b><br />
        • Jatah maksimal 7 jam/hari<br />
        • KKM sekolah = 75
      </div>

      <div className="info">
        <b>📊 NILAI → BATAS HARIAN</b><br />
        • Cukup (75–84) → 7 jam<br />
        • Baik (85–89) → 7,5 jam<br />
        • Sangat Baik (≥90) → 8 jam
      </div>

      <div className="info">
        <b>📚 MATA PELAJARAN (10)</b><br />
        B. Indonesia · B. Inggris · IPAS · Matematika · PABD · Pem. Literasi · PJOK · POTEK · PPKn · SBdP
      </div>

      <div className="info">
        <b>🎮 PERMAINAN</b><br />
        • Setiap game ada 2 mode: Klaim Waktu & Seru-seruan
      </div>

      <button
        className="btn-s back-button-floating"
        onClick={() => {
          suaraKlik();
          go('s-dash');
        }}
      >
        ← Kembali
      </button>
    </div>
  );
};
