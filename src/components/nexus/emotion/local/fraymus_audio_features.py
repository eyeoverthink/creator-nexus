"""Separate DSP estimates. None is a psychological label or verified beat grid."""
import librosa
import numpy as np


def features(audio, sr):
    rms = float(np.sqrt(np.mean(np.square(audio))))
    if rms < 1e-5 or len(audio) < sr:
        return dict(rms=round(rms, 6), onsets_per_second=0.0, pulse_bpm_estimate=None, voiced_pitch_median_hz=None, voiced_fraction=0.0)
    hop = 256
    envelope = librosa.onset.onset_strength(y=audio, sr=sr, hop_length=hop)
    onsets = librosa.onset.onset_detect(onset_envelope=envelope, sr=sr, hop_length=hop)
    pulse = None
    if len(onsets) >= 4:
        pulse = float(np.asarray(librosa.feature.tempo(onset_envelope=envelope, sr=sr, hop_length=hop)).reshape(-1)[0])
    pitch, voiced, _ = librosa.pyin(audio, fmin=65.406, fmax=1046.503, sr=sr, frame_length=1024, hop_length=hop)
    valid = pitch[voiced & np.isfinite(pitch)]
    return dict(rms=round(rms, 6), onsets_per_second=round(len(onsets) / (len(audio) / sr), 6), pulse_bpm_estimate=round(pulse, 6) if pulse is not None and np.isfinite(pulse) else None, voiced_pitch_median_hz=round(float(np.median(valid)), 6) if len(valid) else None, voiced_fraction=round(float(np.mean(voiced)), 6))