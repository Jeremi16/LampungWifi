import Link from 'next/link'
import { ScrollOnRouteChange, TopNav, TopbarLogin, WhatsNewModal } from './AppShellClient.jsx'

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
  return (
    <div className="app-shell">
      <ScrollOnRouteChange />
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand__wordmark">LampungWiFi</span>
          <span className="brand__tag">Direktori WiFi publik Bandar Lampung</span>
        </Link>
        <TopNav items={navItems} />
        <TopbarLogin />
      </header>

      {children}

      <footer className="footer">
        <div className="footer__brand">
          <h3>LampungWiFi</h3>
          <p>Platform tempat kerja, nongkrong, dan transit dengan WiFi publik yang jelas status legalnya.</p>
          <small>&copy; 2026 LampungWiFi. All rights reserved.</small>
        </div>
        {footerSections.map((section) => (
          <div key={section.title}>
            <h4>{section.title}</h4>
            {section.links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </footer>

      <WhatsNewModal version="1.0" />
    </div>
  )
}
