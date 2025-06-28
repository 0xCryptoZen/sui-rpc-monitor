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
    // Enable Tailwind CSS v4 support
    turbo: {
      rules: {
        '*.css': {
          loaders: ['css-loader'],
          as: '*.css',
        },
      },
    },
  },
  // Disable external network calls during build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Disable font optimization to prevent network calls
  optimizeFonts: false,
  // Webpack configuration to handle build issues
  webpack: (config, { isServer }) => {
    // Disable minification completely
    config.optimization.minimize = false;
    
    // Handle Node.js modules for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
        os: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig