/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For Vercel deployment
  output: process.env.VERCEL ? undefined : 'standalone',
  // For static export (GitHub Pages, Netlify, etc)
  // Uncomment the line below for static export
  // output: 'export',
  
  // Optimization for faster builds and offline support
  swcMinify: false,
  compiler: {
    removeConsole: false,
  },
  experimental: {
    optimizeCss: false,
    fontLoaders: [],
  },
  // Disable external network calls during build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig