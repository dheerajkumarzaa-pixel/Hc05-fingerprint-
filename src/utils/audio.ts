import { BuzzerPattern } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Synthesizes a clean piezo buzzer tone using Web Audio API
 */
function playTone(freq: number, durationMs: number, startTimeOffset = 0, type: OscillatorType = 'square', volume = 0.25) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTimeOffset);

  // Smooth attack and decay to avoid loud pop
  const start = ctx.currentTime + startTimeOffset;
  const end = start + durationMs / 1000;

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.setValueAtTime(volume, end - 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(end);
}

/**
 * Play solenoid mechanical latch sound (click/clack)
 */
export function playSolenoidSound(isRetract: boolean) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Short noise burst + metallic thud
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.01));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = isRetract ? 'highpass' : 'lowpass';
  filter.frequency.setValueAtTime(isRetract ? 1800 : 450, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
}

/**
 * Triggers hardware buzzer patterns matching exact user specification:
 * - SUCCESS: 1 LONG BEEP (1200ms)
 * - FAIL: 3 SHORT BEEPS (200ms on, 150ms off)
 * - LOCKOUT: 4 BEEPS (300ms on, 120ms off) + lockout alarm
 */
export function triggerBuzzer(pattern: BuzzerPattern) {
  const ctx = getAudioContext();
  if (!ctx) return;

  switch (pattern) {
    case 'SUCCESS_1_LONG': {
      // 1 Long continuous beep (1200ms at 2400Hz pure piezo frequency)
      playTone(2400, 1200, 0, 'square', 0.28);
      // Dual resonant harmonic for authentic buzzer sound
      playTone(1200, 1200, 0, 'sine', 0.15);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(600);
      }
      break;
    }

    case 'FAIL_3_SHORT': {
      // 3 short beeps: 200ms on, 150ms off, 3 times
      const beepDuration = 200;
      const interval = 350; // 200ms on + 150ms off

      for (let i = 0; i < 3; i++) {
        const offset = (i * interval) / 1000;
        playTone(2200, beepDuration, offset, 'square', 0.28);
        playTone(1100, beepDuration, offset, 'sine', 0.15);
      }

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([150, 100, 150, 100, 150]);
      }
      break;
    }

    case 'LOCKOUT_4_BEEPS': {
      // 4 alarm beeps on 3rd attempt
      const beepDuration = 280;
      const interval = 400;

      for (let i = 0; i < 4; i++) {
        const offset = (i * interval) / 1000;
        // Higher urgent pitch
        playTone(2800, beepDuration, offset, 'square', 0.35);
        playTone(1400, beepDuration, offset, 'sine', 0.18);
      }

      // Add trailing low warning buzz after the 4 beeps
      const afterOffset = (4 * interval) / 1000;
      playTone(450, 700, afterOffset, 'sawtooth', 0.2);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([250, 80, 250, 80, 250, 80, 400]);
      }
      break;
    }

    default:
      break;
  }
}
