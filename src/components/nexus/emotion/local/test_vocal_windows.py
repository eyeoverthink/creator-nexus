"""Standard-library checks only; no simulated native predictions."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from fraymus_vocal_analyze import windows, digest_file


class LocalContractTests(unittest.TestCase):
    def test_one_window(self):
        self.assertEqual(list(windows(16000)), [(0, 16000)])

    def test_full_bound(self):
        out = list(windows(4800000))
        self.assertEqual(len(out), 25)
        self.assertEqual(out[-1][1], 4800000)
        self.assertTrue(all(a[1] == b[0] for a, b in zip(out, out[1:])))

    def test_tail_is_not_dropped(self):
        self.assertEqual(list(windows(192001)), [(0, 192000), (192000, 192001)])

    def test_digest_actual_file(self):
        with tempfile.TemporaryDirectory() as folder:
            p = Path(folder) / 'fixture.bin'
            p.write_bytes(b'not a model, explicit fixture')
            self.assertEqual(digest_file(p), hashlib.sha256(p.read_bytes()).hexdigest())

    def test_manifest_matches_report_contract(self):
        m = json.loads((Path(__file__).parent / 'manifest.json').read_text())
        self.assertEqual(len(m['model']['revision']), 40)
        self.assertEqual(len(m['model']['weights_sha256']), 64)
        self.assertEqual(m['sample_rate'], 16000)
        self.assertEqual(m['window_seconds'], 12)
        self.assertEqual(m['max_seconds'], 300)


if __name__ == '__main__':
    unittest.main()