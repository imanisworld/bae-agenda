export const SERVER_INSTALL_STATE_SNAPSHOT = '1:0'

export function encodeInstallStateSnapshot(dismissed: boolean, isInstalled: boolean) {
  return `${dismissed ? '1' : '0'}:${isInstalled ? '1' : '0'}`
}

export function parseInstallStateSnapshot(snapshot: string) {
  const [dismissedSnapshot, installedSnapshot] = snapshot.split(':')

  return {
    dismissed: dismissedSnapshot === '1',
    isInstalled: installedSnapshot === '1',
  }
}
