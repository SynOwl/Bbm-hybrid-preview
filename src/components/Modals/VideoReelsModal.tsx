import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { suaraKlik } from '../../utils/audio';
import { bukaWA, fallbackClipboard } from '../../utils/whatsapp';

export const VideoReelsModal: React.FC = () => {
  const { videoModal, closeVideoPlayer, showToast, navigateVideo, currentVideoIndex, videoQueue } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const touchStartY = useRef<number | null>(null);
  const suppressTap = useRef<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showPlayIcon, setShowPlayIcon] = useState<boolean>(false);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);

  useEffect(() => {
    if (videoModal.show && videoRef.current && !videoModal.isYouTube) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    if (videoModal.show && videoModal.isYouTube) setIsPlaying(true);
  }, [videoModal.show, videoModal.isYouTube, videoModal.youtubeId]);

  if (!videoModal.show) return null;

  const togglePlayPause = () => {
    if (videoModal.isYouTube) {
      const command = isPlaying ? 'pauseVideo' : 'playVideo';
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), 'https://www.youtube-nocookie.com');
      setIsPlaying(!isPlaying);
    } else if (!videoRef.current) return;
    else if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 600);
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
      navigator
        .share({
          title: videoModal.title,
          text: 'Lihat video H2H ini!',
          url: videoModal.src,
        })
        .catch(() => {});
    } else {
      fallbackClipboard(videoModal.src, showToast);
    }
  };

  return (
    <div className="ig-reels-modal show" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {videoModal.isYouTube && videoModal.youtubeId ? (
        <iframe
          ref={iframeRef}
          key={videoModal.youtubeId}
          title="Pemutar YouTube H2H"
          src={`https://www.youtube-nocookie.com/embed/${videoModal.youtubeId}?autoplay=1&rel=0&enablejsapi=1&playsinline=1&controls=0`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 0,
            background: '#000',
            zIndex: 1,
          }}
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

      {/* Lapisan gesture: usap atas/bawah untuk pindah video, ketuk untuk jeda/putar */}
      <div className="ig-swipe-layer" onClick={handleSwipeLayerClick} />

      {/* Floating UI overlay */}
      <div className="ig-reels-ui">
        {/* Top bar */}
        <div className="ig-top-bar">
          <button
            className="ig-btn-close"
            onClick={() => {
              suaraKlik();
              closeVideoPlayer();
            }}
          >
            ✕
          </button>
          <button
            className="ig-btn-close"
            style={{ width: 'auto', padding: '0 15px', borderRadius: '20px', fontSize: '13px' }}
            onClick={toggleOrientation}
          >
            {isLandscape ? '↩ Portrait' : '⛶ Miring'}
          </button>
        </div>

        {/* Right side action buttons */}
        <div className="ig-actions">
          <div className="ig-action-btn" onClick={handleMintaOffline}>
            <span className="ig-icon">📥</span>
            <span className="ig-text">Minta Offline</span>
          </div>
          <div className="ig-action-btn" onClick={handleShare}>
            <span className="ig-icon">🔗</span>
            <span className="ig-text">Bagikan</span>
          </div>
        </div>

        {/* Bottom user caption */}
        <div className="ig-bottom-info">
          <div className="ig-user">
            @hearts2hearts{' '}
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                opacity: 0.8,
                background: 'rgba(255,255,255,0.2)',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              H2H
            </span>
          </div>
          <div className="ig-desc">{videoModal.title}</div>
          <div className="ig-swipe-hint">Usap ↑ video berikutnya · ↓ sebelumnya</div>
        </div>
      </div>

      {videoQueue.length > 1 && (
        <div className="ig-video-position">{currentVideoIndex + 1} / {videoQueue.length}</div>
      )}

      {showPlayIcon && (
        <div className="play-pause-icon">
          {isPlaying ? '▶' : '⏸'}
        </div>
      )}
    </div>
  );
};
