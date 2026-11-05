import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  suaraKlik,
  suaraBenar,
  suaraSalah,
  suaraSeru,
  ucapkanTeks,
} from '../../utils/audio';

export const BolaRamalanGame: React.FC = () => {
  const { go, showToast } = useApp();
  const [pertanyaan, setPertanyaan] = useState<string>('');
  const [jawaban, setJawaban] = useState<string>('🔮 Bola siap menjawab...');
  const [jawabanType, setJawabanType] = useState<'positif' | 'negatif' | 'netral' | ''>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [bolaCount, setBolaCount] = useState<number>(0);

  useEffect(() => {
    try {
      const c = parseInt(localStorage.getItem('bolaCount') || '0', 10);
      setBolaCount(c);
    } catch {}
  }, []);

  const tapBola = () => {
    if (isThinking) return;
    if (!pertanyaan.trim()) {
      showToast('⚠️ Tulis pertanyaanmu dulu ya!');
      return;
    }

    setIsThinking(true);
    setJawabanType('');
    setJawaban('🔮 Bola sedang melihat masa depan...');
    suaraKlik();

    setTimeout(() => {
      setIsThinking(false);
      const roll = Math.random();
      let answer = '';
      let type: 'positif' | 'negatif' | 'netral' = 'netral';

      if (roll < 0.35) {
        type = 'positif';
        const yes = ['Ya, pasti.', 'Iya.', 'Angin berkata ya.', 'Tentu saja.', 'Pasti bisa!'];
        answer = yes[Math.floor(Math.random() * yes.length)];
      } else if (roll < 0.65) {
        type = 'negatif';
        const no = [
          'Tidak.',
          'Tidak mungkin.',
          'Bukan sekarang.',
          'Jangan berharap.',
          'Bintang-bintang berkata tidak.',
        ];
        answer = no[Math.floor(Math.random() * no.length)];
      } else {
        type = 'netral';
        const netral = [
          'Mungkin suatu hari nanti.',
          'Coba tanya lagi nanti.',
          'Aku tidak tahu.',
          'Hanya waktu yang tahu.',
          'Jangan tanya aku.',
          'Lihat saja nanti.',
          'Kamu yang tahu jawabannya.',
          'Tanyakan pada dirimu sendiri.',
          'Bola sedang bingung.',
          'Awan menutupi jawabannya.',
          'Kesempatan 50:50.',
          'Bisa ya, bisa tidak.',
          'Rahasia alam semesta.',
          'Coba lagi besok.',
          'Mungkin.',
          'Belum terlihat jelas.',
          'Ikuti kata hatimu.',
          'Garis tanganmu kabur.',
          'Tunggu dan lihat.',
          'Semesta belum memutuskan.',
          'Tergantung usahamu.',
          'Kamu sudah tahu, kan?',
          'Bola netral hari ini.',
          'Cari petunjuk lain.',
          'Masa depan masih gelap.',
        ];
        answer = netral[Math.floor(Math.random() * netral.length)];
      }

      setJawaban(answer);
      setJawabanType(type);
      ucapkanTeks(answer);

      if (type === 'positif') suaraBenar();
      else if (type === 'negatif') suaraSalah();
      else suaraSeru();

      const nextCount = bolaCount + 1;
      setBolaCount(nextCount);
      try {
        localStorage.setItem('bolaCount', String(nextCount));
      } catch {}
    }, 2200);
  };

  const resetBola = () => {
    suaraKlik();
    setPertanyaan('');
    setJawaban('🔮 Bola siap menjawab...');
    setJawabanType('');
  };

  return (
    <div className="screen">
      <div className="head">🔮 Bola Ramalan Ajaib</div>
      <div className="info" style={{ textAlign: 'center', fontSize: '12.5px' }}>
        Ketik pertanyaanmu, lalu tap bolanya 💙<br />
        <span style={{ fontSize: '11px', opacity: 0.85 }}>
          Ini cuma seru-seruan ya, bukan ramalan sungguhan ✨
        </span>
      </div>

      <input
        type="text"
        className="bola-input"
        placeholder="Tulis pertanyaanmu di sini..."
        maxLength={120}
        value={pertanyaan}
        onChange={(e) => setPertanyaan(e.target.value)}
      />

      <div className="bola-wrap">
        <div
          className={`bola-container ${isThinking ? 'thinking' : ''}`}
          onClick={tapBola}
        >
          <div className="bola-smoke">
            <div className="smoke-blob b1" />
            <div className="smoke-blob b2" />
            <div className="smoke-blob b3" />
          </div>
          <div className="bola-orb">
            <div className="bola-shine" />
          </div>
          <div className="bola-base" />
        </div>

        <div className={`bola-jawaban ${jawabanType}`}>
          {jawaban}
        </div>
      </div>

      <button className="btn-p" onClick={tapBola}>
        🔮 Ketuk Bola!
      </button>

      <div className="info" style={{ textAlign: 'center', fontSize: '12px' }}>
        Bola sudah menjawab: <b>{bolaCount}</b> kali
      </div>

      <button className="btn-s" onClick={resetBola}>
        🔄 Reset Pertanyaan
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
