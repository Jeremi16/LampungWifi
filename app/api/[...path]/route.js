const API_SERVER_URL = process.env.API_SERVER_URL ?? 'http://localhost:8787'

async function proxy(request, { params }) {
  const { path } = await params
  const sourceUrl = new URL(request.url)
  const targetUrl = new URL(`/api/${path.join('/')}${sourceUrl.search}`, API_SERVER_URL)
  const headers = new Headers(request.headers)

  headers.delete('host')

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
    cache: 'no-store',
  })

  const responseHeaders = new Headers(response.headers)
  responseHeaders.delete('content-encoding')
  responseHeaders.delete('content-length')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

export const GET = proxy
export const POST = proxy
export const PATCH = proxy
export const PUT = proxy
export const DELETE = proxy
