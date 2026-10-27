// Optional local preview export; Node 22.6+ with --experimental-strip-types.
import { mkdir, writeFile } from "node:fs/promises";
import { synthesizeSqueak } from "../src/lib/pipVoice.ts";
const sampleRate = 44100;
const samples = synthesizeSqueak(sampleRate);
const wave = Buffer.alloc(44 + samples.length * 2);
wave.write("RIFF", 0);
wave.writeUInt32LE(wave.length - 8, 4);
wave.write("WAVEfmt ", 8);
wave.writeUInt32LE(16, 16);
wave.writeUInt16LE(1, 20);
wave.writeUInt16LE(1, 22);
wave.writeUInt32LE(sampleRate, 24);
wave.writeUInt32LE(sampleRate * 2, 28);
wave.writeUInt16LE(2, 32);
wave.writeUInt16LE(16, 34);
wave.write("data", 36);
wave.writeUInt32LE(samples.length * 2, 40);
samples.forEach((sample, index) =>
  wave.writeInt16LE(Math.round(sample * 0.1 * 32767), 44 + index * 2),
);
await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true });
await writeFile(new URL("../artifacts/pips-squeak.wav", import.meta.url), wave);
process.stdout.write(
  "Wrote artifacts/pips-squeak.wav (local synthesis preview).\n",
);
