import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { FISH_ITEMS } from '../../data/constants';
import {
  suaraKail,
  suaraTarik,
  suaraHadiah,
  suaraBenar,
  suaraSalah,
  suaraSeru,
  suaraKlik,
} from '../../utils/audio';

export const MancingGame: React.FC = () => {
  const { go, addSaving, addTodayReward, cekBadge, setRewardModal } = useApp();
  const [gameMode, setGameMode] = useState<'waktu' | 'seru' | null>(null);
  const [phase, setPhase] = useState<'idle' | 'casting' | 'waiting' | 'bite' | 'reeling' | 'done'>('idle');
  const [statusText, setStatusText] = useState<string>('Menunggu ikan...');
  const [showStatus, setShowStatus] = useState<boolean>(false);
  const [reelProgress, setReelProgress] = useState<number>(0);
  const [showReel, setShowReel] = useState<boolean>(false);
  const [isAlert, setIsAlert] = useState<boolean>(false);
  const [bobberPos, setBobberPos] = useState<{ x: number; y: number }>({ x: 60, y: 90 });
  const [isBobberDipping, setIsBobberDipping] = useState<boolean>(false);
  const [isRodCasting, setIsRodCasting] = useState<boolean>(false);
  const [isRodPulling, setIsRodPulling] = useState<boolean>(false);
  const [isSceneShaking, setIsSceneShaking] = useState<boolean>(false);
  const [isScreenFlashing, setIsScreenFlashing] = useState<boolean>(false);
  const [isGoldenRays, setIsGoldenRays] = useState<boolean>(false);

  const sceneRef = useRef<HTMLDivElement>(null);
  const biteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<number>(0);

  // Fish background swimming animation
  const [fishList, setFishList] = useState<Array<{ id: number; emoji: string; x: number; y: number; vx: number; flip: boolean }>>([]);

  useEffect(() => {
    const emojis = ['🐟', '🐠', '🐡', '🦈', '🐙', '🦐'];
    const initial = emojis.map((e, idx) => ({
      id: idx,
      emoji: e,
      x: 30 + Math.random() * 250,
      y: 190 + Math.random() * 120,
      vx: (0.4 + Math.random() * 0.8) * (Math.random() < 0.5 ? 1 : -1),
      flip: false,
    }));
    setFishList(initial);

    const interval = setInterval(() => {
      setFishList((prev) =>
        prev.map((f) => {
          let nx = f.x + f.vx;
          let nvx = f.vx;
          let nflip = f.flip;
          if (nx < 10) {
            nx = 10;
            nvx = Math.abs(nvx);
            nflip = false;
          } else if (nx > 350) {
            nx = 350;
            nvx = -Math.abs(nvx);
            nflip = true;
          }
          return { ...f, x: nx, vx: nvx, flip: nflip };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const resetGame = () => {
    if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);
    if (reelTimeoutRef.current) clearTimeout(reelTimeoutRef.current);
    setPhase('idle');
    setShowStatus(false);
    setShowReel(false);
    setIsAlert(false);
    setIsBobberDipping(false);
    setIsRodCasting(false);
    setIsRodPulling(false);
    setIsSceneShaking(false);
    setIsGoldenRays(false);
    setBobberPos({ x: 60, y: 90 });
  };

  const castLine = () => {
    if (phase !== 'idle' && phase !== 'done') return;
    suaraKail();
    resetGame();
    setPhase('casting');
    setIsRodCasting(true);

    const targetX = 120 + Math.random() * 180;
    const targetY = 220 + Math.random() * 70;

    // Casting flight animation
    let prog = 0;
    const castAnim = setInterval(() => {
      prog += 0.04;
      if (prog >= 1) {
        clearInterval(castAnim);
        setBobberPos({ x: targetX, y: targetY });
        setIsRodCasting(false);
        setPhase('waiting');
        setStatusText('⏳ Menunggu ikan...');
        setShowStatus(true);
        scheduleBite(targetX, targetY);
      } else {
        const cx = 60 + (targetX - 60) * prog;
        const cy = 90 + (targetY - 90) * prog - Math.sin(prog * Math.PI) * 90;
        setBobberPos({ x: cx, y: cy });
      }
    }, 25);
  };

  const scheduleBite = (bx: number, by: number) => {
    const wait = 2000 + Math.random() * 2500;
    biteTimeoutRef.current = setTimeout(() => {
      setPhase('bite');
      setIsBobberDipping(true);
      setIsSceneShaking(true);
      setTimeout(() => setIsSceneShaking(false), 300);
      setIsAlert(true);
      setStatusText('❗ TAP SEKARANG! ❗');
      setShowStatus(true);
      suaraKail();
    }, wait);
  };

  const handleSceneClick = () => {
    if (phase === 'bite') {
      if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);
      setIsAlert(false);
      startReeling();
    } else if (phase === 'reeling') {
      suaraTarik();
      lastTapRef.current = Date.now();
      setReelProgress((prev) => {
        const next = prev + 15;
        if (next >= 100) {
          finishCatch();
          return 100;
        }
        return next;
      });
    }
  };

  const startReeling = () => {
    setPhase('reeling');
    setReelProgress(10);
    lastTapRef.current = Date.now();
    setIsBobberDipping(false);
    setIsRodPulling(true);
    setShowReel(true);
    setStatusText('⚡ TAP CEPAT! ⚡');
    suaraTarik();

    // Reeling timeout if not tapped enough
    reelTimeoutRef.current = setTimeout(() => {
      setPhase('waiting');
      setShowReel(false);
      setIsRodPulling(false);
      setStatusText('😢 Ikan lolos!');
      setTimeout(() => {
        setStatusText('⏳ Menunggu ikan...');
        scheduleBite(bobberPos.x, bobberPos.y);
      }, 1500);
    }, 4500);
  };

  const finishCatch = () => {
    if (reelTimeoutRef.current) clearTimeout(reelTimeoutRef.current);
    setPhase('done');
    setShowReel(false);
    setIsRodPulling(false);
    setShowStatus(false);

    const r = FISH_ITEMS[Math.floor(Math.random() * FISH_ITEMS.length)];
    cekBadge('mancing');

    if (gameMode === 'seru') {
      suaraSeru();
      setRewardModal({
        show: true,
        icon: r.e,
        title: '✨ Tangkapanmu!',
        sub: r.n,
        reward: 'Mode seru-seruan, tidak ada klaim waktu ya 💖',
        onPlayAgain: resetGame,
      });
      return;
    }

    // Waktu mode
    let tier: 'common' | 'good' | 'rare' | 'legendary' = 'common';
    if (r.m === 0) tier = 'common';
    else if (r.m <= 15) tier = 'good';
    else if (r.m <= 25) tier = 'rare';
    else tier = 'legendary';

    if (tier === 'common') {
      suaraSalah();
      setIsSceneShaking(true);
      setTimeout(() => setIsSceneShaking(false), 300);
      setTimeout(() => {
        const rewardStr = r.m > 0 ? `+${r.m} menit!` : 'Belum dapat waktu.';
        if (r.m > 0) {
          addSaving(r.m);
          addTodayReward('mancing', r.m);
        }
        setRewardModal({
          show: true,
          icon: r.e,
          title: r.m === 0 ? '😅 Hanya Sampah...' : '🎣 Dapat Sesuatu!',
          sub: r.n,
          reward: rewardStr,
          onPlayAgain: resetGame,
        });
      }, 500);
    } else if (tier === 'good') {
      suaraBenar();
      setTimeout(() => {
        addSaving(r.m);
        addTodayReward('mancing', r.m);
        setRewardModal({
          show: true,
          icon: r.e,
          title: '🎉 DAPAT IKAN!',
          sub: r.n,
          reward: `+${r.m} menit!`,
          onPlayAgain: resetGame,
        });
      }, 700);
    } else if (tier === 'rare') {
      suaraHadiah();
      setTimeout(() => {
        addSaving(r.m);
        addTodayReward('mancing', r.m);
        setRewardModal({
          show: true,
          icon: r.e,
          title: '💜 LANGKA!',
          sub: r.n,
          reward: `+${r.m} menit!`,
          onPlayAgain: resetGame,
        });
      }, 1000);
    } else {
      suaraHadiah();
      setIsScreenFlashing(true);
      setIsGoldenRays(true);
      setTimeout(() => setIsScreenFlashing(false), 700);
      setTimeout(() => setIsGoldenRays(false), 1500);
      setTimeout(() => {
        addSaving(r.m);
        addTodayReward('mancing', r.m);
        setRewardModal({
          show: true,
          icon: r.e,
          title: '👑 LEGENDARIS!',
          sub: r.n,
          reward: `+${r.m} menit!`,
          onPlayAgain: resetGame,
        });
      }, 1200);
    }
  };

  const handleStartMode = (mode: 'waktu' | 'seru') => {
    suaraKlik();
    setGameMode(mode);
    resetGame();
  };

  return (
    <div className="screen">
      <div className="head">💖 🎣 MEMANCING</div>

      {!gameMode ? (
        <div>
          <div className="info" style={{ textAlign: 'center', fontWeight: 700 }}>
            Pilih mode memancing 🎣
          </div>
          <button className="btn-p" onClick={() => handleStartMode('waktu')}>
            ⏱️ MODE KLAIM WAKTU
          </button>
          <button
            className="btn-p"
            style={{ background: 'linear-gradient(135deg,#AB47BC,#EC407A)' }}
            onClick={() => handleStartMode('seru')}
          >
            ✨ MODE SERU-SERUAN
          </button>
          <button
            className="btn-s"
            onClick={() => {
              suaraKlik();
              go('s-main');
            }}
          >
            ← Kembali
          </button>
        </div>
      ) : (
        <div>
          {isScreenFlashing && <div className="screen-flash" />}

          <div
            ref={sceneRef}
            className={`scene ${isSceneShaking ? 'shake' : ''}`}
            onClick={handleSceneClick}
          >
            <div className="sky">
              <div className="sun">☀️</div>
              <div className="cloud c1">☁️</div>
              <div className="cloud c2">☁️</div>
            </div>

            <div className="water">
              <div className="wave" />
              {fishList.map((f) => (
                <div
                  key={f.id}
                  className="fish"
                  style={{
                    left: `${f.x}px`,
                    top: `${f.y}px`,
                    transform: f.flip ? 'scaleX(-1)' : 'scaleX(1)',
                  }}
                >
                  {f.emoji}
                </div>
              ))}
            </div>

            {isGoldenRays && <div className="golden-rays" />}

            {/* Fishing Rod */}
            <div
              className={`rod ${isRodCasting ? 'casting' : ''} ${isRodPulling ? 'pulling' : ''}`}
            />

            {/* Line */}
            {phase !== 'done' && (
              <div
                className="line"
                style={{
                  left: '110px',
                  top: isRodCasting ? '55px' : isRodPulling ? '135px' : '95px',
                  width: `${Math.max(20, Math.sqrt(Math.pow(bobberPos.x - 110, 2) + Math.pow(bobberPos.y - 95, 2)))}px`,
                  transform: `rotate(${Math.atan2(bobberPos.y - 95, bobberPos.x - 110) * (180 / Math.PI)}deg)`,
                }}
              />
            )}

            {/* Bobber */}
            <div
              className={`bobber ${isBobberDipping ? 'dip' : ''}`}
              style={{
                left: `${bobberPos.x}px`,
                top: `${bobberPos.y}px`,
                display: phase === 'done' ? 'none' : 'block',
              }}
            />

            {/* Bite Alert */}
            {isAlert && (
              <div
                className="alert-mark"
                style={{ left: `${bobberPos.x - 10}px`, top: `${bobberPos.y - 50}px` }}
              >
                ❗
              </div>
            )}

            {/* Status floating badge */}
            {showStatus && <div className="status show">{statusText}</div>}

            {/* Reel gauge */}
            {showReel && (
              <div className="reel-wrap show">
                <div className="reel-bar">
                  <div className="reel-fill" style={{ width: `${reelProgress}%` }} />
                </div>
                <div className="reel-text">⚡ TAP CEPAT! ⚡</div>
              </div>
            )}
          </div>

          <button
            className="btn-p"
            disabled={phase === 'casting' || phase === 'waiting' || phase === 'reeling'}
            onClick={castLine}
          >
            {phase === 'waiting' || phase === 'casting' ? '⏳ Menunggu...' : '🎣 LEMPAR KAIL'}
          </button>

          <button
            className="btn-s"
            onClick={() => {
              suaraKlik();
              setGameMode(null);
              resetGame();
            }}
          >
            ← Kembali
          </button>
        </div>
      )}
    </div>
  );
};
