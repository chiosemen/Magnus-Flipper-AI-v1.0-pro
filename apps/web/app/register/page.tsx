"use client";

import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FloatingParticles } from "../components/swoopa-motion/FloatingParticles";
import { SwoopaAIOrb } from "../components/swoopa-ultra/SwoopaAIOrb";
import { LiquidMetalButton } from "../components/swoopa-ultra/LiquidMetalButton";
import { NeonCard } from "../components/swoopa-ultra/NeonCard";
import { useAuth } from "@/app/providers/AuthProvider";

function RegisterPageContent() {
  const [isTyping, setIsTyping] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Basic validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error: signUpError } = await signUp(email, password, fullName);

    if (signUpError) {
      setError(signUpError.message || 'Failed to create account. Please try again.');
      setLoading(false);
      return;
    }

    // Success - show confirmation message
    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-purple-950/40 via-blue-950/30 to-black text-white flex items-center justify-center px-6 relative overflow-hidden">
      {/* Dark Nebula Background */}
      <FloatingParticles layerCount={4} particlesPerLayer={15} speed={0.15} color="rgba(59, 130, 246, 0.2)" />

      {/* Nebula Gradient Layers */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-blue-900/30 via-cyan-900/20 to-transparent"
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-blue-900/20"
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* AI Guardian Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-30 pointer-events-none">
        <SwoopaAIOrb size={400} particleCount={30} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <NeonCard
          className="p-10"
          glowColor="rgba(59, 130, 246, 0.5)"
          hover={false}
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Create your account
          </h1>
          <p className="text-neutral-300 mb-8">
            Start flipping with real-time AI power.
          </p>

          {/* Success Message */}
          {success && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
              <p className="text-green-400 text-sm font-medium mb-2">✓ Account created!</p>
              <p className="text-green-300 text-sm">
                Please check your email to verify your account, then sign in.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <motion.input
              type="text"
              placeholder="Full Name (optional)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading || success}
              className="bg-black/50 border border-blue-500/30 p-4 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              animate={isTyping ? { boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" } : {}}
            />
            <motion.input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || success}
              className="bg-black/50 border border-blue-500/30 p-4 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              animate={isTyping ? { boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" } : {}}
            />
            <motion.input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || success}
              minLength={6}
              className="bg-black/50 border border-blue-500/30 p-4 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              animate={isTyping ? { boxShadow: "0 0 20px rgba(147, 51, 234, 0.5)" } : {}}
            />
            {!success && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <LiquidMetalButton variant="primary" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </LiquidMetalButton>
              </motion.div>
            )}
          </form>
          <p className="text-neutral-300 mt-8 text-center">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-cyan-400 font-semibold hover:text-cyan-300 hover:underline transition"
            >
              Sign in
            </a>
          </p>
        </NeonCard>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
