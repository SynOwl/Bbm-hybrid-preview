import React from 'react';
import { useApp } from '../context/AppContext';
import { suaraKlik } from '../utils/audio';

export const MetodeScreen: React.FC = () => {
  const { go, setCurrentMetode } = useApp();

  const handleSelect = (metode: string) => {
    suaraKlik();
    setCurrentMetode(metode);
    go('s-rincian');
  };

  return (
    <div className="screen">
      <div className="head">💖 Pilih Metode</div>
      <div className="opt-item" onClick={() => handleSelect('Kertas Thermal')}>
        <div className="o-icon">📝</div>
        <div>
          <div className="o-title">1. Kertas Thermal</div>
        </div>
      </div>

      <div className="opt-item" onClick={() => handleSelect('WhatsApp')}>
        <div className="o-icon">💬</div>
        <div>
          <div className="o-title">2. WhatsApp</div>
        </div>
      </div>

      <div className="opt-item" onClick={() => handleSelect('HTML Chrome')}>
        <div className="o-icon">🌐</div>
        <div>
          <div className="o-title">3. HTML Chrome</div>
        </div>
      </div>

      <div className="opt-item" onClick={() => handleSelect('HTML Aplikasi')}>
        <div className="o-icon">📱</div>
        <div>
          <div className="o-title">4. HTML Aplikasi</div>
        </div>
      </div>

      <button
        className="btn-s"
        onClick={() => {
          suaraKlik();
          go('s-soal');
        }}
      >
        ← Kembali
      </button>
    </div>
  );
};
