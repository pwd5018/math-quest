import type { Appearance } from "./appearance";

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
): Promise<boolean> {
  if (mode === "off") {
    stopPipVoice();
    return false;
  }
  if (typeof window === "undefined") return false;
  if (performance.now() - lastVoice < 650) return false;
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
    const samples = synthesizeSqueak(context.sampleRate, mode === "chirpy");
    const buffer = context.createBuffer(1, samples.length, context.sampleRate);
    buffer.copyToChannel(samples, 0);
    const source = context.createBufferSource(),
      gain = context.createGain(),
      filter = context.createBiquadFilter();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = 3400;
    filter.Q.value = 0.4;
    gain.gain.value = mode === "soft" ? 0.1 : 0.15;
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
