let audioCtx: AudioContext | null = null;

export function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    } catch {
      // AudioContext not supported
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    try {
      audioCtx.resume();
    } catch {
      // Ignore
    }
  }
  return audioCtx;
}

export function mainkanNada(freq: number, durasi: number, tipe: OscillatorType = 'sine', volume = 0.15): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tipe;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durasi);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durasi + 0.05);
  } catch {
    // Ignore error
  }
}

export function suaraKlik(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
  mainkanNada(600, 0.08, 'square', 0.1);
}

export function suaraBenar(): void {
  mainkanNada(523, 0.12, 'sine', 0.18);
  setTimeout(() => mainkanNada(659, 0.12, 'sine', 0.18), 100);
  setTimeout(() => mainkanNada(784, 0.2, 'sine', 0.18), 200);
}

export function suaraSalah(): void {
  mainkanNada(220, 0.15, 'sawtooth', 0.15);
  setTimeout(() => mainkanNada(150, 0.3, 'sawtooth', 0.15), 120);
}

export function suaraSeru(): void {
  mainkanNada(659, 0.1, 'triangle', 0.15);
  setTimeout(() => mainkanNada(880, 0.15, 'triangle', 0.15), 90);
}

export function suaraKail(): void {
  mainkanNada(400, 0.15, 'sine', 0.12);
}

export function suaraTarik(): void {
  mainkanNada(800, 0.05, 'square', 0.1);
}

export function suaraTap(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  mainkanNada(1000, 0.04, 'square', 0.08);
}

export function suaraLempar(): void {
  mainkanNada(300, 0.2, 'sawtooth', 0.12);
}

export function suaraPutar(): void {
  mainkanNada(500, 0.1, 'triangle', 0.12);
  setTimeout(() => mainkanNada(700, 0.1, 'triangle', 0.12), 80);
  setTimeout(() => mainkanNada(900, 0.1, 'triangle', 0.12), 160);
}

export function suaraHadiah(): void {
  const nada = [523, 659, 784, 1047];
  for (let i = 0; i < nada.length; i++) {
    setTimeout(() => mainkanNada(nada[i], 0.15, 'sine', 0.2), i * 100);
  }
}

export function suaraUlang(): void {
  mainkanNada(400, 0.1, 'sine', 0.1);
  setTimeout(() => mainkanNada(500, 0.1, 'sine', 0.1), 100);
}

export function sBebek(): void {
  mainkanNada(880, 0.08, 'sine', 0.18);
  setTimeout(() => mainkanNada(1200, 0.1, 'sine', 0.18), 70);
}

export function sEmas(): void {
  const nada = [784, 988, 1175, 1568, 1976];
  for (let i = 0; i < nada.length; i++) {
    setTimeout(() => mainkanNada(nada[i], 0.15, 'triangle', 0.2), i * 80);
  }
}

export function sLepas(): void {
  mainkanNada(300, 0.15, 'sawtooth', 0.1);
  setTimeout(() => mainkanNada(200, 0.2, 'sawtooth', 0.1), 100);
}

export function sHabis(): void {
  const nada = [1047, 880, 659, 523, 392];
  for (let i = 0; i < nada.length; i++) {
    setTimeout(() => mainkanNada(nada[i], 0.2, 'sine', 0.18), i * 150);
  }
}

export function sZonk(): void {
  mainkanNada(180, 0.2, 'sawtooth', 0.15);
  setTimeout(() => mainkanNada(120, 0.25, 'sawtooth', 0.15), 120);
}

export function suaraHappyBirthday(): void {
  const nada = [262, 262, 294, 262, 349, 330, 262, 262, 294, 262, 392, 349];
  const durasi = [0.3, 0.3, 0.4, 0.4, 0.4, 0.6, 0.3, 0.3, 0.4, 0.4, 0.4, 0.6];
  let delay = 0;
  for (let i = 0; i < nada.length; i++) {
    const n = nada[i];
    setTimeout(() => mainkanNada(n, 0.25, 'triangle', 0.2), delay);
    delay += durasi[i] * 1000;
  }
}

export function ucapkanTeks(teks: string): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(teks);
    msg.lang = 'id-ID';
    msg.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang.includes('id') && v.name.includes('Google')) || voices.find((v) => v.lang.includes('id'));
    if (idVoice) msg.voice = idVoice;
    window.speechSynthesis.speak(msg);
  }
}
