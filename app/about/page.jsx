import Link from 'next/link'

export default function Page() {
  return (
    <main className="static-page">
      <section className="static-card">
        <span className="eyebrow">Tentang</span>
        <h1>Direktori WiFi publik Bandar Lampung.</h1>
        <p>LampungWiFi membantu warga menemukan tempat kerja, nongkrong, dan transit dengan akses internet publik yang jelas.</p>
        <Link href="/rules" className="button button--primary">
          Baca aturan
        </Link>
      </section>
    </main>
  )
}
