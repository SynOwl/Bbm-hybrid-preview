import React from 'react';
import { useApp } from '../context/AppContext';
import { suaraKlik } from '../utils/audio';
import { bukaWA } from '../utils/whatsapp';

export const RincianScreen: React.FC = () => {
  const {
    go,
    selectedDay,
    currentMode,
    currentMapel,
    currentJumlah,
    currentWaktu,
    currentMetode,
    showToast,
  } = useApp();

  const handleKirimKeMami = () => {
    suaraKlik();
    const now = new Date();
    const hari = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    let pesan = '💖 BELAJAR BARENG MAMI 💖\n';
    pesan += '📅 Hari: ' + hari + '\n';
    pesan += '🕐 Jam: ' + jam + ' WIB\n\n';
    pesan += '🏫 Hari Belajar: ' + selectedDay + '\n';
    pesan += '🎮 Mode: ' + (currentMode === 1 ? 'Tambah Waktu' : 'Buka Kunci') + '\n';
    pesan += '📚 Mapel: ' + currentMapel + '\n';
    pesan += '🔢 Soal: ' + currentJumlah + '\n';
    pesan += '⏱️ Waktu: ' + currentWaktu + '\n';
    pesan += '📍 Metode: ' + currentMetode + '\n';

    if (currentMetode.startsWith('HTML')) {
      pesan += '\n📄 Mami, tolong kirim file HTML soal untuk Grace ya 💖\n';
      pesan += '⏳ Grace tunggu minimal 30 menit ya Mami...\n';
      // Simpan pesan lengkap agar tombol kirim ulang memakai rincian yang sama.
      localStorage.setItem('pesanPermintaanHTML', pesan + '\n✍️ Dari Grace 💖');
    }
    pesan += '\n✍️ Dari Grace 💖';

    bukaWA(pesan, showToast);

    if (currentMetode.startsWith('HTML')) {
      localStorage.setItem('menungguSoal', 'true');
      localStorage.setItem('waktuBatasTunggu', String(Date.now() + 30 * 60 * 1000));
      localStorage.setItem('cobaKirimUlang', '0');
      setTimeout(() => {
        go('s-tunggu');
      }, 600);
    }
  };

  return (
    <div className="screen">
      <div className="head">💖 Rincian Lengkap</div>
      <div className="info">
        <b>📅 Hari:</b> {selectedDay || '-'}<br />
        <b>🎮 Mode:</b> {currentMode === 1 ? 'Tambah Waktu' : 'Buka Kunci'}<br />
        <b>📚 Mapel:</b> {currentMapel || '-'}<br />
        <b>🔢 Soal:</b> {currentJumlah ? `${currentJumlah} soal` : '-'}<br />
        <b>⏱️ Waktu:</b> {currentWaktu || '-'}<br />
        <b>📍 Metode:</b> {currentMetode || '-'}
      </div>

      <button className="btn-p" onClick={handleKirimKeMami}>
        💬 Kirim ke WhatsApp Mami
      </button>
      {currentMetode.startsWith('HTML') && (
        <p style={{ fontSize: '12px', textAlign: 'center', margin: '8px 0', opacity: 0.9 }}>
          📲 Setelah WhatsApp terbuka, tekan tombol <b>Kirim</b> agar pesan sampai ke Mami ya 💖
        </p>
      )}

      <button
        className="btn-s"
        onClick={() => {
          suaraKlik();
          go('s-metode');
        }}
      >
        ← Kembali
      </button>
    </div>
  );
};
