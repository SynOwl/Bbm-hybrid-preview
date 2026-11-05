import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  suaraLempar,
  suaraHadiah,
  suaraSalah,
  suaraSeru,
  suaraKlik,
} from '../../utils/audio';

export const SasaranGame: React.FC = () => {
  const { go, addSaving, addTodayReward, setRewardModal } = useApp();
  const [gameMode, setGameMode] = useState<'waktu' | 'seru' | null>(null);
  const [phase, setPhase] = useState<'idle' | 'aiming' | 'power' | 'done'>('idle');
  const [aimPos, setAimPos] = useState<number>(50);
  const [powerVal, setPowerVal] = useState<number>(0);
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [hintText, setHintText] = useState<string>('Tap untuk mulai bidik!');
  const [btnText, setBtnText] = useState<string>('🎯 MULAI BIDIK');

  const aimDirRef = useRef<number>(1);
  const powerDirRef = useRef<number>(1);

  const initTarget = () => {
    setPhase('idle');
    setAimPos(50);
    setPowerVal(0);
    setTargetPos({
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 65,
    });
    setHintText('Tap untuk mulai bidik!');
    setBtnText('🎯 MULAI BIDIK');
  };

  useEffect(() => {
    if (gameMode) initTarget();
  }, [gameMode]);

  // Aiming oscillation loop
  useEffect(() => {
    if (phase !== 'aiming') return;
    const interval = setInterval(() => {
      setAimPos((prev) => {
        let next = prev + 1.8 * aimDirRef.current;
        if (next >= 95 || next <= 5) {
          aimDirRef.current *= -1;
        }
        return next;
      });
    }, 25);
    return () => clearInterval(interval);
  }, [phase]);

  // Power bar oscillation loop
  useEffect(() => {
    if (phase !== 'power') return;
    const interval = setInterval(() => {
      setPowerVal((prev) => {
        let next = prev + 3.2 * powerDirRef.current;
        if (next >= 100 || next <= 0) {
          powerDirRef.current *= -1;
        }
        return next;
      });
    }, 25);
    return () => clearInterval(interval);
  }, [phase]);

  const tapSasaran = () => {
    if (phase === 'idle') {
      suaraLempar();
      setPhase('aiming');
      setHintText('Tap untuk STOP AIM!');
      setBtnText('⏸ STOP AIM');
    } else if (phase === 'aiming') {
      suaraLempar();
      setPhase('power');
      setHintText('Tap CEPAT untuk THROW!');
      setBtnText('🚀 THROW!');
    } else if (phase === 'power') {
      setPhase('done');
      // Calculate score
      const acc = 100 - Math.abs(powerVal - 70);
      const aimDiff = Math.abs(aimPos - targetPos.x);
      const score = Math.max(0, acc - aimDiff * 0.5);

      let reward: { e: string; n: string; m: number };
      if (score >= 85) reward = { e: '🎯', n: 'TEPAT DI TITIK TENGAH!', m: 30 };
      else if (score >= 70) reward = { e: '🔴', n: 'Dekat sekali pusat!', m: 25 };
      else if (score >= 55) reward = { e: '🟡', n: 'Hampir sempurna', m: 20 };
      else if (score >= 40) reward = { e: '🟢', n: 'Masuk lingkaran hijau', m: 15 };
      else if (score >= 25) reward = { e: '🔵', n: 'Masuk lingkaran biru', m: 10 };
      else reward = { e: '❌', n: 'Meleset... coba lagi!', m: 0 };

      setHintText(`Hasil: ${Math.round(score)}% akurasi!`);
      setBtnText('🎯 MULAI BIDIK LAGI');

      if (reward.m > 0) suaraHadiah();
      else suaraSalah();

      if (gameMode === 'waktu') {
        if (reward.m > 0) {
          addSaving(reward.m);
          addTodayReward('sasaran', reward.m);
        }
        setRewardModal({
          show: true,
          icon: reward.e,
          title: 'LEMPAR SASARAN',
          sub: reward.n,
          reward: reward.m > 0 ? `+${reward.m} menit!` : 'Belum dapat waktu.',
          onPlayAgain: initTarget,
        });
      } else {
        suaraSeru();
        setRewardModal({
          show: true,
          icon: reward.e,
          title: 'LEMPAR SASARAN',
          sub: reward.n,
          reward: 'Mode seru-seruan, tidak ada klaim waktu 💖',
          onPlayAgain: initTarget,
        });
      }
    } else {
      initTarget();
    }
  };

  const handleStartMode = (mode: 'waktu' | 'seru') => {
    suaraKlik();
    setGameMode(mode);
  };

  return (
    <div className="screen">
      <div className="head">💖 🎯 LEMPAR SASARAN</div>

      {!gameMode ? (
        <div>
          <div className="info" style={{ textAlign: 'center', fontWeight: 700 }}>
            Pilih mode lempar sasaran 🎯
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
          <div className="target-area">
            {/* Target Dot */}
            <div
              className="target-dot"
              style={{
                left: `${targetPos.x}%`,
                top: `${targetPos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />

            {/* Aim vertical line */}
            <div
              className="aim-line"
              style={{
                left: `${aimPos}%`,
                opacity: phase === 'aiming' || phase === 'power' ? 1 : 0,
              }}
            />

            {/* Aim marker */}
            <div
              className="aim-marker"
              style={{
                left: `${aimPos}%`,
                opacity: phase === 'aiming' || phase === 'power' ? 1 : 0,
              }}
            >
              ▼
            </div>

            {/* Power bar */}
            <div className="power-bar-wrap">
              <div className="power-bar" style={{ width: `${powerVal}%` }} />
            </div>
          </div>

          <div className="info" style={{ textAlign: 'center', fontWeight: 700 }}>
            {hintText}
          </div>

          <button className="btn-p" onClick={tapSasaran}>
            {btnText}
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
