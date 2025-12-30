# Magnus Flipper AI - Landing Page

A high-performance, conversion-optimized landing page for Magnus Flipper AI built with Next.js 16, TypeScript, and Tailwind CSS.

## 🎯 Performance Goals

This landing page is designed to achieve:
- **95+ Lighthouse Performance Score**
- **100 Accessibility Score**
- **100 Best Practices Score**
- **100 SEO Score**

Outperforming competitors (MarketplaceMonitor.com, GetSwoopa.com) who use WordPress/Elementor stacks with 70-80 Lighthouse scores.

## 🚀 Tech Stack

- **Framework**: Next.js 16.0.7 with App Router
- **Language**: TypeScript 5.6 (strict mode)
- **Styling**: Tailwind CSS v3
- **Animations**: Framer Motion 11
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Space Grotesk + Inter) via next/font
- **Deployment**: Vercel (optimized)

## 📁 Project Structure

```
apps/landing/
├── src/
│   ├── app/
│   │   ├── globals.css          # Design system & Tailwind
│   │   ├── layout.tsx           # Root layout with SEO
│   │   └── page.tsx             # Home page
│   └── components/
│       ├── Header.tsx           # Sticky nav with mobile menu
│       ├── Hero.tsx             # Hero with stats & animations
│       ├── Features.tsx         # 6-card feature grid
│       ├── HowItWorks.tsx       # 4-step timeline
│       ├── Testimonials.tsx     # Social proof section
│       ├── Pricing.tsx          # 3-tier pricing cards
│       ├── FAQ.tsx              # Accordion FAQ
│       ├── CTA.tsx              # Final conversion section
│       └── Footer.tsx           # Footer with links
├── public/
│   └── manifest.json            # PWA manifest
├── next.config.mjs              # Next.js configuration
├── tailwind.config.ts           # Tailwind design tokens
├── postcss.config.js            # PostCSS config
├── tsconfig.json                # TypeScript config
├── vercel.json                  # Vercel deployment config
└── package.json                 # Dependencies
```

## 🎨 Design System

### Colors

```css
/* Primary - Flipper Green (Money/Profit) */
--flipper-500: #22c55e;

/* Accent - Volt Yellow (Energy/Alerts) */
--volt-400: #facc15;

/* Neutral - Carbon (Dark UI) */
--carbon-950: #020617;  /* Background */
--carbon-900: #0f172a;  /* Cards */
--carbon-800: #1e293b;  /* Borders */
--carbon-100: #f1f5f9;  /* Text */
```

### Typography

- **Display**: Space Grotesk (headings)
- **Body**: Inter (paragraphs)
- **Weights**: 400, 500, 600, 700

### Component Classes

- `.btn-primary` - Green gradient with glow
- `.btn-secondary` - Dark with border
- `.btn-ghost` - Text only
- `.card` - Glass effect card
- `.badge` - Small pill badge
- `.text-gradient` - Green to yellow gradient
- `.section` - Responsive padding
- `.container-wide` - Max-width container

## 🛠️ Development

### Prerequisites

- Node.js 20+
- pnpm 9.12.0

### Installation

From the **monorepo root**:

```bash
# Install all dependencies
pnpm install

# Run landing page in dev mode
pnpm --filter landing dev

# Or from apps/landing directory
cd apps/landing
pnpm dev
```

The landing page will be available at `http://localhost:3001`.

### Available Scripts

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 🏗️ Building for Production

### From Monorepo Root

```bash
# Build all packages first
pnpm build:packages

# Then build landing app
pnpm --filter landing build
```

### From apps/landing

```bash
pnpm build
```

## 🚀 Deployment to Vercel

### Option 1: Automatic Deployment (Recommended)

1. **Connect Repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Select the `apps/landing` directory as the root

2. **Configure Project Settings**
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/landing`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

3. **Set Environment Variables**
   ```
   NEXT_PUBLIC_SITE_URL=https://magnusflipper.ai
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX (optional)
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxx (optional)
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy on every push to main

