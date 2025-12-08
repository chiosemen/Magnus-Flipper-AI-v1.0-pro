"use client";

import Link from "next/link";
import { Facebook, Twitter, Youtube } from "lucide-react";

export const MMAgentFooter = () => {
  return (
    <footer id="contact" className="bg-mm-dark text-white py-16 px-6">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-12 max-w-6xl mx-auto">
          {/* Logo & Contact */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-mm-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-heading font-bold text-xl">MM AGENT</span>
            </div>
            <div className="mt-6">
              <p className="text-white/60 text-sm mb-2">Have a Question? Email Us</p>
              <a
                href="mailto:hello@marketplacemonitor.co.uk"
                className="text-mm-accent hover:underline"
              >
                hello@marketplacemonitor.co.uk
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#objectives" className="text-white/70 hover:text-white transition-colors">
                  Objectives
                </a>
              </li>
              <li>
                <a href="#features" className="text-white/70 hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#user-flow" className="text-white/70 hover:text-white transition-colors">
                  User Flow
                </a>
              </li>
              <li>
                <Link href="/" className="text-white/70 hover:text-white transition-colors">
                  Magnus Flipper Home
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-mm-primary transition-colors"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-mm-primary transition-colors"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-mm-primary transition-colors"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/50 text-sm">
          © 2024 MM Agent. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
