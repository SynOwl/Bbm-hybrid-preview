import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { deteksiMapelDariHTML, isHariMinggu } from '../utils/storage';
import { suaraKlik } from '../utils/audio';

interface UploadSoalScreenProps {
  onLoadHtml: (html: string) => void;
}

export const UploadSoalScreen: React.FC<UploadSoalScreenProps> = ({ onLoadHtml }) => {
  const { go, currentMapel, potongKuota, tutupMinggu, showToast } = useApp();
  const [linkInput, setLinkInput] = useState<string>('');
  const [pasteInput, setPasteInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processAndOpenHtml = (html: string) => {
    const mapelPakai = deteksiMapelDariHTML(html) || currentMapel;
    if (mapelPakai) potongKuota(mapelPakai);

    localStorage.removeItem('menungguSoal');
    localStorage.removeItem('waktuBatasTunggu');
    localStorage.removeItem('cobaKirimUlang');

    try {
      localStorage.setItem('soalHTMLTerakhir', html);
    } catch {}

    if (isHariMinggu()) {
      tutupMinggu();
    }

    onLoadHtml(html);
    go('s-soal-view');
    showToast('📄 Soal dimuat!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.html') && !name.endsWith('.htm')) {
      showToast('⚠️ File harus .html');
      e.target.value = '';
      return;
    }
    showToast('⏳ Membaca file...');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const html = ev.target?.result as string;
      if (html) {
        processAndOpenHtml(html);
      }
    };
    reader.onerror = () => showToast('⚠️ Gagal baca file');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBukaTersimpan = () => {
    suaraKlik();
    const html = localStorage.getItem('soalHTMLTerakhir');
    if (!html) {
      showToast('⚠️ Belum ada soal tersimpan');
      return;
    }
    processAndOpenHtml(html);
  };

  const handleHapusTersimpan = () => {
    suaraKlik();
    if (window.confirm('Hapus soal tersimpan?')) {
      localStorage.removeItem('soalHTMLTerakhir');
      showToast('🗑️ Dihapus');
    }
  };

  const handleSimpanLink = () => {
    suaraKlik();
    let link = linkInput.trim();
    if (!link) {
      showToast('⚠️ Link belum diisi');
      return;
    }
    if (!/^https?:\/\//i.test(link)) link = 'https://' + link;
    localStorage.setItem('soalLinkTerakhir', link);
    window.open(link, '_blank');
    showToast('🌐 Link dibuka!');
  };

  const handleSimpanPaste = () => {
    suaraKlik();
    const html = pasteInput.trim();
    if (!html) {
      showToast('⚠️ HTML belum diisi');
      return;
    }
    processAndOpenHtml(html);
  };

  return (
    <div className="screen">
      <div className="head">💖 Upload Soal dari Mami</div>
      <div className="info">
        Mami kirim file HTML soal ke WhatsApp Grace. Tap kotak di bawah untuk pilih file dari HP 📄
      </div>

      <div
        className="upload-big"
        onClick={() => fileInputRef.current?.click()}
        style={{
          background: 'rgba(255,255,255,.15)',
          border: '2px dashed rgba(255,255,255,.5)',
          borderRadius: '20px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '14px',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '36px' }}>📄</span>
        <div style={{ fontWeight: 800, marginTop: '8px' }}>Pilih File HTML Soal</div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept=".html,.htm,text/html"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button className="btn-s" onClick={handleBukaTersimpan}>
        📂 Buka Soal Terakhir yang Diupload
      </button>

      <button className="btn-s" onClick={handleHapusTersimpan}>
        🗑️ Hapus Soal Tersimpan
      </button>

      <div className="info" style={{ marginTop: '14px' }}>
        Atau masukkan Link / Paste HTML dari Mami:
      </div>

      <input
        type="url"
        value={linkInput}
        onChange={(e) => setLinkInput(e.target.value)}
        className="gm-input"
        placeholder="https://link-soal.com"
        style={{ color: '#4A148C', borderColor: '#F8BBD0', marginBottom: '8px' }}
      />
      <button className="btn-s" onClick={handleSimpanLink}>
        🌐 Simpan & Buka Link
      </button>

      <textarea
        value={pasteInput}
        onChange={(e) => setPasteInput(e.target.value)}
        className="gm-input"
        placeholder="Paste kode HTML di sini..."
        style={{
          color: '#4A148C',
          borderColor: '#F8BBD0',
          minHeight: '100px',
          marginBottom: '8px',
        }}
      />
      <button className="btn-s" onClick={handleSimpanPaste}>
        📄 Simpan & Buka HTML
      </button>

      <button
        className="btn-s"
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
