/**
 * Abide 0.0.11 (@coldtea/abide) facts checked against the published package
 * on 2026-10-11. Audit and replay both throw NO_API_KEY before judging files.
 * Supported hook hosts are claude, codex, opencode, and pi. Cursor is not one.
 */

export const ABIDE_PACKAGE = '@coldtea/abide@0.0.11'
export const ABIDE_KEY_ENV = ['TYPESAFE_AI_API_KEY', 'AI_GATEWAY_API_KEY'] as const
export const ABIDE_HOSTS = ['claude', 'codex', 'opencode', 'pi'] as const

export type AbideAvailability = {
  status: 'ready' | 'blocked'
  packageName: typeof ABIDE_PACKAGE
  missing: string[]
  hosts: readonly string[]
  cursorHookSupported: false
  note: string
}

export function abideAvailability(env: Record<string, string | undefined>): AbideAvailability {
  const missing = ABIDE_KEY_ENV.filter((name) => (env[name] ?? '').trim() === '')
  if (missing.length === ABIDE_KEY_ENV.length) {
    return {
      status: 'blocked',
      packageName: ABIDE_PACKAGE,
      missing: [...ABIDE_KEY_ENV],
      hosts: ABIDE_HOSTS,
      cursorHookSupported: false,
      note: 'Abide audit and replay need TYPESAFE_AI_API_KEY or AI_GATEWAY_API_KEY. Neither is set. No score was produced.',
    }
  }
  return {
    status: 'ready',
    packageName: ABIDE_PACKAGE,
    missing: [],
    hosts: ABIDE_HOSTS,
    cursorHookSupported: false,
    note: 'A key is present. Audit still needs a rubric compiled from AGENTS.md, and the hooks do not attach to Cursor.',
  }
}
