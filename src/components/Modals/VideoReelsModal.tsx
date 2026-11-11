import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { suaraKlik } from '../../utils/audio';
import { bukaWA, fallbackClipboard } from '../../utils/whatsapp';

let youtubeApiPromise: Promise<any> | null = null;

const loadYouTubeApi = (): Promise<any> => {
  const ytWindow = window as any;
  if (ytWindow.YT?.Player) return Promise.resolve(ytWindow.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = ytWindow.onYouTubeIframeAPIReady;
    ytWindow.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === 'function') previousReady();
      if (ytWindow.YT?.Player) resolve(ytWindow.YT);
      else reject(new Error('Pemutar YouTube tidak berhasil dimuat'));
    };

    let script = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => reject(new Error('Koneksi ke pemutar YouTube gagal'));
      document.head.appendChild(script);
    }
  }).catch((error) => {
    youtubeApiPromise = null;
    throw error;
  });

  return youtubeApiPromise;
};

export const VideoReelsModal: React.FC = () => {
  const { videoModal, closeVideoPlayer, showToast, navigateVideo, currentVideoIndex, videoQueue } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubeMountRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const touchStartY = useRef<number | null>(null);
  const suppressTap = useRef<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showPlayIcon, setShowPlayIcon] = useState<boolean>(false);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [youtubeError, setYoutubeError] = useState<string>('');

  useEffect(() => {
    if (!videoModal.show || !videoModal.isYouTube || !videoModal.youtubeId || !youtubeMountRef.current) return;

    let cancelled = false;
    setYoutubeError('');
    setIsPlaying(true);
    youtubeMountRef.current.innerHTML = '';

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !youtubeMountRef.current) return;
        const target = document.createElement('div');
        target.style.width = '100%';
        target.style.height = '100%';
        youtubeMountRef.current.appendChild(target);

        youtubePlayerRef.current = new YT.Player(target, {
          width: '100%',
          height: '100%',
          videoId: videoModal.youtubeId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            playsinline: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (!cancelled) event.target.playVideo();
            },
            onStateChange: (event: any) => {
              if (!cancelled && YT.PlayerState) {
                setIsPlaying(event.data === YT.PlayerState.PLAYING);
              }
            },
            onError: (event: any) => {
              if (cancelled) return;
              const code = Number(event.data);
              const message = code === 101 || code === 150
                ? 'Video ini tidak mengizinkan pemutaran melalui aplikasi.'
                : code === 100
                  ? 'Video sudah dihapus atau dibuat pribadi oleh pemiliknya.'
                  : code === 2
                    ? 'ID video tidak valid.'
                    : 'Video gagal dimuat. Periksa koneksi lalu coba lagi.';
              setYoutubeError(message);
              setIsPlaying(false);
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setYoutubeError('Pemutar YouTube gagal dimuat. Periksa koneksi internet lalu coba lagi.');
      });

    return () => {
      cancelled = true;
      try { youtubePlayerRef.current?.destroy?.(); } catch { /* abaikan saat modal ditutup */ }
      youtubePlayerRef.current = null;
    };
  }, [videoModal.show, videoModal.isYouTube, videoModal.youtubeId]);

  useEffect(() => {
    if (videoModal.show && videoRef.current && !videoModal.isYouTube) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [videoModal.show, videoModal.isYouTube, videoModal.youtubeId]);

  if (!videoModal.show) return null;

  const togglePlayPause = () => {
    if (videoModal.isYouTube) {
      const player = youtubePlayerRef.current;
      if (!player) return;
      if (isPlaying) player.pauseVideo();
      else player.playVideo();
    } else if (!videoRef.current) return;
    else if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowPlayIcon(true);
    window.setTimeout(() => setShowPlayIcon(false), 600);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
    suppressTap.current = false;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return;
    const deltaY = (event.changedTouches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
    touchStartY.current = null;
    if (Math.abs(deltaY) < 55) return;
    suppressTap.current = true;
    navigateVideo(deltaY < 0 ? 1 : -1);
  };

  const handleSwipeLayerClick = () => {
    if (suppressTap.current) { suppressTap.current = false; return; }
    togglePlayPause();
  };

  const toggleOrientation = () => {
    suaraKlik();
    if (!isLandscape) {
      setIsLandscape(true);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      setIsLandscape(false);
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleMintaOffline = () => {
    suaraKlik();
    const pesan = `Halo Mami, boleh kirimkan file video ini supaya bisa disimpan dan ditonton offline?\nVideo: ${videoModal.title}\nLink: ${videoModal.src}`;
    bukaWA(pesan, showToast);
  };

  const handleShare = () => {
    suaraKlik();
    if (navigator.share) {
      navigator.share({ title: videoModal.title, text: 'Lihat video H2H ini!', url: videoModal.src }).catch(() => {});
    } else {
      fallbackClipboard(videoModal.src, showToast);
    }
  };

  return (
    <div className="ig-reels-modal show" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {videoModal.isYouTube && videoModal.youtubeId ? (
        <div
          ref={youtubeMountRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000', zIndex: 1 }}
        />
      ) : (
        <video
          ref={videoRef}
          src={videoModal.src}
          loop
          playsInline
          autoPlay
          style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
        />
      )}

      {youtubeError && (
        <div style={{
          position: 'absolute', zIndex: 5, inset: '20% 8% auto', padding: '18px',
          borderRadius: '14px', background: 'rgba(20,20,20,.96)', color: '#fff',
          textAlign: 'center', fontSize: '14px', lineHeight: 1.5,
        }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎬</div>
          <strong>Video tidak dapat diputar</strong>
          <div style={{ margin: '8px 0 14px', opacity: .9 }}>{youtubeError}</div>
          <button type="button" onClick={() => {
            setYoutubeError('');
            const id = videoModal.youtubeId;
            if (id) {
              try { youtubePlayerRef.current?.destroy?.(); } catch { /* abaikan */ }
              youtubePlayerRef.current = null;
              const mount = youtubeMountRef.current;
              if (mount) mount.innerHTML = '';
              loadYouTubeApi().then((YT) => {
                if (!mount) return;
                const target = document.createElement('div');
                target.style.width = '100%';
                target.style.height = '100%';
                mount.appendChild(target);
                youtubePlayerRef.current = new YT.Player(target, {
                  width: '100%', height: '100%', videoId: id,
                  playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0, origin: window.location.origin },
                  events: {
                    onError: (event: any) => setYoutubeError(
                      Number(event.data) === 101 || Number(event.data) === 150
                        ? 'Video ini tidak mengizinkan pemutaran melalui aplikasi.'
                        : 'Video tetap tidak bisa dimuat. Coba video berikutnya.'
                    ),
                    onReady: (event: any) => event.target.playVideo(),
                  },
                });
              }).catch(() => setYoutubeError('Pemutar YouTube gagal dimuat. Periksa koneksi internet.'));
            }
          }} style={{ padding: '9px 14px', marginRight: '8px', borderRadius: '8px' }}>
            Coba lagi
          </button>
          <button type="button" onClick={() => navigateVideo(1)} disabled={currentVideoIndex >= videoQueue.length - 1}
            style={{ padding: '9px 14px', borderRadius: '8px' }}>
            Video berikutnya →
          </button>
        </div>
      )}

      {/* Lapisan gesture: usap atas/bawah untuk pindah video, ketuk untuk jeda/putar */}
      <div className="ig-swipe-layer" onClick={handleSwipeLayerClick} />

      <div className="ig-reels-ui">
        <div className="ig-top-bar">
          <button className="ig-btn-close" onClick={() => { suaraKlik(); closeVideoPlayer(); }}>✕</button>
          <button className="ig-btn-close" style={{ width: 'auto', padding: '0 15px', borderRadius: '20px', fontSize: '13px' }}
            onClick={toggleOrientation}>
            {isLandscape ? '↩ Portrait' : '⛶ Miring'}
          </button>
        </div>

        <div className="ig-actions">
          <div className="ig-action-btn" onClick={handleMintaOffline}>
            <span className="ig-icon">📥</span><span className="ig-text">Minta Offline</span>
          </div>
          <div className="ig-action-btn" onClick={handleShare}>
            <span className="ig-icon">🔗</span><span className="ig-text">Bagikan</span>
          </div>
        </div>

        <div className="ig-bottom-info">
          <div className="ig-user">
            @hearts2hearts{' '}
            <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px' }}>H2H</span>
          </div>
          <div className="ig-desc">{videoModal.title}</div>
          <div className="ig-swipe-hint">Usap ↑ video berikutnya · ↓ sebelumnya</div>
        </div>
      </div>

      {videoQueue.length > 1 && (
        <div className="ig-video-position">{currentVideoIndex + 1} / {videoQueue.length}</div>
      )}

      {showPlayIcon && <div className="play-pause-icon">{isPlaying ? '▶' : '⏸'}</div>}
    </div>
  );
};
