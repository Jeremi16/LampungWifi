import { PlaceDetailPage } from '../../../src/views/PlaceDetailPage.jsx'
import { placeState } from '../../../src/lib/serverApi.js'

export const revalidate = 60

export default async function Page({ params }) {
  const { placeId } = await params
  const initialState = await placeState(placeId)
  return <PlaceDetailPage key={placeId} placeId={placeId} initialState={initialState} />
}
