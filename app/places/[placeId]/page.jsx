import { PlaceDetailPage } from '../../../src/App.jsx'

export default async function Page({ params }) {
  const { placeId } = await params
  return <PlaceDetailPage placeId={placeId} />
}
