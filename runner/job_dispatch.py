#!/opt/nexus-runner/venv/bin/python
"""job_dispatch.py job.json — thin router that delegates by job_type.

  explainer_short  → run_job_safe.py (the existing renderer)
  tts              → tool_tts.py (standalone Kokoro TTS)
  render           → tool_render.py (standalone HyperFrames render)

Install: set NEXUS_RUN_JOB=/opt/nexus-runner/hf-upgrade/job_dispatch.py in the systemd drop-in
(10-scene-renderer.conf), then `systemctl daemon-reload && systemctl restart nexus-runner`.
This does NOT touch run_job_safe.py — it just wraps the dispatch.
"""
import json, os, subprocess, sys

ROOT = "/opt/nexus-runner"
PY = ROOT + "/venv/bin/python"
HF_UPGRADE = ROOT + "/hf-upgrade"

HANDLERS = {
    "explainer_short": HF_UPGRADE + "/run_job_safe.py",
    "tts":             HF_UPGRADE + "/tool_tts.py",
    "render":          HF_UPGRADE + "/tool_render.py",
}

def main():
    if len(sys.argv) < 2:
        sys.exit("usage: job_dispatch.py job.json")
    job_file = sys.argv[1]
    job = json.load(open(job_file))
    job_type = job.get("job_type", "explainer_short")
    handler = HANDLERS.get(job_type)
    if not handler:
        print(json.dumps({"ok": False, "error": f"unknown job_type: {job_type}"}))
        sys.exit(1)
    result = subprocess.run([PY, handler, job_file], env=os.environ)
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
