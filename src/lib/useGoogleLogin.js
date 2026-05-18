'use client'

import { useMemo, useSyncExternalStore } from 'react'

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const storageKey = 'balamwifi_google_user'
const storageChangedEvent = 'balamwifi_google_user_changed'
let googleIdentityScriptPromise = null

function decodeGoogleCredential(credential) {
  const payload = credential.split('.')[1]
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(decodeURIComponent(escape(json)))
}

export function readStoredGoogleUser() {
  return parseStoredGoogleUser(readStoredGoogleUserValue())
}

function parseStoredGoogleUser(value) {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey)
    }
    return null
  }
}

function readStoredGoogleUserValue() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(storageKey) ?? ''
}

function getServerStoredGoogleUserValue() {
  return ''
}

function subscribeStoredGoogleUser(onStoreChange) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(storageChangedEvent, onStoreChange)

  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(storageChangedEvent, onStoreChange)
  }
}

function notifyStoredGoogleUserChanged() {
  window.dispatchEvent(new Event(storageChangedEvent))
}

function loadGoogleIdentity() {
  if (!googleClientId) {
    return Promise.resolve(false)
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(true)
  }

  if (googleIdentityScriptPromise) {
    return googleIdentityScriptPromise
  }

  googleIdentityScriptPromise = new Promise((resolve) => {
    const existingScript = document.querySelector('script[data-google-identity]')

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(Boolean(window.google?.accounts?.id)), { once: true })
      existingScript.addEventListener('error', () => resolve(false), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.addEventListener('load', () => resolve(Boolean(window.google?.accounts?.id)), { once: true })
    script.addEventListener('error', () => resolve(false), { once: true })
    document.head.appendChild(script)
  })

  return googleIdentityScriptPromise
}

export function useGoogleLogin() {
  const storedUserValue = useSyncExternalStore(
    subscribeStoredGoogleUser,
    readStoredGoogleUserValue,
    getServerStoredGoogleUserValue,
  )
  const user = useMemo(() => parseStoredGoogleUser(storedUserValue), [storedUserValue])

  async function signIn() {
    const ready = await loadGoogleIdentity()
    if (!ready) return

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: ({ credential }) => {
        const profile = decodeGoogleCredential(credential)
        const nextUser = {
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
          credential,
        }
        window.localStorage.setItem(storageKey, JSON.stringify(nextUser))
        notifyStoredGoogleUserChanged()
      },
    })
    window.google.accounts.id.prompt()
  }

  function signOut() {
    window.localStorage.removeItem(storageKey)
    notifyStoredGoogleUserChanged()
  }

  return { user, credential: user?.credential ?? '', signIn, signOut, configured: Boolean(googleClientId) }
}
