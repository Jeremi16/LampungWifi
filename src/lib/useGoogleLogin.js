'use client'

import { useEffect, useState } from 'react'

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const storageKey = 'balamwifi_google_user'

function decodeGoogleCredential(credential) {
  const payload = credential.split('.')[1]
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(decodeURIComponent(escape(json)))
}

export function readStoredGoogleUser() {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(storageKey)
  return value ? JSON.parse(value) : null
}

export function useGoogleLogin() {
  const [user, setUser] = useState(readStoredGoogleUser)

  useEffect(() => {
    if (!googleClientId || window.google?.accounts?.id || document.querySelector('script[data-google-identity]')) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    document.head.appendChild(script)
  }, [])

  function signIn() {
    if (!googleClientId || !window.google?.accounts?.id) return

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: ({ credential }) => {
        const profile = decodeGoogleCredential(credential)
        const nextUser = {
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
        }
        window.localStorage.setItem(storageKey, JSON.stringify(nextUser))
        setUser(nextUser)
      },
    })
    window.google.accounts.id.prompt()
  }

  function signOut() {
    window.localStorage.removeItem(storageKey)
    setUser(null)
  }

  return { user, signIn, signOut, configured: Boolean(googleClientId) }
}
