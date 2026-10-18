#!/usr/bin/env python3
"""Audio transfer companion for TTS jobs. Mirrors video-transfer.py.

Loop: POST runnerPoll {operation: "audio-transfers"} -> find out.wav -> POST multipart to runnerReport.
"""
import json, os, pathlib, re, sys, time, urllib.error, urllib.request, uuid

APP = "https://nexus-create-sync.base44.app"
ROOT = pathlib.Path("/opt/nexus-runner")
MAX_SIZE = 10 * 1024 * 1024

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
        "User-Agent": "nexus-audio-transfer/1.0",
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

def upload(job, secret, jobs_root):
    """Upload a finished TTS job's out.wav to the app (mirrors video-transfer.py upload())."""
    source = job.get("source_event_id", "")
    if not re.fullmatch(r"[A-Za-z0-9_-]{6,64}", source):
        raise ValueError("Invalid job identifier")
    root = jobs_root.resolve()
    path = (root / ("job-" + source) / "out.wav").resolve()
    if not path.is_relative_to(root) or not path.is_file():
        print("Waiting for local WAV:", source, flush=True)
        return
    size = path.stat().st_size
    if size < 44 or size > MAX_SIZE:
        print("Audio must be between 44 bytes and 50 MB:", source, flush=True)
        return
    with path.open("rb") as handle:
        header = handle.read(12)
    if header[0:4] != b"RIFF" or header[8:12] != b"WAVE":
        raise ValueError("Invalid WAV")
    boundary = "nexus-" + uuid.uuid4().hex
    prefix = (
        "--" + boundary + '\r\nContent-Disposition: form-data; name="source_event_id"\r\n\r\n' + source
        + "\r\n--" + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="audio.wav"\r\nContent-Type: audio/wav\r\n\r\n'
    ).encode()
    body = prefix + path.read_bytes() + ("\r\n--" + boundary + "--\r\n").encode()
    result = request(
        "runnerReport", secret, body,
        "multipart/form-data; boundary=" + boundary,
        extra_headers={"X-Media-Type": "audio"},
    )
    if not result.get("ok"):
        raise ValueError("Transfer not acknowledged")
    print("Audio saved in Spark:", source, flush=True)


import argparse
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--runner-id", default="nexus-vps-1")
parser.add_argument("--jobs-root", type=pathlib.Path, default=ROOT / "jobs")
args = parser.parse_args()

secret = os.environ.get("RUNNER_SECRET") or read_env(ROOT / "transfer.env").get("RUNNER_SECRET")
if not secret:
    sys.exit("RUNNER_SECRET is missing.")

cursor = None
while True:
    try:
        payload = {"operation": "audio-transfers", "runner_id": args.runner_id}
        if cursor:
            payload["cursor"] = cursor
        page = request("runnerPoll", secret, json.dumps(payload).encode(), "application/json")
        if not isinstance(page.get("transfers"), list):
            raise ValueError("Server does not support audio-transfers yet")
        for job in page["transfers"]:
            try:
                upload(job, secret, args.jobs_root)
            except NotImplementedError:
                raise
            except Exception as error:
                print("Audio transfer will retry:", job.get("source_event_id"), type(error).__name__, flush=True)
        cursor = page.get("next_cursor") if page.get("has_more") else None
    except NotImplementedError:
        print("upload() not implemented yet", flush=True)
        break
    except Exception as error:
        print("Audio transfer connection will retry:", type(error).__name__, flush=True)
    time.sleep(30)
