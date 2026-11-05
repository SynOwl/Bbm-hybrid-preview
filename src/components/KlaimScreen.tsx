import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { suaraBenar, suaraSalah, suaraKlik } from '../utils/audio';
import { bukaWA } from '../utils/whatsapp';

export const KlaimScreen: React.FC = () => {
  const { go, todayRewards, showToast } = useApp();
  const [totalInput, setTotalInput] = useState<string>('');
  const [checkResult, setCheckResult] = useState<{
    tested: boolean;
    success: boolean;
    text: string;
  }>({ tested: false, success: false, text: '' });
  const [wrongCount, setWrongCount] = useState<number>(0);

  const rewardKeys = [
    { key: 'mancing', name: '🎣 MEMANCING' },
    { key: 'sasaran', name: '🎯 LEMPAR SASARAN' },
    { key: 'kotak', name: '🎁 BUKA KOTAK' },
    { key: 'roda', name: '🎡 PUTAR RODA' },
    { key: 'hitung', name: '🔢 HITUNG CEPAT' },
    { key: 'bebek', name: '🦆 TANGKAP BEBEK' },
    { key: 'pola', name: '🧠 TEBAK POLA' },
    { key: 'angka', name: '🎯 TEBAK ANGKA' },
    { key: 'urutan', name: '🧩 INGAT URUTAN' },
    { key: 'kata', name: '🔤 SUSUN KATA' },
    { key: 'teka', name: '📖 TEKA-TEKI' },
  ];

  const actualTotal = rewardKeys.reduce((acc, curr) => {
    return acc + (todayRewards[curr.key] || 0);
  }, 0);

  const handleCheckTotal = () => {
    suaraKlik();
    const num = parseInt(totalInput.replace(/\D/g, ''), 10) || 0;
    if (num === actualTotal) {
      suaraBenar();
      setCheckResult({
        tested: true,
        success: true,
        text: `🎉 BENAR! Total ${actualTotal} menit!`,
      });
      setWrongCount(0);
    } else {
      suaraSalah();
      const nextWrong = wrongCount + 1;
      setWrongCount(nextWrong);
      setCheckResult({
        tested: true,
        success: false,
        text:
          nextWrong >= 3
            ? '😅 3x salah. Coba hitung pelan-pelan ya.'
            : `❌ Belum tepat. Coba hitung lagi (${3 - nextWrong}x).`,
      });
    }
  };

  const handleKirimWA = () => {
    suaraKlik();
    let pesan = '✨ DAFTAR WAKTU TAMBAHAN ✨\n\n';
    rewardKeys.forEach((item) => {
      const v = todayRewards[item.key] || 0;
      if (v > 0) {
        pesan += `${item.name}: ${v} menit\n`;
      }
    });
    pesan += `\n📊 HASIL: ${totalInput || '(belum dihitung)'} menit\n\n✍️ Dari: Grace 💖`;
    bukaWA(pesan, showToast);
  };

  return (
    <div className="screen">
      <div className="head">💖 📋 DAFTAR WAKTU TAMBAHAN</div>

      <div style={{ marginBottom: '14px' }}>
        {rewardKeys.map((item) => {
          const val = todayRewards[item.key] || 0;
          return (
            <div key={item.key} className="opt-item" style={{ cursor: 'default' }}>
              <div style={{ flex: 1, fontSize: '14px', fontWeight: 700 }}>
                {item.name}
              </div>
              <div style={{ fontWeight: 900 }}>{val} menit</div>
            </div>
          );
        })}
      </div>

      <div className="info" style={{ textAlign: 'center' }}>
        <b>🧮 Jumlahkan semua ya!</b><br />
        Contoh: 10 + 15 + 5 = <b>30</b>
      </div>

      <input
        type="text"
        placeholder="Tulis hasil jumlahmu..."
        value={totalInput}
        onChange={(e) => setTotalInput(e.target.value)}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '18px',
          fontWeight: 800,
          textAlign: 'center',
          border: '3px solid rgba(255,255,255,.5)',
          borderRadius: '16px',
          color: '#1a1a1a',
          marginBottom: '12px',
          background: 'rgba(255,255,255,.92)',
        }}
      />

      <button className="btn-p" onClick={handleCheckTotal}>
        ✅ CEK HASIL
      </button>

      {checkResult.tested && (
        <div
          className="info"
          style={{
            background: checkResult.success
              ? 'rgba(200,240,200,.4)'
              : 'rgba(255,200,200,.4)',
            textAlign: 'center',
            fontWeight: 800,
          }}
        >
          {checkResult.text}
        </div>
      )}

      <button
        className="btn-p"
        style={{ background: 'linear-gradient(135deg,#25D366,#1BAF52)' }}
        onClick={handleKirimWA}
      >
        💬 Kirim ke WhatsApp Mami
      </button>

      <button
        className="btn-s"
        onClick={() => {
          suaraKlik();
          go('s-main');
        }}
      >
        ← Kembali
      </button>
    </div>
  );
};
