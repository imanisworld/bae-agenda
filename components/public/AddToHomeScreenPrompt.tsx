'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  encodeInstallStateSnapshot,
  parseInstallStateSnapshot,
  SERVER_INSTALL_STATE_SNAPSHOT,
} from '@/lib/install-prompt-state'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'baeagenda-install-prompt-dismissed'
const INSTALL_PROMPT_STATE_EVENT = 'baeagenda-install-prompt-state'

function getDismissedState() {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return true
  }
}

function isIosSafari() {
  if (typeof window === 'undefined') return false
  try {
    const ua = window.navigator.userAgent
    const isLegacyIos = /iPad|iPhone|iPod/.test(ua)
    const isModernIpad = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1
    const isIos = isLegacyIos || isModernIpad
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
    return isIos && isSafari
  } catch {
    return false
  }
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia('(display-mode: standalone)').matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  } catch {
    return false
  }
}

function subscribeToInstallState(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  window.addEventListener('appinstalled', onStoreChange)
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(INSTALL_PROMPT_STATE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener('appinstalled', onStoreChange)
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(INSTALL_PROMPT_STATE_EVENT, onStoreChange)
  }
}

function getInstallStateSnapshot() {
  return encodeInstallStateSnapshot(getDismissedState(), isStandalone())
}

export default function AddToHomeScreenPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)
  const [showIosInstructions, setShowIosInstructions] = useState(false)

  const installStateSnapshot = useSyncExternalStore(
    subscribeToInstallState,
    getInstallStateSnapshot,
    () => SERVER_INSTALL_STATE_SNAPSHOT,
  )
  const { dismissed: isDismissed, isInstalled } = parseInstallStateSnapshot(installStateSnapshot)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setDeferredPrompt(null)
      setShowIosInstructions(false)
      window.dispatchEvent(new Event(INSTALL_PROMPT_STATE_EVENT))
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const mode = useMemo(() => {
    if (isInstalled || isDismissed) return 'hidden'
    if (deferredPrompt) return 'android'
    if (isIosSafari()) return 'ios'
    return 'hidden'
  }, [deferredPrompt, isDismissed, isInstalled])

  if (mode === 'hidden') return null

  async function handleInstall() {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setInstalling(false)
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      return
    }
    setShowIosInstructions(false)
    window.dispatchEvent(new Event(INSTALL_PROMPT_STATE_EVENT))
  }

  return (
    <div
      style={{
        marginTop: '18px',
        width: 'min(100%, 440px)',
        border: '1px solid rgba(255,255,255,0.14)',
        background: 'linear-gradient(180deg, rgba(10,10,14,0.78), rgba(10,10,14,0.58))',
        backdropFilter: 'blur(16px)',
        padding: '14px 16px',
        display: 'grid',
        gap: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.28)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'grid', gap: '6px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(250,248,243,0.72)' }}>
            Add To Home Screen
          </div>
          <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--white)' }}>
            Save <span style={{ color: '#9b5de5' }}>The Bae Agenda</span> like an app for faster access and a cleaner full-screen launch.
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss add to home screen prompt"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(250,248,243,0.54)',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
            width: '44px',
            minWidth: '44px',
            height: '44px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {mode === 'android' ? (
        <button
          type="button"
          onClick={handleInstall}
          disabled={installing}
          style={{
            justifySelf: 'start',
            padding: '12px 18px',
            border: '1px solid rgba(155,93,229,0.42)',
            background: 'rgba(155,93,229,0.22)',
            color: 'var(--white)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            minHeight: '44px',
          }}
        >
          {installing ? 'Opening…' : 'Install The Bae'}
        </button>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowIosInstructions((value) => !value)}
            style={{
              justifySelf: 'start',
              padding: '12px 18px',
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'transparent',
              color: 'var(--white)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            {showIosInstructions ? 'Hide Steps' : 'How To Add It'}
          </button>

          {showIosInstructions ? (
            <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'rgba(250,248,243,0.78)' }}>
              In Safari, tap <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>.
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
