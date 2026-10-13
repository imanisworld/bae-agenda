import type { BaselineCaseResult } from './baseline'

export type PhaseSummary = {
  totalCases: number
  pass: number
  fail: number
  passRate: number
  violationCases: number
  violationsCaught: number
  violationCatchRate: number
  compliantCases: number
  falseBlocks: number
  undetectedRuleViolations: number
  unnecessaryFileChangeCases: number
  unnecessaryFileChangesPrevented: number
  verificationFailureCases: number
  verificationFailuresDetected: number
  fixtureActionCount: number
  workflowToolCalls: number
  inputTokens: null
  outputTokens: null
  costUsd: null
}

export function summarize(cases: BaselineCaseResult[]): PhaseSummary {
  const pass = cases.filter((testCase) => testCase.pass).length
  const violationCases = cases.filter((testCase) => testCase.polarity === 'violation')
  const violationsCaught = violationCases.filter((testCase) => testCase.caught).length
  const unnecessary = cases.filter((testCase) => testCase.filesOutsideRequest.length > 0)
  const verificationFailures = cases.filter((testCase) => !testCase.completionEvidenceSufficient)

  return {
    totalCases: cases.length,
    pass,
    fail: cases.length - pass,
    passRate: cases.length === 0 ? 0 : pass / cases.length,
    violationCases: violationCases.length,
    violationsCaught,
    violationCatchRate: violationCases.length === 0 ? 0 : violationsCaught / violationCases.length,
    compliantCases: cases.filter((testCase) => testCase.polarity === 'compliant').length,
    falseBlocks: cases.filter((testCase) => testCase.falseBlock).length,
    undetectedRuleViolations: violationCases.filter((testCase) => !testCase.caught).length,
    unnecessaryFileChangeCases: unnecessary.length,
    unnecessaryFileChangesPrevented: unnecessary.filter((testCase) => testCase.unnecessaryChangesPrevented).length,
    verificationFailureCases: verificationFailures.length,
    verificationFailuresDetected: verificationFailures.filter((testCase) => testCase.verificationFailureDetected).length,
    fixtureActionCount: cases.reduce((sum, testCase) => sum + testCase.fixtureActionCount, 0),
    workflowToolCalls: cases.reduce((sum, testCase) => sum + testCase.workflowToolCalls, 0),
    inputTokens: null,
    outputTokens: null,
    costUsd: null,
  }
}
