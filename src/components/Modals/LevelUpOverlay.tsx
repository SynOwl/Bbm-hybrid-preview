import React from 'react';
import { useApp } from '../../context/AppContext';
import { suaraKlik } from '../../utils/audio';

export const LevelUpOverlay: React.FC = () => {
  const { levelUpModal, closeLevelUpModal } = useApp();

  if (!levelUpModal.show) return null;

  return (
    <div className="levelup-overlay show">
      <div className="levelup-box">
        <span className="levelup-icon">🏆</span>
        <div className="levelup-title">LEVEL UP!</div>
        <div className="levelup-sub">Kamu sekarang Level {levelUpModal.level}!</div>
        <button
          className="modal-btn"
          style={{ background: '#FFF', color: '#EC407A', fontSize: '16px', padding: '16px' }}
          onClick={() => {
            suaraKlik();
            closeLevelUpModal();
          }}
        >
          🎉 Lanjut Belajar!
        </button>
      </div>
    </div>
  );
};
