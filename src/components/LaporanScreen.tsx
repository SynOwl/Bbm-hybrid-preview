import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { suaraKlik } from '../utils/audio';
import { bukaWA } from '../utils/whatsapp';

export const LaporanScreen: React.FC = () => {
  const { go, currentJumlah, cekBadge, catatRekap, showToast } = useApp();
  const [jenis, setJenis] = useState<'belajar' | 'bonus'>('belajar');
  const [mapel, setMapel] = useState<string>('');
  const [skor, setSkor] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [namaGame, setNamaGame] = useState<string>('');
  const [menitBonus, setMenitBonus] = useState<string>('');

  const handleKirimWA = () => {
    suaraKlik();
    let pesan = '💖 LAPORAN GRACE 💖\n\n';
    pesan += '📅 Waktu: ' + new Date().toLocaleString('id-ID') + '\n';

    if (jenis === 'belajar') {
      const skorNum = parseInt(skor, 10);
      if (skorNum >= 90) cekBadge('bintang');
      if (!mapel.trim()) {
        showToast('⚠️ Mapel harus diisi');
        return;
      }
      pesan += `📚 Mapel: ${mapel}\n`;
      if (skor) pesan += `📈 Skor: ${skor}\n`;
      if (catatan) pesan += `📝 Catatan: ${catatan}\n`;
    } else {
      if (!namaGame.trim() || !menitBonus.trim()) {
        showToast('⚠️ Game dan Menit harus diisi');
        return;
      }
      pesan += `🎮 Game: ${namaGame}\n`;
      pesan += `⏱️ Bonus: ${menitBonus} menit\n`;
    }

    bukaWA(pesan, showToast);
  };

  const handleSimpanRekap = () => {
    suaraKlik();
    if (jenis === 'belajar') {
      if (!mapel.trim()) {
        showToast('⚠️ Mapel harus diisi');
        return;
      }
      const item: Parameters<typeof catatRekap>[0] = {
        jenis: 'Belajar',
        mapel: mapel.trim(),
        jumlahSoal: currentJumlah || 0,
      };
      if (skor) item.skor = parseInt(skor, 10);
      catatRekap(item);
    } else {
      const m = parseInt(menitBonus, 10);
      if (!namaGame.trim() || isNaN(m)) {
        showToast('⚠️ Game dan Menit harus diisi');
        return;
      }
      catatRekap({
        jenis: 'Bonus',
        nama: namaGame.trim(),
        menit: m,
      });
    }
    showToast('💾 Disimpan ke Rekap Mingguan!');
  };

  return (
    <div className="screen">
      <div className="head">💖 💬 Laporan Rapi</div>
      <div className="info">
        Kirim laporan belajar atau bonus ke WhatsApp Mami dengan format rapi.
      </div>

      <select
        className="gm-input"
        value={jenis}
        onChange={(e) => setJenis(e.target.value as 'belajar' | 'bonus')}
        style={{ color: '#4A148C', borderColor: '#F8BBD0' }}
      >
        <option value="belajar">📚 Laporan Belajar</option>
        <option value="bonus">🎮 Laporan Bonus Game</option>
      </select>

      {jenis === 'belajar' ? (
        <div>
          <input
            type="text"
            className="gm-input"
            placeholder="Mapel"
            value={mapel}
            onChange={(e) => setMapel(e.target.value)}
            style={{ color: '#4A148C', borderColor: '#F8BBD0' }}
          />
          <input
            type="number"
            className="gm-input"
            placeholder="Skor (opsional)"
            value={skor}
            onChange={(e) => setSkor(e.target.value)}
            style={{ color: '#4A148C', borderColor: '#F8BBD0' }}
          />
          <textarea
            className="gm-input"
            placeholder="Catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            style={{
              color: '#4A148C',
              borderColor: '#F8BBD0',
              minHeight: '80px',
            }}
          />
        </div>
      ) : (
        <div>
          <input
            type="text"
            className="gm-input"
            placeholder="Nama Game"
            value={namaGame}
            onChange={(e) => setNamaGame(e.target.value)}
            style={{ color: '#4A148C', borderColor: '#F8BBD0' }}
          />
          <input
            type="number"
            className="gm-input"
            placeholder="Menit Bonus"
            value={menitBonus}
            onChange={(e) => setMenitBonus(e.target.value)}
            style={{ color: '#4A148C', borderColor: '#F8BBD0' }}
          />
        </div>
      )}

      <button className="btn-p" onClick={handleKirimWA}>
        💬 Kirim ke WhatsApp Mami
      </button>

      <button className="btn-s" onClick={handleSimpanRekap}>
        💾 Simpan ke Rekap Mingguan
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
