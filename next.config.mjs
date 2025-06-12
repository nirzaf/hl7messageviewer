/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Remove static export configuration
  // Add trailingSlash for better compatibility
  trailingSlash: true,
  // Disable React strict mode for compatibility
  reactStrictMode: false,
}

export default nextConfig