import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { suaraKlik } from '../utils/audio';

export const Header: React.FC = () => {
  const { fotoAvatar, setFotoAvatar, openLightbox, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem('bbm_dark_mode') === '1'; } catch { return false; }
  });

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    try { localStorage.setItem('bbm_dark_mode', darkMode ? '1' : '0'); } catch {}
  }, [darkMode]);

  const handleAvatarClick = () => {
    suaraKlik();
    if (fotoAvatar) {
      openLightbox(fotoAvatar);
    } else {
      triggerUpload();
    }
  };

  const triggerUpload = () => {
    suaraKlik();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setFotoAvatar(dataUrl);
        showToast('✅ Foto profil tersimpan!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="app-header">
      <div className="app-avatar" onClick={handleAvatarClick} title="Lihat atau ganti foto profil">
        {fotoAvatar ? (
          <img src={fotoAvatar} alt="Avatar Grace" />
        ) : (
          <span>💛</span>
        )}
        <span
          className="cam"
          onClick={(e) => {
            e.stopPropagation();
            triggerUpload();
          }}
          title="Ganti Foto"
        >
          📸
        </span>
      </div>
      <div className="atitle">
        <h2>Belajar Bareng Mami</h2>
        <p>Hai, Grace · Kelas 4 SD · Hearts2Hearts ✨</p>
      </div>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setDarkMode((value) => !value)}
        aria-label={darkMode ? 'Pakai mode terang' : 'Pakai mode gelap'}
        title={darkMode ? 'Pakai mode terang' : 'Pakai mode gelap'}
      >
        <span aria-hidden="true">{darkMode ? '☀️' : '🌙'}</span>
        <span>{darkMode ? 'Terang' : 'Gelap'}</span>
      </button>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
};
