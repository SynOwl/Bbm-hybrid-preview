import React from 'react';
import { useApp } from '../context/AppContext';
import { suaraKlik } from '../utils/audio';

interface MainScreenProps {
  onOpenQuiz: (type: 'hitung' | 'pola' | 'angka' | 'urutan' | 'kata' | 'teka') => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onOpenQuiz }) => {
  const { go } = useApp();

  const handleNav = (screenId: Parameters<typeof go>[0]) => {
    suaraKlik();
    go(screenId);
  };

  const handleQuiz = (type: 'hitung' | 'pola' | 'angka' | 'urutan' | 'kata' | 'teka') => {
    suaraKlik();
    onOpenQuiz(type);
  };

  return (
    <div className="screen">
      <div className="head">💖 Main & Klaim Bonus</div>
      <div className="info" style={{ textAlign: 'center', fontWeight: 700 }}>
        🎮 Pilih game 💖<br />
        <span style={{ fontSize: '11px', opacity: 0.9 }}>
          Semua game bisa klaim waktu atau seru-seruan ✨
        </span>
      </div>

      <div className="game-list">
        <div className="game-card" onClick={() => handleNav('s-mancing')}>
          <div className="g-icon">🎣</div>
          <div>
            <div className="g-title">1. MEMANCING</div>
            <div className="g-sub">⏱️ Klaim waktu / ✨ Seru-seruan</div>
          </div>
        </div>

        <div className="game-card" onClick={() => handleNav('s-sasaran')}>
          <div className="g-icon">🎯</div>
          <div>
            <div className="g-title">2. LEMPAR SASARAN</div>
            <div className="g-sub">⏱️ Klaim waktu / ✨ Seru-seruan</div>
          </div>
        </div>

        <div className="game-card" onClick={() => handleNav('s-kotak')}>
          <div className="g-icon">🎁</div>
          <div>
            <div className="g-title">3. BUKA KOTAK</div>
            <div className="g-sub">⏱️ Klaim waktu / ✨ Seru-seruan</div>
          </div>
        </div>

        <div className="game-card" onClick={() => handleNav('s-roda')}>
          <div className="g-icon">🎡</div>
          <div>
            <div className="g-title">4. PUTAR RODA</div>
            <div className="g-sub">⏱️ Klaim waktu / ✨ Seru-seruan</div>
          </div>
        </div>

        <div className="game-card" onClick={() => handleQuiz('hitung')}>
          <div className="g-icon">🔢</div>
          <div>
            <div className="g-title">5. HITUNG CEPAT</div>
            <div className="g-sub">⏱️ Klaim waktu / ✨ Seru-seruan</div>
          </div>
        </div>

        <div className="game-card" onClick={() => handleQuiz('pola')}>
          <div className="g-icon">🧠</div>
          <div>
            <div className="g-title">6. TEBAK POLA</div>
            <div className="g-sub">⏱️ Klaim waktu / ✨ Seru-seruan</div>
          </div>
        </div>

        <div className="game-card" onClick={() => handleQuiz('angka')}>
          <div className="g-icon">🎯</div>
          <div>
            <div className="g-title">7. TEBAK ANGKA</div>
            <div className="g-sub">⏱️ Klaim waktu / ✨ Seru-seruan</div>
          </div>
        </div>

        <div className="game-card" onClick={() => handleQuiz('urutan')}>
          <div className="g-icon">🧩</div>
          <div>
            <div className="g-title">8. INGAT URUTAN</div>
            <div className="g-sub">⏱️ Klaim waktu / ✨ Seru-seruan</div>
          </div>
        </div>

        <div className="game-card" onClick={() => handleQuiz('kata')}>
          <div className="g-icon">🔤</div>
          <div>
            <div className="g-title">9. SUSUN KATA</div>
            <div className="g-sub">⏱️ Klaim waktu / ✨ Seru-seruan</div>
          </div>
        </div>

        <div className="game-card" onClick={() => handleQuiz('teka')}>
          <div className="g-icon">📖</div>
          <div>
            <div className="g-title">10. TEKA-TEKI</div>
            <div className="g-sub">⏱️ Klaim waktu / ✨ Seru-seruan</div>
          </div>
        </div>

        <div className="game-card" onClick={() => handleNav('s-bebek')}>
          <div className="g-icon">🦆</div>
          <div>
            <div className="g-title">11. TANGKAP BEBEK</div>
            <div className="g-sub">⏱️ Klaim waktu / ✨ Seru-seruan</div>
          </div>
        </div>

        <div className="game-card" onClick={() => handleNav('s-bola')}>
          <div className="g-icon">🔮</div>
          <div>
            <div className="g-title">12. BOLA RAMALAN AJAIB</div>
            <div className="g-sub">✨ Seru-seruan saja</div>
          </div>
        </div>
      </div>

      <button
        className="btn-p"
        style={{ marginTop: '18px' }}
        onClick={() => handleNav('s-klaim')}
      >
        📋 Lihat Daftar Klaim
      </button>

      <button className="btn-s" onClick={() => handleNav('s-dash')}>
        ← Kembali
      </button>
    </div>
  );
};
