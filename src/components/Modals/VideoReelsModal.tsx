import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { suaraKlik } from '../../utils/audio';
import { bukaWA, fallbackClipboard } from '../../utils/whatsapp';

export const VideoReelsModal: React.FC = () => {
  const { videoModal, closeVideoPlayer, showToast } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showPlayIcon, setShowPlayIcon] = useState<boolean>(false);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);

  useEffect(() => {
    if (videoModal.show && videoRef.current && !videoModal.isYouTube) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [videoModal.show, videoModal.isYouTube]);

  if (!videoModal.show) return null;

  const togglePlayPause = () => {
    if (videoModal.isYouTube || !videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 600);
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
    <div className="ig-reels-modal show">
      {videoModal.isYouTube && videoModal.youtubeId ? (
        <iframe
          title="Pemutar YouTube H2H"
          src={`https://www.youtube-nocookie.com/embed/${videoModal.youtubeId}?autoplay=1&rel=0&enablejsapi=1&playsinline=1`}
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
          onClick={togglePlayPause}
        />
      )}

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
        </div>
      </div>

      {showPlayIcon && (
        <div className="play-pause-icon">
          {isPlaying ? '▶' : '⏸'}
        </div>
      )}
    </div>
  );
};
