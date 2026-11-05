import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AI_MAPEL } from '../data/constants';
import { AIMapel } from '../types';
import { suaraKlik } from '../utils/audio';
import { bukaWA, fallbackClipboard } from '../utils/whatsapp';

export const AIScreen: React.FC = () => {
  const { go, showToast } = useApp();
  const [selectedAI, setSelectedAI] = useState<AIMapel | null>(null);

  const handleSelect = (item: AIMapel) => {
    suaraKlik();
    setSelectedAI(item);
  };

  const getFullPrompt = (item: AIMapel) => {
    return (
      `🤖 BELAJAR BARENG AI — ${item.nama}\n\n` +
      `${item.pesan}\n\n` +
      `Aturan: bahasa sederhana ramah anak SD. Kalau aku tanya hal tidak cocok/berbahaya, tolak lembut. Jangan minta data pribadi. Kalau aku sedih, suruh cerita ke Mami.`
    );
  };

  const handleCopy = (text: string) => {
    fallbackClipboard(text, showToast);
  };

  const handleSendWA = (text: string) => {
    bukaWA(text, showToast);
  };

  return (
    <div className="screen">
      <div className="head">💖 🤖 Belajar Bareng AI</div>
      <div className="info" style={{ fontSize: '12.5px' }}>
        Pilih topik → salin (copy) pertanyaannya → kirim ke AI lain atau WhatsApp Mami.
      </div>

      <button
        className="btn-p"
        style={{ marginBottom: '16px' }}
        onClick={() => {
          suaraKlik();
          go('s-ai-aman');
        }}
      >
        🛡️ Chat AI Aman (Filter Anak)
      </button>

      <div>
        {AI_MAPEL.map((item) => (
          <div
            key={item.nama}
            className="opt-item"
            onClick={() => handleSelect(item)}
          >
            <div className="o-icon">{item.icon}</div>
            <div>
              <div className="o-title">AI {item.nama}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn-s"
        onClick={() => {
          suaraKlik();
          go('s-dash');
        }}
      >
        ← Kembali
      </button>

      {/* Prompt preview modal */}
      {selectedAI && (
        <div className="modal-overlay show">
          <div className="modal-card" style={{ maxWidth: '380px' }}>
            <div
              style={{
                fontSize: '17px',
                fontWeight: 900,
                color: '#EC407A',
                marginBottom: '8px',
              }}
            >
              🤖 {selectedAI.nama}
            </div>

            <div className="gm-info">
              📋 Tekan COPY, lalu paste di AI lain (ChatGPT, Gemini, dll) atau kirim ke WA Mami 💖
            </div>

            <div className="copy-box">{getFullPrompt(selectedAI)}</div>

            <button
              className="modal-btn"
              style={{ background: 'linear-gradient(135deg,#0288D1,#03A9F4)' }}
              onClick={() => handleCopy(getFullPrompt(selectedAI))}
            >
              📋 COPY Pertanyaan
            </button>

            <button
              className="modal-btn"
              style={{ background: 'linear-gradient(135deg,#25D366,#1BAF52)' }}
              onClick={() => handleSendWA(getFullPrompt(selectedAI))}
            >
              💬 Kirim ke WA Mami
            </button>

            <button
              className="modal-btn"
              style={{
                background: '#FFF',
                color: '#EC407A',
                border: '2px solid #F8BBD0',
              }}
              onClick={() => setSelectedAI(null)}
            >
              ← Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
