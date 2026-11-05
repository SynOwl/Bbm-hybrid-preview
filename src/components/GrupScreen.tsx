import React from 'react';
import { useApp } from '../context/AppContext';
import { suaraKlik } from '../utils/audio';

export const GrupScreen: React.FC = () => {
  const { go, openLightbox } = useApp();

  return (
    <div className="screen">
      <div className="head">💖 Tentang Hearts2Hearts</div>

      <div className="info" style={{ textAlign: 'center', padding: '20px' }}>
        <img
          src="https://s2u-fansite.vercel.app/images/logo-h2h.png"
          alt="Logo Hearts2Hearts"
          onClick={() => openLightbox('https://s2u-fansite.vercel.app/images/logo-h2h.png')}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
          style={{
            width: '150px',
            height: '150px',
            objectFit: 'contain',
            background: '#fff',
            padding: '8px',
            borderRadius: '24px',
            border: '3px solid rgba(255,255,255,.9)',
            boxShadow: '0 6px 20px rgba(0,0,0,.25)',
            margin: '0 auto 12px',
            display: 'block',
            cursor: 'zoom-in',
          }}
        />
        <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '6px' }}>
          Hearts2Hearts
        </h1>
        <p>하츠투하츠 · H2H</p>
        <p><b>Debut:</b> 24 Februari 2025</p>
        <p><b>Agensi:</b> SM Entertainment</p>
        <p><b>Jumlah anggota:</b> 8</p>
        <p><b>Fandom:</b> S2U (하츄)</p>
      </div>

      <div className="head">🌷 Tentang Grup</div>
      <div className="info">
        <b>Nama dan konsep</b><br />
        Hearts2Hearts (하츠투하츠) adalah girl group Korea Selatan beranggotakan delapan orang.
        Nama grup menggambarkan tujuan menghubungkan hati dengan penggemar di seluruh dunia melalui musik
        yang memuat beragam emosi dan pesan tulus, lalu melangkah bersama sebagai “kita” yang lebih besar.
      </div>

      <div className="info">
        <b>Debut</b><br />
        Grup memulai debut pada 24 Februari 2025 lewat single album <i>The Chase</i>. Lagu yang menjadi
        title track adalah “The Chase”; rilisan debut juga memuat “Butterflies”.
      </div>

      <div className="info">
        <b>Anggota</b><br />
        Jiwoo · Carmen · Yuha · Stella · Juun · A-na · Ian · Ye-on.<br />
        Daftar dan urutan ini mengikuti kanal profil artis resmi.
      </div>

      <div className="head">🗓️ Perjalanan & Musik</div>
      <div className="info">
        <b>2025 — Tahun debut</b><br />
        • 24 Februari: debut dengan single album <i>The Chase</i>, berisi “The Chase” dan “Butterflies”.<br />
        • 18 Juni: single digital “STYLE”.<br />
        • 24 September: “Pretty Please” dirilis sebagai single pra-rilis.<br />
        • 20 Oktober: mini album pertama <i>FOCUS</i>.
      </div>

      <div className="info">
        <b>2026 — Perkembangan terbaru</b><br />
        • Februari: single “RUDE!”.<br />
        • Juni: mini album kedua <i>Lemon Tang</i>.<br />
        • Agustus: single Jepang pertama <i>ICONIC HEART</i>.<br />
        • September: single “Moonride”.<br />
        • 5 Oktober: “ICONIC HEART (Korean Ver.)”.<br />
        • 11 Oktober: “Candy Box Lover”, lagu tema anime <i>Dessert Catch! Teenieping</i>.<br />
        • 16 Oktober: “Next Chapter”, kolaborasi 10 tahun <i>Arena of Valor</i>.
      </div>

      <div className="head">💿 Diskografi ringkas</div>
      <div className="info">
        • <b>The Chase</b> — single album (2025)<br />
        • <b>STYLE</b> — single digital (2025)<br />
        • <b>Pretty Please</b> — single pra-rilis (2025)<br />
        • <b>FOCUS</b> — mini album pertama (2025)<br />
        • <b>RUDE!</b> — single (2026)<br />
        • <b>Lemon Tang</b> — mini album kedua (2026)<br />
        • <b>ICONIC HEART</b> — single Jepang pertama (2026)<br />
        • <b>Moonride</b> — single (2026)<br />
        • <b>Candy Box Lover</b> — OST anime (2026)
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
    </div>
  );
};
