import React from 'react';
import { useApp } from '../../context/AppContext';
import { suaraKlik } from '../../utils/audio';

export const GoodbyeModal: React.FC = () => {
  const { goodbyeModal, setGoodbyeModal, saving, showToast } = useApp();

  if (!goodbyeModal) return null;

  const jam = Math.floor(saving / 60);
  const menit = saving % 60;
  const savingText =
    saving > 0
      ? `${jam > 0 ? jam + ' jam ' : ''}${menit > 0 ? menit + ' menit' : ''}`.trim()
      : '0 menit';

  const handleKeluar = () => {
    suaraKlik();

    // Pulihkan penghubung native yang dipakai versi BBM sebelum migrasi React.
    // Jangan memakai history.back(): pada WebView itu justru bisa kembali ke beranda APK.
    const nativeWindow = window as any;
    const panggilSalahSatu = (target: any, names: string[]): boolean => {
      if (!target) return false;
      for (const name of names) {
        if (typeof target[name] === 'function') {
          try {
            target[name]();
            return true;
          } catch {
            // Coba nama fungsi native berikutnya.
          }
        }
      }
      return false;
    };

    const berhasil =
      panggilSalahSatu(nativeWindow.WebToApk, [
        'closeApp', 'finish', 'quit', 'close', 'kill', 'killApp',
        'exitApplication', 'exitApp', 'exit', 'closeApplication',
      ]) ||
      panggilSalahSatu(nativeWindow.Android, ['exitApp', 'closeApp']) ||
      panggilSalahSatu(nativeWindow.AppMint, ['closeApp']);

    setGoodbyeModal(false);

    if (!berhasil) {
      showToast('Fitur keluar otomatis tidak terdeteksi. Gunakan tombol Back HP untuk keluar.');
    }
  };

  return (
    <div className="modal-overlay show">
      <div className="modal-card">
        <span className="modal-icon">🎉</span>
        <div className="modal-title" style={{ fontSize: '22px' }}>
          Terima Kasih Grace!
        </div>
        <div className="modal-sub">
          Kamu sudah belajar dengan baik hari ini. 💖
        </div>
        <div className="modal-reward">
          Tabungan hari ini: {savingText}
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: '#7E57C2',
            marginBottom: '14px',
          }}
        >
          Yakin mau selesai belajar?
        </div>

        <button
          className="modal-btn"
          style={{ background: 'linear-gradient(135deg,#25D366,#1BAF52)' }}
          onClick={handleKeluar}
        >
          ✅ Ya, Selesai
        </button>

        <button
          className="modal-btn"
          style={{
            background: '#FFF',
            color: '#EC407A',
            border: '2px solid #F8BBD0',
          }}
          onClick={() => {
            suaraKlik();
            setGoodbyeModal(false);
          }}
        >
          🏠 Kembali ke Menu
        </button>
      </div>
    </div>
  );
};
