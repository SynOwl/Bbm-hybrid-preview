import React from 'react';
import { useApp } from '../context/AppContext';
import { MODE1_OPTIONS, MODE2_OPTIONS } from '../data/constants';
import { suaraKlik } from '../utils/audio';

export const SoalCountScreen: React.FC = () => {
  const { go, currentMode, setCurrentJumlah, setCurrentWaktu } = useApp();
  const options = currentMode === 1 ? MODE1_OPTIONS : MODE2_OPTIONS;

  const handleSelect = (soal: number, waktu: string) => {
    suaraKlik();
    setCurrentJumlah(soal);
    setCurrentWaktu(waktu);
    go('s-metode');
  };

  return (
    <div className="screen">
      <div className="head">💖 Mau berapa soal?</div>
      <div>
        {options.map((opt) => (
          <div
            key={opt.soal}
            className="opt-item"
            onClick={() => handleSelect(opt.soal, opt.waktu)}
          >
            <div className="o-icon">🔢</div>
            <div>
              <div className="o-title">{opt.soal} soal</div>
              <div className="o-sub">≈ {opt.waktu}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn-s back-button-floating"
        onClick={() => {
          suaraKlik();
          go('s-mapel');
        }}
      >
        ← Kembali
      </button>
    </div>
  );
};
