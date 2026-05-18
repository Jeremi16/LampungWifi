'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getPlaces } from '../api'
import { quickFilters } from '../lib/constants'
import { InfoBanner, LoadingGrid, PlaceCard, SectionHeader } from '../components/ui'

const emptyFeaturedState = {
  loading: true,
  error: '',
  source: '',
  items: [],
}

export function HomePage({ initialFeatured = emptyFeaturedState } = {}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [featured, setFeatured] = useState(initialFeatured)
  const visibleFeatured = search.trim() ? featured : initialFeatured

  useEffect(() => {
    const query = search.trim()

    if (!query) {
      return undefined
    }

    let active = true
    const controller = new AbortController()

    async function loadFeatured() {
      try {
        setFeatured((current) => ({ ...current, loading: true, error: '' }))
        const response = await getPlaces({
          q: query,
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
  }, [search])

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
        {visibleFeatured.error ? <InfoBanner tone="danger">{visibleFeatured.error}</InfoBanner> : null}
        {visibleFeatured.loading ? (
          <LoadingGrid />
        ) : (
          <div className="place-grid">
            {visibleFeatured.items.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </section>

    </main>
  )
}
