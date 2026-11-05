import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MEMBER } from '../data/constants';
import { hitungUsiaMember } from '../utils/storage';
import { suaraKlik } from '../utils/audio';

export const MemberScreen: React.FC = () => {
  const {
    go,
    fotoGrup,
    setFotoGrup,
    memberCustomPhotos,
    memberOfficialPhotos,
    saveMemberPhoto,
    resetMemberPhoto,
    openLightbox,
    showToast,
    currentTema,
    applyTema,
  } = useApp();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeUploadMemberId, setActiveUploadMemberId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupFileInputRef = useRef<HTMLInputElement>(null);

  const toggleMember = (id: string) => {
    suaraKlik();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const triggerUploadMember = (id: string) => {
    suaraKlik();
    setActiveUploadMemberId(id);
    fileInputRef.current?.click();
  };

  const handleMemberFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadMemberId) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        saveMemberPhoto(activeUploadMemberId, dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGroupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setFotoGrup(dataUrl);
        showToast('✅ Foto grup tersimpan!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveGroupPhoto = () => {
    suaraKlik();
    if (window.confirm('Hapus foto grup?')) {
      setFotoGrup(
        'https://hips.hearstapps.com/hmg-prod/images/eee8b03c-98a3-4740-b83b-b0953f98fd68.png?crop=0.492xw%3A0.984xh%3B0.00489xw%2C0.00977xh&resize=1200%3A%2A'
      );
      showToast('🗑️ Foto grup direset');
    }
  };

  return (
    <div className="screen">
      <div className="head">💖 Hearts2Hearts OT8</div>
      <div className="info">
        💖 Profil 8 member Hearts2Hearts. Ketuk nama untuk membuka biodata. Tekan 📸 untuk memilih
        foto dari Galeri HP. Foto disimpan di HP Grace, terpisah dari katalog online.
      </div>

      {/* Group banner */}
      <div
        className="grup-banner"
        onClick={() => {
          if (fotoGrup) openLightbox(fotoGrup);
          else groupFileInputRef.current?.click();
        }}
      >
        {fotoGrup ? (
          <>
            <img src={fotoGrup} alt="Foto grup Hearts2Hearts OT8" />
            <span
              className="edit-badge"
              onClick={(e) => {
                e.stopPropagation();
                groupFileInputRef.current?.click();
              }}
            >
              🔄 Ganti
            </span>
          </>
        ) : (
          <div className="empty">
            📸 Foto Grup H2H OT8
            <small>Tap Ganti untuk pilih foto</small>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        <button
          className="btn-s"
          style={{
            marginBottom: '0',
            fontSize: '12px',
            padding: '12px 8px',
            borderColor: currentTema === 'h2h' ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.35)',
            background: currentTema === 'h2h' ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.25)',
          }}
          onClick={() => {
            suaraKlik();
            applyTema('h2h');
            showToast('🌊 Tema: H2H OT8 (Grup)');
          }}
        >
          {currentTema === 'h2h' ? '✓ Tema H2H OT8' : '🌊 Tema H2H OT8'}
        </button>
        <button
          className="btn-s"
          style={{
            marginBottom: '0',
            fontSize: '12px',
            padding: '12px 8px',
          }}
          onClick={handleRemoveGroupPhoto}
        >
          🗑️ Hapus Foto
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleMemberFileChange}
      />
      <input
        type="file"
        ref={groupFileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleGroupFileChange}
      />

      {/* 8 Members Grid */}
      <div className="member-grid">
        {MEMBER.map((m) => {
          const isExpanded = expandedId === m.id;
          const customPhoto = memberCustomPhotos[m.id];
          const officialPhoto = memberOfficialPhotos[m.id];
          const displayPhoto =
            customPhoto ||
            officialPhoto ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${m.id}`;

          return (
            <div key={m.id} className="member-card" data-member={m.id}>
              <div className="member-top">
                <div
                  className="member-ava"
                  onClick={() => openLightbox(displayPhoto)}
                  title="Lihat foto"
                >
                  <img
                    src={displayPhoto}
                    alt={m.nama}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span>{m.emoji}</span>
                </div>

                <div className="member-info" onClick={() => toggleMember(m.id)}>
                  <b>
                    {m.nama} {m.hangul}
                  </b>
                  <span>{m.posisi}</span>
                </div>

                <span
                  className="member-cam"
                  onClick={() => triggerUploadMember(m.id)}
                  title="Ganti Foto"
                >
                  📸
                </span>
              </div>

              {isExpanded && (
                <div className="member-detail">
                  <div className="row">
                    <span className="k">Nama lengkap</span>
                    <span>{m.namaLengkap}</span>
                  </div>
                  <div className="row">
                    <span className="k">Tanggal lahir</span>
                    <span>{m.tgl}</span>
                  </div>
                  <div className="row">
                    <span className="k">Usia</span>
                    <span>{hitungUsiaMember(m.tgl)}</span>
                  </div>
                  <div className="row">
                    <span className="k">Asal</span>
                    <span>{m.tempat}</span>
                  </div>
                  <div className="row">
                    <span className="k">Kebangsaan</span>
                    <span>{m.kebangsaan}</span>
                  </div>
                  <div className="row">
                    <span className="k">Peran</span>
                    <span>{m.posisi}</span>
                  </div>

                  <div
                    style={{
                      background: 'rgba(0,0,0,.25)',
                      borderRadius: '12px',
                      padding: '8px 10px',
                      fontSize: '11.5px',
                      marginTop: '8px',
                      textShadow: '0 2px 5px rgba(0,0,0,.95)',
                    }}
                  >
                    💡 {m.fun}
                  </div>

                  <button
                    type="button"
                    className="btn-s"
                    style={{
                      marginTop: '10px',
                      marginBottom: '4px',
                      padding: '10px 14px',
                      fontSize: '12.5px',
                      borderColor: currentTema === m.id ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.4)',
                      background: currentTema === m.id ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.25)',
                    }}
                    onClick={() => {
                      suaraKlik();
                      applyTema(m.id);
                      showToast(`🎨 Tema berganti ke ${m.nama} ${m.emoji}`);
                    }}
                  >
                    {currentTema === m.id ? `✓ Tema Aktif: ${m.nama} ${m.emoji}` : `🎨 Pasang Tema ${m.nama} ${m.emoji}`}
                  </button>

                  <button
                    type="button"
                    className="upload-btn"
                    onClick={() => triggerUploadMember(m.id)}
                  >
                    📸 Ganti Foto dari Galeri
                  </button>

                  {customPhoto && (
                    <button
                      type="button"
                      className="upload-btn"
                      style={{
                        border: '1px solid rgba(255,255,255,.45)',
                        background: 'rgba(0,0,0,.22)',
                      }}
                      onClick={() => {
                        suaraKlik();
                        resetMemberPhoto(m.id);
                      }}
                    >
                      ↩️ Kembalikan ke Foto Resmi
                    </button>
                  )}
                </div>
              )}
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
