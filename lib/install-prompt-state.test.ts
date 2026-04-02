import { describe, expect, it } from 'vitest'
import {
  encodeInstallStateSnapshot,
  parseInstallStateSnapshot,
  SERVER_INSTALL_STATE_SNAPSHOT,
} from './install-prompt-state'

describe('install prompt state snapshots', () => {
  it('encodes dismissed and installed flags into a stable primitive snapshot', () => {
    expect(encodeInstallStateSnapshot(true, false)).toBe('1:0')
    expect(encodeInstallStateSnapshot(false, true)).toBe('0:1')
  })

  it('parses snapshot strings back into booleans for the prompt UI', () => {
    expect(parseInstallStateSnapshot('0:0')).toEqual({
      dismissed: false,
      isInstalled: false,
    })

    expect(parseInstallStateSnapshot('1:1')).toEqual({
      dismissed: true,
      isInstalled: true,
    })
  })

  it('keeps the server fallback snapshot hidden by default', () => {
    expect(parseInstallStateSnapshot(SERVER_INSTALL_STATE_SNAPSHOT)).toEqual({
      dismissed: true,
      isInstalled: false,
    })
  })
})
