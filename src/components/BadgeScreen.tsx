import React from 'react';
import { useApp } from '../context/AppContext';
import { BADGES } from '../data/constants';
import { suaraKlik } from '../utils/audio';

export const BadgeScreen: React.FC = () => {
  const { go, userBadges } = useApp();

  return (
    <div className="screen">
      <div className="head">🏆 Piala & Pencapaian Grace</div>
      <div className="info" style={{ textAlign: 'center', fontSize: '12.5px' }}>
        Kumpulkan semua lencana dengan rajin belajar dan bermain! 💖
      </div>

      <div className="badge-grid">
        {BADGES.map((b) => {
          const unlocked = userBadges.includes(b.id);
          const cls = unlocked ? 'unlocked' : 'locked';
          const icon = unlocked ? b.icon : '🔒';
          const title = unlocked ? b.title : '???';
          const desc = unlocked ? b.desc : 'Terkunci';

          return (
            <div key={b.id} className={`badge-card ${cls}`}>
              <span className="badge-icon">{icon}</span>
              <div className="badge-title">{title}</div>
              <div className="badge-desc">{desc}</div>
            </div>
          );
        })}
      </div>

      <button
        className="btn-s"
        style={{ marginTop: '14px' }}
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
