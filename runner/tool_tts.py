#!/opt/nexus-runner/venv/bin/python
"""tool_tts.py job.json — standalone Kokoro TTS handler for the nexus runner.

Reads job.json with {job_type: "tts", text, voice, speed, lang}.
Writes result.json with {ok, audio_url, duration, voice} and out.wav.
The runner_client uploads result.json via runnerReport.
"""
import json, os, sys, time
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = "/opt/nexus-runner"
MODELS = ROOT + "/models/"
JOBS = os.environ.get("HF_JOBS_ROOT", ROOT + "/jobs")

def main():
    job = json.load(open(sys.argv[1]))
    jid = job.get("job_id", f"tts-{int(time.time())}")
    d = f"{JOBS}/{jid}"
    os.makedirs(d, exist_ok=True)

    text = str(job.get("text", "")).strip()
    if not text:
        result = {"ok": False, "error": "text required"}
        json.dump(result, open(f"{d}/result.json", "w"))
        print(json.dumps(result))
        return 1

    voice = str(job.get("voice", "af_heart"))
    speed = max(0.5, min(2.0, float(job.get("speed", 1.0))))
    lang = str(job.get("lang", "en-us"))

    t0 = time.time()
    k = Kokoro(f"{MODELS}kokoro-v1.0.onnx", f"{MODELS}voices-v1.0.bin")
    audio, sr = k.create(text, voice=voice, speed=speed, lang=lang)
    sf.write(f"{d}/out.wav", audio, sr)
    duration = round(len(audio) / sr, 2)
    gen_time = round(time.time() - t0, 2)

    result = {
        "ok": True,
        "job_id": jid,
        "audio_file": f"{d}/out.wav",
        "duration": duration,
        "voice": voice,
        "speed": speed,
        "samples": len(audio),
        "rate": sr,
        "gen_seconds": gen_time,
    }
    json.dump(result, open(f"{d}/result.json", "w"), indent=2)
    print(json.dumps(result))
    return 0

if __name__ == "__main__":
    sys.exit(main() or 0)
