'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useGoogleLogin } from '../lib/useGoogleLogin'

const whatsNewVersion = '1.0'

const navItems = [
  { href: '/places', label: 'Cari WiFi' },
  { href: '/rules', label: 'Aturan' },
  { href: '/submit', label: 'Tambah tempat' },
]

const footerSections = [
  {
    title: 'Jelajahi',
    links: [
      { href: '/places', label: 'Cari WiFi' },
      { href: '/rules', label: 'Aturan' },
      { href: '/submit', label: 'Tambah tempat' },
    ],
  },
  {
    title: 'Lainnya',
    links: [
      { href: '/whats-new', label: "What's New" },
      { href: '/about', label: 'Tentang' },
      { href: '/contact', label: 'Kontak' },
    ],
  },
]

export function AppShell({ children }) {
  const pathname = usePathname()
  const { user, signIn, signOut, configured } = useGoogleLogin()
  const [showWhatsNew, setShowWhatsNew] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('balamwifi_seen_whats_new') !== whatsNewVersion
  })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  function closeWhatsNew() {
    window.localStorage.setItem('balamwifi_seen_whats_new', whatsNewVersion)
    setShowWhatsNew(false)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand__wordmark">LampungWiFi</span>
          <span className="brand__tag">Direktori WiFi publik Bandar Lampung</span>
        </Link>
        <nav className="topnav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass(pathname, item.activeHref ?? item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>
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
      </header>

      {children}

      <footer className="footer">
        <div className="footer__brand">
          <h3>LampungWiFi</h3>
          <p>Platform tempat kerja, nongkrong, dan transit dengan WiFi publik yang jelas status legalnya.</p>
          <small>© 2026 LampungWiFi. All rights reserved.</small>
        </div>
        {footerSections.map((section) => (
          <div key={section.title}>
            <h4>{section.title}</h4>
            {section.links.map((link) =>
              link.external || link.href.startsWith('#') ? (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noreferrer' : undefined}
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ),
            )}
          </div>
        ))}
      </footer>

      {showWhatsNew ? (
        <div className="whats-new-modal" role="dialog" aria-modal="true" aria-labelledby="whats-new-title">
          <div className="whats-new-modal__card">
            <span className="eyebrow">What's New · Version {whatsNewVersion}</span>
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
      ) : null}
    </div>
  )
}

function navLinkClass(pathname, href) {
  return pathname === href.split('?')[0] ? 'topnav__link topnav__link--active' : 'topnav__link'
}
