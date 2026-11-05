import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { suaraKlik } from '../utils/audio';

interface SoalViewScreenProps {
  htmlContent: string;
}

export const SoalViewScreen: React.FC<SoalViewScreenProps> = ({ htmlContent }) => {
  const { go } = useApp();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    suaraKlik();
    if (!isFullscreen) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleClose = () => {
    suaraKlik();
    if (isFullscreen && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    go('s-upload');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: '#FFF',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <iframe
        title="Soal Grace"
        srcDoc={htmlContent}
        className="soal-frame"
        sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-forms"
        style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
      />
      <div
        style={{
          position: 'fixed',
          top: '12px',
          right: '12px',
          zIndex: 9999,
          display: 'flex',
          gap: '6px',
        }}
      >
        <button className="btn-melayang" onClick={toggleFullscreen}>
          {isFullscreen ? '⤦ Keluar FS' : '⛶ Fullscreen'}
        </button>
        <button className="btn-melayang" onClick={handleClose}>
          ← Tutup
        </button>
      </div>
    </div>
  );
};
