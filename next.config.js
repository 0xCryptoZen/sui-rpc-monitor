/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable server actions
    serverActions: true,
  },
}

module.exports = nextConfig