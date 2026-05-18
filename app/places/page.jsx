import { PlacesPage } from '../../src/views/PlacesPage.jsx'
import { readFilters, filtersToQuery, searchParamsKey } from '../../src/lib/filters.js'
import { placesState } from '../../src/lib/serverApi.js'

export const revalidate = 60

export default async function Page({ searchParams }) {
  const resolvedSearchParams = await searchParams
  const filters = readFilters(resolvedSearchParams)
  const initialState = await placesState(filtersToQuery(filters))

  const key = searchParamsKey(resolvedSearchParams)

  return <PlacesPage key={key} filters={filters} searchKey={key} initialState={initialState} />
}
