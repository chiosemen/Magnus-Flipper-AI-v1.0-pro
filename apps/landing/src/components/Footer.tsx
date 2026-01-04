'use client';

import Link from 'next/link';
import { Zap, Twitter, Facebook, Instagram, Youtube, Linkedin } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' },
  ],
  resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'Help Center', href: '/help' },
    { label: 'Flipping Guides', href: '/guides' },
    { label: 'API Docs', href: '/api-docs' },
    { label: 'Status', href: '/status' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Press Kit', href: '/press' },
    { label: 'Partners', href: '/partners' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'GDPR', href: '/gdpr' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/magnusflipperai', label: 'Twitter' },
  { icon: Facebook, href: 'https://facebook.com/magnusflipperai', label: 'Facebook' },
  { icon: Instagram, href: 'https://instagram.com/magnusflipperai', label: 'Instagram' },
  { icon: Youtube, href: 'https://youtube.com/@magnusflipperai', label: 'YouTube' },
  { icon: Linkedin, href: 'https://linkedin.com/company/magnus-flipper-ai', label: 'LinkedIn' },
];

export default function Footer() {
  return (
    <footer className="bg-carbon-900/50 border-t border-carbon-800">
      <div className="container-wide py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold font-heading">
                Magnus <span className="text-gradient">Flipper</span>
              </span>
            </Link>
            <p className="text-carbon-400 text-sm mb-6 max-w-xs">
              Find profitable flips before anyone else with AI-powered marketplace monitoring and instant alerts.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-carbon-800 flex items-center justify-center text-carbon-400 hover:text-flipper-400 hover:bg-carbon-700 transition-all duration-200"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-carbon-100 mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="link text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-carbon-100 mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="link text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-carbon-100 mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="link text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-carbon-100 mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="link text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-carbon-800 pt-8 mb-8">
          <div className="max-w-md">
            <h3 className="font-semibold text-carbon-100 mb-2">
              Subscribe to our newsletter
            </h3>
            <p className="text-sm text-carbon-400 mb-4">
              Get flipping tips, deal alerts, and product updates delivered weekly.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="input flex-grow"
                required
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-carbon-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-carbon-500">
            © {new Date().getFullYear()} Magnus Flipper AI. All rights reserved.
          </p>
          <p className="text-sm text-carbon-500">
            A product of{' '}
            <a
              href="https://magnus-tech.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-flipper-400 hover:text-flipper-300 transition-colors"
            >
              Magnus-Tech.AI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
