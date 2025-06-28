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
    serverComponentsExternalPackages: ['pg', 'bcryptjs', 'jose'],
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
  webpack: (config, { isServer, dev }) => {
    // Disable minification completely to avoid build errors
    config.optimization.minimize = false;
    
    // Handle Node.js modules for different environments
    if (!isServer) {
      // Client-side: exclude Node.js modules
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
        'pg-native': false,
        'pg': false,
        'jose': false,
      };
    } else {
      // Server-side: make modules external but not tailwindcss
      config.externals = config.externals || [];
      config.externals.push({
        'pg': 'commonjs pg',
        'jose': 'commonjs jose',
        'pg-native': 'commonjs pg-native'
      });
    }
    
    // Always allow tailwindcss to be bundled
    if (Array.isArray(config.externals)) {
      config.externals = config.externals.filter(external => 
        typeof external !== 'string' || !external.includes('tailwindcss')
      );
    }
    
    // Exclude problematic modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'pg-native': false,
    };
    
    return config;
  },
  
}

module.exports = nextConfig