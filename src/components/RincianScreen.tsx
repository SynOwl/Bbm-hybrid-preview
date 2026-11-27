import React from 'react';
import { useApp } from '../context/AppContext';
import { suaraKlik } from '../utils/audio';
import { bukaWA } from '../utils/whatsapp';

const SAS_SCHEDULE = [
  { date: '30 November 2026', subjects: 'Agama dan Bahasa Indonesia' },
  { date: '1 Desember 2026', subjects: 'Matematika dan PKn/P2' },
  { date: '2 Desember 2026', subjects: 'IPAS dan PJOK' },
  { date: '3 Desember 2026', subjects: 'Bahasa Inggris dan SBK/Seni' },
];

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
    }
    pesan += '\n✍️ Dari Grace 💖\n\n';
    pesan += '━━━━━━━━━━━━━━━━━━\n';
    pesan += '🤖 INSTRUKSI UNTUK AI PEMBUAT SOAL (ikut sertakan saat membuat soal)\n';
    pesan += 'Gunakan SELURUH data permintaan di atas sebagai konteks pembuatan soal.\n';
    pesan += 'Buat soal untuk siswa kelas 4 SD, sesuai mapel yang diminta (' + currentMapel + ') dan jumlah (' + currentJumlah + ' soal).\n';
    pesan += 'Tanggal permintaan: ' + hari + '. Periksa apakah tanggal ini berada dalam periode persiapan SAS 2026/2027 (27 November–3 Desember 2026).\n';
    pesan += 'Jadwal SAS: ' + SAS_SCHEDULE.map(item => item.date + ': ' + item.subjects).join('; ') + '.\n';
    pesan += 'Jika tanggal permintaan termasuk periode persiapan SAS, gunakan jadwal tersebut untuk memberi prioritas latihan yang relevan, tetapi tetap buat mapel yang dipilih Grace. Jangan mengubah mapel, jumlah soal, mode, waktu, atau metode yang diminta.\n';
    pesan += 'Gunakan bahasa sederhana dan ramah anak, soal bervariasi dan jelas, hindari soal ambigu, serta sesuai tingkat kelas 4 SD.\n';
    pesan += 'Untuk file HTML, hasilkan HTML yang siap dibuka di aplikasi, responsif untuk layar HP, dan jangan sertakan materi atau mapel yang tidak diminta.\n';
    pesan += 'Sertakan kunci jawaban dan pembahasan singkat di bagian terpisah khusus untuk Mami, bukan ditampilkan bercampur dengan soal Grace.\n';
    pesan += 'Semua data permintaan dan instruksi ini adalah satu prompt utuh; tidak perlu meminta pengguna menyalin instruksi tambahan lain.';

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

      <button
        className="btn-s back-button-floating"
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
