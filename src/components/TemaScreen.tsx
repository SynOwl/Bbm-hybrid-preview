import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TEMA } from '../data/constants';
import { suaraKlik } from '../utils/audio';

export const TemaScreen: React.FC = () => {
  const {
    go,
    currentTema,
    applyTema,
    tampilanFoto,
    setTampilanFoto,
    fotoLatarCustom,
    setFotoLatarCustom,
    showToast,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setFotoLatarCustom(dataUrl);
        showToast('✅ Foto latar tersimpan!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const modes = [
    { id: 'full', label: '🔳 Full' },
    { id: 'grid', label: '▦ Grid' },
    { id: 'center', label: '◉ Center' },
    { id: 'fit', label: '⬜ Fit' },
    { id: 'stretch', label: '↔️ Stretch' },
    { id: 'off', label: '🚫 Tanpa Foto' },
  ];

  return (
    <div className="screen">
      <div className="head">💖 Ganti Tema & Latar</div>

      <button
        className="btn-p"
        onClick={() => {
          suaraKlik();
          fileInputRef.current?.click();
        }}
      >
        🖼️ Upload Foto Latar dari Galeri
      </button>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleUploadBg}
      />

      {fotoLatarCustom && (
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <img
            src={fotoLatarCustom}
            alt="Preview Latar"
            style={{
              width: '100%',
              maxHeight: '150px',
              objectFit: 'cover',
              borderRadius: '16px',
              border: '2px solid rgba(255,255,255,.5)',
            }}
          />
        </div>
      )}

      <div className="head" style={{ marginTop: '10px' }}>
        🖼️ Tampilan Foto
      </div>
      <div className="grid-2" style={{ marginBottom: '12px' }}>
        {modes.map((m) => (
          <button
            key={m.id}
            className="btn-s"
            style={{
              fontSize: '13px',
              borderColor: tampilanFoto === m.id ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.35)',
              background: tampilanFoto === m.id ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)',
            }}
            onClick={() => setTampilanFoto(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="head" style={{ marginTop: '20px' }}>
        🎨 Pilih Warna Tema
      </div>
      <div className="grid-2">
        {TEMA.map((t) => {
          const isSelected = t.id === currentTema;
          let bgPreview = 'linear-gradient(180deg, #B3E5FC, #03A9F4)';
          if (t.id === 'jiwoo') bgPreview = 'linear-gradient(180deg, #FFE0EC, #FFB6C1)';
          else if (t.id === 'carmen') bgPreview = 'linear-gradient(180deg, #A5D6A7, #43A047)';
          else if (t.id === 'yuha') bgPreview = 'linear-gradient(180deg, #FFE4F0, #FFB8D1)';
          else if (t.id === 'stella') bgPreview = 'linear-gradient(180deg, #FFE0B2, #FF9800)';
          else if (t.id === 'juun') bgPreview = 'linear-gradient(180deg, #D1C4E9, #7E57C2)';
          else if (t.id === 'ana') bgPreview = 'linear-gradient(180deg, #FFE082, #FFA000)';
          else if (t.id === 'ian') bgPreview = 'linear-gradient(180deg, #A7FFEB, #009688)';
          else if (t.id === 'yeon') bgPreview = 'linear-gradient(180deg, #FFF59D, #FBC02D)';

          const motifs: Record<string, string> = {
            h2h: '🌊 💖 💎 ✨',
            jiwoo: '🍓 ✨ 🌸 💖',
            carmen: '🌴 🍀 🍃 💚',
            yuha: '🎀 🌷 🫧 💕',
            stella: '🧁 ⭐ 🌟 🧡',
            juun: '👾 🪐 🔮 💜',
            ana: '🌻 ☀️ 🍯 💛',
            ian: '🫛 🌱 🌿 🩵',
            yeon: '😊 🌼 🐥 💛',
          };

          return (
            <div
              key={t.id}
              className="grid-item"
              style={{
                background: bgPreview,
                borderColor: isSelected ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.3)',
                boxShadow: isSelected ? '0 0 0 3px rgba(255,255,255,.5)' : undefined,
                position: 'relative',
              }}
              onClick={() => {
                suaraKlik();
                applyTema(t.id);
                showToast(`🎨 Tema: ${t.nama}`);
              }}
            >
              {isSelected && (
                <span
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'rgba(255,255,255,.9)',
                    color: '#000',
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: '10px',
                  }}
                >
                  ✓ Aktif
                </span>
              )}
              <span className="g-icon" style={{ fontSize: '36px', marginBottom: '4px' }}>
                {t.emoji}
              </span>
              <div className="g-title" style={{ color: '#FFF', textShadow: '0 2px 4px #000' }}>
                {t.nama}
              </div>
              <div style={{ fontSize: '10px', marginTop: '4px', letterSpacing: '1px', opacity: 0.9 }}>
                {motifs[t.id] || ''}
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="btn-s back-button-floating"
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
