"""Explicit local-only audio analysis; exports inert JSON, never uploads audio."""
import argparse
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path


def digest_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(4 * 1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def windows(samples, sr=16000, seconds=12):
    for start in range(0, samples, sr * seconds):
        yield start, min(samples, start + sr * seconds)


def choose_audio():
    from tkinter import Tk, filedialog
    root = Tk()
    root.withdraw()
    try:
        return filedialog.askopenfilename(title='Choose owned or consented vocal audio (1–300 seconds)', filetypes=[('Audio', '*.wav *.flac *.ogg')])
    finally:
        root.destroy()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--audio')
    parser.add_argument('--input-kind', required=True, choices=['speech', 'singing_vocals', 'mixed_music'])
    parser.add_argument('--device', choices=['cpu', 'cuda'], default='cpu')
    parser.add_argument('--offline', action='store_true', help='Require pinned files already in the local cache.')
    args = parser.parse_args()
    selected = args.audio or choose_audio()
    if not selected:
        print('Cancelled. No audio was processed.')
        return
    audio_path = Path(selected).resolve()
    if audio_path.suffix.lower() not in ('.wav', '.flac', '.ogg') or not audio_path.is_file() or audio_path.stat().st_size > 512 * 1024 * 1024 or len(audio_path.name) > 160:
        raise RuntimeError('Choose a local WAV/FLAC/OGG file, at most 512 MB, with a basename of at most 160 characters.')
    output = audio_path.with_name(audio_path.name + '.fraymus-emotion.json')
    if output.exists():
        raise RuntimeError('Report already exists. Move or rename it before running again; no file was overwritten.')
    os.environ.update(HF_HUB_DISABLE_TELEMETRY='1', HF_HUB_DISABLE_IMPLICIT_TOKEN='1', DO_NOT_TRACK='1', TOKENIZERS_PARALLELISM='false')
    import numpy as np
    import soundfile as sf
    import librosa
    import torch
    from huggingface_hub import hf_hub_download
    from fraymus_ser_model import load_model
    from fraymus_audio_features import features
    manifest = json.loads((Path(__file__).parent / 'manifest.json').read_text(encoding='utf-8-sig'))
    pinned = manifest['model']
    info = sf.info(str(audio_path))
    if info.channels not in (1, 2) or not 8000 <= info.samplerate <= 192000 or not 1 <= info.duration <= 300 or info.frames * info.channels > 64000000:
        raise RuntimeError('Audio must be mono/stereo, 8–192 kHz, 1–300 seconds and at most 64 million decoded samples.')
    if args.device == 'cuda' and not torch.cuda.is_available():
        raise RuntimeError('CUDA was requested but is unavailable. Install a compatible environment or explicitly select --device cpu.')
    audio_hash = digest_file(audio_path)
    raw, rate = sf.read(str(audio_path), dtype='float32', always_2d=True)
    raw = librosa.resample(raw.mean(axis=1), orig_sr=rate, target_sr=16000).astype(np.float32)
    if not np.isfinite(raw).all() or not 16000 <= len(raw) <= 4800000:
        raise RuntimeError('Decoded/resampled audio is nonfinite or outside the 1–300 second bound.')
    print('Audio stays on this PC. Fetching/checking pinned public model files; first download is about 1.27 GB.')
    def fetch(repo, name, revision):
        return Path(hf_hub_download(repo_id=repo, filename=name, revision=revision, token=False, local_files_only=args.offline))
    weights = fetch(pinned['id'], 'model.safetensors', pinned['revision'])
    if digest_file(weights) != pinned['weights_sha256']:
        raise RuntimeError('Pinned safetensors SHA-256 mismatch; refusing inference.')
    config_path = fetch(pinned['id'], 'config.json', pinned['revision'])
    backbone = fetch('microsoft/wavlm-large', 'config.json', pinned['backbone_revision'])
    config = json.loads(config_path.read_text(encoding='utf-8'))
    normal = manifest['normalization']
    if config.get('mean') != normal['mean'] or config.get('std') != normal['std']:
        raise RuntimeError('Pinned normalization does not match the model config.')
    model = load_model(backbone, weights, config_path, args.device)
    segments = []
    with torch.inference_mode():
        for start, end in windows(len(raw)):
            chunk = raw[start:end]
            normalized = (chunk - normal['mean']) / (normal['std'] + normal['epsilon'])
            if len(normalized) < 16000:
                normalized = np.pad(normalized, (0, 16000 - len(normalized)))
            wave = torch.as_tensor(normalized, dtype=torch.float32, device=args.device).unsqueeze(0)
            mask = torch.ones(wave.shape, dtype=torch.long, device=args.device)
            values = model(wave, mask).detach().cpu().numpy().reshape(-1)
            if len(values) != 3 or not np.isfinite(values).all():
                raise RuntimeError('Model returned invalid A/D/V values.')
            segments.append(dict(start=round(start / 16000, 6), end=round(end / 16000, 6), **dict(zip(('arousal', 'dominance', 'valence'), (round(float(v), 6) for v in values))), **features(chunk, 16000)))
            print('Analyzed window', len(segments), 'ending at', round(end / 16000, 2), 'seconds.')
    if digest_file(audio_path) != audio_hash:
        raise RuntimeError('Audio changed while being analyzed; refusing to export mismatched provenance.')
    report = dict(schema='fraymus.vocal-emotion/1', model=pinned, created_at=datetime.now(timezone.utc).isoformat(), device=args.device, input_kind=args.input_kind, sample_rate=16000, normalization=normal, window_seconds=12, audio=dict(name=audio_path.name, sha256=audio_hash, duration_seconds=round(len(raw) / 16000, 6)), segments=segments)
    text = json.dumps(report, ensure_ascii=False, allow_nan=False, separators=(',', ':'))
    if len(text.encode('utf-8')) > 18000:
        raise RuntimeError('Report exceeds the supported 18 KB; use shorter audio.')
    with output.open('x', encoding='utf-8') as f:
        f.write(text)
    print('Saved:', output)
    print('Import this JSON in Fraymus Brain > Vocal emotion. No audio or report was sent automatically.')


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Cancelled.')
    except Exception as e:
        print('Analysis stopped:', str(e))
        raise SystemExit(1)