import React from 'react';
import { useApp } from '../../context/AppContext';
import { suaraKlik } from '../../utils/audio';

export const EventModal: React.FC = () => {
  const { eventModal, closeEventModal } = useApp();

  if (!eventModal.show || !eventModal.event) return null;

  const e = eventModal.event;
  const isMember = e.type === 'member';

  return (
    <div className="modal-overlay show">
      <div className="modal-card">
        <span className="modal-icon">{isMember ? '🎂✨🎂' : '💖✨💖'}</span>
        <div className="modal-title">
          {isMember
            ? `SELAMAT ULANG TAHUN ${e.nama.toUpperCase()}!`
            : 'HAPPY ANNIVERSARY HEARTS2HEARTS!'}
        </div>
        <div className="modal-sub">
          📅 {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div
          className="modal-reward"
          dangerouslySetInnerHTML={{
            __html: isMember
              ? `${e.nama} genap ${eventModal.umur} tahun ${e.emoji}!`
              : '1 tahun bersama S2U ✨<br>8 member: Jiwoo, Carmen, Yuha, Stella, Juun, A-na, Ian, Ye-on 💖',
          }}
        />

        <button
          className="modal-btn"
          onClick={() => {
            suaraKlik();
            closeEventModal();
          }}
        >
          🎉 Rayakan!
        </button>
      </div>
    </div>
  );
};
