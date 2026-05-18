'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useSyncExternalStore } from 'react'
import { useGoogleLogin } from '../lib/useGoogleLogin'

const whatsNewStorageKey = 'balamwifi_seen_whats_new'
const whatsNewChangedEvent = 'balamwifi_whats_new_changed'

export function ScrollOnRouteChange() {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return null
}

export function TopNav({ items }) {
  const pathname = usePathname()

  return (
    <nav className="topnav">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={navLinkClass(pathname, item.activeHref ?? item.href)}>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

export function TopbarLogin() {
  const { user, signIn, signOut, configured } = useGoogleLogin()

  return (
    <div className="topbar__login">
      {user ? (
        <button type="button" className="login-button" onClick={signOut} title={user.email}>
          {user.picture ? <img src={user.picture} alt="" /> : null}
          <span>{user.name}</span>
        </button>
      ) : (
        <button type="button" className="button button--primary button--small" onClick={signIn} disabled={!configured}>
          Login
        </button>
      )}
    </div>
  )
}

export function WhatsNewModal({ version }) {
  const seenWhatsNewVersion = useSyncExternalStore(
    subscribeWhatsNew,
    readSeenWhatsNewVersion,
    () => version,
  )
  const showWhatsNew = seenWhatsNewVersion !== version

  function closeWhatsNew() {
    window.localStorage.setItem(whatsNewStorageKey, version)
    window.dispatchEvent(new Event(whatsNewChangedEvent))
  }

  if (!showWhatsNew) {
    return null
  }

  return (
    <div className="whats-new-modal" role="dialog" aria-modal="true" aria-labelledby="whats-new-title">
      <div className="whats-new-modal__card">
        <span className="eyebrow">What's New - Version {version}</span>
        <h2 id="whats-new-title">Update baru LampungWiFi.</h2>
        <p>Pencarian lebih ringkas, filter bisa dibuka saat dibutuhkan, login Google aktif untuk submit dan rating WiFi.</p>
        <div className="whats-new-modal__actions">
          <Link href="/whats-new" className="button button--primary" onClick={closeWhatsNew}>
            Lihat update
          </Link>
          <button type="button" className="button button--ghost" onClick={closeWhatsNew}>
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  )
}

function navLinkClass(pathname, href) {
  return pathname === href.split('?')[0] ? 'topnav__link topnav__link--active' : 'topnav__link'
}

function subscribeWhatsNew(onStoreChange) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(whatsNewChangedEvent, onStoreChange)

  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(whatsNewChangedEvent, onStoreChange)
  }
}

function readSeenWhatsNewVersion() {
  return window.localStorage.getItem(whatsNewStorageKey) ?? ''
}
