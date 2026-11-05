import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { POLA_DATA, KATA_DATA, TEKA_DATA } from '../../data/constants';
import {
  suaraTap,
  suaraBenar,
  suaraSalah,
  suaraHadiah,
  suaraSeru,
  suaraUlang,
  mainkanNada,
} from '../../utils/audio';

interface QuizGameModalProps {
  gameType: 'hitung' | 'pola' | 'angka' | 'urutan' | 'kata' | 'teka' | null;
  onClose: () => void;
}

export const QuizGameModal: React.FC<QuizGameModalProps> = ({ gameType, onClose }) => {
  const { addSaving, addTodayReward, cekBadge, catatRekap, showToast } = useApp();

  const [mode, setMode] = useState<'waktu' | 'seru' | null>(null);

  // Common result state
  const [result, setResult] = useState<{
    show: boolean;
    success: boolean;
    message: string;
    menit: number;
  }>({ show: false, success: false, message: '', menit: 0 });

  // 1. Hitung Cepat state
  const [hitungSoal, setHitungSoal] = useState<string>('');
  const [hitungOptions, setHitungOptions] = useState<number[]>([]);
  const [hitungJawab, setHitungJawab] = useState<number>(0);

  // 2. Tebak Pola state
  const [polaSoal, setPolaSoal] = useState<string>('');
  const [polaOptions, setPolaOptions] = useState<number[]>([]);
  const [polaJawab, setPolaJawab] = useState<number>(0);

  // 3. Tebak Angka state
  const [angkaTarget, setAngkaTarget] = useState<number>(0);
  const [angkaCoba, setAngkaCoba] = useState<number>(0);
  const [angkaInput, setAngkaInput] = useState<string>('');
  const [angkaHint, setAngkaHint] = useState<string>('Masukkan tebakanmu');

  // 4. Ingat Urutan state
  const [urutanLevel, setUrutanLevel] = useState<number>(1);
  const [urutanTarget, setUrutanTarget] = useState<string[]>([]);
  const [urutanInput, setUrutanInput] = useState<string[]>([]);
  const [urutanFase, setUrutanFase] = useState<'ingat' | 'tebak' | 'berhasil'>('ingat');
  const emojisPool = ['🍓', '🎀', '🌻', '🍀', '⭐', '💖', '🌸', '🦋'];

  // 5. Susun Kata state
  const [kataAcak, setKataAcak] = useState<string>('');
  const [kataOptions, setKataOptions] = useState<string[]>([]);
  const [kataJawab, setKataJawab] = useState<string>('');

  // 6. Teka-Teki state
  const [tekaSoal, setTekaSoal] = useState<string>('');
  const [tekaOptions, setTekaOptions] = useState<string[]>([]);
  const [tekaJawab, setTekaJawab] = useState<string>('');

  // Initializer for chosen game
  const initGame = (t: string) => {
    setResult({ show: false, success: false, message: '', menit: 0 });
    suaraUlang();

    if (t === 'hitung') {
      const tipe = Math.floor(Math.random() * 6);
      let a = 0;
      let b = 0;
      let j = 0;
      let s = '';

      if (tipe === 0) {
        a = Math.floor(Math.random() * 40) + 10;
        b = Math.floor(Math.random() * 30) + 5;
        j = a + b;
        s = `${a} + ${b} = ?`;
      } else if (tipe === 1) {
        a = Math.floor(Math.random() * 50) + 30;
        b = Math.floor(Math.random() * 25) + 5;
        j = a - b;
        s = `${a} − ${b} = ?`;
      } else if (tipe === 2) {
        a = Math.floor(Math.random() * 8) + 2;
        b = Math.floor(Math.random() * 8) + 2;
        j = a * b;
        s = `${a} × ${b} = ?`;
      } else if (tipe === 3) {
        b = Math.floor(Math.random() * 8) + 2;
        j = Math.floor(Math.random() * 8) + 2;
        a = b * j;
        s = `${a} ÷ ${b} = ?`;
      } else if (tipe === 4) {
        a = (Math.floor(Math.random() * 15) + 5) * 100;
        b = (Math.floor(Math.random() * 10) + 2) * 100;
        j = a + b;
        s = `${a} + ${b} = ?`;
      } else {
        a = Math.floor(Math.random() * 6) + 2;
        b = Math.floor(Math.random() * 6) + 2;
        const c = Math.floor(Math.random() * 15) + 5;
        j = a * b + c;
        s = `${a} × ${b} + ${c} = ?`;
      }

      const opts = [j];
      while (opts.length < 4) {
        const d = Math.floor(Math.random() * 20) - 10;
        const n = j + d;
        if (n > 0 && n !== j && !opts.includes(n)) opts.push(n);
      }
      opts.sort(() => Math.random() - 0.5);

      setHitungSoal(s);
      setHitungJawab(j);
      setHitungOptions(opts);
    } else if (t === 'pola') {
      const p = POLA_DATA[Math.floor(Math.random() * POLA_DATA.length)];
      setPolaSoal(p.d.join(', ') + ', ?');
      setPolaJawab(p.j);
      const opts = [...p.o].sort(() => Math.random() - 0.5);
      setPolaOptions(opts);
    } else if (t === 'angka') {
      const tgt = Math.floor(Math.random() * 50) + 1;
      setAngkaTarget(tgt);
      setAngkaCoba(0);
      setAngkaInput('');
      setAngkaHint('Masukkan tebakanmu');
    } else if (t === 'urutan') {
      startUrutan(1);
    } else if (t === 'kata') {
      const k = KATA_DATA[Math.floor(Math.random() * KATA_DATA.length)];
      const scrambled = k.k
        .split('')
        .sort(() => Math.random() - 0.5)
        .join(' ');
      setKataAcak(scrambled);
      setKataJawab(k.k);
      setKataOptions([...k.o].sort(() => Math.random() - 0.5));
    } else if (t === 'teka') {
      const tk = TEKA_DATA[Math.floor(Math.random() * TEKA_DATA.length)];
      setTekaSoal(tk.t);
      setTekaJawab(tk.j);
      setTekaOptions([...tk.o].sort(() => Math.random() - 0.5));
    }
  };

  const startUrutan = (level: number) => {
    setUrutanLevel(level);
    const jml = Math.min(8, 2 + level);
    const seq: string[] = [];
    for (let i = 0; i < jml; i++) {
      seq.push(emojisPool[Math.floor(Math.random() * emojisPool.length)]);
    }
    setUrutanTarget(seq);
    setUrutanInput([]);
    setUrutanFase('ingat');

    setTimeout(() => {
      setUrutanFase('tebak');
    }, 3000);
  };

  useEffect(() => {
    if (gameType && mode) {
      initGame(gameType);
    }
  }, [gameType, mode]);

  if (!gameType) return null;

  const handleFinish = (success: boolean, menit: number, msg: string) => {
    if (success) {
      if (mode === 'waktu') {
        suaraHadiah();
        addSaving(menit);
        addTodayReward(gameType, menit);
        catatRekap({ jenis: 'Bonus', nama: gameType, menit });
      } else {
        suaraSeru();
      }
    } else {
      suaraSalah();
    }

    setResult({
      show: true,
      success,
      message: msg,
      menit: mode === 'waktu' ? menit : 0,
    });
  };

  // Titles
  const titles: Record<string, string> = {
    hitung: '🔢 Hitung Cepat',
    pola: '🧠 Tebak Pola',
    angka: '🎯 Tebak Angka',
    urutan: '🧩 Ingat Urutan',
    kata: '🔤 Susun Kata',
    teka: '📖 Teka-Teki',
  };

  return (
    <div className="modal-overlay show">
      <div className="modal-card" style={{ maxWidth: '380px' }}>
        <div style={{ fontSize: '17px', fontWeight: 900, color: '#EC407A', marginBottom: '8px' }}>
          {titles[gameType] || '🎮 Game'}
        </div>

        {/* Mode Selector */}
        {!mode ? (
          <div>
            <div className="gm-info">
              Pilih mode permainan 💖<br />
              <span style={{ fontSize: '11px', opacity: 0.85 }}>
                Klaim Waktu dapat hadiah menit · Seru-seruan hanya untuk senang-senang
              </span>
            </div>
            <button
              className="modal-btn"
              style={{
                background: 'linear-gradient(135deg,#25D366,#1BAF52)',
                padding: '18px',
                fontSize: '15px',
              }}
              onClick={() => setMode('waktu')}
            >
              ⏱️ KLAIM WAKTU
            </button>
            <button
              className="modal-btn"
              style={{
                background: 'linear-gradient(135deg,#AB47BC,#EC407A)',
                padding: '18px',
                fontSize: '15px',
              }}
              onClick={() => setMode('seru')}
            >
              ✨ SERU-SERUAN
            </button>
            <button
              className="modal-btn"
              style={{ background: '#FFF', color: '#EC407A', border: '2px solid #F8BBD0', marginTop: '10px' }}
              onClick={onClose}
            >
              ← Batal
            </button>
          </div>
        ) : result.show ? (
          /* Result View */
          <div>
            <div style={{ fontSize: '56px', textAlign: 'center', margin: '14px 0' }}>
              {result.success ? '🎉' : '😅'}
            </div>
            <div className="gm-skor" style={{ fontSize: '16px' }}>
              {result.message}
            </div>
            {result.menit > 0 && (
              <div
                style={{
                  textAlign: 'center',
                  fontWeight: 800,
                  color: '#EC407A',
                  fontSize: '15px',
                  margin: '10px 0',
                }}
              >
                +{result.menit} menit masuk tabungan! 💖
              </div>
            )}
            <button
              className="modal-btn"
              style={{ background: 'linear-gradient(135deg,#25D366,#1BAF52)' }}
              onClick={() => initGame(gameType)}
            >
              🔄 Main Lagi
            </button>
            <button
              className="modal-btn"
              style={{ background: '#FFF', color: '#EC407A', border: '2px solid #F8BBD0' }}
              onClick={onClose}
            >
              ← Selesai
            </button>
          </div>
        ) : (
          /* Game Playing Content */
          <div className="gm-wrap">
            {/* 1. Hitung Cepat */}
            {gameType === 'hitung' && (
              <div>
                <div className="gm-info">⚡ Jawab dengan tepat!</div>
                <div className="gm-soal">{hitungSoal}</div>
                {hitungOptions.map((opt) => (
                  <div
                    key={opt}
                    className="gm-pilihan"
                    onClick={() => {
                      suaraTap();
                      if (opt === hitungJawab) {
                        cekBadge('hitung');
                        handleFinish(true, 10, '🎉 Benar! Kamu jago matematika!');
                      } else {
                        handleFinish(false, 0, `Jawaban benar: ${hitungJawab}`);
                      }
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}

            {/* 2. Tebak Pola */}
            {gameType === 'pola' && (
              <div>
                <div className="gm-info">🧠 Lanjutkan pola angkanya!</div>
                <div className="gm-soal">{polaSoal}</div>
                {polaOptions.map((opt) => (
                  <div
                    key={opt}
                    className="gm-pilihan"
                    onClick={() => {
                      suaraTap();
                      if (opt === polaJawab) {
                        handleFinish(true, 10, `Hebat! Polanya benar: ${polaJawab}`);
                      } else {
                        handleFinish(false, 0, `Jawaban benar: ${polaJawab}`);
                      }
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}

            {/* 3. Tebak Angka */}
            {gameType === 'angka' && (
              <div>
                <div className="gm-info">🎯 Aku pikirkan angka 1–50. Tebak dalam 7x!</div>
                <div className="gm-skor">{angkaHint}</div>
                <input
                  type="number"
                  className="gm-input"
                  placeholder="Tulis angka 1-50"
                  min="1"
                  max="50"
                  value={angkaInput}
                  onChange={(e) => setAngkaInput(e.target.value)}
                />
                <button
                  className="modal-btn"
                  onClick={() => {
                    const v = parseInt(angkaInput, 10);
                    if (!v || v < 1 || v > 50) {
                      showToast('⚠️ Masukkan 1-50');
                      return;
                    }
                    suaraTap();
                    const nextCoba = angkaCoba + 1;
                    setAngkaCoba(nextCoba);
                    if (v === angkaTarget) {
                      suaraBenar();
                      handleFinish(true, 10, `Benar! Angkanya ${v}. Pakai ${nextCoba}x tebak!`);
                    } else if (nextCoba >= 7) {
                      suaraSalah();
                      handleFinish(false, 0, `Habis kesempatan! Angkanya ${angkaTarget}`);
                    } else {
                      mainkanNada(v < angkaTarget ? 700 : 400, 0.15, 'sine', 0.12);
                      setAngkaHint(
                        v < angkaTarget
                          ? `⬆️ Lebih BESAR! Sisa ${7 - nextCoba}x`
                          : `⬇️ Lebih KECIL! Sisa ${7 - nextCoba}x`
                      );
                      setAngkaInput('');
                    }
                  }}
                >
                  Tebak!
                </button>
              </div>
            )}

            {/* 4. Ingat Urutan */}
            {gameType === 'urutan' && (
              <div>
                {urutanFase === 'ingat' ? (
                  <div>
                    <div className="gm-info">
                      🧩 Level {urutanLevel} — Perhatikan {urutanTarget.length} emoji!
                    </div>
                    <div className="gm-emoji-row">{urutanTarget.join(' ')}</div>
                    <div className="gm-info">Ingat ya... 3 detik</div>
                  </div>
                ) : (
                  <div>
                    <div className="gm-info">Pilih ulang urutannya!</div>
                    <div className="gm-emoji-row">
                      {urutanInput.length > 0 ? urutanInput.join(' ') : '?'}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px',
                        marginTop: '12px',
                      }}
                    >
                      {emojisPool.map((em, i) => (
                        <div
                          key={i}
                          className="gm-pilihan"
                          style={{ fontSize: '28px', padding: '10px' }}
                          onClick={() => {
                            suaraTap();
                            const nextInp = [...urutanInput, em];
                            setUrutanInput(nextInp);
                            if (nextInp.length === urutanTarget.length) {
                              const match = nextInp.every((v, idx) => v === urutanTarget[idx]);
                              if (match) {
                                suaraBenar();
                                handleFinish(
                                  true,
                                  10,
                                  `Hebat! Berhasil mengingat level ${urutanLevel}!`
                                );
                              } else {
                                suaraSalah();
                                handleFinish(
                                  false,
                                  0,
                                  `Urutan benar: ${urutanTarget.join(' ')}`
                                );
                              }
                            }
                          }}
                        >
                          {em}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. Susun Kata */}
            {gameType === 'kata' && (
              <div>
                <div className="gm-info">🔤 Susun huruf jadi kata yang benar!</div>
                <div className="gm-soal" style={{ letterSpacing: '8px', fontSize: '28px' }}>
                  {kataAcak}
                </div>
                {kataOptions.map((opt) => (
                  <div
                    key={opt}
                    className="gm-pilihan"
                    onClick={() => {
                      suaraTap();
                      if (opt === kataJawab) {
                        handleFinish(true, 10, `Benar! Kata: ${kataJawab}`);
                      } else {
                        handleFinish(false, 0, `Jawaban benar: ${kataJawab}`);
                      }
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}

            {/* 6. Teka-Teki */}
            {gameType === 'teka' && (
              <div>
                <div className="gm-info">📖 Tebak jawabannya!</div>
                <div className="gm-soal" style={{ fontSize: '15px', lineHeight: 1.5 }}>
                  {tekaSoal}
                </div>
                {tekaOptions.map((opt) => (
                  <div
                    key={opt}
                    className="gm-pilihan"
                    onClick={() => {
                      suaraTap();
                      if (opt === tekaJawab) {
                        handleFinish(true, 10, `Benar! Jawabannya: ${tekaJawab}`);
                      } else {
                        handleFinish(false, 0, `Jawaban benar: ${tekaJawab}`);
                      }
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}

            <button
              className="modal-btn"
              style={{
                background: '#FFF',
                color: '#EC407A',
                border: '2px solid #F8BBD0',
                marginTop: '10px',
              }}
              onClick={onClose}
            >
              ← Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
