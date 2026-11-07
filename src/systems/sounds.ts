/**
 * Sons sintéticos via Web Audio API (sem arquivos externos)
 * Escolhas do jogador:
 * - Bateria: opção 3 (curto-circuito em cascata)
 * - Oxigênio: opção 3 (pop-pop-pop)
 * - Amostra: opção 5 (tubo estourando)
 * - Cristal: opção 3 (brilho com harmônicos)
 * - Propulsão: opção 2 (jato de turbina)
 */

let audioCtx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

export function isSoundEnabled() {
  return enabled;
}

/** Garante que o áudio possa tocar após o primeiro clique */
export function unlockAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.12,
  frequencyEnd?: number
) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (frequencyEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, frequencyEnd),
      ctx.currentTime + duration
    );
  }

  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration + 0.03);
}

function playNoiseBurst(duration: number, volume = 0.08, highpass = 800) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = highpass;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start();
}

/** Som ao combinar um tipo de peça — opções escolhidas pelo jogador */
export function playMatchSound(pieceType: string) {
  switch (pieceType) {
    case 'battery':
      // Opção 3 — curto-circuito (zaps em cascata)
      [0, 60, 120, 180, 240, 300].forEach((t, i) => {
        setTimeout(
          () => playTone(700 + i * 120, 0.1, 'square', 0.06 - i * 0.006),
          t
        );
      });
      break;

    case 'oxygen':
      // Opção 3 — sequência de pop-pop-pop
      [0, 80, 160, 240, 320].forEach((t, i) => {
        setTimeout(
          () =>
            playTone(380 + i * 40, 0.08, 'sine', 0.07, 500 + i * 40),
          t
        );
      });
      break;

    case 'sample':
      // Opção 5 — tubo estourando com resíduo
      playTone(250, 0.12, 'sawtooth', 0.07);
      playNoiseBurst(0.3, 0.1, 700);
      setTimeout(() => playTone(900, 0.2, 'triangle', 0.04, 250), 80);
      setTimeout(() => playNoiseBurst(0.12, 0.05, 1500), 160);
      break;

    case 'crystal':
      // Opção 3 — brilho com harmônicos
      playTone(523, 0.22, 'sine', 0.07);
      playTone(659, 0.22, 'sine', 0.05);
      setTimeout(() => {
        playTone(784, 0.25, 'sine', 0.06);
        playTone(987, 0.25, 'sine', 0.04);
      }, 100);
      setTimeout(() => playTone(1175, 0.28, 'sine', 0.04), 220);
      break;

    case 'propulsion':
      // Opção 2 — jato de turbina
      playTone(90, 0.4, 'sawtooth', 0.09, 160);
      setTimeout(() => playTone(140, 0.25, 'square', 0.05, 80), 30);
      setTimeout(() => playTone(70, 0.2, 'sawtooth', 0.03, 50), 180);
      break;

    case 'treasure':
      playTreasureSound();
      break;

    case 'neutralizer':
      playTone(520, 0.16, 'triangle', 0.08);
      setTimeout(() => playTone(680, 0.18, 'sine', 0.07), 90);
      setTimeout(() => playTone(860, 0.2, 'sine', 0.05), 180);
      break;

    default:
      playTone(440, 0.14, 'sine', 0.08);
      setTimeout(() => playTone(554, 0.16, 'sine', 0.07), 70);
      setTimeout(() => playTone(659, 0.18, 'sine', 0.05), 150);
  }
}

/** Som genérico de combinação */
export function playComboSound(matchCount: number) {
  const base = 400 + Math.min(matchCount, 8) * 30;
  playTone(base, 0.1, 'sine', 0.07);
  setTimeout(() => playTone(base * 1.25, 0.14, 'sine', 0.06), 60);
}

export function playTreasureSound() {
  playTone(523, 0.12, 'sine', 0.1);
  setTimeout(() => playTone(659, 0.12, 'sine', 0.09), 90);
  setTimeout(() => playTone(784, 0.18, 'sine', 0.1), 180);
  setTimeout(() => playTone(1046, 0.25, 'sine', 0.08), 280);
  setTimeout(() => playTone(1200, 0.06, 'triangle', 0.05), 350);
  setTimeout(() => playTone(1400, 0.06, 'triangle', 0.04), 420);
  setTimeout(() => playTone(1600, 0.08, 'triangle', 0.04), 490);
}

export function playSwapSound() {
  playTone(280, 0.06, 'triangle', 0.04);
}

export function playInvalidSound() {
  playTone(200, 0.12, 'sawtooth', 0.05, 120);
}

/** Consumo de energia da bateria Nautilus-X */
export function playEnergyDrainSound() {
  playTone(220, 0.09, 'sawtooth', 0.045, 140);
  playNoiseBurst(0.06, 0.03, 1200);
}

/** Recarga da bateria (combinação de baterias / emergência / tesouro) */
export function playEnergyChargeSound(intensity = 1) {
  const n = Math.max(1, Math.min(3, Math.round(intensity)));
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      playTone(380 + i * 140, 0.12, 'square', 0.05 + i * 0.01);
      playTone(520 + i * 100, 0.1, 'sine', 0.04);
    }, i * 70);
  }
  setTimeout(() => playTone(880, 0.14, 'triangle', 0.05), n * 70);
}

/** Alerta de energia baixa */
export function playEnergyLowSound() {
  playTone(180, 0.14, 'square', 0.06, 120);
  setTimeout(() => playTone(150, 0.16, 'sawtooth', 0.05, 90), 120);
}

/** Tentativa de movimento sem energia */
export function playEnergyEmptySound() {
  playTone(120, 0.18, 'sawtooth', 0.07, 70);
  playNoiseBurst(0.1, 0.04, 400);
}
