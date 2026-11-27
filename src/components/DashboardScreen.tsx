import React from 'react';
import { useApp } from '../context/AppContext';
import { MAX_SAVING, XP_PER_LEVEL } from '../data/constants';
import { suaraKlik } from '../utils/audio';

const SAS_SCHEDULE = [
  { date: '2026-11-30', day: 'Senin', subjects: ['Agama', 'Bahasa Indonesia'] },
  { date: '2026-12-01', day: 'Selasa', subjects: ['Matematika', 'PKn/P2'] },
  { date: '2026-12-02', day: 'Rabu', subjects: ['IPAS', 'PJOK'] },
  { date: '2026-12-03', day: 'Kamis', subjects: ['Bahasa Inggris', 'SBK/Seni'] },
];
const SAS_PREP = [
  { date: '2026-11-27', day: 'Jumat', subjects: ['Agama', 'Bahasa Indonesia'] },
  { date: '2026-11-28', day: 'Sabtu', subjects: ['Matematika', 'PKn/P2'] },
  { date: '2026-11-29', day: 'Minggu', subjects: ['IPAS', 'PJOK'] },
];

const localDateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export const DashboardScreen: React.FC = () => {
  const {
    go, selectedDay, ubahHari, saving, userXP, userLevel, userStreak, battery, setGoodbyeModal,
  } = useApp();

  const savingPercent = Math.min(100, Math.round((saving / MAX_SAVING) * 100));
  const jam = Math.floor(saving / 60);
  const menit = saving % 60;
  const savingAmountText = saving >= 60
    ? `${jam > 0 ? jam + ' jam ' : ''}${menit > 0 ? menit + ' menit' : ''} / 5 jam`.trim()
    : `${saving} menit / 5 jam`;
  const xpInLevel = userXP % XP_PER_LEVEL;
  const handleNav = (screenId: Parameters<typeof go>[0]) => { suaraKlik(); go(screenId); };

  const today = localDateKey();
  const sasActive = today >= '2026-11-27' && today <= '2026-12-03';
  const todaySchedule = [...SAS_PREP, ...SAS_SCHEDULE].find(item => item.date === today);
  const examSchedule = SAS_SCHEDULE.find(item => item.date === today);

  return (
    <div className="screen">
      <div className="chip-row">
        <div className="chip green">⚡ <span>{battery}</span></div>
        <div className="chip">🏫 <span>{selectedDay || 'Hari Belajar'}</span></div>
      </div>
      <button className="btn-p" onClick={ubahHari}>🔄 Ubah hari</button>

      {sasActive && (
        <section style={{ margin: '16px 0', padding: 16, borderRadius: 18, background: 'linear-gradient(135deg, #e0f7fa, #f3e5f5)', color: '#263238' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>📚 Persiapan SAS 2026/2027</div>
          <div style={{ marginTop: 4, fontSize: 13 }}>30 November – 3 Desember</div>
          {todaySchedule ? (
            <>
              <div style={{ marginTop: 12, fontWeight: 700 }}>{examSchedule ? 'Jadwal ujian hari ini' : 'Fokus belajar hari ini'} · {todaySchedule.day}</div>
              {todaySchedule.subjects.map((subject, i) => <div key={subject} style={{ padding: '7px 0' }}>{i+1}. {subject}</div>)}
            </>
          ) : <div style={{ marginTop: 10 }}>Persiapkan materi sesuai jadwal ujian mendatang.</div>}
          <button className="btn-p" style={{ marginTop: 12 }} onClick={() => handleNav('s-mode')}>📖 Mulai latihan</button>
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Lihat jadwal SAS</summary>
            <div style={{ marginTop: 8 }}>
              {SAS_SCHEDULE.map(item => <div key={item.date} style={{ padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,.1)' }}><b>{item.day}</b> · {item.date.slice(8,10)} Desember<br/>{item.subjects.join(' → ')}</div>)}
            </div>
          </details>
        </section>
      )}

      <div className="saving-box">
        <div className="saving-header"><div className="s-title">⏱️ Tabungan Waktu</div><div className="s-badge">{savingPercent}%</div></div>
        <div className="saving-amount">{savingAmountText}</div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${savingPercent}%` }} /></div>
        <div className="saving-note">Reset otomatis tiap hari 🔄</div>
      </div>

      <div className="xp-box">
        <div className="xp-header"><div className="xp-level">Lv {userLevel}</div><div className="xp-title">✨ Petualangan Grace</div></div>
        <div className="xp-bar-wrap"><div className="xp-bar" style={{ width: `${xpInLevel}%` }} /></div>
        <div className="xp-info"><span>{xpInLevel} / {XP_PER_LEVEL} XP</span></div>
        <div className="streak-row"><span className="streak-fire">🔥</span><span>{userStreak} hari berturut-turut!</span></div>
      </div>

      <button className="btn-p" onClick={() => handleNav('s-mode')}>⏰ Pakai HP</button>
      <div className="grid-2">
        <div className="grid-item" onClick={() => handleNav('s-upload')}><span className="g-icon">📤</span><div className="g-title">Upload Soal</div></div>
        <div className="grid-item" onClick={() => handleNav('s-main')}><span className="g-icon">🎮</span><div className="g-title">Game</div></div>
        <div className="grid-item" onClick={() => handleNav('s-video')}><span className="g-icon">🎬</span><div className="g-title">Video H2H</div></div>
        <div className="grid-item" onClick={() => handleNav('s-ai')}><span className="g-icon">🤖</span><div className="g-title">Belajar AI</div></div>
        <div className="grid-item" onClick={() => handleNav('s-aturan')}><span className="g-icon">📋</span><div className="g-title">Aturan</div></div>
        <div className="grid-item" onClick={() => handleNav('s-tema')}><span className="g-icon">🎨</span><div className="g-title">Ganti Tema</div></div>
        <div className="grid-item" onClick={() => handleNav('s-member')}><span className="g-icon">💖</span><div className="g-title">Profil Member</div></div>
        <div className="grid-item" onClick={() => handleNav('s-grup')}><span className="g-icon">🌟</span><div className="g-title">Tentang H2H</div></div>
        <div className="grid-item" onClick={() => handleNav('s-rekap')}><span className="g-icon">📊</span><div className="g-title">Rekap Mingguan</div></div>
        <div className="grid-item" onClick={() => handleNav('s-badge')}><span className="g-icon">🏆</span><div className="g-title">Piala & Badge</div></div>
      </div>
      <button className="btn-s" onClick={() => handleNav('s-laporan')}>💬 Laporan Rapi ke Mami</button>
      <button className="btn-d" onClick={() => { suaraKlik(); setGoodbyeModal(true); }}>🏁 Selesai Belajar</button>
    </div>
  );
};
