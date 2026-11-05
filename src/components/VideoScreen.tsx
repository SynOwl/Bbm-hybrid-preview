import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { YouTubeArchiveItem } from '../types';
import { suaraKlik } from '../utils/audio';

export const VideoScreen: React.FC = () => {
  const {
    go,
    openVideoPlayer,
    showToast,
    catalogVideos,
    catalogShorts,
    catalogStats,
    catalogLoading,
    catalogRefreshing,
    refreshCatalog,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<'videos' | 'shorts'>('shorts');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [limit, setLimit] = useState<number>(24);

  type SyncStatus = { status?: string; message?: string; checkedAt?: string | null; completedAt?: string | null; catalogUpdatedAt?: string | null; newVideos?: number; newShorts?: number };
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  // Status dan waktu sinkronisasi berasal dari metadata GitHub, bukan jam HP.
  useEffect(() => {
    let active = true;
    const loadSyncStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/h2h-sync-status.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (active && data && typeof data === 'object') setSyncStatus(data);
      } catch (error) {
        console.warn('Status sinkronisasi GitHub belum dapat dibaca:', error);
      }
    };
    loadSyncStatus();
    const timer = window.setInterval(loadSyncStatus, 5 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const statusLabel = syncStatus?.status === 'updated'
    ? '✅ Katalog GitHub diperbarui'
    : syncStatus?.status === 'no_changes'
      ? 'ℹ️ Belum ada update baru di YouTube'
      : syncStatus?.status === 'failed'
        ? '⚠️ Sinkronisasi YouTube gagal'
        : '⏳ Menunggu pemeriksaan GitHub pertama';

  // Semua waktu status ditampilkan eksplisit dalam zona waktu WIB.
  const formatWaktuWIB = (date: Date): string =>
    date.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) + ' WIB';

  // Format tanggal dalam bahasa Indonesia
  const formatTanggal = (date: Date): string => {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleRefreshClick = () => {
    suaraKlik();
    refreshCatalog(true).then((res) => {
      if (res.status === 'updated') {
        showToast(`🔄 Katalog diperbarui dari ${res.source || 'GitHub'}`);
      } else if (res.status === 'unchanged') {
        showToast('✅ Katalog sudah versi paling baru');
      } else {
        showToast('⚠️ Gagal terhubung ke mirror (menggunakan cache HP)');
      }
    });
  };

  const currentList = activeCategory === 'videos' ? catalogVideos : catalogShorts;
  const filteredList = currentList.filter((item) =>
    searchQuery.trim() ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const displayedList = filteredList.slice(0, limit);

  const handlePlayYouTube = (item: YouTubeArchiveItem) => {
    suaraKlik();
    openVideoPlayer(
      `https://www.youtube.com/watch?v=${item.id}`,
      item.title,
      true,
      item.id
    );
  };

  const now = new Date();
  const cutoff = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

  const hasId1InScreen = catalogShorts.some((s) => s.id === 'KLUCXIGvx0c');
  const hasId2InScreen = catalogShorts.some((s) => s.id === 'nl-YbxNFlGk');

  if (typeof window !== 'undefined') {
    console.log('6. VideoScreen catalogShorts diterima:', {
      totalShorts: catalogShorts.length,
      hasKLUCXIGvx0c: hasId1InScreen,
      hasNlYbxNFlGk: hasId2InScreen,
    });
  }

  return (
    <div className="screen">
      <div className="head">🎬 Galeri Video & Shorts H2H</div>
      <div className="info">
        Koleksi video dan Shorts resmi kanal Hearts2Hearts langsung dari arsip GitHub terbaru.
        Konten otomatis diurutkan dari yang paling baru 💖
      </div>

      <section style={{ margin: '14px 0' }}>
        {/* Header Seksi & Kontrol Refresh */}
        <div className="yt-refresh-box">
          <div style={{ flex: '1 1 auto', minWidth: '180px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFF' }}>
              📡 Sumber:{' '}
              <span style={{ color: catalogStats?.isLiveGitHub ? '#A7FFEB' : '#FFE082' }}>
                {catalogStats?.sourceFile || 'Memuat...'}
              </span>
            </div>
            <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
              Jendela 31 hari: {formatTanggal(cutoff)} – {formatTanggal(now)}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.95, marginTop: '5px', fontWeight: 700 }}>
              {statusLabel}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '3px' }}>
              🛰️ Pemeriksaan YouTube (server): {syncStatus?.checkedAt ? formatWaktuWIB(new Date(syncStatus.checkedAt)) : 'Belum tersedia'}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>
              ☁️ Sinkronisasi GitHub selesai: {syncStatus?.completedAt ? formatWaktuWIB(new Date(syncStatus.completedAt)) : 'Belum tersedia'}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>
              📲 Versi katalog yang dimuat aplikasi: {catalogStats?.updatedAt ? formatWaktuWIB(new Date(catalogStats.updatedAt)) : 'Belum ada katalog'}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>
              {syncStatus?.message || 'Menunggu status sinkronisasi dari GitHub.'}
            </div>
          </div>
          <button
            type="button"
            className="yt-refresh-btn"
            onClick={handleRefreshClick}
            disabled={catalogRefreshing || catalogLoading}
          >
            {catalogRefreshing ? '⏳ Memeriksa GitHub...' : '🔄 Ambil Katalog GitHub'}
          </button>
        </div>

        {/* Panel Diagnostik Sementara Sisi Browser (Dapat dibuka langsung di Preview) */}
        <details style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', margin: '10px 0', fontSize: '11px', color: '#cbd5e1', textAlign: 'left', lineHeight: '1.5' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 800, color: '#38bdf8' }}>
            🔬 Panel Diagnostik Browser (Klik untuk Buka Hasil Uji Nyata)
          </summary>
          <div style={{ marginTop: '8px', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>📊 Status Layar VideoScreen:</div>
            <div>• Total catalogShorts di state: <strong>{catalogShorts.length}</strong></div>
            <div>• ID 1 (<code>KLUCXIGvx0c</code> - summer daydream): <strong style={{ color: hasId1InScreen ? '#4ade80' : '#f87171' }}>{hasId1InScreen ? '✅ DITERIMA DI SCREEN' : '❌ TIDAK ADA'}</strong></div>
            <div>• ID 2 (<code>nl-YbxNFlGk</code> - whatsinmydrafts): <strong style={{ color: hasId2InScreen ? '#4ade80' : '#f87171' }}>{hasId2InScreen ? '✅ DITERIMA DI SCREEN' : '❌ TIDAK ADA'}</strong></div>

            <div style={{ fontWeight: 700, color: '#f1f5f9', marginTop: '8px', marginBottom: '4px' }}>💾 LocalStorage Browser Aktual:</div>
            <div>• Kunci: <code>bbm_cached_h2h_archive_v4</code></div>
            <div>• Status: {typeof localStorage !== 'undefined' && localStorage.getItem('bbm_cached_h2h_archive_v4') ? (
              (() => {
                try {
                  const c = JSON.parse(localStorage.getItem('bbm_cached_h2h_archive_v4') || '{}');
                  const has1 = Array.isArray(c.shorts) && c.shorts.some((s: any) => s.id === 'KLUCXIGvx0c');
                  const has2 = Array.isArray(c.shorts) && c.shorts.some((s: any) => s.id === 'nl-YbxNFlGk');
                  return (
                    <span style={{ color: '#e2e8f0' }}>
                      Ada (updatedAt: <strong>{c.updatedAt}</strong>, Videos: {c.videos?.length || 0}, Shorts: {c.shorts?.length || 0}, ID 1: {has1 ? '✅ Ada' : '❌ Belum Ada'}, ID 2: {has2 ? '✅ Ada' : '❌ Belum Ada'})
                    </span>
                  );
                } catch {
                  return <span style={{ color: '#f87171' }}>Format JSON korup</span>;
                }
              })()
            ) : (
              <span style={{ color: '#94a3b8' }}>Kosong / Belum tersimpan</span>
            )}</div>

            <div style={{ fontWeight: 700, color: '#f1f5f9', marginTop: '8px', marginBottom: '4px' }}>🌐 Objek window.__BBM_DIAGNOSTICS__:</div>
            <div>Detail mirror dan durasi lengkap tersedia di DevTools Console (<code>window.__BBM_DIAGNOSTICS__</code>).</div>
          </div>
        </details>

        {/* Tab Kategori Shorts vs Video (Shorts dibuka default agar langsung terlihat update terbaru) */}
        <div className="yt-tabs" role="tablist">
          <button
            type="button"
            className={`yt-tab ${activeCategory === 'shorts' ? 'active' : ''}`}
            onClick={() => {
              suaraKlik();
              setActiveCategory('shorts');
              setLimit(24);
            }}
          >
            📱 Shorts ({catalogShorts.length})
          </button>
          <button
            type="button"
            className={`yt-tab ${activeCategory === 'videos' ? 'active' : ''}`}
            onClick={() => {
              suaraKlik();
              setActiveCategory('videos');
              setLimit(24);
            }}
          >
            🎬 Video ({catalogVideos.length})
          </button>
        </div>

        {/* Kolom Pencarian */}
        <input
          className="yt-search"
          type="search"
          placeholder={`Cari judul ${activeCategory === 'shorts' ? 'Shorts' : 'video'}...`}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setLimit(24);
          }}
        />

        <div className="yt-archive-count">
          Menampilkan {Math.min(displayedList.length, filteredList.length)} dari {filteredList.length}{' '}
          {activeCategory === 'shorts' ? 'Shorts' : 'video'} aktif (31 hari terakhir)
        </div>

        {catalogLoading ? (
          <div className="info" style={{ textAlign: 'center', padding: '24px 0' }}>
            ⏳ Memuat katalog dari mirror terbaru...
          </div>
        ) : displayedList.length === 0 ? (
          <div className="info" style={{ textAlign: 'center', padding: '24px 0' }}>
            Tidak ada konten yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="yt-grid">
            {displayedList.map((item) => (
              <button
                key={item.id}
                type="button"
                className="yt-card"
                onClick={() => handlePlayYouTube(item)}
              >
                <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                  <img
                    className="yt-thumbnail"
                    src={item.thumbnail}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`;
                    }}
                  />
                  <span className="yt-play-icon">▶</span>
                </div>

                <span className="yt-title-overlay">{item.title}</span>

                <div className="yt-card-meta">
                  <span className="yt-card-date">
                    📅 {formatTanggal(item.published)}
                  </span>
                  <span className="yt-source-tag">YouTube</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {filteredList.length > limit && (
          <button
            type="button"
            className="btn-s"
            style={{ marginTop: '16px' }}
            onClick={() => setLimit((prev) => prev + 24)}
          >
            Muat Lainnya ({filteredList.length - limit} tersisa)
          </button>
        )}
      </section>

      {/* Navigasi Kembali */}
      <button
        className="btn-s"
        onClick={() => {
          suaraKlik();
          go('s-dash');
        }}
      >
        ← Kembali ke Dashboard
      </button>
    </div>
  );
};
