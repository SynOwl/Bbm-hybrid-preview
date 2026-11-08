import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { suaraKlik, suaraHadiah, suaraSalah } from '../utils/audio';
import { bukaWA } from '../utils/whatsapp';
import { getSheetsConfig } from '../services/sheetsSync';

export const RekapScreen: React.FC = () => {
  const {
    go,
    rekapList,
    resetRekap,
    showToast,
    sheetsSyncStatus,
    lastSyncTime,
    syncErrorMessage,
    offlineQueueCount,
    syncToSheets,
    pullFromSheets,
    testSheetsConn,
    updateSheetsConfig,
  } = useApp();

  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>('');
  const [inputToken, setInputToken] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [testingConn, setTestingConn] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    probeId?: string;
    testTabMissing?: boolean;
  } | null>(null);
  const [isSyncingAction, setIsSyncingAction] = useState<boolean>(false);

  useEffect(() => {
    const cfg = getSheetsConfig();
    setInputUrl(cfg.webAppUrl);
    setInputToken(cfg.token);
  }, [showConfigModal]);

  const now = new Date();
  const awal = new Date(now);
  const diff = (now.getDay() + 6) % 7;
  awal.setDate(now.getDate() - diff);
  awal.setHours(0, 0, 0, 0);

  const mingguIni = rekapList.filter((x) => {
    return x.waktu ? new Date(x.waktu) >= awal : true;
  });

  let totalMenit = 0;
  let totalSoal = 0;
  let totalBonus = 0;
  let totalBelajar = 0;
  const nilaiList: number[] = [];

  mingguIni.forEach((x) => {
    if (x.jenis === 'Bonus') {
      totalBonus++;
      totalMenit += x.menit || 0;
    }
    if (x.jenis === 'Belajar') {
      totalBelajar++;
      totalSoal += x.jumlahSoal || 0;
      if (typeof x.skor === 'number') nilaiList.push(x.skor);
    }
  });

  const rata = nilaiList.length
    ? Math.round(nilaiList.reduce((a, b) => a + b, 0) / nilaiList.length)
    : null;

  const handleKirimRekapWA = () => {
    suaraKlik();
    let pesan = '📊 REKAP MINGGUAN GRACE\n\n';
    pesan += `📅 Dibuat: ${now.toLocaleString('id-ID')}\n`;
    pesan += `🧾 Total aktivitas: ${mingguIni.length}\n\n`;

    mingguIni
      .slice()
      .reverse()
      .forEach((x, i) => {
        pesan += `${i + 1}. ${x.jenis || 'Aktivitas'} - ${x.nama || x.mapel || 'Kegiatan'}`;
        if (x.jenis === 'Bonus') pesan += ` | +${x.menit || 0} menit`;
        if (x.jenis === 'Belajar') {
          pesan += ` | ${x.jumlahSoal || 0} soal`;
          if (typeof x.skor === 'number') pesan += ` | skor ${x.skor}`;
        }
        pesan += '\n';
      });

    bukaWA(pesan, showToast);
  };

  const handleManualSync = async () => {
    suaraKlik();
    setIsSyncingAction(true);
    const res = await syncToSheets(true);
    setIsSyncingAction(false);
    if (res.success) {
      suaraHadiah();
      showToast(res.message);
    } else {
      suaraSalah();
      showToast(`⚠️ ${res.message}`);
    }
  };

  const handleManualPull = async () => {
    suaraKlik();
    setIsSyncingAction(true);
    const res = await pullFromSheets();
    setIsSyncingAction(false);
    if (res.success) {
      suaraHadiah();
      showToast(res.message);
    } else {
      suaraSalah();
      showToast(`⚠️ ${res.message}`);
    }
  };

  const handleTestConnection = async () => {
    suaraKlik();
    setTestingConn(true);
    setTestResult(null);
    const res = await testSheetsConn(inputUrl, inputToken);
    setTestingConn(false);
    setTestResult(res);
    if (res.success) {
      suaraHadiah();
    } else {
      suaraSalah();
    }
  };

  const handleSaveConfig = () => {
    suaraKlik();
    updateSheetsConfig(inputUrl, inputToken);
    setShowConfigModal(false);
    setTestResult(null);
  };

  // Status visual badge
  let statusBadgeColor = '#9E9E9E';
  let statusBadgeText = '⚙️ Belum Dikonfigurasi';
  let statusDetailText = 'Atur Google Apps Script Web App untuk mengaktifkan sinkronisasi online.';

  if (sheetsSyncStatus === 'synced') {
    statusBadgeColor = '#2E7D32';
    statusBadgeText = '🟢 Tersinkron ke Google Sheets';
    statusDetailText = lastSyncTime ? `Terakhir tersinkron: ${lastSyncTime}` : 'Semua data tersimpan aman di spreadsheet.';
  } else if (sheetsSyncStatus === 'syncing' || isSyncingAction) {
    statusBadgeColor = '#1565C0';
    statusBadgeText = '⏳ Sedang Menyinkronkan...';
    statusDetailText = 'Menghubungkan ke Google Apps Script...';
  } else if (sheetsSyncStatus === 'error') {
    statusBadgeColor = '#C62828';
    statusBadgeText = '🔴 Koneksi Belum Berhasil';
    statusDetailText = syncErrorMessage || 'Data tetap aman di HP Grace dan akan otomatis dikirim saat online.';
  } else if (sheetsSyncStatus === 'idle') {
    statusBadgeColor = '#00838F';
    statusBadgeText = '📡 Siap Sinkronisasi';
    statusDetailText = offlineQueueCount > 0 ? `${offlineQueueCount} data menunggu pengiriman.` : 'Koneksi spreadsheet aktif.';
  }

  return (
    <div className="screen">
      <div className="head">💖 📊 Rekap Mingguan</div>

      {/* Box Status Sinkronisasi Google Sheets */}
      <div
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '16px',
          padding: '14px 16px',
          marginBottom: '14px',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#FFF',
              background: statusBadgeColor,
              padding: '3px 10px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {statusBadgeText}
          </div>
          <button
            onClick={() => {
              suaraKlik();
              setShowConfigModal(true);
            }}
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              color: '#FFF',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            ⚙️ Atur Sheets
          </button>
        </div>

        <div style={{ fontSize: '11px', opacity: 0.85, marginBottom: '10px', lineHeight: 1.4 }}>
          {statusDetailText}
          {offlineQueueCount > 0 && sheetsSyncStatus !== 'synced' && (
            <div style={{ color: '#FFD54F', marginTop: '4px', fontWeight: 700 }}>
              📦 {offlineQueueCount} data tersimpan di antrean offline HP Grace
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleManualSync}
            disabled={isSyncingAction}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #FF6F00, #FFA000)',
              color: '#FFF',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: isSyncingAction ? 'not-allowed' : 'pointer',
              opacity: isSyncingAction ? 0.7 : 1,
            }}
          >
            {isSyncingAction ? '⏳ Menyinkronkan...' : '🔄 Kirim ke Sheets'}
          </button>
          <button
            onClick={handleManualPull}
            disabled={isSyncingAction}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.15)',
              color: '#FFF',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '10px',
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isSyncingAction ? 'not-allowed' : 'pointer',
            }}
          >
            📥 Ambil dari Sheets
          </button>
        </div>
      </div>

      <div className="info">
        <b>Minggu ini</b>: {mingguIni.length} aktivitas<br />
        🎮 Bonus: {totalBonus} kali • ⏱️ {totalMenit} menit<br />
        📚 Belajar: {totalBelajar} sesi • 🔢 {totalSoal} soal
        {rata !== null && (
          <>
            <br />
            📈 Rata-rata skor: <b>{rata}</b>
          </>
        )}
      </div>

      <div style={{ marginBottom: '14px' }}>
        {mingguIni.length === 0 ? (
          <div className="info" style={{ textAlign: 'center' }}>
            Belum ada data minggu ini 💖
          </div>
        ) : (
          mingguIni
            .slice()
            .reverse()
            .map((item, idx) => {
              const tgl = item.waktu
                ? new Date(item.waktu).toLocaleString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Baru saja';

              let detail = '';
              if (item.jenis === 'Bonus') detail = `⏱️ +${item.menit || 0} menit`;
              else if (item.jenis === 'Belajar') {
                detail = `📚 ${item.jumlahSoal || 0} soal`;
                if (typeof item.skor === 'number') detail += ` • Skor ${item.skor}`;
              }

              return (
                <div
                  key={item.id || idx}
                  className="opt-item"
                  style={{
                    cursor: 'default',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#FFD54F',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      {item.jenis || 'Aktivitas'}
                    </div>
                    {item.synced ? (
                      <span style={{ fontSize: '11px', color: '#81C784', fontWeight: 700 }} title="Tersimpan di Google Sheets">
                        ☁️ Terkirim
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#FFB74D', fontWeight: 700 }} title="Tersimpan lokal di HP Grace">
                        📱 Lokal
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>
                    {item.nama || item.mapel || 'Kegiatan'}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>{tgl}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{detail}</div>
                </div>
              );
            })
        )}
      </div>

      <button className="btn-p" onClick={handleKirimRekapWA}>
        💬 Kirim Rekap ke Mami
      </button>

      <button className="btn-s" onClick={resetRekap}>
        🧹 Reset Rekap
      </button>

      <button
        className="btn-s back-button-floating"
        onClick={() => {
          suaraKlik();
          go('s-dash');
        }}
      >
        ← Kembali
      </button>

      {/* Modal Pengaturan Google Sheets */}
      {showConfigModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowConfigModal(false)}
        >
          <div
            style={{
              background: '#FFF',
              color: '#333',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '20px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#4A148C' }}>
                ⚙️ Pengaturan Google Sheets
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#666',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#555', marginBottom: '16px', lineHeight: 1.4 }}>
              Integrasikan spreadsheet Google Sheets secara otomatis melalui <b>Google Apps Script Web App</b> dengan token keamanan rahasia.
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#4A148C', marginBottom: '4px' }}>
                GOOGLE APPS SCRIPT WEB APP URL
              </label>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #CE93D8',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                  color: '#333',
                }}
              />
              <span style={{ fontSize: '10px', color: '#777' }}>
                Didapatkan dari menu Deploy &gt; New deployment &gt; Web app di Apps Script.
              </span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#4A148C' }}>
                  TOKEN AUTENTIKASI RAHASIA
                </label>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  style={{ background: 'none', border: 'none', fontSize: '10px', color: '#8E24AA', cursor: 'pointer', fontWeight: 700 }}
                >
                  {showToken ? '🙈 Sembunyikan' : '👁️ Lihat'}
                </button>
              </div>
              <input
                type={showToken ? 'text' : 'password'}
                placeholder="Masukkan token rahasia..."
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #CE93D8',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                  color: '#333',
                }}
              />
              <span style={{ fontSize: '10px', color: '#777' }}>
                Harus sama dengan token di <code>Code.gs</code> atau Script Properties.
              </span>
            </div>

            {testResult && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  marginBottom: '14px',
                  background: testResult.success ? '#E8F5E9' : '#FFEBEE',
                  color: testResult.success ? '#2E7D32' : '#C62828',
                  border: `1px solid ${testResult.success ? '#A5D6A7' : '#FFCDD2'}`,
                  fontWeight: 600,
                }}
              >
                {testResult.success ? '✅ ' : '❌ '}
                {testResult.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConn}
                style={{
                  flex: 1,
                  background: '#F3E5F5',
                  color: '#4A148C',
                  border: '1px solid #CE93D8',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: testingConn ? 'not-allowed' : 'pointer',
                }}
              >
                {testingConn ? '⏳ Menguji...' : '🧪 Uji Koneksi'}
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #8E24AA, #D81B60)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                💾 Simpan
              </button>
            </div>

            <div
              style={{
                background: '#F9F9F9',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '11px',
                color: '#666',
                border: '1px solid #EEE',
                lineHeight: 1.4,
              }}
            >
              <b style={{ color: '#4A148C' }}>📋 Perlindungan Data Spreadsheet: "Progres Belajar Grace"</b><br />
              • Tab A dan B <b>terlindungi penuh</b> (tidak dibaca, diubah, atau disentuh oleh BBM).<br />
              • Tab resmi BBM: <code>BBM_Rekap_Aktivitas</code> &amp; <code>BBM_Status_Grace</code>.<br />
              • Tab uji coba tulis-baca: <code>BBM_Integration_Test</code> (rollback otomatis).<br />
              • Tab tidak dibuat otomatis saat aplikasi berjalan demi menjaga integritas spreadsheet.<br />
              • Pastikan setelan deployment Apps Script <i>Who has access</i> adalah <b>Anyone</b>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
