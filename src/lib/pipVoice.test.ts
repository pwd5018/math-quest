import { afterEach, describe, expect, it, vi } from "vitest";
import { synthesizeSqueak } from "./pipVoice";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
describe("bounded local creature audio", () => {
  it("creates a short finite waveform with silent edges and no clipping at common device rates", () => {
    for (const rate of [8000, 44100, 48000, 96000]) {
      const samples = synthesizeSqueak(rate);
      expect(samples.length).toBe(Math.ceil(rate * 0.48));
      expect(samples[0]).toBe(0);
      expect(Math.abs(samples.at(-1)!)).toBeLessThan(0.001);
      let peak = 0,
        energy = 0;
      for (const value of samples) {
        expect(Number.isFinite(value)).toBe(true);
        peak = Math.max(peak, Math.abs(value));
        energy += value * value;
      }
      expect(peak).toBeLessThan(0.87);
      expect(energy).toBeGreaterThan(1);
      expect(samples[Math.floor(rate * 0.21)]).toBe(0);
    }
  });
  it("is deterministic and produces a distinct extra-chirpy contour", () => {
    expect(synthesizeSqueak(44100)).toEqual(synthesizeSqueak(44100));
    expect(synthesizeSqueak(44100, true)).not.toEqual(synthesizeSqueak(44100));
  });
  it("rejects invalid or unbounded allocation requests", () => {
    for (const rate of [0, -1, NaN, Infinity, 44100.5, 192000])
      expect(() => synthesizeSqueak(rate)).toThrow();
  });
  it("never creates an audio device for muted playback or merely importing the module", async () => {
    const create = vi.fn();
    vi.stubGlobal("window", { AudioContext: create });
    const voice = await import("./pipVoice");
    expect(create).not.toHaveBeenCalled();
    expect(await voice.playPipVoice("off")).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
  it("cancels playback if muted while a browser audio resume is pending", async () => {
    let finishResume: () => void = () => {};
    const createdBuffer = vi.fn();
    class PendingAudio {
      state = "suspended";
      sampleRate = 44100;
      resume() {
        return new Promise<void>((resolve) => {
          finishResume = () => {
            this.state = "running";
            resolve();
          };
        });
      }
      createBuffer = createdBuffer;
    }
    vi.stubGlobal("window", { AudioContext: PendingAudio });
    const voice = await import("./pipVoice");
    const pending = voice.playPipVoice("soft");
    voice.stopPipVoice();
    finishResume();
    expect(await pending).toBe(false);
    expect(createdBuffer).not.toHaveBeenCalled();
  });
});
