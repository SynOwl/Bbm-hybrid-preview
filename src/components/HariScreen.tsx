import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

type FormKind = 'ibadah' | 'kegiatan' | 'libur' | null;

export const HariScreen: React.FC = () => {
  const { pilihHari } = useApp();
  const [form, setForm] = useState<FormKind>(null);
  const [detail, setDetail] = useState('');
  const [reason, setReason] = useState('');
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const submit = () => {
    const value = detail.trim();
    if (!value) return;
    if (form === 'ibadah') pilihHari(`Ibadah Gereja: ${value}`);
    if (form === 'kegiatan') pilihHari(`Kegiatan Gereja: ${value}`);
    if (form === 'libur') pilihHari(`Libur Sekolah (${reason}): ${value}`);
  };

  const startForm = (kind: FormKind) => { setForm(kind); setDetail(''); setReason(kind === 'libur' ? 'Izin' : ''); };

  return (
    <div className="screen">
      <div className="greet">
        <span className="icons">💖🩵💖</span>
        <h1>Hai Grace!</h1>
        <p>Hari ini hari apa ya?</p>
        <div className="date">{todayFormatted}</div>
      </div>

      <div className="card-opt rekomendasi" onClick={() => pilihHari('Hari Sekolah')}>
        <div className="badge">⭐ Rekomendasi</div>
        <span className="opt-icon">🏫</span>
        <div className="opt-title">Hari Sekolah</div>
        <div className="opt-sub">Senin–Jumat</div>
      </div>

      <div className="card-opt" onClick={() => pilihHari('Hari Libur')}>
        <span className="opt-icon">🎈</span>
        <div className="opt-title">Hari Libur</div>
        <div className="opt-sub">Tanggal merah / libur</div>
      </div>

      <div className="card-opt" onClick={() => startForm('ibadah')}>
        <span className="opt-icon">🙏</span>
        <div className="opt-title">Ibadah Gereja</div>
        <div className="opt-sub">Isi jenis ibadah, misalnya Sekolah Minggu</div>
      </div>

      <div className="card-opt" onClick={() => startForm('kegiatan')}>
        <span className="opt-icon">⛪</span>
        <div className="opt-title">Kegiatan Gereja</div>
        <div className="opt-sub">Catat kegiatan yang diikuti</div>
      </div>

      <div className="card-opt" onClick={() => startForm('libur')}>
        <span className="opt-icon">📚</span>
        <div className="opt-title">Libur Sekolah</div>
        <div className="opt-sub">Izin, sekolah diliburkan, atau sakit</div>
      </div>

      {form && (
        <div className="card" style={{ marginTop: 16, padding: 16 }}>
          <h2>{form === 'ibadah' ? 'Catat Ibadah Gereja' : form === 'kegiatan' ? 'Catat Kegiatan Gereja' : 'Catat Libur Sekolah'}</h2>
          {form === 'libur' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {['Izin', 'Sekolah diliburkan', 'Sakit'].map((r) => (
                <button type="button" key={r} onClick={() => setReason(r)}
                  style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid currentColor', background: reason === r ? 'var(--accent, #e8d5ff)' : 'transparent' }}>
                  {r}
                </button>
              ))}
            </div>
          )}
          <label htmlFor="day-context-detail">{form === 'ibadah' ? 'Jenis ibadah' : form === 'kegiatan' ? 'Kegiatan' : 'Keterangan'}</label>
          <input id="day-context-detail" value={detail} onChange={(e) => setDetail(e.target.value)}
            placeholder={form === 'ibadah' ? 'Contoh: Sekolah Minggu' : form === 'kegiatan' ? 'Contoh: Latihan paduan suara' : 'Tuliskan keterangan'}
            style={{ width: '100%', boxSizing: 'border-box', padding: 12, marginTop: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={submit} disabled={!detail.trim() || (form === 'libur' && !reason)}>Simpan & lanjut</button>
            <button type="button" onClick={() => setForm(null)}>Batal</button>
          </div>
        </div>
      )}
    </div>
  );
};
