import React from 'react';
import { useApp } from '../context/AppContext';
import { suaraKlik } from '../utils/audio';

export const ModeScreen: React.FC = () => {
  const { go, setCurrentMode } = useApp();

  const handleSelect = (mode: number) => {
    suaraKlik();
    setCurrentMode(mode);
    go('s-mapel');
  };

  return (
    <div className="screen">
      <div className="head">💖 Menu Pakai HP</div>
      <div className="opt-item" onClick={() => handleSelect(1)}>
        <div className="o-icon">⏱️</div>
        <div>
          <div className="o-title">1. TAMBAH WAKTU HP</div>
          <div className="o-sub">Tidak masuk hitungan 7 jam harian</div>
        </div>
      </div>

      <div className="opt-item" onClick={() => handleSelect(2)}>
        <div className="o-icon">🔒</div>
        <div>
          <div className="o-title">2. BUKA KUNCI HP</div>
          <div className="o-sub">Harus 100% benar</div>
        </div>
      </div>

      <button
        className="btn-s"
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
