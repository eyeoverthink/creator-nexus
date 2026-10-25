"""Outbound-only Creator Nexus Needle3 worker. No HTTP listener or action executor."""
import argparse
import getpass
import hashlib
import json
import multiprocessing as mp
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from needle_runtime import native_complete, verify_installation

ENDPOINT = 'https://creator-nexus.base44.app/functions/fraymusBrain'
SMOKE = {'prompt': 'Record this note: Needle bridge ready', 'system': 'Extract the supplied note.',
         'max_new_tokens': 128, 'tools': [{'name': 'record_note', 'description': 'Record the supplied note.',
         'parameters': {'type': 'object', 'properties': {'note': {'type': 'string', 'maxLength': 512}},
                        'required': ['note'], 'additionalProperties': False}}]}


def child_run(pipe, manifest, request):
    try:
        pipe.send({'result': native_complete(manifest, request)})
    except BaseException as e:
        pipe.send({'error': str(e)[:900]})
    finally:
        pipe.close()


def isolated_complete(manifest, request):
    ctx = mp.get_context('spawn')
    parent, child = ctx.Pipe(duplex=False)
    process = ctx.Process(target=child_run, args=(child, manifest, request), daemon=True)
    process.start()
    child.close()
    try:
        if not parent.poll(140):
            raise RuntimeError('Local native inference exceeded 140 seconds.')
        try:
            message = parent.recv()
        except EOFError:
            raise RuntimeError('Native process exited before returning a result; check DLL dependencies and available memory.') from None
        if 'error' in message:
            raise RuntimeError(message['error'])
        return message['result']
    finally:
        if process.is_alive():
            process.terminate()
        process.join(5)
        if process.is_alive():
            process.kill()
            process.join()
        parent.close()


class TerminalError(Exception):
    pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--worker-id', required=True)
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    home = Path(__file__).resolve().parent
    manifest = json.loads((home / 'installation.json').read_text(encoding='utf-8-sig'))
    supplied_token = os.environ.pop('FRAYMUS_NEEDLE_TOKEN', '')
    print('Checking local model, DLL and wheel SHA-256 values...')
    proof = verify_installation(manifest)
    smoke = isolated_complete(manifest, SMOKE)
    calls = smoke.get('function_calls', [])
    if not smoke.get('success') or smoke.get('type') != 'call' or len(calls) != 1 or calls[0].get('name') != 'record_note' or calls[0].get('arguments', {}).get('note') != 'Needle bridge ready':
        raise RuntimeError('Native smoke check did not return the exact expected note.')
    proof['smoke_passed'] = True
    print('Pinned files match and native smoke inference passed.')
    if args.check_only:
        return
    token = supplied_token or getpass.getpass('Paste the one-time displayed pairing token: ').strip()
    if len(token) != 64 or any(c not in '0123456789abcdef' for c in token):
        raise RuntimeError('Pairing token must be 64 hexadecimal characters.')

    def post(action, **fields):
        body = json.dumps({'action': action, 'worker_id': args.worker_id, **fields}, ensure_ascii=False, allow_nan=False).encode('utf-8')
        request = urllib.request.Request(ENDPOINT, data=body, method='POST', headers={'Content-Type': 'application/json', 'x-needle-token': token})
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read(60000))
        except urllib.error.HTTPError as e:
            if e.code in (400, 401, 403, 409):
                detail = json.loads(e.read(4096)).get('error', 'Bridge rejected the request.')
                if 'Authentication required to view users' in detail:
                    detail = 'Publish the latest app version before starting this worker. The public endpoint still requires app-user login.'
                raise TerminalError(detail) from None
            raise

    post('needle_worker_hello', attestation=proof)
    print('Paired. Waiting for workspace requests. Ctrl+C stops this worker.')
    pending_file = home / 'pending-receipt.json'
    wait = 30
    while True:
        try:
            if pending_file.exists():
                pending = json.loads(pending_file.read_text(encoding='utf-8'))
                if pending.pop('_worker_id', None) != args.worker_id:
                    raise TerminalError('Pending receipt belongs to a different pairing; review/remove it before restarting.')
                try:
                    post('needle_worker_report', **pending)
                    print('Request result accepted by the bridge.')
                except TerminalError as e:
                    if 'expired' in str(e) or 'cancelled' in str(e):
                        print('Pending request expired or was cancelled; discarding its local receipt.')
                    else:
                        raise
                pending_file.unlink()
            response = post('needle_worker_poll')
            job = response.get('job')
            if job:
                if hashlib.sha256(job['input_json'].encode('utf-8')).hexdigest() != job['input_sha256']:
                    raise TerminalError('Request digest mismatch; refusing inference.')
                pending = {'job_id': job['id'], 'nonce': job['nonce'], 'lease_id': job['lease_id'], 'input_sha256': job['input_sha256'], '_worker_id': args.worker_id}
                try:
                    result = isolated_complete(manifest, json.loads(job['input_json']))
                    raw = json.dumps(result, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)
                    if len(raw) > 14000:
                        raise RuntimeError('Native output exceeds bridge limit.')
                    pending.update(result_json=raw, output_sha256=hashlib.sha256(raw.encode('utf-8')).hexdigest())
                except Exception as e:
                    pending['error'] = str(e)[:900]
                temporary = pending_file.with_suffix('.tmp')
                temporary.write_text(json.dumps(pending, ensure_ascii=False), encoding='utf-8')
                temporary.replace(pending_file)
                continue
            wait = 30
            time.sleep(max(30, response.get('poll_after_seconds', 30)))
        except TerminalError:
            raise
        except (urllib.error.URLError, TimeoutError, OSError):
            print('Bridge unavailable; retaining any pending receipt and backing off.')
            time.sleep(wait)
            wait = min(120, wait * 2)


if __name__ == '__main__':
    mp.freeze_support()
    try:
        main()
    except KeyboardInterrupt:
        print('Worker stopped.')
    except Exception as e:
        print('Worker stopped:', str(e))
        raise SystemExit(1)