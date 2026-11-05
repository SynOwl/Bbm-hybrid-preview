import React from 'react';
import { useApp } from '../../context/AppContext';
import { suaraKlik } from '../../utils/audio';

export const RewardModal: React.FC = () => {
  const { rewardModal, closeRewardModal, go } = useApp();

  if (!rewardModal.show) return null;

  return (
    <div className="modal-overlay show">
      <div className="modal-card">
        <span className="modal-icon">{rewardModal.icon}</span>
        <div className="modal-title">{rewardModal.title}</div>
        <div className="modal-sub">{rewardModal.sub}</div>
        <div className="modal-reward">{rewardModal.reward}</div>

        {rewardModal.onPlayAgain && (
          <button
            className="modal-btn"
            onClick={() => {
              suaraKlik();
              closeRewardModal();
              rewardModal.onPlayAgain?.();
            }}
          >
            Main Lagi
          </button>
        )}

        <button
          className="modal-btn"
          style={{
            background: '#FFF',
            color: '#EC407A',
            border: '2px solid #F8BBD0',
          }}
          onClick={() => {
            suaraKlik();
            closeRewardModal();
            go('s-main');
          }}
        >
          ← Kembali
        </button>
      </div>
    </div>
  );
};
