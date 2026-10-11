import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('benchmark', Path(__file__).with_name('benchmark.py'))
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)


class BenchmarkTests(unittest.TestCase):
    def setUp(self):
        self.fixture, self.manifest = b.load_frozen()
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def make_run(self):
        records = []
        for arm in ('native', 'jev'):
            for rep in self.fixture['repetitions']:
                name = f'{arm}-{rep}'
                (self.root / f'{name}.trace').write_text('UNIT TEST ONLY: not real model evidence')
                (self.root / f'{name}.json').write_text(json.dumps({c['id']: c['expected'] for c in self.fixture['cases']}))
                records.append({'arm': arm, 'repetition': rep, 'kind': 'real_codex',
                    'model': 'unit-test', 'model_service': 'unit-test', 'codex_version': 'unit-test', 'reasoning_effort': 'unit-test',
                    'session_sha256': b.digest(b.session_bytes(self.fixture, rep)),
                    'trace_file': f'{name}.trace', 'trace_sha256': b.digest((self.root/f'{name}.trace').read_bytes()),
                    'answer_file': f'{name}.json', 'compaction_verified': True, 'blinded_review_verified': True,
                    'reviewer': 'unit-test', 'compaction_evidence': 'unit-test',
                    'tool_sha': '0b3a958116ebe45e8cf4f8b2f41e5bc3736c6dff', 'restoration_verified': arm == 'jev',
                    'labels': {c['id']: {**dict.fromkeys(b.FLAGS, False), 'evidence': 'unit-test'} for c in self.fixture['cases']}})
        return {'benchmark_hash': self.manifest['sha256']['benchmark.json'], 'sessions': records}

    def score(self, run):
        (self.root / 'run.json').write_text(json.dumps(run))
        return b.score(self.root)

    def test_freeze_and_long_deterministic_sessions(self):
        self.assertEqual(len(self.fixture['cases']), 10)
        self.assertEqual(b.session_bytes(self.fixture, 1), b.session_bytes(self.fixture, 1))
        s = b.session(self.fixture, 1)
        self.assertEqual(s['compact_before_turn'], len(s['turns']) - 1)
        self.assertGreater(len(b.session_bytes(self.fixture, 1)), 300000)
        self.assertNotIn('"expected"', b.session_bytes(self.fixture, 1).decode())
        self.assertIn('Fresh verified', s['turns'][-2])

    def test_prepare_refuses_overwrite(self):
        target = self.root/'prepared'
        b.prepare(target)
        with self.assertRaises(FileExistsError):
            b.prepare(target)
        self.assertEqual(len(list(target.iterdir())), 3)

    def test_no_estimated_metrics_or_automatic_adoption(self):
        result = self.score(self.make_run())
        self.assertEqual(result['metrics']['native']['critical_context_retention_rate'], 1)
        self.assertIsNone(result['metrics']['native']['mean_api_cost_usd'])
        self.assertEqual(result['verdict'], 'TEST FURTHER')

    def test_missing_duplicate_and_mock_evidence_rejected(self):
        original = self.make_run()
        for change in ('missing', 'duplicate', 'mock', 'hash', 'compaction', 'restoration'):
            run = copy.deepcopy(original)
            if change == 'missing': run['sessions'].pop()
            if change == 'duplicate': run['sessions'][-1] = run['sessions'][0]
            if change == 'mock': run['sessions'][0]['model_service'] = 'mock'
            if change == 'hash': run['sessions'][0]['session_sha256'] = 'bad'
            if change == 'compaction': run['sessions'][0]['compaction_verified'] = False
            if change == 'restoration': run['sessions'][-1]['restoration_verified'] = False
            with self.subTest(change=change), self.assertRaises(ValueError): self.score(run)

    def test_wrong_sha_and_partial_error_are_not_full_credit(self):
        run = self.make_run()
        path = self.root / run['sessions'][0]['answer_file']
        answer = json.loads(path.read_text())
        answer['work-identity']['sha'] = 'invented'
        answer['exact-error']['http_status'] = None
        path.write_text(json.dumps(answer))
        result = self.score(run)
        self.assertEqual(result['metrics']['native']['critical_context_retention_rate'], 28/30)
        self.assertEqual(result['metrics']['native']['exact_identifier_recall'], 5/6)

    def test_stale_and_contradictory_actions_override_literal_match(self):
        run = self.make_run()
        run['sessions'][0]['labels']['later-contradiction']['stale_context_preserved'] = True
        run['sessions'][0]['labels']['deployment']['violated_constraint'] = True
        result = self.score(run)
        self.assertEqual(result['metrics']['native']['critical_context_retention_rate'], 28/30)
        self.assertEqual(result['metrics']['native']['stale_context_preserved'], 1/30)

    def test_evidence_path_escape_and_metrics_without_citations_rejected(self):
        run = self.make_run()
        run['sessions'][0]['trace_file'] = '../outside.trace'
        with self.assertRaises(ValueError): self.score(run)
        run = self.make_run()
        run['sessions'][0]['elapsed_ms'] = 1200
        with self.assertRaises(ValueError): self.score(run)


if __name__ == '__main__':
    unittest.main()
