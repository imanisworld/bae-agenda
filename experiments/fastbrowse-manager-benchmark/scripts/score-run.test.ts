import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BENCHMARK_ROOT,
  loadJson,
  scoreBenchmark,
  type ObservedLead,
  type ScoringProfile,
} from './apply-manager-rules'

type Claim = {
  id: string
  label: 'evidenced' | 'contradicted' | 'inference' | 'unknown'
  quote: string | null
  url: string | null
}

describe('baseline metric file', () => {
  it('scores the frozen observations and writes the metric file', () => {
    const profile = loadJson<ScoringProfile>('fixtures/scoring-profile.json')
    const observations = loadJson<{
      system: string
      tool_calls: { http_fetches: number; web_searches: number; fastbrowse_runs: number }
      cost: number | null
      leads: ObservedLead[]
      claims: Claim[]
    }>('results/baseline-observations.json')

    const metrics = scoreBenchmark(profile, observations.leads)
    const claims = {
      total: observations.claims.length,
      evidenced: observations.claims.filter((claim) => claim.label === 'evidenced').length,
      contradicted: observations.claims.filter((claim) => claim.label === 'contradicted').length,
      inference: observations.claims.filter((claim) => claim.label === 'inference').length,
      unknown: observations.claims.filter((claim) => claim.label === 'unknown').length,
      missing_quote: observations.claims
        .filter((claim) => claim.label !== 'unknown' && (!claim.quote || !claim.url))
        .map((claim) => claim.id),
    }

    writeFileSync(
      path.join(BENCHMARK_ROOT, 'results/baseline-metrics.json'),
      `${JSON.stringify({
        system: observations.system,
        tool_calls: observations.tool_calls,
        cost: observations.cost,
        metrics,
        claims,
      }, null, 2)}\n`
    )

    expect(metrics.unsupported_fields).toEqual([])
    expect(metrics.false_positive_ids).toEqual([])
    expect(claims.missing_quote).toEqual([])
    expect(observations.tool_calls.http_fetches).toBe(36)
    expect(observations.tool_calls.web_searches).toBe(11)
  })
})
