import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BOX_ITEMS } from '../../data/constants';
import {
  suaraTap,
  suaraHadiah,
  suaraSalah,
  suaraSeru,
  suaraKlik,
} from '../../utils/audio';

export const KotakGame: React.FC = () => {
  const { go, addSaving, addTodayReward, setRewardModal } = useApp();
  const [gameMode, setGameMode] = useState<'waktu' | 'seru' | null>(null);
  const [shakingIdx, setShakingIdx] = useState<number | null>(null);
  const [openedIdx, setOpenedIdx] = useState<number | null>(null);
  const [opened, setOpened] = useState<boolean>(false);

  const resetBoxes = () => {
    setShakingIdx(null);
    setOpenedIdx(null);
    setOpened(false);
  };

  const handleBoxClick = (index: number) => {
    if (opened) return;
    setOpened(true);
    suaraTap();
    setShakingIdx(index);

    setTimeout(() => {
      setShakingIdx(null);
      setOpenedIdx(index);

      setTimeout(() => {
        const r = BOX_ITEMS[Math.floor(Math.random() * BOX_ITEMS.length)];

        if (gameMode === 'waktu') {
          if (r.m > 0) {
            suaraHadiah();
            addSaving(r.m);
            addTodayReward('kotak', r.m);
          } else {
            suaraSalah();
          }

          setRewardModal({
            show: true,
            icon: r.e,
            title: 'BUKA KOTAK',
            sub: r.n,
            reward: r.m > 0 ? `+${r.m} menit!` : 'Belum dapat waktu.',
            onPlayAgain: resetBoxes,
          });
        } else {
          suaraSeru();
          setRewardModal({
            show: true,
            icon: r.e,
            title: 'BUKA KOTAK',
            sub: r.n,
            reward: 'Mode seru-seruan, tidak ada klaim waktu 💖',
            onPlayAgain: resetBoxes,
          });
        }
      }, 500);
    }, 700);
  };

  const handleStartMode = (mode: 'waktu' | 'seru') => {
    suaraKlik();
    setGameMode(mode);
    resetBoxes();
  };

  return (
    <div className="screen">
      <div className="head">💖 🎁 BUKA KOTAK</div>

      {!gameMode ? (
        <div>
          <div className="info" style={{ textAlign: 'center', fontWeight: 700 }}>
            Pilih mode buka kotak 🎁
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
          <div className="info" style={{ textAlign: 'center', fontWeight: 700 }}>
            Pilih 1 kotak — ada hadiah di dalamnya!
          </div>

          <div className="box-grid">
            {Array.from({ length: 9 }).map((_, i) => {
              const isShaking = shakingIdx === i;
              const isOpened = openedIdx === i;

              return (
                <div
                  key={i}
                  className={`gift-box ${isShaking ? 'shaking' : ''} ${isOpened ? 'opened' : ''}`}
                  onClick={() => handleBoxClick(i)}
                >
                  {isOpened ? '✨' : '🎁'}
                </div>
              );
            })}
          </div>

          <button
            className="btn-s"
            style={{ marginTop: '16px' }}
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
