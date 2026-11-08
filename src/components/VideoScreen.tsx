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

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [limit, setLimit] = useState<number>(24);

  type SyncStatus = { status?: string; message?: string; checkedAt?: string | null; completedAt?: string | null; catalogUpdatedAt?: string | null; newVideos?: number; newShorts?: number };
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  // Status dan waktu sinkronisasi berasal dari metadata GitHub, bukan jam HP.
  useEffect(() => {
    let active = true;
    const loadSyncStatus = async () => {
      try {
        const sources = [
          `https://raw.githubusercontent.com/SynOwl/Bbm-hybrid-preview/main/data/h2h-sync-status.json?t=${Date.now()}`,
          `https://cdn.jsdelivr.net/gh/SynOwl/Bbm-hybrid-preview@main/data/h2h-sync-status.json?t=${Date.now()}`,
        ];
        let loaded: SyncStatus | null = null;
        for (const url of sources) {
          try {
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) continue;
            const data = await response.json();
            if (data && typeof data === 'object') { loaded = data; break; }
          } catch { /* coba mirror berikutnya */ }
        }
        if (!loaded) throw new Error('Semua mirror status GitHub belum dapat dibaca');
        if (active) setSyncStatus(loaded);
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

  const handleRefreshClick = async () => {
    suaraKlik();
    try {
      const res = await refreshCatalog(true);
      if (res.status === 'updated') {
        showToast(`🔄 Katalog diperbarui dari ${res.source || 'GitHub'}`);
      } else if (res.status === 'unchanged') {
        if (syncStatus?.status === 'no_changes' && syncStatus.checkedAt) {
          showToast(`ℹ️ YouTube terakhir diperiksa ${formatWaktuWIB(new Date(syncStatus.checkedAt))}; belum ada update baru. Video: ${syncStatus.newVideos ?? 0}, Shorts: ${syncStatus.newShorts ?? 0}.`);
        } else {
          showToast('✅ Katalog sudah versi paling baru');
        }
      } else {
        showToast(`⚠️ ${res.message || 'GitHub belum bisa dijangkau. Cache HP tetap digunakan.'}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kesalahan tidak diketahui';
      showToast(`⚠️ Pengambilan katalog gagal: ${message}`);
    }
  };

  // Video biasa dan Shorts ditampilkan dalam satu feed, tanpa duplikasi, terbaru lebih dulu.
  const currentList = Array.from(
    new Map([...catalogVideos, ...catalogShorts].map((item) => [item.id, item])).values()
  ).sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
  const filteredList = currentList.filter((item) =>
    searchQuery.trim() ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const displayedList = filteredList.slice(0, limit);

  const handlePlayYouTube = (item: YouTubeArchiveItem) => {
    suaraKlik();
    const index = filteredList.findIndex((video) => video.id === item.id);
    openVideoPlayer(
      `https://www.youtube.com/watch?v=${item.id}`,
      item.title,
      true,
      item.id,
      filteredList,
      index
    );
  };

  const now = new Date();
  const cutoff = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

  return (
    <div className="screen">
      <div className="head">🎬 Galeri Video H2H</div>
      <div className="info">
        Semua video resmi Hearts2Hearts, termasuk Shorts dan MV, ada dalam satu daftar dan diurutkan dari yang paling baru 💖
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
              {catalogRefreshing ? '📲 Perangkat ini sedang mengambil katalog GitHub...' : statusLabel}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '3px' }}>
              🛰️ {syncStatus?.checkedAt ? `YouTube diperiksa ${formatWaktuWIB(new Date(syncStatus.checkedAt))}` : 'Pemeriksaan YouTube belum tersedia'}{syncStatus?.status === 'no_changes' ? ' — belum ada update terbaru' : ''}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>
              📊 Hasil pemeriksaan: {`Video baru ${syncStatus?.newVideos ?? '—'} · Shorts baru ${syncStatus?.newShorts ?? '—'}`}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>
              ☁️ Sinkronisasi GitHub selesai: {syncStatus?.completedAt ? formatWaktuWIB(new Date(syncStatus.completedAt)) : 'Belum tersedia'}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>
              📲 Versi katalog yang dimuat perangkat ini: {catalogStats?.updatedAt ? formatWaktuWIB(new Date(catalogStats.updatedAt)) : 'Belum ada katalog'} ({catalogStats?.isLiveGitHub ? 'sumber GitHub' : 'cache / mirror cadangan'})
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



        {/* Kolom Pencarian */}
        <input
          className="yt-search"
          type="search"
          placeholder="Cari judul video atau Shorts..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setLimit(24);
          }}
        />

        <div className="yt-archive-count">
          Menampilkan {Math.min(displayedList.length, filteredList.length)} dari {filteredList.length}{' '}
          video dan Shorts aktif (31 hari terakhir)
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
        className="btn-s back-button-floating"
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
