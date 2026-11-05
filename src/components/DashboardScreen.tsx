import React from 'react';
import { useApp } from '../context/AppContext';
import { MAX_SAVING, XP_PER_LEVEL } from '../data/constants';
import { suaraKlik } from '../utils/audio';

export const DashboardScreen: React.FC = () => {
  const {
    go,
    selectedDay,
    ubahHari,
    saving,
    userXP,
    userLevel,
    userStreak,
    battery,
    setGoodbyeModal,
  } = useApp();

  const savingPercent = Math.min(100, Math.round((saving / MAX_SAVING) * 100));
  const jam = Math.floor(saving / 60);
  const menit = saving % 60;
  const savingAmountText =
    saving >= 60
      ? `${jam > 0 ? jam + ' jam ' : ''}${menit > 0 ? menit + ' menit' : ''} / 5 jam`.trim()
      : `${saving} menit / 5 jam`;

  const xpInLevel = userXP % XP_PER_LEVEL;

  const handleNav = (screenId: Parameters<typeof go>[0]) => {
    suaraKlik();
    go(screenId);
  };

  return (
    <div className="screen">
      <div className="chip-row">
        <div className="chip green">
          ⚡ <span>{battery}</span>
        </div>
        <div className="chip">
          🏫 <span>{selectedDay || 'Hari Belajar'}</span>
        </div>
      </div>

      <button className="btn-p" onClick={ubahHari}>
        🔄 Ubah hari
      </button>

      {/* Tabungan Waktu */}
      <div className="saving-box">
        <div className="saving-header">
          <div className="s-title">⏱️ Tabungan Waktu</div>
          <div className="s-badge">{savingPercent}%</div>
        </div>
        <div className="saving-amount">{savingAmountText}</div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${savingPercent}%` }} />
        </div>
        <div className="saving-note">Reset otomatis tiap hari 🔄</div>
      </div>

      {/* Petualangan Grace: XP & Level */}
      <div className="xp-box">
        <div className="xp-header">
          <div className="xp-level">Lv {userLevel}</div>
          <div className="xp-title">✨ Petualangan Grace</div>
        </div>
        <div className="xp-bar-wrap">
          <div className="xp-bar" style={{ width: `${xpInLevel}%` }} />
        </div>
        <div className="xp-info">
          <span>{xpInLevel} / {XP_PER_LEVEL} XP</span>
        </div>
        <div className="streak-row">
          <span className="streak-fire">🔥</span>
          <span>{userStreak} hari berturut-turut!</span>
        </div>
      </div>

      {/* Primary Action Button */}
      <button className="btn-p" onClick={() => handleNav('s-mode')}>
        ⏰ Pakai HP
      </button>

      {/* Main 10 Navigation Grid */}
      <div className="grid-2">
        <div className="grid-item" onClick={() => handleNav('s-upload')}>
          <span className="g-icon">📤</span>
          <div className="g-title">Upload Soal</div>
        </div>
        <div className="grid-item" onClick={() => handleNav('s-main')}>
          <span className="g-icon">🎮</span>
          <div className="g-title">Main & Bonus</div>
        </div>
        <div className="grid-item" onClick={() => handleNav('s-video')}>
          <span className="g-icon">🎬</span>
          <div className="g-title">Video H2H</div>
        </div>
        <div className="grid-item" onClick={() => handleNav('s-ai')}>
          <span className="g-icon">🤖</span>
          <div className="g-title">Belajar AI</div>
        </div>
        <div className="grid-item" onClick={() => handleNav('s-aturan')}>
          <span className="g-icon">📋</span>
          <div className="g-title">Aturan</div>
        </div>
        <div className="grid-item" onClick={() => handleNav('s-tema')}>
          <span className="g-icon">🎨</span>
          <div className="g-title">Ganti Tema</div>
        </div>
        <div className="grid-item" onClick={() => handleNav('s-member')}>
          <span className="g-icon">💖</span>
          <div className="g-title">Profil Member</div>
        </div>
        <div className="grid-item" onClick={() => handleNav('s-grup')}>
          <span className="g-icon">🌟</span>
          <div className="g-title">Tentang H2H</div>
        </div>
        <div className="grid-item" onClick={() => handleNav('s-rekap')}>
          <span className="g-icon">📊</span>
          <div className="g-title">Rekap Mingguan</div>
        </div>
        <div className="grid-item" onClick={() => handleNav('s-badge')}>
          <span className="g-icon">🏆</span>
          <div className="g-title">Piala & Badge</div>
        </div>
      </div>

      {/* Bottom Actions */}
      <button className="btn-s" onClick={() => handleNav('s-laporan')}>
        💬 Laporan Rapi ke Mami
      </button>
      <button
        className="btn-d"
        onClick={() => {
          suaraKlik();
          setGoodbyeModal(true);
        }}
      >
        🏁 Selesai Belajar
      </button>
    </div>
  );
};
