import { HomePage } from '../src/views/HomePage.jsx'
import { placesState } from '../src/lib/serverApi.js'

export const revalidate = 60

export default async function Page() {
  const initialFeatured = await placesState({ limit: 8 })
  return <HomePage initialFeatured={initialFeatured} />
}
