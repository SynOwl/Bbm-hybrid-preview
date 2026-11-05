import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  sBebek,
  sEmas,
  sZonk,
  sHabis,
  suaraKlik,
  suaraHadiah,
} from '../../utils/audio';

interface DuckItem {
  id: number;
  x: number;
  y: number;
  type: 'normal' | 'emas' | 'zonk';
  icon: string;
  born: number;
  ttl: number;
}

const BEBEK_ZONK = ['💣', '🗑️', '🐍', '🦂', '👻', '💀', '🐊', '🕷️'];

export const TangkapBebekGame: React.FC = () => {
  const { go, addSaving, addTodayReward, cekBadge, setRewardModal } = useApp();
  const [gameMode, setGameMode] = useState<'waktu' | 'seru' | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [waktu, setWaktu] = useState<number>(30);
  const [skor, setSkor] = useState<number>(0);
  const [emas, setEmas] = useState<number>(0);
  const [zonk, setZonk] = useState<number>(0);
  const [totalBebek, setTotalBebek] = useState<number>(0);
  const [ducks, setDucks] = useState<DuckItem[]>([]);
  const [floatingPops, setFloatingPops] = useState<Array<{ id: number; text: string; x: number; y: number; cls: string }>>([]);
  const [isScreenFlashing, setIsScreenFlashing] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duckIdCounter = useRef<number>(1);
  const popIdCounter = useRef<number>(1);

  const resetBebek = () => {
    setIsPlaying(false);
    setWaktu(30);
    setSkor(0);
    setEmas(0);
    setZonk(0);
    setTotalBebek(0);
    setDucks([]);
    setFloatingPops([]);
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnerRef.current) clearInterval(spawnerRef.current);
  };

  const spawnDuck = () => {
    const roll = Math.random();
    let type: 'normal' | 'emas' | 'zonk' = 'normal';
    let icon = '🦆';
    let ttl = 2200;

    if (roll < 0.15) {
      type = 'emas';
      icon = '👑';
      ttl = 1500;
    } else if (roll < 0.35) {
      type = 'zonk';
      icon = BEBEK_ZONK[Math.floor(Math.random() * BEBEK_ZONK.length)];
      ttl = 1800;
    }

    const x = Math.random() * 260 + 10;
    const y = Math.random() * 220 + 40;

    const newDuck: DuckItem = {
      id: duckIdCounter.current++,
      x,
      y,
      type,
      icon,
      born: Date.now(),
      ttl,
    };

    setDucks((prev) => [...prev, newDuck]);
  };

  const handleStartGame = () => {
    resetBebek();
    setIsPlaying(true);
    suaraKlik();

    // Initial ducks
    setTimeout(spawnDuck, 100);
    setTimeout(spawnDuck, 400);
    setTimeout(spawnDuck, 700);

    // Spawner
    spawnerRef.current = setInterval(() => {
      spawnDuck();
    }, 900);

    // Timer
    timerRef.current = setInterval(() => {
      setWaktu((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Check expiring ducks
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setDucks((prev) => prev.filter((d) => now - d.born <= d.ttl));
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const tapDuck = (duck: DuckItem) => {
    if (!isPlaying) return;
    setDucks((prev) => prev.filter((d) => d.id !== duck.id));
    setTotalBebek((prev) => prev + 1);

    if (duck.type === 'emas') {
      sEmas();
      setIsScreenFlashing(true);
      setTimeout(() => setIsScreenFlashing(false), 500);
      setSkor((prev) => prev + 3);
      setEmas((prev) => prev + 1);
      addPop('+3 👑', duck.x, duck.y, 'emas');
    } else if (duck.type === 'zonk') {
      sZonk();
      setSkor((prev) => Math.max(0, prev - 2));
      setZonk((prev) => prev + 1);
      addPop('-2 💥', duck.x, duck.y, 'zonk');
    } else {
      sBebek();
      setSkor((prev) => prev + 1);
      addPop('+1', duck.x, duck.y, '');
    }
  };

  const addPop = (text: string, x: number, y: number, cls: string) => {
    const id = popIdCounter.current++;
    setFloatingPops((prev) => [...prev, { id, text, x, y, cls }]);
    setTimeout(() => {
      setFloatingPops((prev) => prev.filter((p) => p.id !== id));
    }, 900);
  };

  const endGame = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnerRef.current) clearInterval(spawnerRef.current);
    setDucks([]);
    sHabis();

    setSkor((finalSkor) => {
      if (finalSkor >= 15) cekBadge('bebek');

      let rewardMinutes = 0;
      if (finalSkor >= 25) rewardMinutes = 30;
      else if (finalSkor >= 15) rewardMinutes = 20;
      else if (finalSkor >= 8) rewardMinutes = 10;
      else rewardMinutes = 5;

      let pesan = '💪 Semangat! Coba lagi ya!';
      if (finalSkor >= 25) pesan = '🏆 LUAR BIASA! Kamu jagonya!';
      else if (finalSkor >= 15) pesan = '🎉 Hebat! Tangkapanmu banyak!';
      else if (finalSkor >= 8) pesan = '😊 Bagus! Terus berlatih!';

      if (gameMode === 'waktu') {
        suaraHadiah();
        addSaving(rewardMinutes);
        addTodayReward('bebek', rewardMinutes);
        setRewardModal({
          show: true,
          icon: '🦆',
          title: 'TANGKAP BEBEK',
          sub: `${pesan} (Skor: ${finalSkor})`,
          reward: `+${rewardMinutes} menit masuk tabungan! 💖`,
          onPlayAgain: handleStartGame,
        });
      } else {
        setRewardModal({
          show: true,
          icon: '🦆',
          title: 'TANGKAP BEBEK',
          sub: `${pesan} (Skor: ${finalSkor})`,
          reward: 'Mode seru-seruan, tidak ada klaim waktu 💖',
          onPlayAgain: handleStartGame,
        });
      }

      return finalSkor;
    });
  };

  const handleStartMode = (mode: 'waktu' | 'seru') => {
    suaraKlik();
    setGameMode(mode);
    resetBebek();
  };

  return (
    <div className="screen">
      <div className="head">💖 🦆 TANGKAP BEBEK</div>

      {!gameMode ? (
        <div>
          <div className="info" style={{ textAlign: 'center', fontWeight: 700 }}>
            Pilih mode tangkap bebek 🦆
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
            className="info"
            style={{ textAlign: 'center', fontWeight: 700, fontSize: '12.5px' }}
          >
            Tap bebek 🦆 secepat mungkin!<br />
            Bebek emas 👑 = skor 3x lipat! · Waktu 30 detik
          </div>

          <div className="bebek-stat">
            <div>
              ⏱️ Waktu<span className="angka">{waktu}</span>
            </div>
            <div>
              🎯 Skor<span className="angka">{skor}</span>
            </div>
            <div>
              👑 Emas<span className="angka">{emas}</span>
            </div>
          </div>

          <div className="arena-bebek" style={{ position: 'relative' }}>
            <div className="air-atas" />

            {/* Ducks */}
            {ducks.map((d) => (
              <div
                key={d.id}
                className={`bebek ${d.type === 'emas' ? 'emas' : ''} ${d.type === 'zonk' ? 'zonk' : ''}`}
                style={{ left: `${d.x}px`, top: `${d.y}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  tapDuck(d);
                }}
              >
                {d.icon}
              </div>
            ))}

            {/* Floating popups (+1, +3, -2) */}
            {floatingPops.map((pop) => (
              <div
                key={pop.id}
                className={`bebek-pop ${pop.cls}`}
                style={{ left: `${pop.x}px`, top: `${pop.y}px` }}
              >
                {pop.text}
              </div>
            ))}
          </div>

          <button className="btn-p" disabled={isPlaying} onClick={handleStartGame}>
            {isPlaying ? '🦆 MENANGKAP...' : '🦆 MULAI TANGKAP'}
          </button>

          <button
            className="btn-s"
            onClick={() => {
              suaraKlik();
              resetBebek();
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
