'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { accessTypeOptions, categoryOptions, localizeLabel } from '../lib/constants'
import { EmptyState, InfoBanner, LoadingGrid, PlaceCard, StatusPill } from '../components/ui'
import { FilterSelect } from '../components/FilterSelect'
import { localizeSpeed } from '../lib/pageLabels'

const emptyPlacesState = {
  loading: true,
  error: '',
  source: '',
  items: [],
}

const defaultFilters = {
  q: '',
  category: 'all',
  accessType: 'all',
  speed: 'all',
  outlets: false,
  open24: false,
  wifi: true,
}

export function PlacesPage({ filters = defaultFilters, searchKey = '', initialState = emptyPlacesState } = {}) {
  const router = useRouter()
  const state = initialState
  const [showFilters, setShowFilters] = useState(false)
  const [openFilter, setOpenFilter] = useState('')
  const hasAdvancedFilters =
    filters.category !== 'all' ||
    filters.accessType !== 'all' ||
    filters.speed !== 'all' ||
    filters.outlets ||
    filters.open24 ||
    !filters.wifi

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
    setOpenFilter('')
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
    setOpenFilter('')
  }

  function toggleFilter(name) {
    setOpenFilter((current) => (current === name ? '' : name))
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
                  open={openFilter === 'speed'}
                  onOpen={(nextOpen = true) => (nextOpen ? toggleFilter('speed') : setOpenFilter(''))}
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
                  open={openFilter === 'accessType'}
                  onOpen={(nextOpen = true) => (nextOpen ? toggleFilter('accessType') : setOpenFilter(''))}
                  options={[
                    { value: 'all', label: 'Semua jenis akses' },
                    ...accessTypeOptions.map((item) => ({ value: item, label: localizeLabel(item) })),
                  ]}
                />

                <FilterSelect
                  label="Kategori"
                  name="category"
                  defaultValue={filters.category}
                  open={openFilter === 'category'}
                  onOpen={(nextOpen = true) => (nextOpen ? toggleFilter('category') : setOpenFilter(''))}
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
