import React from 'react';
import { useApp } from '../../context/AppContext';
import { suaraKlik } from '../../utils/audio';

export const LightboxModal: React.FC = () => {
  const { lightbox, closeLightbox, showToast } = useApp();

  if (!lightbox.show || !lightbox.src) return null;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    suaraKlik();
    const a = document.createElement('a');
    a.href = lightbox.src;
    a.download = 'H2H_Photo.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('📥 Mengunduh foto...');
  };

  return (
    <div className="lightbox show" onClick={closeLightbox}>
      <button
        className="lb-close"
        onClick={(e) => {
          e.stopPropagation();
          suaraKlik();
          closeLightbox();
        }}
      >
        ✕
      </button>

      <img
        src={lightbox.src}
        alt="Foto H2H"
        onClick={(e) => e.stopPropagation()}
      />

      <button
        type="button"
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg,#25D366,#1BAF52)',
          color: 'white',
          border: 'none',
          padding: '14px 28px',
          borderRadius: '25px',
          fontWeight: 800,
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 2005,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        onClick={handleDownload}
      >
        ⬇️ Simpan ke Galeri
      </button>
    </div>
  );
};
