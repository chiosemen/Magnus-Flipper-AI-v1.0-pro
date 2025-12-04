/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@magnus-flipper-ai/agentic-engine',
    '@magnus-flipper-ai/deal-engine',
    '@magnus-flipper-ai/profit-engine',
    '@magnus-flipper-ai/shipping-engine',
    '@magnus-flipper-ai/scraper-sync',
    '@magnus-flipper-ai/arb-engine',
  ],
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // PERFORMANCE: Experimental optimizations
  experimental: {
    // Enable memory cache for better performance
    optimizePackageImports: [
      '@magnus-flipper-ai/agentic-engine',
      '@magnus-flipper-ai/deal-engine',
      '@magnus-flipper-ai/profit-engine',
      '@magnus-flipper-ai/shipping-engine',
      '@magnus-flipper-ai/scraper-sync',
      '@magnus-flipper-ai/arb-engine',
    ],
  },
  
<<<<<<< HEAD
  // Image optimization configuration
  images: {
    domains: [
      "images.craigslist.org",
      "i.ebayimg.com",
      "images.vinted.net",
      "scontent.xx.fbcdn.net"
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.craigslist.org"
      },
      {
        protocol: "https",
        hostname: "*.ebayimg.com"
      },
      {
        protocol: "https",
        hostname: "*.vinted.net"
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net"
      }
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60
  },
  
=======
>>>>>>> ddee1ee (Phase 12A–12F: Full worker rebuild, fixed imports, TS config, pnpm workspaces, Dockerfiles, v3 infra)
  // Security headers
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://magnusflipper.com';
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.stripe.com wss://*.supabase.co",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');
    
    const securityHeaders = [
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Content-Security-Policy',
        value: csp,
      },
      {
        key: 'Permissions-Policy',
        value: [
          'accelerometer=()',
          'ambient-light-sensor=()',
          'autoplay=()',
          'battery=()',
          'camera=()',
          'cross-origin-isolated=()',
          'display-capture=()',
          'document-domain=()',
          'encrypted-media=()',
          'execution-while-not-rendered=()',
          'execution-while-out-of-viewport=()',
          'fullscreen=(self)',
          'geolocation=()',
          'gyroscope=()',
          'keyboard-map=()',
          'magnetometer=()',
          'microphone=()',
          'midi=()',
          'navigation-override=()',
          'payment=()',
          'picture-in-picture=()',
          'publickey-credentials-get=()',
          'screen-wake-lock=()',
          'sync-xhr=()',
          'usb=()',
          'web-share=()',
          'xr-spatial-tracking=()',
        ].join(', '),
      },
    ];
    
    // Add HSTS in production
    if (isProduction) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      });
    }
    
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
