import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WHEEL_SEGMENTS } from '../../data/constants';
import {
  suaraPutar,
  suaraHadiah,
  suaraSalah,
  suaraSeru,
  suaraKlik,
} from '../../utils/audio';

export const RodaGame: React.FC = () => {
  const { go, addSaving, addTodayReward, setRewardModal } = useApp();
  const [gameMode, setGameMode] = useState<'waktu' | 'seru' | null>(null);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [hintText, setHintText] = useState<string>('Tekan PUTAR untuk main!');

  const resetWheel = () => {
    setSpinning(false);
    setRotation(0);
    setHintText('Tekan PUTAR untuk main!');
  };

  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    suaraPutar();
    setHintText('🌀 Roda berputar...');

    const cnt = WHEEL_SEGMENTS.length;
    const segAngle = 360 / cnt;
    const idx = Math.floor(Math.random() * cnt);
    const extra = 360 * 5;
    const target = extra + (360 - idx * segAngle - segAngle / 2);
    const nextRotation = rotation + target;

    setRotation(nextRotation);

    setTimeout(() => {
      const r = WHEEL_SEGMENTS[idx];
      setSpinning(false);
      setHintText(`Hasil: ${r.e} ${r.n}`);

      if (gameMode === 'waktu') {
        if (r.m > 0) {
          suaraHadiah();
          addSaving(r.m);
          addTodayReward('roda', r.m);
        } else {
          suaraSalah();
        }

        setRewardModal({
          show: true,
          icon: r.e,
          title: 'PUTAR RODA',
          sub: r.n,
          reward: r.m > 0 ? `+${r.m} menit!` : 'Belum dapat waktu.',
          onPlayAgain: resetWheel,
        });
      } else {
        suaraSeru();
        setRewardModal({
          show: true,
          icon: r.e,
          title: 'PUTAR RODA',
          sub: r.n,
          reward: 'Mode seru-seruan, tidak ada klaim waktu 💖',
          onPlayAgain: resetWheel,
        });
      }
    }, 4200);
  };

  const handleStartMode = (mode: 'waktu' | 'seru') => {
    suaraKlik();
    setGameMode(mode);
    resetWheel();
  };

  return (
    <div className="screen">
      <div className="head">💖 🎡 PUTAR RODA</div>

      {!gameMode ? (
        <div>
          <div className="info" style={{ textAlign: 'center', fontWeight: 700 }}>
            Pilih mode putar roda 🎡
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
          <div className="wheel-wrap">
            <div className="wheel-container">
              <div className="wheel-pointer">▼</div>
              <div
                className="wheel"
                style={{
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                <div className="wheel-center">🎁</div>
              </div>
            </div>
          </div>

          <div className="info" style={{ textAlign: 'center', fontWeight: 700 }}>
            {hintText}
          </div>

          <button className="btn-p" disabled={spinning} onClick={spinWheel}>
            🎡 PUTAR!
          </button>

          <button
            className="btn-s"
            onClick={() => {
              suaraKlik();
              setGameMode(null);
            }}
          >
            ← Kembali
          </button>
        </div>
      )}
    </div>
  );
};
