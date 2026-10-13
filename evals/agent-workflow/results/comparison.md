# Abide / Jev comparison

Generated: 2026-10-11T14:12:15.138Z

Verdict: TEST FURTHER

## Current workflow

- Pass rate: 0.5
- Violation catch rate: 0
- False blocks: 0
- Undetected rule violations: 10

## Current + Abide

- Status: blocked
- Missing: TYPESAFE_AI_API_KEY, AI_GATEWAY_API_KEY
- Pass rate: not measured
- No Abide score was produced. audit and replay also do not accept this suite's transcripts.

## Current + Abide + Jev

- Jev status: blocked
- Missing: TYPESAFE_API_KEY
- Probe: Unauthenticated POST returned HTTP 403 in 152 ms. No repository content was sent.
- Pass rate: not measured
- No Jev score was produced. The harness does not invent answers.

ADOPT is unavailable because neither tool has a measured catch-rate improvement.
REJECT is unavailable because the tools were not executed, so this run cannot show that they fail to reduce violations.
