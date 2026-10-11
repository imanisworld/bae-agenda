import type { BaselineCaseResult, RepoFacts } from './baseline'
import type { PhaseSummary } from './metrics'
import type { Verdict } from './compare'

export function renderBaselineReport(input: {
  generatedAt: string
  runtimeMs: number
  facts: RepoFacts
  summary: PhaseSummary
  cases: BaselineCaseResult[]
}) {
  const lines = [
    '# Baseline agent-workflow evaluation',
    '',
    `Generated: ${input.generatedAt}`,
    '',
    'This is the current workflow with no Abide rubric and no Jev calls.',
    'Pass means the workflow blocked a violation or allowed a compliant turn.',
    'CI still runs test, lint, and build on a pull request. That does not judge these policy cases.',
    `vercel.json git.deploymentEnabled=${String(input.facts.deploymentEnabled)}, so a merge does not create a Vercel deployment. The baseline still does not reject an agent claim that a merge deployed production.`,
    '',
    '## Summary',
    '',
    `- Total cases: ${input.summary.totalCases}`,
    `- Pass: ${input.summary.pass}`,
    `- Fail: ${input.summary.fail}`,
    `- Pass rate: ${input.summary.passRate}`,
    `- Violation catch rate: ${input.summary.violationCatchRate} (${input.summary.violationsCaught}/${input.summary.violationCases})`,
    `- False blocks: ${input.summary.falseBlocks}`,
    `- Undetected rule violations: ${input.summary.undetectedRuleViolations}`,
    `- Unnecessary file-change cases: ${input.summary.unnecessaryFileChangeCases}, prevented: ${input.summary.unnecessaryFileChangesPrevented}`,
    `- Verification-failure cases: ${input.summary.verificationFailureCases}, detected: ${input.summary.verificationFailuresDetected}`,
    `- Fixture actions: ${input.summary.fixtureActionCount}`,
    `- Workflow tool calls: ${input.summary.workflowToolCalls}`,
    `- Runtime ms: ${input.runtimeMs}`,
    '- Input tokens: unavailable',
    '- Output tokens: unavailable',
    '- Cost USD: unavailable',
    '',
    '## Cases',
    '',
    ...input.cases.map((testCase) =>
      `- ${testCase.id}: ${testCase.pass ? 'pass' : 'fail'} caught=${testCase.caught} falseBlock=${testCase.falseBlock} rules=${testCase.violatedRuleIds.join(',') || 'none'}`,
    ),
    '',
  ]
  return lines.join('\n')
}

export function renderComparisonReport(input: {
  generatedAt: string
  verdict: Verdict
  baseline: PhaseSummary
  abideStatus: string
  jevStatus: string
  abideMissing: string[]
  jevMissing: string[]
  jevProbe: string
}) {
  return [
    '# Abide / Jev comparison',
    '',
    `Generated: ${input.generatedAt}`,
    '',
    `Verdict: ${input.verdict}`,
    '',
    '## Current workflow',
    '',
    `- Pass rate: ${input.baseline.passRate}`,
    `- Violation catch rate: ${input.baseline.violationCatchRate}`,
    `- False blocks: ${input.baseline.falseBlocks}`,
    `- Undetected rule violations: ${input.baseline.undetectedRuleViolations}`,
    '',
    '## Current + Abide',
    '',
    `- Status: ${input.abideStatus}`,
    `- Missing: ${input.abideMissing.join(', ') || 'none'}`,
    '- Pass rate: not measured',
    '- No Abide score was produced. audit and replay also do not accept this suite\'s transcripts.',
    '',
    '## Current + Abide + Jev',
    '',
    `- Jev status: ${input.jevStatus}`,
    `- Missing: ${input.jevMissing.join(', ') || 'none'}`,
    `- Probe: ${input.jevProbe}`,
    '- Pass rate: not measured',
    '- No Jev score was produced. The harness does not invent answers.',
    '',
    'ADOPT is unavailable because neither tool has a measured catch-rate improvement.',
    'REJECT is unavailable because the tools were not executed, so this run cannot show that they fail to reduce violations.',
    '',
  ].join('\n')
}
