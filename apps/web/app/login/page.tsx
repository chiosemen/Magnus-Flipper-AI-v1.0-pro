"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FloatingParticles } from "../components/swoopa-motion/FloatingParticles";
import { SwoopaAIOrb } from "../components/swoopa-ultra/SwoopaAIOrb";
import { LiquidMetalButton } from "../components/swoopa-ultra/LiquidMetalButton";
import { NeonCard } from "../components/swoopa-ultra/NeonCard";
import { useAuth } from "@/app/providers/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function LoginPageContent() {
  const [isTyping, setIsTyping] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const oneTapInitialized = useRef(false);

  const supabase = supabaseBrowser();

  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isAuthenticated } = useAuth();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  useEffect(() => {
    if (isAuthenticated || oneTapInitialized.current) {
      return;
    }

    if (!googleClientId) {
      console.warn("[Auth] Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }

    const initializeOneTap = () => {
      if (oneTapInitialized.current) {
        return;
      }

      if (!window.google?.accounts?.id) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) {
            console.warn("[Auth] Google One Tap missing credential");
            return;
          }

          const { error: idTokenError } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
          });

          if (idTokenError) {
            console.warn("[Auth] Google One Tap sign-in failed", idTokenError);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.prompt();
      oneTapInitialized.current = true;
    };

    if (window.google?.accounts?.id) {
      initializeOneTap();
      return;
    }

    if (document.getElementById("google-gis")) {
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gis";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeOneTap;
    document.head.appendChild(script);
  }, [googleClientId, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message || 'Invalid email or password');
      setLoading(false);
      return;
    }

    // Success - auth state will update and useEffect will redirect
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setError(null);
    setOauthLoading(true);

    // Use NEXT_PUBLIC_SITE_URL if set, otherwise fall back to window.location.origin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const redirectUrl = `${siteUrl}/auth/callback`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (oauthError) {
      setError(oauthError.message || "Failed to start Google sign-in");
      setOauthLoading(false);
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/30 via-blue-950/20 to-black text-white flex items-center justify-center px-6 relative overflow-hidden">
      {/* Dark Nebula Background */}
      <FloatingParticles layerCount={4} particlesPerLayer={15} speed={0.15} color="rgba(147, 51, 234, 0.2)" />

      {/* Nebula Gradient Layers */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-purple-900/30 via-blue-900/20 to-transparent"
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
        className="absolute inset-0 bg-gradient-radial from-cyan-900/20 via-transparent to-purple-900/20"
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
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <NeonCard
          className="p-10"
          glowColor="rgba(147, 51, 234, 0.5)"
          hover={false}
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-neutral-300 mb-8">Sign in to your Magnus account</p>
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <motion.input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-black/50 border border-purple-500/30 p-4 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              animate={isTyping ? { boxShadow: "0 0 20px rgba(147, 51, 234, 0.5)" } : {}}
            />
            <motion.input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="bg-black/50 border border-purple-500/30 p-4 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              animate={isTyping ? { boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" } : {}}
            />
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <LiquidMetalButton variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </LiquidMetalButton>
            </motion.div>
            {googleClientId && (
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={loading || oauthLoading}
                className="oauth-google-btn w-full flex items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 py-3 text-sm font-medium hover:bg-white/10 transition"
              >
                <img src="/google.svg" alt="Google" className="h-5 w-5" />
                {oauthLoading ? "Connecting..." : "Continue with Google"}
              </button>
            )}
          </form>
          <p className="text-neutral-300 mt-8 text-center">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-cyan-400 font-semibold hover:text-cyan-300 hover:underline transition"
            >
              Create one
            </a>
          </p>
        </NeonCard>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
