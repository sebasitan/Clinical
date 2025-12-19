/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    turbopack: {
      root: '.',
    }
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
