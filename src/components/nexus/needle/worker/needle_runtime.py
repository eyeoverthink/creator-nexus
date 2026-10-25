"""Pinned Needle3 C ABI adapter. No package install, model download or tool execution."""
import ctypes
import hashlib
import json
import os
import struct
import sys
from pathlib import Path


def digest_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(4 * 1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def verify_installation(manifest):
    if sys.platform != 'win32' or struct.calcsize('P') != 8:
        raise RuntimeError('This pinned installation requires 64-bit Windows Python.')
    paths = {'weights': manifest['weights'], 'library': manifest['library'],
             'wheel': manifest['wheel']}
    proof = {k: manifest[k] for k in ('model', 'revision', 'engine_version')}
    for name, path in paths.items():
        if not Path(path).is_file():
            raise RuntimeError('Missing local ' + name + ': ' + path)
        actual = digest_file(path)
        if actual != manifest[name + '_sha256']:
            raise RuntimeError('SHA-256 mismatch for ' + name + '; refusing to load.')
        proof[name + '_sha256'] = actual
    return proof


def native_complete(manifest, request):
    # Called only in a short-lived child process. Recheck before every DLL load.
    verify_installation(manifest)
    os.environ['NEEDLE_TELEMETRY'] = '0'
    os.environ['DO_NOT_TRACK'] = '1'
    directory = os.add_dll_directory(str(Path(manifest['library']).parent))
    try:
        lib = ctypes.CDLL(manifest['library'])
        lib.needle_load.argtypes = [ctypes.c_char_p, ctypes.c_uint64]
        lib.needle_load.restype = ctypes.c_int
        lib.needle_init.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_char_p]
        lib.needle_init.restype = ctypes.c_int
        lib.needle_complete.argtypes = [ctypes.c_char_p, ctypes.POINTER(ctypes.c_float),
                                       ctypes.c_int, ctypes.c_int, ctypes.c_char_p, ctypes.c_int]
        lib.needle_complete.restype = ctypes.c_int
        with open(manifest['weights'], 'rb') as f:
            weights = f.read()
        if lib.needle_load(weights, len(weights)) < 0:
            raise RuntimeError('needle_load rejected the pinned weights.')
        if lib.needle_init(request['system'].encode('utf-8'),
                           json.dumps(request['tools'], ensure_ascii=False).encode('utf-8'), None) < 0:
            raise RuntimeError('needle_init failed.')
        buffer = ctypes.create_string_buffer(65536)
        rc = lib.needle_complete(request['prompt'].encode('utf-8'), None, 0,
                                 request['max_new_tokens'], buffer, len(buffer))
        if rc < 0:
            raise RuntimeError('needle_complete failed with code ' + str(rc))
        result = json.loads(buffer.value.decode('utf-8'))
        # Deliberately exclude private model reasoning and arbitrary native fields.
        allowed = ('type', 'success', 'error', 'function_calls', 'confidence',
                   'prefill_tps', 'decode_tps', 'peak_ram_mb')
        return {k: result[k] for k in allowed if k in result}
    finally:
        directory.close()