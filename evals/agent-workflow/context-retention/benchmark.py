#!/usr/bin/env python3
"""Offline preparation and evidence scoring. Never starts a model or calls an API."""
import argparse
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FLAGS = ('hallucinated_detail', 'repeated_completed_work', 'violated_constraint',
         'wrong_identifier', 'stale_context_preserved', 'restoration_noise')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load_frozen():
    manifest = json.loads((ROOT / 'freeze.json').read_text())
    for name, expected in manifest['sha256'].items():
        if digest((ROOT / name).read_bytes()) != expected:
            raise ValueError(f'Frozen artifact changed: {name}; create a NEW benchmark version')
    return json.loads((ROOT / 'benchmark.json').read_text()), manifest


def session(fixture, repetition):
    if repetition not in fixture['repetitions']:
        raise ValueError('Unknown repetition')
    opening = ('This is a synthetic Bae Agenda memory evaluation, not a request to operate the app. '
               'Do not execute side effects. Treat the following as session facts, then acknowledge briefly.\n')
    opening += '\n'.join(c['early'] for c in fixture['cases'])
    turns = [opening]
    files = {}
    for turn in range(fixture['intervening_turns']):
        topic = fixture['distractor_topics'][turn % len(fixture['distractor_topics'])]
        # No random generator, clock, credentials, real customer data, or oracle in prepared files.
        lines = [f'Synthetic diagnostic batch {repetition}:{turn}:{line} for {topic}: '
                 f'fixture row {line:03d} was inspected; sample count={(turn + line) % 31}; '
                 'render duration bucket=normal; fixture checksum group=sample; '
                 'diagnostic counters are synthetic and carry no business-state meaning.'
                 for line in range(fixture['lines_per_turn'])]
        name = f'diagnostics/batch-{turn:02d}.txt'
        files[name] = '\n'.join(lines) + '\n'
        turns.append(f'Read {name} using the local file tool and acknowledge briefly. '
                     'The previous diagnostic batch is complete; its row-level counters are no longer needed.')
    turns.append('Fresh verified repository state, supplied after the historical context:\n' + fixture['fresh_state']['text'] + '\nAcknowledge briefly.')
    turns.append('Answer from this session and its native summary/restored archive. Do not use outside history. '
                 'Return only one JSON object keyed by the case IDs below, with the named answer fields. '
                 'Use null for an unknown value, rather than inventing it. No actions should be executed.\n' +
                 '\n'.join(f"{c['id']}: {c['probe']} Fields: {', '.join(c['expected'])}." for c in fixture['cases']))
    return {'repetition': repetition, 'compact_before_turn': len(turns)-1,
            'turns': turns, 'files': files, 'schema_version': 1}


def session_bytes(fixture, repetition):
    return (json.dumps(session(fixture, repetition), indent=2) + '\n').encode()


def prepare(output):
    fixture, manifest = load_frozen()
    output.mkdir(parents=True, exist_ok=False)
    for repetition in fixture['repetitions']:
        raw = session_bytes(fixture, repetition)
        target = output / f'session-{repetition}'
        target.mkdir()
        (target / 'session.json').write_bytes(raw)
        for name, content in session(fixture, repetition)['files'].items():
            path = target / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
    print(json.dumps({'status': 'prepared_not_run', 'directory': str(output.resolve()),
                      'benchmark_hash': manifest['sha256']['benchmark.json'],
                      'sessions': len(fixture['repetitions']), 'network_calls': 0}))


