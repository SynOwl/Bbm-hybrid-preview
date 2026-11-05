import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KATA_TERLARANG, TOPIK_BELAJAR } from '../data/constants';
import { suaraBenar, suaraSalah, suaraKlik } from '../utils/audio';
import { bukaWA, fallbackClipboard } from '../utils/whatsapp';

export const AIAmanScreen: React.FC = () => {
  const { go, showToast } = useApp();
  const [inputQuery, setInputQuery] = useState<string>('');
  const [result, setResult] = useState<{
    status: 'idle' | 'blocked' | 'nonStudy' | 'approved';
    promptText?: string;
  }>({ status: 'idle' });

  const handleCheck = () => {
    suaraKlik();
    const q = inputQuery.trim();
    if (!q) {
      showToast('⚠️ Tulis pertanyaan dulu');
      return;
    }

    const low = q.toLowerCase();
    const isBlocked = KATA_TERLARANG.some((k) => low.includes(k));
    if (isBlocked) {
      suaraSalah();
      setResult({ status: 'blocked' });
      return;
    }

    const isStudy = TOPIK_BELAJAR.some((t) => low.includes(t));
    if (!isStudy) {
      suaraSalah();
      setResult({ status: 'nonStudy' });
      return;
    }

    suaraBenar();
    const full =
      `Halo! Aku anak kelas 4 SD. Tolong bantu aku belajar dengan bahasa yang sederhana dan ramah anak.\n\n` +
      `Pertanyaanku: ${q}\n\n` +
      `Kalau pertanyaanku tidak cocok atau berbahaya, tolak dengan lembut. Jangan minta data pribadiku ya.`;

    setResult({ status: 'approved', promptText: full });
  };

  return (
    <div className="screen">
      <div className="head">💖 🛡️ AI Aman (Filter Anak)</div>
      <div className="info">
        Tanya hal-hal tentang pelajaran. Kata tidak aman akan diblokir otomatis.
      </div>

      <textarea
        className="gm-input"
        placeholder="Contoh: Bagaimana cara menghitung pecahan?"
        value={inputQuery}
        onChange={(e) => setInputQuery(e.target.value)}
        style={{ color: '#4A148C', borderColor: '#F8BBD0', minHeight: '100px' }}
      />

      <button className="btn-p" onClick={handleCheck}>
        ✨ Cek & Buat Pertanyaan
      </button>

      {/* Result feedback */}
      {result.status === 'blocked' && (
        <div
          className="info"
          style={{ background: 'rgba(255,255,255,.9)', color: '#B71C1C', textShadow: 'none' }}
        >
          ⛔ <b>Pertanyaan ini belum cocok untuk AI belajar.</b><br />
          Coba tanya pelajaran sekolah atau bilang ke Mami ya 💖
        </div>
      )}

      {result.status === 'nonStudy' && (
        <div
          className="info"
          style={{ background: 'rgba(255,255,255,.9)', color: '#4A148C', textShadow: 'none' }}
        >
          🤖 <b>AI aman hanya untuk topik belajar.</b><br />
          Coba tanya soal pelajaran seperti Matematika, IPA, Bahasa, atau tugas sekolah ya 💖
        </div>
      )}

      {result.status === 'approved' && result.promptText && (
        <div
          className="info"
          style={{ background: 'rgba(255,255,255,.9)', color: '#1B5E20', textShadow: 'none' }}
        >
          ✅ <b>Pertanyaan aman untuk belajar!</b><br /><br />
          <div className="copy-box" style={{ background: '#F3E5F5' }}>
            {result.promptText}
          </div>

          <button
            className="btn-p"
            style={{
              marginTop: '10px',
              fontSize: '13px',
              padding: '12px',
              background: 'linear-gradient(135deg,#0288D1,#03A9F4)',
            }}
            onClick={() => fallbackClipboard(result.promptText!, showToast)}
          >
            📋 COPY Pertanyaan
          </button>

          <button
            className="btn-p"
            style={{
              fontSize: '13px',
              padding: '12px',
              background: 'linear-gradient(135deg,#25D366,#1BAF52)',
            }}
            onClick={() => bukaWA(result.promptText!, showToast)}
          >
            💬 Kirim ke WA Mami
          </button>

          <div
            style={{
              fontSize: '11px',
              opacity: 0.85,
              textAlign: 'center',
              marginTop: '8px',
              color: '#4A148C',
            }}
          >
            Salin dulu, lalu paste di ChatGPT / Gemini / AI lain 💖
          </div>
        </div>
      )}

      <button
        className="btn-s"
        onClick={() => {
          suaraKlik();
          go('s-ai');
        }}
      >
        ← Kembali ke Menu AI
      </button>
    </div>
  );
};
