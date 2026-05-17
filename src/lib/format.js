export function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatMbps(value) {
  if (!value && value !== 0) {
    return '0'
  }

  return Number(value).toFixed(1).replace(/\.0$/, '')
}

export function buildMapsUrl(place) {
  if (place.latitude && place.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
}
