import Link from 'next/link'

export default function Page() {
  return (
    <main className="static-page">
      <section className="static-card">
        <span className="eyebrow">Kontak</span>
        <h1>Kirim tempat atau koreksi data.</h1>
        <p>Punya info WiFi publik yang valid? Kirim lewat formulir komunitas supaya bisa ditinjau dan tampil di direktori.</p>
        <Link href="/submit" className="button button--primary">
          Kirim tempat
        </Link>
      </section>
    </main>
  )
}
