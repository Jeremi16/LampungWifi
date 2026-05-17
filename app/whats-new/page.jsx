import Link from 'next/link'

export default function Page() {
  return (
    <main className="static-page">
      <section className="static-card">
        <span className="eyebrow">What's New</span>
        <h1>Update terbaru LampungWiFi.</h1>
        <p>Direktori kini punya halaman aturan baru, pencarian lebih ringkas, dan filter yang bisa dibuka saat dibutuhkan.</p>
        <div className="version-card">
          <span>Version 1.0</span>
          <h2>Rilis awal direktori WiFi publik.</h2>
          <ul>
            <li>Pencarian tempat WiFi publik di Bandar Lampung.</li>
            <li>Filter berdasarkan kecepatan, akses, kategori, colokan, dan 24 jam.</li>
            <li>Halaman aturan untuk menjaga data tetap aman dibagikan.</li>
          </ul>
        </div>
        <Link href="/places" className="button button--primary">
          Coba cari WiFi
        </Link>
      </section>
    </main>
  )
}
