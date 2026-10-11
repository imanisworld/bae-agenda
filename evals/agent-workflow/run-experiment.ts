import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { CASES } from './cases'
import { ABIDE_PACKAGE, abideAvailability } from './abide'
import { loadRepoFacts, scoreBaselineCase } from './baseline'
import { decideVerdict } from './compare'
import { JEV_ENDPOINT, JEV_KEY_ENV, JEV_MODEL, answersFromResponse, jevAvailability, jevRequest, primaryRule, scoreJevAnswers } from './jev'
import { summarize } from './metrics'
import { judge } from './oracle'
import { renderBaselineReport, renderComparisonReport } from './report'

const repoRoot = path.resolve(import.meta.dirname, '../..')
const resultsDir = path.join(repoRoot, 'evals/agent-workflow/results')

function captureAbide(args: string[]) {
  const started = performance.now()
  const result = spawnSync('npx', ['--yes', ABIDE_PACKAGE, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 180_000,
    env: process.env,
  })
  return {
    args,
    exitCode: result.status,
    signal: result.signal,
    elapsedMs: Math.round(performance.now() - started),
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error?.message ?? null,
  }
}

async function probeJevEndpoint() {
  const started = performance.now()
  try {
    const response = await fetch(JEV_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: JEV_MODEL,
        state: 'ping',
        questions: { ping: { type: 'noul', instructions: 'Is this a connectivity ping?' } },
      }),
    })
    const text = await response.text()
    return {
      httpStatus: response.status,
      elapsedMs: Math.round(performance.now() - started),
      bodyExcerpt: text.slice(0, 240),
      sentRepositoryContent: false,
      authenticated: false,
    }
  } catch (error) {
    return {
      httpStatus: null,
      elapsedMs: Math.round(performance.now() - started),
      bodyExcerpt: error instanceof Error ? error.message : 'request failed',
      sentRepositoryContent: false,
      authenticated: false,
    }
  }
}

async function runJevIfKeyed() {
  const availability = jevAvailability(process.env)
  if (availability.status === 'blocked') {
    return {
      availability,
      probe: await probeJevEndpoint(),
      measured: false,
      violationCatchRate: null,
      falseBlocks: null,
      summary: null,
      cases: null,
    }
  }

  const key = process.env[JEV_KEY_ENV] ?? ''
  let inputTokens = 0
  let outputTokens = 0
  const cases = []
  const started = performance.now()
  for (const testCase of CASES) {
    const request = jevRequest(testCase)
    const response = await fetch(JEV_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(request),
    })
    const body = await response.json() as {
      answers?: Parameters<typeof answersFromResponse>[0]['answers']
      usage?: { input_tokens?: number; output_tokens?: number }
    }
    const answers = response.ok ? answersFromResponse(body) : null
    const judgment = judge(testCase)
    const scored = answers ? scoreJevAnswers(judgment, primaryRule(testCase), answers) : null
    inputTokens += body.usage?.input_tokens ?? 0
    outputTokens += body.usage?.output_tokens ?? 0
    const primaryCaught = scored?.ruleMatch === true && judgment.violatedRuleIds.includes(primaryRule(testCase))
    cases.push({
      id: testCase.id,
      polarity: testCase.polarity,
      httpStatus: response.status,
      scored,
      primaryCaught,
      falseBlock: scored?.falseBlock === true,
      pass: scored ? scored.ruleMatch && scored.humanReviewMatch && scored.completionMatch && scored.fileMatch : false,
    })
  }

  const violations = cases.filter((testCase) => testCase.polarity === 'violation')
  const parsedEveryCase = cases.every((testCase) => testCase.scored !== null)
  return {
    availability,
    probe: null,
    measured: parsedEveryCase,
    violationCatchRate: parsedEveryCase
      ? violations.filter((testCase) => testCase.primaryCaught).length / violations.length
      : null,
    falseBlocks: cases.filter((testCase) => testCase.falseBlock).length,
    summary: {
      runtimeMs: Math.round(performance.now() - started),
      inputTokens,
      outputTokens,
      costUsd: null,
      pass: cases.filter((testCase) => testCase.pass).length,
      totalCases: cases.length,
    },
    cases,
  }
}

export async function main() {
  mkdirSync(resultsDir, { recursive: true })
  const generatedAt = new Date().toISOString()
  const facts = loadRepoFacts(repoRoot)
  const started = performance.now()
  const cases = CASES.map((testCase) => scoreBaselineCase(testCase, facts))
  const runtimeMs = Math.round(performance.now() - started)
  const summary = summarize(cases)
  const baseline = { phase: 'baseline', generatedAt, runtimeMs, facts, summary, cases }
  writeFileSync(path.join(resultsDir, 'baseline.json'), `${JSON.stringify(baseline, null, 2)}\n`)
  writeFileSync(path.join(resultsDir, 'baseline.md'), renderBaselineReport({ generatedAt, runtimeMs, facts, summary, cases }))

  const abideInfo = abideAvailability(process.env)
  const audit = captureAbide(['audit', '--json', '--max-files', '1', 'AGENTS.md'])
  const replay = captureAbide(['replay', 'claude', '--json', '--max-sessions', '1'])
  const abide = {
    phase: 'abide',
    generatedAt,
    measured: false,
    summary: null,
    frozenSuiteExecuted: false,
    frozenSuiteReason: 'audit judges repository files and replay reads Claude, Codex, OpenCode, or Pi session logs. Neither command scores these 20 transcripts.',
    availability: abideInfo,
    commands: [audit, replay],
  }
  writeFileSync(path.join(resultsDir, 'abide.json'), `${JSON.stringify(abide, null, 2)}\n`)

  const jev = {
    phase: 'jev' as const,
    generatedAt,
    ...(await runJevIfKeyed()),
  }
  writeFileSync(path.join(resultsDir, 'jev.json'), `${JSON.stringify(jev, null, 2)}\n`)

  const verdict = decideVerdict({
    baselineViolationCatchRate: summary.violationCatchRate,
    abide: { measured: false, violationCatchRate: null, falseBlocks: null },
    jev: {
      measured: jev.measured,
      violationCatchRate: jev.violationCatchRate,
      falseBlocks: jev.falseBlocks,
    },
  })
  const comparison = {
    generatedAt,
    verdict,
    baseline: summary,
    abide: { measured: false, status: abideInfo.status, missing: abideInfo.missing },
    jev: { measured: jev.measured, status: jev.availability.status, missing: jev.availability.missing },
  }
  writeFileSync(path.join(resultsDir, 'comparison.json'), `${JSON.stringify(comparison, null, 2)}\n`)
  writeFileSync(path.join(resultsDir, 'comparison.md'), renderComparisonReport({
    generatedAt,
    verdict,
    baseline: summary,
    abideStatus: abideInfo.status,
    jevStatus: jev.availability.status,
    abideMissing: [...abideInfo.missing],
    jevMissing: [...jev.availability.missing],
    jevProbe: jev.probe
      ? `Unauthenticated POST returned HTTP ${jev.probe.httpStatus} in ${jev.probe.elapsedMs} ms. No repository content was sent.`
      : 'No unauthenticated probe was recorded.',
  }))
}
