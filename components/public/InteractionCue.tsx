'use client'

/**
 * A tiny editorial hint ("DRAG", "TAP") that tells phone visitors a piece of
 * artwork is interactive. Touch screens only — on desktop the cursor does the
 * work. Once the visitor uses that interaction, the cue fades out and stays
 * hidden for the rest of the visit (shared by every cue with the same id).
 */
import { useSyncExternalStore } from 'react'
import styles from './InteractionCue.module.css'

const PREFIX = 'bae-cue:'
const listeners = new Set<() => void>()
/** Covers browsers where session storage is blocked. */
const usedThisLoad = new Set<string>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function hasUsed(id: string) {
  try {
    return window.sessionStorage.getItem(PREFIX + id) === '1'
  } catch {
    return false
  }
}

/** Call from the interaction's own handler the first time it's used. */
export function markCueUsed(id: string) {
  if (hasUsed(id)) return
  try {
    window.sessionStorage.setItem(PREFIX + id, '1')
  } catch {
    // Storage blocked: the cue still hides on this page via the listeners.
  }
  usedThisLoad.add(id)
  listeners.forEach((listener) => listener())
}

type Props = {
  id: string
  label: string
  className?: string
}

export default function InteractionCue({ id, label, className }: Props) {
  const used = useSyncExternalStore(
    subscribe,
    () => usedThisLoad.has(id) || hasUsed(id),
    () => false,
  )

  return (
    <span
      className={`${styles.cue}${used ? ` ${styles.done}` : ''}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      {label}
    </span>
  )
}
