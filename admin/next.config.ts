import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The VPS image runs `.next/standalone/server.js`; it contains the traced
  // server dependencies and no development packages.
  output: 'standalone',
  poweredByHeader: false,
  devIndicators: false,
  serverExternalPackages: ['mongodb'],
  experimental: {
    agentUpgrade: 'security' as any,
  },
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
