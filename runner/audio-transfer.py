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

# TODO(human): implement the upload() function
# It should:
#   1. Validate source_event_id from the job dict
#   2. Find out.wav at jobs_root / ("job-" + source) / "out.wav"
#   3. Verify the file exists, is between 44 bytes and MAX_SIZE, and starts with b"RIFF"
#   4. Build a multipart/form-data body with two fields: source_event_id (text) and file (the WAV)
#   5. POST it to runnerReport with X-Media-Type: audio header
#   6. Check the response has ok=True
#
# Reference: video-transfer.py's upload() does the same thing for MP4 files.
# Key differences from video: check for "RIFF" magic bytes (not "ftyp"),
# content type is audio/wav (not video/mp4), and pass X-Media-Type: audio header.
def upload(job, secret, jobs_root):
    raise NotImplementedError("needs implementation")


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
