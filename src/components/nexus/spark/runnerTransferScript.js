export default String.raw`#!/usr/bin/env python3
"""Private Spark video transfer companion. Python 3 standard library only."""
import argparse, getpass, json, os, pathlib, re, shutil, subprocess, sys, time, urllib.request, uuid
APP = "https://nexus-create-sync.base44.app"
ROOT = pathlib.Path("/opt/nexus-runner")
MAX_SIZE = 50 * 1024 * 1024

def read_env(path):
    values = {}
    if path.is_file():
        for line in path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.removeprefix("export ").split("=", 1)
                values[key.strip()] = value.strip().strip("\"'")
    return values

def request(endpoint, secret, body, content_type):
    req = urllib.request.Request(APP + "/functions/" + endpoint, data=body, headers={"x-runner-secret": secret, "Content-Type": content_type, "User-Agent": "nexus-video-transfer/1.0"}, method="POST")
    with urllib.request.urlopen(req, timeout=180) as response:
        return json.load(response)

def upload(job, secret, jobs_root):
    source = job.get("source_event_id", "")
    if not re.fullmatch(r"[A-Za-z0-9_-]{6,64}", source):
        raise ValueError("Invalid job identifier")
    root = jobs_root.resolve()
    path = (root / ("job-" + source) / "out.mp4").resolve()
    if not path.is_relative_to(root) or not path.is_file():
        print("Waiting for local MP4:", source, flush=True)
        return
    size = path.stat().st_size
    if size < 12 or size > MAX_SIZE:
        print("Video must be between 12 bytes and 50 MB:", source, flush=True)
        return
    with path.open("rb") as handle:
        if handle.read(12)[4:8] != b"ftyp":
            raise ValueError("Invalid MP4")
    boundary = "nexus-" + uuid.uuid4().hex
    prefix = ("--" + boundary + '\r\nContent-Disposition: form-data; name="source_event_id"\r\n\r\n' + source + "\r\n--" + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="video.mp4"\r\nContent-Type: video/mp4\r\n\r\n').encode()
    result = request("runnerReport", secret, prefix + path.read_bytes() + ("\r\n--" + boundary + "--\r\n").encode(), "multipart/form-data; boundary=" + boundary)
    if not result.get("ok"):
        raise ValueError("Transfer not acknowledged")
    print("Video saved privately in Spark:", source, flush=True)

def install(args):
    if os.geteuid() != 0:
        sys.exit("Run installation with sudo.")
    ROOT.mkdir(parents=True, exist_ok=True)
    values = {**read_env(ROOT / ".env"), **read_env(ROOT / "transfer.env"), **os.environ}
    secret = values.get("RUNNER_SECRET") or getpass.getpass("Existing RUNNER_SECRET (hidden): ")
    if len(secret) < 32 or "\n" in secret or "\r" in secret or '"' in secret:
        sys.exit("A valid existing RUNNER_SECRET is required.")
    config = ROOT / "transfer.env"
    descriptor = os.open(config, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, "w") as handle:
        handle.write('RUNNER_SECRET="' + secret + '"\n')
    os.chmod(config, 0o600)
    target = ROOT / "video-transfer.py"
    if pathlib.Path(__file__).resolve() != target:
        shutil.copyfile(__file__, target)
    if not re.fullmatch(r"[A-Za-z0-9_.-]{1,40}", args.runner_id):
        sys.exit("Invalid runner ID")
    python = shutil.which("python3")
    if not python:
        sys.exit("Python 3 is required")
    unit = "[Unit]\nDescription=Spark private video transfer\nAfter=network-online.target\nWants=network-online.target\n[Service]\nType=simple\nEnvironmentFile=/opt/nexus-runner/transfer.env\nExecStart=" + python + " /opt/nexus-runner/video-transfer.py --runner-id " + args.runner_id + "\nRestart=always\nRestartSec=30\nUMask=0077\n[Install]\nWantedBy=multi-user.target\n"
    pathlib.Path("/etc/systemd/system/nexus-video-transfer.service").write_text(unit)
    subprocess.run(["systemctl", "daemon-reload"], check=True)
    subprocess.run(["systemctl", "enable", "nexus-video-transfer.service"], check=True)
    subprocess.run(["systemctl", "restart", "nexus-video-transfer.service"], check=True)
    print("Transfer helper installed. Existing renders and future completed jobs will be uploaded automatically. Check: sudo journalctl -u nexus-video-transfer -f")

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--install", action="store_true")
parser.add_argument("--runner-id", default="nexus-vps-1")
parser.add_argument("--jobs-root", type=pathlib.Path, default=ROOT / "jobs")
args = parser.parse_args()
if args.install:
    install(args)
    sys.exit(0)
secret = os.environ.get("RUNNER_SECRET") or read_env(ROOT / "transfer.env").get("RUNNER_SECRET")
if not secret:
    sys.exit("RUNNER_SECRET is missing. Run --install first.")
cursor = None
while True:
    try:
        payload = {"operation": "transfers", "runner_id": args.runner_id}
        if cursor:
            payload["cursor"] = cursor
        page = request("runnerPoll", secret, json.dumps(payload).encode(), "application/json")
        if not isinstance(page.get("transfers"), list):
            raise ValueError("Publish the updated Spark app before starting transfers")
        for job in page["transfers"]:
            try:
                upload(job, secret, args.jobs_root)
            except Exception as error:
                print("Transfer will retry:", job.get("source_event_id"), type(error).__name__, flush=True)
        cursor = page.get("next_cursor") if page.get("has_more") else None
    except Exception as error:
        print("Transfer connection will retry:", type(error).__name__, flush=True)
    time.sleep(30)
`;