### Option 2: Manual Deployment via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# From apps/landing directory
cd apps/landing

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Custom Domain Setup

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add `magnusflipper.ai`
4. Configure DNS records as instructed by Vercel:
   ```
   A Record:  @ → 76.76.21.21
   CNAME:     www → cname.vercel-dns.com
   ```

## 🎯 Performance Optimizations

### Implemented Optimizations

✅ **Next.js Image Optimization**
- AVIF & WebP formats
- Blur placeholders
- Responsive sizing
- 1-year cache TTL

✅ **Font Optimization**
- `next/font/google` with `display: swap`
- Preload enabled
- Self-hosted fonts

✅ **Code Splitting**
- Client components marked with `'use client'`
- Server components by default
- Lazy loading for below-fold content

✅ **Asset Caching**
- Static assets: 1-year immutable cache
- Fonts: 1-year cache
- Images: 1-year cache

✅ **Security Headers**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

✅ **React Optimizations**
- Strict mode enabled
- Console.log removal in production
- CSS optimization enabled

## 📊 SEO Configuration

### Meta Tags

All pages include:
- Title with template
- Description (155 characters)
- Keywords
- Open Graph tags
- Twitter Card tags
- Canonical URL
- Robots directives

### Structured Data Ready

The landing page is ready for:
- Organization schema
- Product schema
- Review schema
- FAQ schema

Add these to `layout.tsx` or `page.tsx` as needed.

## 🖼️ Required Assets

Create and add these images to `/public`:

1. **favicon.ico** (32x32) - Browser tab icon
2. **icon.svg** - Scalable favicon
3. **apple-touch-icon.png** (180x180) - iOS home screen
4. **icon-192.png** (192x192) - PWA icon
5. **icon-512.png** (512x512) - PWA icon
6. **og-image.png** (1200x630) - Social sharing image

### Design Guidelines

- Use green gradient (#22c55e) with yellow accent (#facc15)
- Feature Zap/lightning bolt icon
- Dark background (#020617)
- Clean, modern design

## 🧪 Testing Checklist

Before deployment, verify:

- [ ] `pnpm build` completes without errors
- [ ] `pnpm type-check` shows zero TypeScript errors
- [ ] `pnpm lint` shows zero ESLint errors
- [ ] All components render correctly
- [ ] Mobile responsiveness works (375px - 1920px)
- [ ] All navigation links work
- [ ] All images use `next/image`
- [ ] Accessibility: semantic HTML, ARIA labels, keyboard nav
- [ ] SEO: meta tags, Open Graph, sitemap ready

## 📈 Analytics Setup (Optional)

### Google Analytics

1. Get your GA4 Measurement ID from Google Analytics
2. Add to environment variables:
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
3. Add Google Analytics script to `layout.tsx`:
   ```tsx
   <Script
     src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
     strategy="afterInteractive"
   />
   ```

### Vercel Analytics

Automatically enabled for all Vercel deployments. No setup required.

## 🔧 Troubleshooting

### Build Errors

**Issue**: Module not found errors
```bash
# Solution: Install dependencies from monorepo root
cd ../..
pnpm install
```

**Issue**: TypeScript errors
```bash
# Solution: Check all components and fix type issues
pnpm type-check
```

### Development Issues

**Issue**: Port 3001 already in use
```bash
# Solution: Change port in package.json or kill existing process
lsof -ti:3001 | xargs kill -9
```

**Issue**: Fonts not loading
```bash
# Solution: Clear .next cache
rm -rf .next
pnpm dev
```

## 📞 Support

For issues or questions:
- Email: support@magnusflipper.ai
- GitHub Issues: [Link to your repo]
- Documentation: [Link to docs]

## 📄 License

Copyright © 2025 Magnus-Tech.AI. All rights reserved.

---

Built with ⚡ by Magnus-Tech.AI
