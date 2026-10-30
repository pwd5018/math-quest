import type { Appearance } from "./appearance";
import type { PipSound } from "./pipInteraction";

/** A tiny, deterministic creature voice. No microphone, speech API, files or network. */
export function synthesizeSqueak(
  sampleRate: number,
  chirpy = false,
): Float32Array {
  if (!Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 96000)
    throw new Error("Unsupported audio sample rate.");
  const duration = 0.48;
  const samples = new Float32Array(Math.ceil(sampleRate * duration));
  let phase = 0;
  for (let i = 0; i < samples.length; i++) {
    const time = i / sampleRate;
    const syllable = time < 0.19 ? time / 0.19 : (time - 0.235) / 0.245;
    if (syllable < 0 || syllable > 1) continue;
    const envelope = Math.sin(Math.PI * syllable) ** 1.7;
    const frequency =
      (time < 0.19
        ? 620 + 310 * Math.sin(syllable * Math.PI * 0.85)
        : 790 - 290 * syllable) + (chirpy ? 100 : 0);
    phase += (2 * Math.PI * frequency) / sampleRate;
    const vibrato = Math.sin(time * 2 * Math.PI * 22) * 0.07;
    // Soft harmonics give a rounded, vowel-like "wee-yip" instead of an alert beep.
    samples[i] =
      envelope *
      (Math.sin(phase + vibrato) * 0.64 +
        Math.sin(phase * 2) * 0.17 +
        Math.sin(phase * 3) * 0.055);
  }
  return samples;
}
/** Short, event-specific creature sounds with deterministic variation and silent edges. */
export function synthesizeReaction(
  rate: number,
  mode: Appearance["voice"],
  cue: PipSound = "hello",
  variant = 0,
) {
  if (!Number.isInteger(rate) || rate < 8000 || rate > 96000)
    throw new Error("Unsupported audio sample rate.");
  const durations: Record<PipSound, number> = {
    hello: 0.38,
    giggle: 0.55,
    peek: 0.17,
    sniff: 0.24,
    chirp: 0.27,
    purr: 0.45,
    highfive: 0.2,
    swish: 0.24,
    fetch: 0.28,
    pop: 0.11,
    dance: 0.42,
  };
  const duration = durations[cue];
  const out = new Float32Array(Math.ceil(rate * duration));
  if (mode === "off") return out;
  const pitch = {
    soft: 1,
    chirpy: 1.35,
    mellow: 0.64,
    robot: 0.85,
    chime: 1.6,
  }[mode];
  const v = ((Math.trunc(variant) % 3) + 3) % 3;
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / rate,
      p = t / duration;
    const pulses = cue === "giggle" ? 3 : cue === "dance" ? 4 : 1;
    const envelope =
      Math.sin(Math.PI * p) ** 1.4 *
      (pulses === 1 ? 1 : Math.sin(Math.PI * p * pulses) ** 2);
    const base =
      cue === "purr"
        ? 190
        : cue === "sniff" || cue === "swish"
          ? 310
          : cue === "pop"
            ? 1050
            : 520;
    let frequency =
      (base +
        (cue === "pop"
          ? -700 * p
          : 160 * Math.sin(p * Math.PI * (cue === "peek" ? 1.6 : 1)))) *
      pitch *
      (1 + v * 0.045);
    if (mode === "robot") frequency = Math.round(frequency / 65) * 65;
    phase += (2 * Math.PI * frequency) / rate;
    const tone =
      Math.sin(phase) * 0.59 +
      Math.sin(phase * (mode === "chime" ? 2.76 : 2)) * 0.15 +
      Math.sin(phase * 3) * 0.045;
    const breath = (Math.sin(i * 1.71) + Math.sin(i * 2.33)) * 0.13;
    out[i] =
      envelope *
      (cue === "sniff" || cue === "swish" ? breath + tone * 0.25 : tone) *
      (cue === "purr" ? 0.7 + 0.3 * Math.sin(t * 170) : 1);
  }
  return out;
}
let context: AudioContext | null = null;
let active: AudioBufferSourceNode | null = null;
let lastVoice = -Infinity;
let generation = 0;
export function stopPipVoice() {
  generation++;
  try {
    active?.stop();
  } catch {
    /* Already finished. */
  }
  active = null;
}
/** Call only from a pointer/keyboard activation. A rejected browser policy never blocks play. */
export async function playPipVoice(
  mode: Appearance["voice"],
  cue: PipSound = "hello",
  variant = 0,
): Promise<boolean> {
  if (mode === "off") {
    stopPipVoice();
    return false;
  }
  if (typeof window === "undefined") return false;
  if (performance.now() - lastVoice < 180) return false;
  lastVoice = performance.now();
  const requestGeneration = ++generation;
  try {
    const AudioCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) return false;
    context ??= new AudioCtor();
    if (context.state === "suspended") await context.resume();
    if (context.state !== "running" || generation !== requestGeneration)
      return false;
    stopPipVoice();
    const samples = synthesizeReaction(context.sampleRate, mode, cue, variant);
    const buffer = context.createBuffer(1, samples.length, context.sampleRate);
    buffer.copyToChannel(samples, 0);
    const source = context.createBufferSource(),
      gain = context.createGain(),
      filter = context.createBiquadFilter();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = 3400;
    filter.Q.value = 0.4;
    gain.gain.value = mode === "chirpy" ? 0.12 : 0.1;
    source.connect(filter).connect(gain).connect(context.destination);
    active = source;
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      if (active === source) active = null;
    };
    source.start();
    return true;
  } catch {
    return false;
  }
}
