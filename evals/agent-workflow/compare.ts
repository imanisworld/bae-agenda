export type ToolArm = {
  measured: boolean
  violationCatchRate: number | null
  falseBlocks: number | null
}

export type Verdict = 'ADOPT' | 'TEST FURTHER' | 'REJECT'

/**
 * ADOPT requires a measured catch-rate improvement and no new false blocks.
 * A measured arm that does not improve is a rejection of that arm.
 * An unmeasured arm cannot be adopted or rejected on quality.
 */
export function decideVerdict(input: {
  baselineViolationCatchRate: number
  abide: ToolArm
  jev: ToolArm
}): Verdict {
  const measured = [input.abide, input.jev].filter((arm) => arm.measured)
  if (measured.length === 0) return 'TEST FURTHER'

  const improved = measured.some((arm) =>
    arm.violationCatchRate !== null &&
    arm.falseBlocks !== null &&
    arm.violationCatchRate > input.baselineViolationCatchRate &&
    arm.falseBlocks === 0,
  )
  return improved ? 'ADOPT' : 'REJECT'
}
