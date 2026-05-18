function readParam(searchParams, key) {
  if (!searchParams) {
    return null
  }

  if (typeof searchParams.get === 'function') {
    return searchParams.get(key)
  }

  const value = searchParams[key]
  return Array.isArray(value) ? value[0] : value
}

export function readFilters(searchParams) {
  return {
    q: readParam(searchParams, 'q') || '',
    category: readParam(searchParams, 'category') || 'all',
    accessType: readParam(searchParams, 'accessType') || 'all',
    speed: readParam(searchParams, 'speed') || 'all',
    outlets: readParam(searchParams, 'outlets') === 'true',
    open24: readParam(searchParams, 'open24') === 'true',
    wifi: readParam(searchParams, 'wifi') !== 'false',
  }
}

export function filtersToQuery(filters) {
  return {
    q: filters.q || undefined,
    category: filters.category !== 'all' ? filters.category : undefined,
    accessType: filters.accessType !== 'all' ? filters.accessType : undefined,
    speed: filters.speed !== 'all' ? filters.speed : undefined,
    outlets: filters.outlets || undefined,
    open24: filters.open24 || undefined,
    wifi: filters.wifi ? undefined : 'false',
  }
}

export function searchParamsKey(searchParams) {
  const params = new URLSearchParams()

  if (!searchParams) {
    return ''
  }

  if (typeof searchParams.forEach === 'function') {
    searchParams.forEach((value, key) => params.append(key, value))
    return params.toString()
  }

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item))
    } else if (value !== undefined && value !== null) {
      params.set(key, value)
    }
  }

  return params.toString()
}
