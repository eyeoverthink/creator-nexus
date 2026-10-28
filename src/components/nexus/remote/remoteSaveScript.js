import {saveBlob} from '@/components/nexus/remote/downloadMaterial';
// Standard-library Python script that copies all material and media files to a local folder.
const script=endpoint=>`#!/usr/bin/env python3
"""Creator Nexus local save.

Copies your Creator Nexus material (Library items, rendered videos and voice
audio, drafts, productions, builds, knowledge, sparks, chats, models and
workflows) plus their media files into a folder on this computer.
Needs only Python 3, no extra packages.

  python creator_nexus_save.py --key cnx_YOURKEY
  python creator_nexus_save.py --key cnx_YOURKEY --types library,media --since 2026-10-01

You can set the NEXUS_KEY environment variable instead of passing --key.
Run it again any time: items are refreshed and files already saved are skipped.
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

ENDPOINT = "${endpoint}"


def call(key, payload):
    data = json.dumps(payload).encode("utf-8")
    for attempt in range(5):
        request = urllib.request.Request(ENDPOINT, data=data, method="POST", headers={"Content-Type": "application/json", "X-Nexus-Key": key})
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "replace")[:300]
            if error.code in (429, 500, 502, 503, 504) and attempt < 4:
                time.sleep(10 * (attempt + 1))
                continue
            sys.exit("Request failed (%s): %s" % (error.code, detail))
        except urllib.error.URLError as error:
            if attempt < 4:
                time.sleep(10 * (attempt + 1))
                continue
            sys.exit("Could not reach Creator Nexus: %s" % error.reason)


def safe(name):
    return re.sub(r"[^A-Za-z0-9._-]+", "_", str(name))[:120] or "file"


def main():
    parser = argparse.ArgumentParser(description="Save your Creator Nexus material on this computer.")
    parser.add_argument("--key", default=os.environ.get("NEXUS_KEY", ""), help="your remote key (cnx_...)")
    parser.add_argument("--out", default="creator-nexus-save", help="folder to save into")
    parser.add_argument("--types", default="", help="comma-separated types, e.g. library,media")
    parser.add_argument("--since", default="", help="only items changed since this date, e.g. 2026-10-01")
    parser.add_argument("--no-files", action="store_true", help="save records only, skip media files")
    args = parser.parse_args()
    if not args.key:
        sys.exit("Pass --key cnx_... or set the NEXUS_KEY environment variable.")

    catalog = call(args.key, {"action": "catalog"})
    known = [entry["type"] for entry in catalog["types"]]
    wanted = [name.strip() for name in args.types.split(",") if name.strip()] or known
    print("Saving for", catalog.get("account", {}).get("email") or "your account")
    for kind in wanted:
        if kind not in known:
            print("Skipping unknown type:", kind)
            continue
        folder = os.path.join(args.out, kind)
        os.makedirs(folder, exist_ok=True)
        cursor, saved, files = None, 0, 0
        while True:
            payload = {"action": "list", "type": kind, "limit": 50, "include_files": not args.no_files}
            if cursor:
                payload["cursor"] = cursor
            if args.since:
                payload["since"] = args.since
            page = call(args.key, payload)
            for item in page["items"]:
                attached = item.pop("_files", [])
                with open(os.path.join(folder, item["id"] + ".json"), "w", encoding="utf-8") as handle:
                    json.dump(item, handle, ensure_ascii=False, indent=2)
                saved += 1
                for entry in attached:
                    if not entry.get("url"):
                        continue
                    target = os.path.join(folder, item["id"] + "_" + safe(entry.get("file_name") or entry["field"]))
                    if os.path.exists(target):
                        continue
                    try:
                        urllib.request.urlretrieve(entry["url"], target)
                        files += 1
                    except Exception as error:
                        print("  could not download", entry.get("file_name") or entry["field"], "-", error)
            print("%s: %d items, %d new files" % (kind, saved, files))
            if not page.get("has_more"):
                break
            cursor = page.get("next_cursor")
    print("Done. Saved to", os.path.abspath(args.out))


if __name__ == "__main__":
    main()
`;
export function downloadSaveScript(endpoint){saveBlob('creator_nexus_save.py',new Blob([script(endpoint)],{type:'text/x-python'}));}