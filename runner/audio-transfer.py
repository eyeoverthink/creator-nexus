#!/usr/bin/env python3
"""Audio transfer — scans local jobs/ for completed TTS WAVs and uploads them.

Filesystem-first: instead of polling runnerPoll (which requires a server-side
operation we can't deploy), scan the jobs directory for TTS results with out.wav
and upload them via runnerReport multipart with X-Media-Type: audio.
"""
import json, os, pathlib, re, sys, time, urllib.error, urllib.request, uuid

APP = "https://nexus-create-sync.base44.app"
ROOT = pathlib.Path("/opt/nexus-runner")
MAX_SIZE = 10 * 1024 * 1024
UPLOADED_MARKER = ".audio_uploaded"

def read_env(path):
    values = {}
    if path.is_file():
        for line in path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.removeprefix("export ").split("=", 1)
                values[key.strip()] = value.strip().strip("\"'")
    return values

def request(endpoint, secret, body, content_type, extra_headers=None):
    headers = {
        "User-Agent": "nexus-audio-transfer/2.0",
        "x-runner-secret": secret,
        "Content-Type": content_type,
    }
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(
        APP + "/functions/" + endpoint, data=body, headers=headers, method="POST"
    )
    with urllib.request.urlopen(req, timeout=120) as response:
        return json.load(response)

def find_uploadable_tts_jobs(jobs_root):
    """Scan jobs/ for TTS results that have out.wav but no upload marker."""
    uploadable = []
    if not jobs_root.is_dir():
        return uploadable
    for job_dir in sorted(jobs_root.iterdir()):
        if not job_dir.is_dir() or not job_dir.name.startswith("job-"):
            continue
        marker = job_dir / UPLOADED_MARKER
        if marker.exists():
            continue
        result_file = job_dir / "result.json"
        wav_file = job_dir / "out.wav"
        if not result_file.is_file() or not wav_file.is_file():
            continue
        try:
            result = json.loads(result_file.read_text())
        except (json.JSONDecodeError, OSError):
            continue
        if not result.get("ok"):
            continue
        if result.get("job_type", "tts") != "tts" and "audio_file" not in result:
            continue
        source_event_id = job_dir.name.removeprefix("job-")
        if not re.fullmatch(r"[A-Za-z0-9_-]{6,64}", source_event_id):
            continue
        uploadable.append({"source_event_id": source_event_id, "wav": wav_file, "dir": job_dir})
    return uploadable

def upload(job, secret):
    """Upload a finished TTS job's out.wav to the app via runnerReport multipart."""
    source = job["source_event_id"]
    path = job["wav"]
    size = path.stat().st_size
    if size < 44 or size > MAX_SIZE:
        print(f"Skipping {source}: WAV size {size} out of range", flush=True)
        return False
    with path.open("rb") as handle:
        header = handle.read(12)
    if header[0:4] != b"RIFF" or header[8:12] != b"WAVE":
        print(f"Skipping {source}: not a valid WAV", flush=True)
        return False
    boundary = "nexus-" + uuid.uuid4().hex
    prefix = (
        "--" + boundary + '\r\nContent-Disposition: form-data; name="source_event_id"\r\n\r\n' + source
        + "\r\n--" + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="audio.wav"\r\nContent-Type: audio/wav\r\n\r\n'
    ).encode()
    body = prefix + path.read_bytes() + ("\r\n--" + boundary + "--\r\n").encode()
    result = request(
        "audioUpload", secret, body,
        "multipart/form-data; boundary=" + boundary,
    )
    if not result.get("ok"):
        if result.get("already_uploaded"):
            print(f"Already uploaded: {source}", flush=True)
            return True
        raise ValueError(f"Transfer not acknowledged: {result}")
    print(f"Audio uploaded: {source} -> {result.get('file_uri', '?')}", flush=True)
    return True


import argparse
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--runner-id", default="nexus-vps-1")
parser.add_argument("--jobs-root", type=pathlib.Path, default=ROOT / "jobs")
args = parser.parse_args()

secret = os.environ.get("RUNNER_SECRET") or read_env(ROOT / "transfer.env").get("RUNNER_SECRET")
if not secret:
    sys.exit("RUNNER_SECRET is missing.")

print(f"Audio transfer v2 scanning {args.jobs_root} every 15s", flush=True)
while True:
    try:
        jobs = find_uploadable_tts_jobs(args.jobs_root)
        for job in jobs:
            try:
                if upload(job, secret):
                    (job["dir"] / UPLOADED_MARKER).touch()
            except Exception as error:
                print(f"Upload retry needed: {job['source_event_id']} {type(error).__name__}: {error}", flush=True)
    except Exception as error:
        print(f"Scan error: {type(error).__name__}: {error}", flush=True)
    time.sleep(15)
