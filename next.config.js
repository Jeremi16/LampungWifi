const defaultImageHosts = ['i.ibb.co', 'images.unsplash.com', 'lh3.googleusercontent.com']
const imageHosts = (process.env.NEXT_IMAGE_REMOTE_HOSTS ?? defaultImageHosts.join(','))
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: 'https',
      hostname,
    })),
  },
}

export default nextConfig
