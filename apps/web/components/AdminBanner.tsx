/**
 * Admin Banner
 *
 * Displays a banner indicating the user is logged in as an admin.
 * Provides visibility for admin access status.
 */

"use client";

import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import { fadeVariants, prefersReducedMotion } from "@/lib/motion";

export function AdminBanner() {
  return (
    <motion.div
      initial={prefersReducedMotion() ? false : "hidden"}
      animate={prefersReducedMotion() ? false : "visible"}
      variants={fadeVariants}
      className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-3 mb-4"
    >
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-purple-400" />
        <div>
          <p className="text-sm font-semibold text-purple-200">
            Logged in as Admin
          </p>
          <p className="text-xs text-purple-300/80">
            You have full access to all system controls and metrics
          </p>
        </div>
      </div>
    </motion.div>
  );
}