def read_evidence(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file():
        raise ValueError('Evidence must be an existing file inside the run directory')
    return path.read_bytes()


def score(root):
    fixture, manifest = load_frozen()
    run = json.loads((root / 'run.json').read_text())
    if run['benchmark_hash'] != manifest['sha256']['benchmark.json']:
        raise ValueError('Benchmark hash mismatch')
    expected_keys = {(arm, rep) for arm in ('native', 'jev') for rep in fixture['repetitions']}
    if len(run['sessions']) != len(expected_keys) or {(s['arm'], s['repetition']) for s in run['sessions']} != expected_keys:
        raise ValueError('Exactly three real sessions per arm are required')
    configs = []
    rows = []
    for record in run['sessions']:
        if record['kind'] != 'real_codex' or record['model_service'] in ('mock', 'synthetic', 'loopback'):
            raise ValueError('Synthetic smoke tests are not retention results')
        for field in ('model', 'model_service', 'codex_version', 'reasoning_effort'):
            if not record.get(field):
                raise ValueError(f'Missing {field}')
        configs.append(tuple(record[f] for f in ('model', 'model_service', 'codex_version', 'reasoning_effort')))
        if record['session_sha256'] != digest(session_bytes(fixture, record['repetition'])):
            raise ValueError('Session prompt mismatch')
        # Human review must confirm complete prompt delivery, actual native compaction,
        # no oracle access, arm isolation, and no unsafe actions from these raw traces.
        trace = read_evidence(root, record['trace_file'])
        if digest(trace) != record['trace_sha256'] or not trace:
            raise ValueError('Raw trace hash mismatch or empty trace')
        if record['compaction_verified'] is not True or record['blinded_review_verified'] is not True:
            raise ValueError('Compaction and blinded trace review are required')
        if not record.get('reviewer') or not record.get('compaction_evidence'):
            raise ValueError('Reviewer and trace location for compaction are required')
        if record['arm'] == 'jev':
            if record.get('tool_sha') != '0b3a958116ebe45e8cf4f8b2f41e5bc3736c6dff' or record.get('restoration_verified') is not True:
                raise ValueError('Pinned tool and actual restoration evidence required')
        elif record.get('restoration_verified') is not False:
            raise ValueError('Native baseline must have no Jev restoration')
        answer = json.loads(read_evidence(root, record['answer_file']))
        if set(answer) != {c['id'] for c in fixture['cases']}:
            raise ValueError('Missing or extra answer IDs')
        if set(record['labels']) != set(answer):
            raise ValueError('Missing or extra label IDs')
        for case in fixture['cases']:
            actual = answer[case['id']]
            if not isinstance(actual, dict) or set(actual) != set(case['expected']):
                raise ValueError('Answer fields do not match schema; record unknown values as null')
            labels = record['labels'][case['id']]
            if any(type(labels.get(flag)) is not bool for flag in FLAGS):
                raise ValueError('Every human error/noise label must be explicitly true or false')
            if not labels.get('evidence'):
                raise ValueError('Every judgment needs a response/trace evidence citation')
            matched = sum(type(actual[k]) is type(v) and actual[k] == v for k, v in case['expected'].items())
            status = 'correct' if matched == len(actual) else 'partial' if matched else 'forgotten'
            # Matching literal fields does not excuse contradictory actions or invented detail.
            if any(labels[f] for f in FLAGS if f != 'restoration_noise'):
                status = 'failed'
            rows.append({'arm': record['arm'], 'repetition': record['repetition'], 'id': case['id'],
                         'status': status, **{flag: labels[flag] for flag in FLAGS}})
        for metric in ('elapsed_ms', 'api_cost_usd', 'input_tokens', 'output_tokens', 'tool_calls'):
            value = record.get(metric)
            if value is not None and (type(value) not in (int, float) or not math.isfinite(value) or value < 0):
                raise ValueError('Metrics must be nonnegative measured numbers or null')
            if value is not None and not record.get('metric_evidence', {}).get(metric):
                raise ValueError('Measured metrics require a trace/billing citation')
    if len(set(configs)) != 1:
        raise ValueError('Model, runtime, provider, and reasoning effort must match between all sessions')
    metrics = {}
    for arm in ('native', 'jev'):
        subset = [r for r in rows if r['arm'] == arm]
        records = [s for s in run['sessions'] if s['arm'] == arm]
        metrics[arm] = {'critical_context_retention_rate': sum(r['status'] == 'correct' for r in subset)/len(subset),
                        'cases': len(subset), **{f: sum(r[f] for r in subset)/len(subset) for f in FLAGS}}
        identifiers = [r for r in subset if r['id'] in ('exact-path', 'work-identity')]
        metrics[arm]['exact_identifier_recall'] = sum(r['status'] == 'correct' for r in identifiers)/len(identifiers)
        for metric in ('elapsed_ms', 'api_cost_usd', 'input_tokens', 'output_tokens', 'tool_calls'):
            values = [r.get(metric) for r in records]
            metrics[arm][f'mean_{metric}'] = sum(values)/len(values) if all(v is not None for v in values) else None
    # Numeric results do not independently authorize adoption. Operator reviews cost,
    # setup complexity and preregistered bars; this tool cannot install or adopt anything.
    return {'verdict': 'TEST FURTHER', 'reason': 'Independent adoption-bar review required; no automatic adoption',
            'metrics': metrics, 'per_case': rows, 'adoption_contract': fixture['adoption']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['prepare', 'score'])
    parser.add_argument('directory', type=Path)
    args = parser.parse_args()
    if args.command == 'prepare':
        prepare(args.directory)
    else:
        print(json.dumps(score(args.directory), indent=2))


if __name__ == '__main__':
    main()
