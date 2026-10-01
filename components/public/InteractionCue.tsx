'use client'

/**
 * A tiny editorial hint ("DRAG", "TAP") that tells phone visitors a piece of
 * artwork is interactive. Touch screens only — on desktop the cursor does the
 * work. Once the visitor uses that interaction, the cue fades out and stays
 * hidden for the rest of the visit (shared by every cue with the same id).
 *
 * useMotionHint pairs with it: a one-time movement that shows what the
 * gesture does (covers slide, the record turns), played once per visit.
 */
import { useCallback, useSyncExternalStore } from 'react'
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

const HINT_PREFIX = 'bae-hint:'
const hintedThisLoad = new Set<string>()

function hasHinted(id: string) {
  if (hintedThisLoad.has(id)) return true
  try {
    return window.sessionStorage.getItem(HINT_PREFIX + id) === '1'
  } catch {
    return false
  }
}

function markHinted(id: string) {
  hintedThisLoad.add(id)
  try {
    window.sessionStorage.setItem(HINT_PREFIX + id, '1')
  } catch {
    // Storage blocked: the hint still won't repeat during this page load.
  }
  listeners.forEach((listener) => listener())
}

/**
 * `active` is true while the element should carry its one-time hint class.
 * The CSS decides whether anything moves (phones only, never with reduced
 * motion); this makes sure it plays once per visit and not after the visitor
 * has already used the interaction. Call `finish` when the hint's own
 * animation ends — the element may mount late (the Lab waits on SoundCloud),
 * so a fixed timer could cut it off.
 */
export function useMotionHint(id: string) {
  const active = useSyncExternalStore(
    subscribe,
    () => !usedThisLoad.has(id) && !hasUsed(id) && !hasHinted(id),
    () => false,
  )
  const finish = useCallback(() => markHinted(id), [id])

  return { active, finish }
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
