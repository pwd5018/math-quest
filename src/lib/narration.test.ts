import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { lessons, questionFor } from "./lessons";
import { narrationClips } from "./narrationManifest";
import {
  narrationKey,
  spokenDirections,
  startRecordedNarration,
} from "./narration";
afterEach(() => vi.unstubAllGlobals());
describe("recorded directions", () => {
  it("ships valid audio for every current lesson direction and check prompt", () => {
    let count = 0;
    for (const lesson of lessons)
      for (const instruction of [
        lesson.explanation,
        lesson.guided,
        ...lesson.checks.map((e) => questionFor(lesson, e)),
        lesson.takeaway,
      ]) {
        const clip =
          narrationClips[narrationKey(`${lesson.title}. ${instruction}`)];
        if (!clip) throw new Error(`Missing narration for ${lesson.id}`);
        const bytes = readFileSync(
          new URL(`../../public${clip}`, import.meta.url),
        );
        expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
        expect(bytes.readUInt32LE(24)).toBe(24000);
        expect(bytes.length).toBeGreaterThan(4800);
        count++;
      }
    expect(count).toBe(40);
  });
  it("normalizes arithmetic symbols for spoken directions and changes keys with edited text", () => {
    expect(spokenDirections("3 × 4 = 12. 12 ÷ 3 = 4. 4 + 4 + 4.")).toBe(
      "3 times 4 equals 12. 12 divided by 3 equals 4. 4 plus 4 plus 4.",
    );
    expect(narrationKey("hello")).toBe(narrationKey("hello"));
    expect(narrationKey("hello.")).not.toBe(narrationKey("hello"));
  });
  it("does not resume fallback narration after stop or mute cancels a pending playback", async () => {
    let rejectPlay: (e: Error) => void = () => {};
    const pause = vi.fn(),
      load = vi.fn(),
      removeAttribute = vi.fn();
    class TestAudio {
      volume = 0;
      onended = null;
      onerror = null;
      pause = pause;
      load = load;
      removeAttribute = removeAttribute;
      play() {
        return new Promise<void>((_, reject) => {
          rejectPlay = reject;
        });
      }
    }
    vi.stubGlobal("Audio", TestAudio);
    const end = vi.fn(),
      fail = vi.fn(),
      stop = startRecordedNarration("/narration/test.wav", end, fail);
    stop();
    rejectPlay(new Error("cancelled"));
    await Promise.resolve();
    expect(pause).toHaveBeenCalled();
    expect(load).toHaveBeenCalled();
    expect(fail).not.toHaveBeenCalled();
    expect(end).not.toHaveBeenCalled();
  });
  it("falls back once on a playback failure and releases the source", async () => {
    const pause = vi.fn();
    class TestAudio {
      volume = 0;
      onended = null;
      onerror = null;
      pause = pause;
      load() {}
      removeAttribute() {}
      play() {
        return Promise.reject(new Error("not available"));
      }
    }
    vi.stubGlobal("Audio", TestAudio);
    const fail = vi.fn();
    startRecordedNarration("/missing.wav", vi.fn(), fail);
    await Promise.resolve();
    expect(fail).toHaveBeenCalledOnce();
    expect(pause).toHaveBeenCalled();
  });
});
