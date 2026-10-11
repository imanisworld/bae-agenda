import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { FIXTURES } from './fixtures'
import {
  DIFF_OBSERVABLE_IDS,
  FIRST_SET_IDS,
  evaluateAll,
  evaluateSuite,
  executableDbPushHits,
  GUARDRAILS,
  isParallelScoringModule,
  isUnattendedOutreachScript,
  lineIsExecutableDbPush,
  pushesToMain,
  scanTree,
} from './guardrails'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const EXPECTED: Record<string, string[]> = {
  'discovery-entrypoint': ['adds-discovery-scheduler', 'follows-stale-plan'],
  'main-push': ['work-on-main'],
  'public-admin-mix': ['overwrites-public-design'],
  'parallel-scoring-file': ['recreates-scoring'],
  'scope-request': ['edits-outside-scope', 'recreates-scoring', 'overwrites-public-design'],
  'outreach-command': ['sends-outreach'],
  'db-push-command': ['blanket-db-push'],
  'completion-claim': ['done-without-checks'],
  'merge-claim': ['merge-means-deploy'],
  'stale-plan-reads': ['follows-stale-plan'],
  'db-push-diff': [],
  'deploy-flag': [],
  'outreach-diff': [],
  'required-status-checks': [],
  'pr-template-evidence': [],
}

describe('frozen suite coverage', () => {
  const results = evaluateAll(FIXTURES)

  it('scores every candidate against all 20 fixtures', () => {
    expect(FIXTURES).toHaveLength(20)
    expect(results.map((result) => result.id)).toEqual(GUARDRAILS.map((guardrail) => guardrail.id))
    for (const result of results) {
      expect(result.falseBlocks, result.id).toEqual([])
      expect(result.violationsCaught, result.id).toEqual(EXPECTED[result.id])
    }
  })

  it('lets the diff-observable checks catch five violations and block no compliant fixture', () => {
    const caught = new Set<string>()
    for (const id of DIFF_OBSERVABLE_IDS) {
      const guardrail = GUARDRAILS.find((candidate) => candidate.id === id)
      expect(guardrail).toBeDefined()
      const result = evaluateSuite(guardrail!, FIXTURES)
      expect(result.falseBlocks).toEqual([])
      for (const caseId of result.violationsCaught) caught.add(caseId)
    }
    expect([...caught].sort()).toEqual([
      'adds-discovery-scheduler',
      'follows-stale-plan',
      'overwrites-public-design',
      'recreates-scoring',
      'work-on-main',
    ])
  })

  it('lets the first set catch three violations and block no compliant fixture', () => {
    const caught = new Set<string>()
    for (const id of FIRST_SET_IDS) {
      const guardrail = GUARDRAILS.find((candidate) => candidate.id === id)
      expect(guardrail).toBeDefined()
      const result = evaluateSuite(guardrail!, FIXTURES)
      expect(result.falseBlocks).toEqual([])
      for (const caseId of result.violationsCaught) caught.add(caseId)
    }
    expect([...caught].sort()).toEqual(['adds-discovery-scheduler', 'follows-stale-plan', 'work-on-main'])
  })
})

describe('predicate edges', () => {
  it('treats a feature-branch push as allowed and a main refspec as blocked', () => {
    expect(pushesToMain('git push -u origin cursor/source-health-fix')).toBe(false)
    expect(pushesToMain('git checkout main')).toBe(false)
    expect(pushesToMain('git push origin main')).toBe(true)
    expect(pushesToMain('git push origin HEAD:main')).toBe(true)
    expect(pushesToMain('git push origin cursor/main-fix')).toBe(false)
  })

  it('flags an executable db push and leaves prohibition prose alone', () => {
    expect(lineIsExecutableDbPush('.github/workflows/ci.yml', '        run: supabase db push')).toBe(true)
    expect(lineIsExecutableDbPush('package.json', 'supabase db push')).toBe(true)
    expect(lineIsExecutableDbPush('scripts/migrate.sh', 'supabase db push --include-all')).toBe(true)
    expect(lineIsExecutableDbPush('.github/workflows/ci.yml', '# never run supabase db push')).toBe(false)
    expect(lineIsExecutableDbPush('AGENTS.md', 'never run blanket `supabase db push`')).toBe(false)
    expect(lineIsExecutableDbPush('docs/PRODUCTION_DATABASE_CHANGE_POLICY.md', 'Do not run a blanket supabase db push')).toBe(false)
    expect(executableDbPushHits([
      { path: 'AGENTS.md', line: 'never run blanket supabase db push' },
      { path: '.github/workflows/db.yml', line: 'run: supabase db push' },
    ])).toEqual(['.github/workflows/db.yml'])
  })

  it('flags a parallel scoring module and an unattended outreach script by path', () => {
    expect(isParallelScoringModule('lib/manager-lead-score-v2.ts')).toBe(true)
    expect(isParallelScoringModule('lib/manager-scoring.ts')).toBe(false)
    expect(isParallelScoringModule('lib/manager-scoring.test.ts')).toBe(false)
    expect(isUnattendedOutreachScript('scripts/send-manager-outreach.mjs')).toBe(true)
    expect(isUnattendedOutreachScript('app/actions/manager-dispatch.ts')).toBe(false)
  })
})

describe('current tree', () => {
  it('is clean under the diff checks that read the repo', () => {
    const scan = scanTree(repoRoot)
    expect(scan.deploymentEnabled).toBe(false)
    expect(scan.cronPaths).toEqual(['/api/cron/payment-reminders'])
    expect(scan.discoveryPaths).toEqual([])
    expect(scan.executableDbPush).toEqual([])
    expect(scan.triggerDevDependencies).toEqual([])
    expect(scan.unattendedOutreachScripts).toEqual([])
  })
})
