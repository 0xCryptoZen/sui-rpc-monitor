/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For Vercel deployment
  output: process.env.VERCEL ? undefined : 'standalone',
  // For static export (GitHub Pages, Netlify, etc)
  // Uncomment the line below for static export
  // output: 'export',
  
  // Force Node.js runtime for all API routes
  runtime: 'nodejs',
  
  // Optimization for faster builds and offline support
  swcMinify: false,
  compiler: {
    removeConsole: false,
  },
  experimental: {
    optimizeCss: false,
    // Disable edge runtime globally
    runtime: 'nodejs',
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
    // Disable minification completely to avoid build errors
    config.optimization.minimize = false;
    
    // Only apply fallbacks for client-side bundles
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
        process: false,
        buffer: false,
        child_process: false,
        worker_threads: false,
      };
    }
    
    // Exclude problematic modules from client-side bundling
    config.resolve.alias = {
      ...config.resolve.alias,
      'pg-native': false,
    };
    
    // Ignore Node.js modules in client-side builds
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'pg': 'pg',
        'bcryptjs': 'bcryptjs',
        'jose': 'jose',
      });
    }
    
    return config;
  },
}

module.exports = nextConfig