'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  createPlace,
  createReview,
  getAdminSubmissions,
  getPlace,
  getPlaces,
  updateSubmissionStatus,
} from './api'
import {
  accessTypeOptions,
  categoryOptions,
  defaultSubmissionForm,
  legalRules,
  localizeLabel,
  passwordSourceOptions,
  quickFilters,
} from './lib/constants'
import { buildMapsUrl, formatDate, formatMbps } from './lib/format'
import { useGoogleLogin } from './lib/useGoogleLogin'
import {
  EmptyState,
  InfoBanner,
  LoadingGrid,
  MetricRow,
  MetricTile,
  PlaceCard,
  ReviewCard,
  SectionHeader,
  StarMeter,
  StatusPill,
} from './components/ui'
import './App.css'

const ratingOptions = [1, 2, 3, 4, 5]
const maxReviewImageBytes = 350 * 1024

function LoginGate({ user, onSignIn, onSignOut, configured }) {
  if (user) {
    return (
      <div className="login-card login-card--signed-in">
        {user.picture ? <img src={user.picture} alt="" /> : null}
        <div>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>
        <button type="button" className="button button--ghost button--small" onClick={onSignOut}>
          Keluar
        </button>
      </div>
    )
  }

  return (
    <div className="login-card">
      <div>
        <strong>Login Google diperlukan</strong>
        <span>Masuk dulu untuk kirim tempat atau rating WiFi.</span>
      </div>
      <button type="button" className="button button--primary button--small" onClick={onSignIn} disabled={!configured}>
        Login Google
      </button>
      {!configured ? <small>Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` untuk mengaktifkan login.</small> : null}
    </div>
  )
}

async function compressReviewImage(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  return canvas.toDataURL('image/jpeg', 0.72)
}

function FilterSelect({ label, name, defaultValue, options }) {
  const [value, setValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value) ?? options[0]

  return (
    <div className="field filter-field--select custom-select">
      <span>{label}</span>
      <input type="hidden" name={name} value={value} />
      <button type="button" className="custom-select__button" onClick={() => setOpen((current) => !current)}>
        {selected.label}
      </button>
      {open ? (
        <div className="custom-select__menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === value ? 'custom-select__option custom-select__option--active' : 'custom-select__option'}
              onClick={() => {
                setValue(option.value)
                setOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function HomePage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [featured, setFeatured] = useState({
    loading: true,
    error: '',
    source: '',
    items: [],
  })

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function loadFeatured() {
      try {
        setFeatured((current) => ({ ...current, loading: true, error: '' }))
        const response = await getPlaces({
          q: deferredSearch,
          limit: 8,
          signal: controller.signal,
        })

        if (!active) {
          return
        }

        setFeatured({
          loading: false,
          error: '',
          source: response.meta.source,
          items: response.data,
        })
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }

        if (!active) {
          return
        }

        setFeatured({
          loading: false,
          error: error.message,
          source: '',
          items: [],
        })
      }
    }

    const timer = window.setTimeout(loadFeatured, 300)
    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [deferredSearch])

  function handleHeroSubmit(event) {
    event.preventDefault()
    const params = new URLSearchParams()

    if (search.trim()) {
      params.set('q', search.trim())
    }

    router.push(`/places${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <main>
      <section className="hero-panel">
        <div className="hero-panel__backdrop" />
        <div className="hero-panel__content">
          <h1>
            <span className="hero-title__line">Internet Cepat</span>
            <span className="hero-title__line">Dimana Saja.</span>
          </h1>
          <p>
            Cari kafe, perpustakaan, area kampus, dan coworking dengan catatan WiFi publik,
            laporan kecepatan, dan ulasan komunitas.
          </p>

          <form className="hero-search" onSubmit={handleHeroSubmit}>
            <label className="sr-only" htmlFor="hero-search">
              Cari tempat
            </label>
            <input
              id="hero-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari tempat, kecamatan, atau suasana kerja"
            />
            <button type="submit" className="button button--primary">
              Cari
            </button>
          </form>

          <div className="hero-panel__chips">
            {quickFilters.map((filter) => (
              <Link
                key={filter.label}
                className="quick-chip"
                href={`/places?${new URLSearchParams(filter.query).toString()}`}
              >
                <strong>{filter.label}</strong>
                <span>{filter.description}</span>
              </Link>
            ))}
          </div>

        </div>
      </section>

      <section className="section">
        <SectionHeader
          title="Tempat ramah WiFi pilihan"
          description="Dipilih dari rating, kecepatan, dan jumlah ulasan supaya kunjungan pertama tidak terasa acak."
          action={
            <Link href="/places" className="button button--ghost button--small">
              Lihat semua
            </Link>
          }
        />
        {featured.error ? <InfoBanner tone="danger">{featured.error}</InfoBanner> : null}
        {featured.loading ? (
          <LoadingGrid />
        ) : (
          <div className="place-grid">
            {featured.items.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </section>

    </main>
  )
}

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

export function PlacesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filters = useMemo(() => readFilters(searchParams), [searchParams])
  const searchKey = searchParams.toString()
  const [state, setState] = useState({
    loading: true,
    error: '',
    source: '',
    items: [],
  })
  const [showFilters, setShowFilters] = useState(false)
  const hasAdvancedFilters =
    filters.category !== 'all' ||
    filters.accessType !== 'all' ||
    filters.speed !== 'all' ||
    filters.outlets ||
    filters.open24 ||
    !filters.wifi

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function loadPlaces() {
      try {
        setState((current) => ({ ...current, loading: true, error: '' }))
        const response = await getPlaces({
          q: filters.q || undefined,
          category: filters.category !== 'all' ? filters.category : undefined,
          accessType: filters.accessType !== 'all' ? filters.accessType : undefined,
          speed: filters.speed !== 'all' ? filters.speed : undefined,
          outlets: filters.outlets || undefined,
          open24: filters.open24 || undefined,
          wifi: filters.wifi ? undefined : 'false',
          signal: controller.signal,
        })

        if (!active) {
          return
        }

        setState({
          loading: false,
          error: '',
          source: response.meta.source,
          items: response.data,
        })
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }

        if (!active) {
          return
        }

        setState({
          loading: false,
          error: error.message,
          source: '',
          items: [],
        })
      }
    }

    loadPlaces()
    return () => {
      active = false
      controller.abort()
    }
  }, [filters.accessType, filters.category, filters.open24, filters.outlets, filters.q, filters.speed, filters.wifi])

  function applyFilters(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    const q = filters.q.trim()
    const category = String(formData.get('category') ?? 'all')
    const accessType = String(formData.get('accessType') ?? 'all')
    const speed = String(formData.get('speed') ?? 'all')
    const wifi = formData.get('wifi') === 'on'
    const outlets = formData.get('outlets') === 'on'
    const open24 = formData.get('open24') === 'on'

    if (q) {
      next.set('q', q)
    }
    if (category !== 'all') {
      next.set('category', category)
    }
    if (accessType !== 'all') {
      next.set('accessType', accessType)
    }
    if (speed !== 'all') {
      next.set('speed', speed)
    }
    if (outlets) {
      next.set('outlets', 'true')
    }
    if (open24) {
      next.set('open24', 'true')
    }
    if (!wifi) {
      next.set('wifi', 'false')
    }

    router.push(`/places${next.toString() ? `?${next.toString()}` : ''}`)
    setShowFilters(false)
  }

  function applySearch(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const q = String(formData.get('q') ?? '').trim()

    router.push(`/places${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  function resetFilters() {
    router.push('/places')
    setShowFilters(false)
  }

  return (
    <main className="page page--list">
      <section className="section section--list">
        <div className="results-panel">
          <div className="results-panel__header">
            <div>
              <h1>Temukan WiFi Terbaik</h1>
            </div>
          </div>

          <form
            key={`search-${searchKey}`}
            className={showFilters ? 'places-search places-search--filters-open' : 'places-search'}
            onSubmit={applySearch}
          >
            <label className="sr-only" htmlFor="places-search">
              Cari tempat WiFi
            </label>
            <input
              id="places-search"
              name="q"
              defaultValue={filters.q}
              placeholder="Cari Kedaton, perpustakaan, coworking"
            />
            <button type="submit" className="button button--primary">
              Cari
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setShowFilters((current) => !current)}
            >
              {showFilters ? 'Tutup filter' : hasAdvancedFilters ? 'Ubah filter' : 'Filter'}
            </button>
          </form>

          {showFilters ? (
            <aside className="filter-panel filter-panel--inline">
              <div className="filter-panel__header">
                <h2>Sesuaikan tempat dengan gaya kerja.</h2>
              </div>

              <form key={searchKey} className="filter-form filter-form--inline" onSubmit={applyFilters}>
                <FilterSelect
                  label="Kecepatan WiFi"
                  name="speed"
                  defaultValue={filters.speed}
                  options={[
                    { value: 'all', label: 'Semua level' },
                    { value: 'steady', label: 'Stabil (20+ Mbps)' },
                    { value: 'fast', label: 'Cepat (50+ Mbps)' },
                    { value: 'ultra', label: 'Sangat cepat (100+ Mbps)' },
                  ]}
                />

                <FilterSelect
                  label="Jenis akses"
                  name="accessType"
                  defaultValue={filters.accessType}
                  options={[
                    { value: 'all', label: 'Semua jenis akses' },
                    ...accessTypeOptions.map((item) => ({ value: item, label: localizeLabel(item) })),
                  ]}
                />

                <FilterSelect
                  label="Kategori"
                  name="category"
                  defaultValue={filters.category}
                  options={[
                    { value: 'all', label: 'Semua kategori' },
                    ...categoryOptions.map((item) => ({ value: item, label: localizeLabel(item) })),
                  ]}
                />

                <label className="checkbox-field filter-field--check">
                  <input type="checkbox" name="wifi" defaultChecked={filters.wifi} />
                  <span>Hanya tampilkan tempat dengan WiFi tersedia</span>
                </label>

                <label className="checkbox-field filter-field--check">
                  <input type="checkbox" name="outlets" defaultChecked={filters.outlets} />
                  <span>Butuh colokan listrik</span>
                </label>

                <label className="checkbox-field filter-field--check">
                  <input type="checkbox" name="open24" defaultChecked={filters.open24} />
                  <span>Buka 24 jam</span>
                </label>

                <div className="filter-form__actions">
                  <button type="submit" className="button button--primary">
                    Terapkan filter
                  </button>
                  <button type="button" className="button button--ghost" onClick={resetFilters}>
                    Atur ulang
                  </button>
                </div>
              </form>
            </aside>
          ) : null}

          <p className="results-count">
            {state.loading ? 'Memuat tempat...' : `${state.items.length} tempat cocok dengan pencarian.`}
          </p>

          <div className="active-filters">
            {filters.speed !== 'all' ? <StatusPill tone="info">{localizeSpeed(filters.speed)}</StatusPill> : null}
            {filters.outlets ? <StatusPill tone="success">Colokan</StatusPill> : null}
            {filters.open24 ? <StatusPill tone="warning">24/7</StatusPill> : null}
            {filters.category !== 'all' ? <StatusPill tone="muted">{localizeLabel(filters.category)}</StatusPill> : null}
          </div>

          {state.error ? <InfoBanner tone="danger">{state.error}</InfoBanner> : null}
          {state.loading ? (
            <LoadingGrid />
          ) : state.items.length ? (
            <div className="place-grid">
              {state.items.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Tidak ada tempat yang cocok."
              description="Longgarkan satu atau dua filter, atau kirim tempat baru lewat formulir komunitas."
            />
          )}
        </div>
      </section>
    </main>
  )
}

export function PlaceDetailPage({ placeId }) {
  const auth = useGoogleLogin()
  const [state, setState] = useState({
    loading: true,
    error: '',
    place: null,
    source: '',
  })
  const [reviewForm, setReviewForm] = useState({
    authorName: '',
    reviewTitle: '',
    ratingSpeed: 5,
    ratingComfort: 5,
    imageUrl: '',
    comment: '',
  })
  const [reviewMessage, setReviewMessage] = useState({ tone: '', text: '' })
  const [sendingReview, setSendingReview] = useState(false)

  useEffect(() => {
    let active = true

    async function loadPlace() {
      try {
        setState((current) => ({ ...current, loading: true, error: '' }))
        const response = await getPlace(placeId)

        if (!active) {
          return
        }

        setState({
          loading: false,
          error: '',
          place: response.data,
          source: response.meta.source,
        })
      } catch (error) {
        if (!active) {
          return
        }

        setState({
          loading: false,
          error: error.message,
          place: null,
          source: '',
        })
      }
    }

    loadPlace()
    return () => {
      active = false
    }
  }, [placeId])

  async function handleReviewSubmit(event) {
    event.preventDefault()
    if (!auth.user) {
      setReviewMessage({ tone: 'danger', text: 'Login Google diperlukan sebelum mengirim ulasan.' })
      return
    }
    setSendingReview(true)
    setReviewMessage({ tone: '', text: '' })

    try {
      await createReview({
        placeId: Number(placeId),
        authorName: auth.user.name,
        authorEmail: auth.user.email,
        reviewTitle: reviewForm.reviewTitle,
        ratingSpeed: Number(reviewForm.ratingSpeed),
        ratingComfort: Number(reviewForm.ratingComfort),
        imageUrl: reviewForm.imageUrl,
        comment: reviewForm.comment,
      })

      const refreshed = await getPlace(placeId)
      setState((current) => ({
        ...current,
        place: refreshed.data,
        source: refreshed.meta.source,
      }))
      setReviewForm({
        authorName: '',
        reviewTitle: '',
        ratingSpeed: 5,
        ratingComfort: 5,
        imageUrl: '',
        comment: '',
      })
      setReviewMessage({ tone: 'success', text: 'Ulasan terkirim dan tampil di halaman.' })
    } catch (error) {
      setReviewMessage({ tone: 'danger', text: error.message })
    } finally {
      setSendingReview(false)
    }
  }

  async function handleReviewImageChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      setReviewForm((current) => ({ ...current, imageUrl: '' }))
      return
    }

    if (!file.type.startsWith('image/')) {
      setReviewMessage({ tone: 'danger', text: 'File harus berupa gambar.' })
      event.target.value = ''
      return
    }

    if (file.size > maxReviewImageBytes) {
      setReviewMessage({ tone: 'danger', text: 'Ukuran foto maksimal 800 KB.' })
      event.target.value = ''
      return
    }

    try {
      const imageUrl = await compressReviewImage(file)
      setReviewMessage({ tone: '', text: '' })
      setReviewForm((current) => ({ ...current, imageUrl }))
    } catch (error) {
      setReviewMessage({ tone: 'danger', text: error.message })
    }
  }

  if (state.loading) {
    return (
      <main className="page">
        <section className="section">
          <LoadingGrid />
        </section>
      </main>
    )
  }

  if (state.error || !state.place) {
    return (
      <main className="page">
        <section className="section">
          <InfoBanner tone="danger">{state.error || 'Tempat tidak ditemukan'}</InfoBanner>
        </section>
      </main>
    )
  }

  const place = state.place

  return (
    <main className="page">
      <section className="section detail-page">
        <div className="detail-page__main">
          <div className={`detail-hero tone--${place.image_tone || 'lagoon'}`}>
            <div className="detail-hero__media">
              {place.image_url ? <Image src={place.image_url} alt="" width={960} height={620} sizes="(max-width: 900px) 100vw, 760px" priority /> : null}
            </div>
            <div className="detail-hero__content">
              <h1>{place.name}</h1>
              <p>{place.address}</p>
              <p className="detail-hero__hours">{place.operating_hours || 'Jam operasional belum tersedia.'}</p>
              <div className="detail-hero__meta">
                <StatusPill tone="muted">{place.district}</StatusPill>
                <StatusPill tone="warning">{place.avg_rating.toFixed(1)} / 5</StatusPill>
                <StatusPill tone="muted">{place.review_count} ulasan</StatusPill>
              </div>
              {place.submitter_name ? <p className="contributor-credit">Dikontribusikan oleh {place.submitter_name}</p> : null}
              <p className="detail-hero__context">{place.map_context || 'Catatan lokasi dari kontributor belum ada.'}</p>
              <div className="detail-hero__location">
                <div className="map-card__visual">
                  <div className="map-pin" />
                </div>
                <div>
                  <h2>Konteks lokasi</h2>
                  <p>{place.map_context || 'Catatan peta belum ada.'}</p>
                  <a href={buildMapsUrl(place)} target="_blank" rel="noreferrer" className="button button--ghost">
                    Lihat di peta
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-grid">
            <article className="panel">
              <h2>Akses WiFi</h2>
              <div className="metric-stack">
                <MetricRow label="Metode akses" value={localizeLabel(place.wifi_access_type) || 'Perlu update'} />
                <MetricRow
                  label="Password"
                  value={place.wifi_password || 'Tidak ada password publik'}
                  note="Ditampilkan hanya untuk akses publik, disetujui pemilik, atau dikonfirmasi staf."
                />
                <MetricRow label="Sumber password" value={localizeLabel(place.password_source) || 'Tidak ada password publik'} />
                <MetricRow label="Catatan" value={place.access_notes || 'Tidak ada catatan tambahan'} />
              </div>
            </article>

            <article className="panel">
              <h2>Suasana dan kualitas</h2>
              <div className="quality-grid">
                <MetricTile
                  label="Unduh"
                  value={place.wifi_speed_mbps ? `${formatMbps(place.wifi_speed_mbps)} Mbps` : 'Menunggu'}
                />
                <MetricTile
                  label="Unggah"
                  value={place.upload_mbps ? `${formatMbps(place.upload_mbps)} Mbps` : 'Menunggu'}
                />
                <MetricTile label="Ping" value={place.ping_ms ? `${place.ping_ms} ms` : 'Menunggu'} />
                <MetricTile label="Suasana" value={localizeLabel(place.ambience_label) || 'Menunggu'} />
              </div>
              <div className="quality-grid">
                <StarMeter label="Rating kecepatan" value={place.avg_speed_rating} />
                <StarMeter label="Rating kenyamanan" value={place.avg_comfort_rating} />
              </div>
            </article>
          </div>

          <article className="panel">
            <SectionHeader
              title="Kata Pengunjung"
              description="Rating kecepatan dan kenyamanan dipisah agar tempat cepat tapi ramai tetap terlihat jujur."
            />
            <div className="review-list">
              {place.reviews?.length ? (
                place.reviews.map((review) => <ReviewCard key={review.id} review={review} />)
              ) : (
                <EmptyState
                  title="Belum ada ulasan."
                  description="Ulasan pertama membantu pengunjung berikutnya."
                />
              )}
            </div>
          </article>

          <article className="panel">
            <SectionHeader
              title="Tambahkan laporan kecepatan dan kenyamanan"
              description="Rating harus antara 1 sampai 5. Tulis komentar yang praktis dan spesifik."
            />
            {reviewMessage.text ? <InfoBanner tone={reviewMessage.tone}>{reviewMessage.text}</InfoBanner> : null}
            <LoginGate {...auth} />
            <form className="review-form" onSubmit={handleReviewSubmit}>
              <label className="field">
                <span>Judul ulasan</span>
                <input
                  value={reviewForm.reviewTitle}
                  onChange={(event) => setReviewForm((current) => ({ ...current, reviewTitle: event.target.value }))}
                  placeholder="Contoh: WiFi kencang buat deadline"
                  required
                />
              </label>
              <div className="review-form__grid">
                <label className="field">
                  <span>Rating kecepatan</span>
                  <select
                    value={reviewForm.ratingSpeed}
                    onChange={(event) =>
                      setReviewForm((current) => ({ ...current, ratingSpeed: Number(event.target.value) }))
                    }
                  >
                    {ratingOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Rating kenyamanan</span>
                  <select
                    value={reviewForm.ratingComfort}
                    onChange={(event) =>
                      setReviewForm((current) => ({ ...current, ratingComfort: Number(event.target.value) }))
                    }
                  >
                    {ratingOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Komentar</span>
                <textarea
                  value={reviewForm.comment}
                  onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                  placeholder="Ceritakan stabilitas koneksi, kebisingan, colokan, atau area duduk terbaik."
                  required
                />
              </label>
              <label className="field">
                <span>Foto ulasan</span>
                <input type="file" accept="image/*" onChange={handleReviewImageChange} />
              </label>
              {reviewForm.imageUrl ? <img className="review-form__preview" src={reviewForm.imageUrl} alt="Preview foto ulasan" /> : null}
              <button type="submit" className="button button--primary" disabled={sendingReview}>
                {sendingReview ? 'Mengirim...' : 'Terbitkan ulasan'}
              </button>
            </form>
          </article>

          <article className="panel">
            <h2>Rekomendasi terdekat</h2>
            <div className="related-list">
              {place.related_places?.map((item) => (
                <Link key={item.id} href={`/places/${item.id}`} className="related-card">
                  <strong>{item.name}</strong>
                  <span>{formatMbps(item.wifi_speed_mbps)} Mbps</span>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

export function SubmitPage() {
  const auth = useGoogleLogin()
  const [form, setForm] = useState(defaultSubmissionForm)
  const [status, setStatus] = useState({ tone: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!auth.user) {
      setStatus({ tone: 'danger', text: 'Login Google diperlukan sebelum mengirim tempat.' })
      return
    }
    setSubmitting(true)
    setStatus({ tone: '', text: '' })

    try {
      await createPlace({
        ...form,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        wifiSpeedMbps: form.wifiSpeedMbps ? Number(form.wifiSpeedMbps) : null,
        uploadMbps: form.uploadMbps ? Number(form.uploadMbps) : null,
        pingMs: form.pingMs ? Number(form.pingMs) : null,
        submitterName: auth.user.name,
        submitterEmail: auth.user.email,
      })

      setForm(defaultSubmissionForm)
      setStatus({
        tone: 'success',
        text: 'Tempat terkirim ke antrean moderasi. Admin harus meninjau sebelum tampil publik.',
      })
    } catch (error) {
      setStatus({ tone: 'danger', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page">
      <section className="section section--submit">
        <div className="submit-copy">
          <span className="eyebrow">Alur kontributor</span>
          <h1>Tambahkan tempat WiFi publik</h1>
          <p>
            Bantu komunitas Bandar Lampung menemukan internet yang jelas tanpa melanggar privasi.
            Setiap kiriman masuk moderasi sebelum tampil di direktori publik.
          </p>
          <div className="policy-list">
            {legalRules.map((rule) => (
              <article key={rule} className="policy-list__item">
                <span className="policy-list__dot" />
                <p>{rule}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <SectionHeader
            eyebrow="Kiriman termoderasi"
            title="Detail tempat dan laporan kualitas awal"
            description="Password tetap opsional, tapi sumber wajib diisi saat password dibagikan."
          />
          {status.text ? <InfoBanner tone={status.tone}>{status.text}</InfoBanner> : null}
          <LoginGate {...auth} />
          <form className="submit-form" onSubmit={handleSubmit}>
            <div className="submit-form__grid">
              <label className="field">
                <span>Nama tempat</span>
                <input name="name" value={form.name} onChange={updateField} required />
              </label>
              <label className="field">
                <span>Kecamatan</span>
                <input name="district" value={form.district} onChange={updateField} required />
              </label>
            </div>

            <label className="field">
              <span>Alamat</span>
              <input name="address" value={form.address} onChange={updateField} required />
            </label>

            <div className="submit-form__grid">
              <label className="field">
                <span>Kategori</span>
                <select name="category" value={form.category} onChange={updateField}>
                  {categoryOptions.map((item) => (
                    <option key={item} value={item}>
                      {localizeLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Jenis akses</span>
                <select name="wifiAccessType" value={form.wifiAccessType} onChange={updateField}>
                  {accessTypeOptions.map((item) => (
                    <option key={item} value={item}>
                      {localizeLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="submit-form__grid">
              <label className="field">
                <span>Lintang</span>
                <input name="latitude" value={form.latitude} onChange={updateField} placeholder="-5.38" />
              </label>
              <label className="field">
                <span>Bujur</span>
                <input name="longitude" value={form.longitude} onChange={updateField} placeholder="105.25" />
              </label>
            </div>

            <div className="toggle-grid">
              <label className="toggle-card">
                <input type="checkbox" name="wifiAvailable" checked={form.wifiAvailable} onChange={updateField} />
                <div>
                  <strong>WiFi tersedia</strong>
                  <span>Matikan jika tempat ini sedang tidak punya koneksi aktif.</span>
                </div>
              </label>
              <label className="toggle-card">
                <input
                  type="checkbox"
                  name="hasPowerOutlets"
                  checked={form.hasPowerOutlets}
                  onChange={updateField}
                />
                <div>
                  <strong>Colokan listrik</strong>
                  <span>Penting untuk sesi kerja lebih dari satu jam.</span>
                </div>
              </label>
              <label className="toggle-card">
                <input type="checkbox" name="quietZone" checked={form.quietZone} onChange={updateField} />
                <div>
                  <strong>Area tenang</strong>
                  <span>Tandai hanya jika panggilan dan kerja fokus masih realistis.</span>
                </div>
              </label>
              <label className="toggle-card">
                <input type="checkbox" name="open24Hours" checked={form.open24Hours} onChange={updateField} />
                <div>
                  <strong>Buka 24 jam</strong>
                  <span>Berguna untuk kerja malam atau perjalanan.</span>
                </div>
              </label>
            </div>

            <div className="submit-form__grid">
              <label className="field">
                <span>Password WiFi publik</span>
                <input
                  name="wifiPassword"
                  value={form.wifiPassword}
                  onChange={updateField}
                  placeholder="Hanya jika terpampang publik atau disetujui pemilik"
                />
              </label>
              <label className="field">
                <span>Sumber password</span>
                <select name="passwordSource" value={form.passwordSource} onChange={updateField}>
                  <option value="">Pilih sumber</option>
                  {passwordSourceOptions.map((item) => (
                    <option key={item} value={item}>
                      {localizeLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Catatan akses</span>
              <textarea
                name="accessNotes"
                value={form.accessNotes}
                onChange={updateField}
                placeholder="Contoh: tanya kasir setelah pesan, atau pakai portal setelah check-in."
              />
            </label>

            <div className="submit-form__grid submit-form__grid--triple">
              <label className="field">
                <span>Unduh Mbps</span>
                <input name="wifiSpeedMbps" value={form.wifiSpeedMbps} onChange={updateField} />
              </label>
              <label className="field">
                <span>Unggah Mbps</span>
                <input name="uploadMbps" value={form.uploadMbps} onChange={updateField} />
              </label>
              <label className="field">
                <span>Ping ms</span>
                <input name="pingMs" value={form.pingMs} onChange={updateField} />
              </label>
            </div>

            <div className="submit-form__grid">
              <label className="field">
                <span>Jam operasional</span>
                <input
                  name="operatingHours"
                  value={form.operatingHours}
                  onChange={updateField}
                  placeholder="Mon-Fri 08:00-22:00"
                />
              </label>
              <label className="field">
                <span>Label suasana</span>
                <input
                  name="ambienceLabel"
                  value={form.ambienceLabel}
                  onChange={updateField}
                  placeholder="Area tenang / pusat kerja / pilihan singgah"
                />
              </label>
            </div>

            <label className="field">
              <span>Catatan peta atau konteks</span>
              <textarea
                name="mapContext"
                value={form.mapContext}
                onChange={updateField}
                placeholder="Patokan, lantai, area duduk terbaik, atau kampus/bisnis terdekat."
              />
            </label>

            <label className="field">
              <span>URL gambar</span>
              <input
                type="url"
                name="imageUrl"
                value={form.imageUrl}
                onChange={updateField}
                placeholder="https://i.ibb.co/.../workspace-lampung.jpg"
              />
            </label>

            <button type="submit" className="button button--primary" disabled={submitting}>
              {submitting ? 'Mengirim...' : 'Kirim tempat untuk ditinjau'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export function AdminPage() {
  const [adminToken, setAdminToken] = useState('')
  const [state, setState] = useState({
    loading: true,
    error: '',
    source: '',
    stats: null,
    submissions: [],
  })
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    setAdminToken(window.localStorage.getItem('balamwifi_admin_token') ?? '')
  }, [])

  useEffect(() => {
    let active = true

    async function loadQueue() {
      try {
        setState((current) => ({ ...current, loading: true, error: '' }))
        const response = await getAdminSubmissions(adminToken)

        if (!active) {
          return
        }

        setState({
          loading: false,
          error: '',
          source: response.meta.source,
          stats: response.data.stats,
          submissions: response.data.submissions,
        })
      } catch (error) {
        if (!active) {
          return
        }

        setState({
          loading: false,
          error: error.message,
          source: '',
          stats: null,
          submissions: [],
        })
      }
    }

    loadQueue()
    return () => {
      active = false
    }
  }, [adminToken])

  function saveAdminToken(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const token = String(formData.get('adminToken') ?? '').trim()

    if (token) {
      window.localStorage.setItem('balamwifi_admin_token', token)
    } else {
      window.localStorage.removeItem('balamwifi_admin_token')
    }

    setAdminToken(token)
  }

  async function moderate(placeId, status) {
    setBusyId(placeId)

    try {
      await updateSubmissionStatus(placeId, status, adminToken)
      const refreshed = await getAdminSubmissions(adminToken)
      setState({
        loading: false,
        error: '',
        source: refreshed.meta.source,
        stats: refreshed.data.stats,
        submissions: refreshed.data.submissions,
      })
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="page">
      <section className="section">
        <SectionHeader
          eyebrow="Akses moderator"
          title="Menunggu persetujuan"
          description="Antrean admin menjaga aturan password legal dan memblokir data WiFi pribadi yang belum terverifikasi."
          action={<StatusPill tone="muted">Sumber: {state.source || 'memuat'}</StatusPill>}
        />

        {state.error ? <InfoBanner tone="danger">{state.error}</InfoBanner> : null}
        <form className="admin-token-form" onSubmit={saveAdminToken}>
          <label className="field">
            <span>Token admin</span>
            <input
              name="adminToken"
              type="password"
              defaultValue={adminToken}
              placeholder="Tempel ADMIN_TOKEN untuk moderasi terlindungi"
            />
          </label>
          <button type="submit" className="button button--primary">
            Simpan token
          </button>
        </form>
        {state.loading ? (
          <LoadingGrid />
        ) : (
          <>
            <div className="admin-metrics">
              <MetricTile label="Tempat disetujui" value={String(state.stats?.total_spots ?? 0)} />
              <MetricTile label="Menunggu tinjauan" value={String(state.stats?.pending_submissions ?? 0)} />
              <MetricTile label="Ditolak" value={String(state.stats?.rejected_submissions ?? 0)} />
              <MetricTile label="Kontributor aktif" value={String(state.stats?.active_contributors ?? 0)} />
            </div>

            <div className="admin-queue">
              {state.submissions.map((submission) => (
                <article key={submission.id} className="submission-card">
                  <div className="submission-card__copy">
                    <div className="submission-card__head">
                      <div>
                        <h3>{submission.name}</h3>
                        <p>{submission.address}</p>
                      </div>
                      <StatusPill tone={submission.status === 'pending' ? 'warning' : 'danger'}>
                        {localizeStatus(submission.status)}
                      </StatusPill>
                    </div>
                    <div className="submission-card__meta">
                      <StatusPill tone="muted">{localizeLabel(submission.category)}</StatusPill>
                      <StatusPill tone="muted">{submission.submitter_name || 'Pengirim tidak diketahui'}</StatusPill>
                      <StatusPill tone="info">
                        {submission.wifi_speed_mbps
                          ? `${formatMbps(submission.wifi_speed_mbps)} Mbps`
                          : 'Kecepatan menunggu'}
                      </StatusPill>
                    </div>
                    <p>{submission.access_notes || 'Belum ada catatan akses.'}</p>
                    <small>
                      Dibuat {formatDate(submission.created_at)}. Sumber password:{' '}
                      {localizeLabel(submission.password_source) || 'belum diisi'}
                    </small>
                  </div>
                  <div className="submission-card__actions">
                    <button
                      type="button"
                      className="button button--primary"
                      disabled={busyId === submission.id}
                      onClick={() => moderate(submission.id, 'approved')}
                    >
                      Setujui
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
                      disabled={busyId === submission.id}
                      onClick={() => moderate(submission.id, 'rejected')}
                    >
                      Tolak
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

function readFilters(searchParams) {
  return {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    accessType: searchParams.get('accessType') || 'all',
    speed: searchParams.get('speed') || 'all',
    outlets: searchParams.get('outlets') === 'true',
    open24: searchParams.get('open24') === 'true',
    wifi: searchParams.get('wifi') !== 'false',
  }
}

function localizeSpeed(speed) {
  return {
    steady: 'Stabil',
    fast: 'Cepat',
    ultra: 'Sangat cepat',
  }[speed] || speed
}

function localizeStatus(status) {
  return {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
  }[status] || status
}
