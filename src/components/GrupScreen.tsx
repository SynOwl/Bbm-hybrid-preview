import React from 'react';
import { useApp } from '../context/AppContext';
import { suaraKlik } from '../utils/audio';

export const GrupScreen: React.FC = () => {
  const { go, openLightbox, h2hProfile } = useApp();
  const group = h2hProfile?.group;
  const members = h2hProfile?.members || [];
  const logoUrl = group?.logoUrl || 'https://s2u-fansite.vercel.app/images/logo-h2h.png';

  return (
    <div className="screen">
      <div className="head">💖 Tentang {group?.name || 'Hearts2Hearts'}</div>

      <div className="info" style={{ textAlign: 'center', padding: '20px' }}>
        <img
          src={logoUrl}
          alt="Logo Hearts2Hearts"
          onClick={() => openLightbox(logoUrl)}
          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          style={{
            width: '150px', height: '150px', objectFit: 'contain', background: '#fff',
            padding: '8px', borderRadius: '24px', border: '3px solid rgba(255,255,255,.9)',
            boxShadow: '0 6px 20px rgba(0,0,0,.25)', margin: '0 auto 12px',
            display: 'block', cursor: 'zoom-in',
          }}
        />
        <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '6px' }}>
          {group?.name || 'Hearts2Hearts'}
        </h1>
        <p>{group?.hangul || '하츠투하츠'} · H2H</p>
        <p><b>Debut:</b> {group?.debutDate || '24 Februari 2025'}</p>
        <p><b>Agensi:</b> {group?.agency || 'SM Entertainment'}</p>
        <p><b>Jumlah anggota:</b> {group?.memberCount || 8}</p>
        <p><b>Fandom:</b> {group?.fandom || 'S2U (하츄)'}</p>
      </div>

      <div className="head">🌷 Tentang Grup</div>
      <div className="info">
        <b>Nama dan konsep</b><br />
        {group?.summary || 'Hearts2Hearts adalah girl group Korea Selatan beranggotakan delapan orang.'}
      </div>

      <div className="info">
        <b>Debut dan musik</b><br />
        {group?.concept || 'Grup memulai debut pada 24 Februari 2025.'}
      </div>

      <div className="info">
        <b>Anggota</b><br />
        {members.length === 8
          ? members.map((member) => member.nama).join(' · ')
          : 'Jiwoo · Carmen · Yuha · Stella · Juun · A-na · Ian · Ye-on'}
      </div>

      {group?.history?.length ? (
        <>
          <div className="head">🗓️ Perjalanan & Musik</div>
          {group.history.map((period) => (
            <div className="info" key={period.year}>
              <b>{period.year}</b><br />
              {period.items.map((item, index) => (
                <React.Fragment key={index}>• {item}<br /></React.Fragment>
              ))}
            </div>
          ))}
        </>
      ) : null}

      {group?.discography?.length ? (
        <>
          <div className="head">💿 Diskografi ringkas</div>
          <div className="info">
            {group.discography.map((release, index) => (
              <React.Fragment key={release.title}>
                • <b>{release.title}</b> — {release.description}
                {index < group.discography.length - 1 ? <br /> : null}
              </React.Fragment>
            ))}
          </div>
        </>
      ) : null}

      <div className="info" style={{ fontSize: '11px', opacity: 0.85 }}>
        Katalog profil diperbarui otomatis dari file data aplikasi saat tersedia koneksi internet.
        {group && h2hProfile?.updatedAt ? <><br />Pembaruan katalog: {h2hProfile.updatedAt}</> : null}
      </div>

      <button
        className="btn-s back-button-floating"
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
