import Link from 'next/link'
import { legalRules } from '../lib/constants'
import { MetricTile, SectionHeader } from '../components/ui'

export function RulesPage() {
  const moderationSteps = [
    'Kontributor login Google lalu mengirim detail tempat.',
    'Admin memeriksa alamat, jenis akses, dan sumber password jika ada.',
    'Tempat yang valid disetujui dan nama kontributor tampil sebagai apresiasi.',
  ]
  const privacyRules = [
    'Email kontributor dipakai untuk identifikasi internal dan tindak lanjut moderasi.',
    'Yang tampil publik hanya nama kontributor, nama reviewer, dan isi kontribusi.',
    'Password privat, akun staf, voucher personal, atau akses internal tidak dipublikasikan.',
  ]

  return (
    <main className="rules-page">
      <section className="rules-hero">
        <span className="eyebrow">Aturan publikasi</span>
        <h1>Direktori WiFi aman dimulai dari data yang boleh dibagikan.</h1>
        <p>
          LampungWiFi hanya menampilkan informasi WiFi publik yang punya konteks jelas. Aturan ini menjaga pemilik tempat,
          kontributor, dan pengunjung supaya data yang tampil tetap berguna tanpa membocorkan akses privat.
        </p>
        <div className="rules-hero__actions">
          <Link href="/places" className="button button--ghost">
            Cari WiFi
          </Link>
          <Link href="/submit" className="button button--primary">
            Tambah tempat
          </Link>
        </div>
      </section>

      <section className="rules-summary" aria-label="Ringkasan aturan">
        <MetricTile label="Akses yang boleh tampil" value="Publik" />
        <MetricTile label="Login kontribusi" value="Google" />
        <MetricTile label="Moderasi tempat" value="Wajib" />
        <MetricTile label="Kredit kontributor" value="Ditampilkan" />
      </section>

      <section id="legal-policy" className="section rules-layout">
        <div className="rules-panel rules-panel--light">
          <SectionHeader
            title="Yang boleh tampil"
            description="Gunakan daftar ini sebelum mengirim tempat, password, atau catatan akses."
          />
          <div className="rules-list">
            {legalRules.map((rule, index) => (
              <article key={rule} className="rule-card">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{rule}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="rules-panel rules-panel--dark">
          <h2>Setiap tempat baru ditinjau sebelum masuk daftar publik.</h2>
          <div className="rules-list rules-list--dark">
            {moderationSteps.map((step, index) => (
              <article key={step} className="rule-card rule-card--dark">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="rules-panel rules-panel--privacy">
        <SectionHeader
          title="Kontributor dihargai, data sensitif tetap dibatasi."
          description="Login Google membantu mengurangi spam dan memberi kredit saat tempat sudah disetujui."
        />
        <div className="rules-list rules-list--privacy">
          {privacyRules.map((rule) => (
            <article key={rule} className="rule-card rule-card--privacy">
              <span>✓</span>
              <p>{rule}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rules-cta">
        <div>
          <span className="eyebrow">Siap berkontribusi?</span>
          <h2>Kirim tempat yang memang punya akses WiFi publik.</h2>
          <p>Lengkapi alamat, tipe akses, catatan lokasi, dan laporan kecepatan supaya admin bisa meninjau lebih cepat.</p>
        </div>
        <Link href="/submit" className="button button--primary">
          Kirim sekarang
        </Link>
      </section>
    </main>
  )
}
