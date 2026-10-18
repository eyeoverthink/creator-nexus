#!/opt/nexus-runner/venv/bin/python
"""tool_render.py job.json — standalone HyperFrames render handler for the nexus runner.

Reads job.json with {job_type: "render", narration, style, voice, format}.
Runs the full pipeline: Kokoro voice → Whisper timings → scene plan → HyperFrames → out.mp4.
Writes result.json with {ok, video_file, durations_s, style, renderer}.

This is the same pipeline as explainer_short but triggered standalone (not from a Spark).
"""
import json, os, subprocess, signal, sys, time

ROOT = "/opt/nexus-runner"
PY = ROOT + "/venv/bin/python"
HF_UPGRADE = ROOT + "/hf-upgrade"
JOBS = os.environ.get("HF_JOBS_ROOT", ROOT + "/jobs")
TIMEOUT = int(os.environ.get("HF_TOTAL_TIMEOUT", "480"))

def run_group(cmd, env, timeout):
    p = subprocess.Popen(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, start_new_session=True)
    try:
        out, _ = p.communicate(timeout=timeout)
        return p.returncode, out
    except subprocess.TimeoutExpired:
        os.killpg(p.pid, signal.SIGKILL)
        p.communicate()
        return -9, f"timed out after {timeout}s"

def main():
    job = json.load(open(sys.argv[1]))
    jid = job.get("job_id", f"render-{int(time.time())}")
    job["job_id"] = jid
    job["job_type"] = "explainer_short"
    d = f"{JOBS}/{jid}"
    os.makedirs(d, exist_ok=True)

    jf = f"{d}/job.json"
    json.dump(job, open(jf, "w"))
    env = dict(os.environ, HF_JOBS_ROOT=JOBS)

    rc, out = run_group([PY, f"{HF_UPGRADE}/run_job_safe.py", jf], env, TIMEOUT)

    try:
        res = json.load(open(f"{d}/result.json"))
    except Exception:
        res = None

    if rc == 0 and res and res.get("ok") and os.path.exists(f"{d}/out.mp4"):
        res["job_id"] = jid
        json.dump(res, open(f"{d}/result.json", "w"), indent=2)
        print(json.dumps(res))
        return 0

    result = {
        "ok": False,
        "job_id": jid,
        "error": res.get("error", "render failed") if res else f"exit code {rc}",
        "output": (out or "")[-500:],
    }
    json.dump(result, open(f"{d}/result.json", "w"), indent=2)
    print(json.dumps(result))
    return 1

if __name__ == "__main__":
    sys.exit(main() or 0)
