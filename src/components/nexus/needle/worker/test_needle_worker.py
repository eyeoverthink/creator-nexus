"""Protocol/unit fixtures only; these tests do not run the real Windows model."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch
import needle_runtime as runtime
import needle_worker as worker


class RuntimeTests(unittest.TestCase):
    def manifest(self, root):
        manifest = {'model': 'fixture', 'revision': 'fixture', 'engine_version': 'fixture'}
        for name in ('weights', 'library', 'wheel'):
            p = Path(root) / name
            p.write_bytes(('fixture-' + name).encode())
            manifest[name] = str(p)
            manifest[name + '_sha256'] = hashlib.sha256(p.read_bytes()).hexdigest()
        return manifest

    def test_platform_rejected(self):
        with patch.object(runtime.sys, 'platform', 'linux'):
            with self.assertRaisesRegex(RuntimeError, '64-bit Windows'):
                runtime.verify_installation({})

    def test_hash_match_and_tamper_fail_closed(self):
        with tempfile.TemporaryDirectory() as root, patch.object(runtime.sys, 'platform', 'win32'):
            m = self.manifest(root)
            self.assertEqual(runtime.verify_installation(m)['weights_sha256'], m['weights_sha256'])
            Path(m['library']).write_bytes(b'changed')
            with self.assertRaisesRegex(RuntimeError, 'SHA-256 mismatch'):
                runtime.verify_installation(m)

    def test_native_abi_and_no_reasoning_forwarded(self):
        with tempfile.TemporaryDirectory() as root, patch.object(runtime.sys, 'platform', 'win32'):
            m = self.manifest(root)
            lib = MagicMock()
            lib.needle_load.return_value = 0
            lib.needle_init.return_value = 0
            def complete(*args):
                self.assertEqual(args[1:4], (None, 0, 128))
                args[-2].value = json.dumps({'type': 'call', 'success': True, 'function_calls': [], 'reasoning': 'private'}).encode()
                return 1
            lib.needle_complete.side_effect = complete
            with patch.object(runtime.ctypes, 'CDLL', return_value=lib), patch.object(runtime.os, 'add_dll_directory', create=True):
                result = runtime.native_complete(m, worker.SMOKE)
            self.assertNotIn('reasoning', result)
            self.assertEqual(lib.needle_load.call_args.args[0], Path(m['weights']).read_bytes())
            self.assertEqual(len(lib.needle_complete.argtypes), 6)

    def test_timeout_terminates_native_child(self):
        ctx, parent, child, process = MagicMock(), MagicMock(), MagicMock(), MagicMock()
        ctx.Pipe.return_value = (parent, child)
        ctx.Process.return_value = process
        parent.poll.return_value = False
        process.is_alive.return_value = True
        with patch.object(worker.mp, 'get_context', return_value=ctx):
            with self.assertRaisesRegex(RuntimeError, '140 seconds'):
                worker.isolated_complete({}, worker.SMOKE)
        process.terminate.assert_called_once()
        process.kill.assert_called_once()
        parent.close.assert_called_once()


if __name__ == '__main__':
    unittest.main()