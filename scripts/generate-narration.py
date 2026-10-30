"""Offline narration generation using the owner's existing Kokoro installation."""
import json
import sys
from pathlib import Path
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

model_folder, input_file, output_folder = map(Path, sys.argv[1:4])
entries = json.loads(input_file.read_text(encoding="utf-8"))
engine = Kokoro(str(model_folder / "kokoro-v1.0.onnx"), str(model_folder / "voices-v1.0.bin"))
for i, entry in enumerate(entries, 1):
    output = output_folder / entry["filename"]
    if output.exists():
        existing, rate = sf.read(output)
        if rate == 24000 and existing.size > 2400 and np.isfinite(existing).all():
            print(f"[{i}/{len(entries)}] Cached {output.name}", flush=True)
            continue
    audio, rate = engine.create(entry["text"], voice="af_heart", speed=0.9, lang="en-us")
    if audio.size < 2400 or not np.isfinite(audio).all():
        raise ValueError("Invalid generated waveform")
    # Brief padding avoids abruptly cutting the first or last sound on some devices.
    audio = np.concatenate([np.zeros(int(rate * .08)), audio, np.zeros(int(rate * .14))])
    temporary = output.with_suffix(".tmp.wav")
    sf.write(temporary, audio, rate, subtype="PCM_16")
    temporary.replace(output)
    print(f"[{i}/{len(entries)}] {output.name}: {audio.size / rate:.1f}s", flush=True)
