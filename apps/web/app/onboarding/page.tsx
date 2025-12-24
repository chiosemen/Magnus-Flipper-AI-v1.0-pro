'use client';

/**
 * Onboarding Page - First-Time User Flow
 *
 * REQUIREMENTS:
 * =============
 * - Must complete onboarding before accessing dashboard
 * - Sets onboarding_completed = true in profiles table
 * - Collects user preferences (optional)
 * - Can skip for existing users (grandfathered)
 *
 * FLOW:
 * =====
 * 1. Welcome screen
 * 2. Collect full name (if not provided)
 * 3. Explain key features
 * 4. Mark onboarding complete
 * 5. Redirect to dashboard
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user has already completed onboarding, redirect to dashboard
  useEffect(() => {
    if (profile?.onboarding_completed) {
      router.push('/dashboard');
    }
  }, [profile, router]);

  // Pre-fill full name if available
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = supabaseBrowser();

      // Update profile with onboarding complete + full name
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          full_name: fullName || null,
        })
        .eq('id', user?.id);

      if (updateError) {
        console.error('[Onboarding] Error updating profile:', updateError);
        setError('Failed to complete onboarding. Please try again.');
        setLoading(false);
        return;
      }

      // Refresh profile in auth context
      await refreshProfile();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('[Onboarding] Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="text-6xl mb-6">🚀</div>
            <h1 className="text-4xl font-bold text-[#ededed] mb-4">
              Welcome to Magnus Flipper!
            </h1>
            <p className="text-lg text-[#6E7681] mb-8">
              Let's get you set up in just a few seconds.
            </p>
            <button
              onClick={() => setStep(2)}
              className="bg-[#4FF0E6] text-[#0D1117] px-8 py-3 rounded-lg font-semibold hover:bg-[#3dd9cf] transition-colors"
            >
              Get Started
            </button>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <h2 className="text-2xl font-bold text-[#ededed] mb-4 text-center">
              What should we call you?
            </h2>
            <p className="text-[#6E7681] mb-6 text-center">
              This helps personalize your experience
            </p>
            <input
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 text-[#ededed] focus:outline-none focus:border-[#4FF0E6] transition-colors mb-6"
            />
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-[#ededed] px-6 py-3 rounded-lg font-semibold hover:border-[#4a4a4a] transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-[#4FF0E6] text-[#0D1117] px-6 py-3 rounded-lg font-semibold hover:bg-[#3dd9cf] transition-colors"
              >
                {fullName ? 'Continue' : 'Skip'}
              </button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-[#ededed] mb-6 text-center">
              You're all set!
            </h2>
            <p className="text-lg text-[#6E7681] mb-8 text-center">
              Here's what you can do with Magnus Flipper:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-lg font-semibold text-[#ededed] mb-2">
                  Smart Scanning
                </h3>
                <p className="text-sm text-[#6E7681]">
                  Real-time marketplace intelligence across multiple platforms
                </p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                <div className="text-4xl mb-3">💎</div>
                <h3 className="text-lg font-semibold text-[#ededed] mb-2">
                  Deal Discovery
                </h3>
                <p className="text-sm text-[#6E7681]">
                  AI-powered deal detection and profit calculation
                </p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-lg font-semibold text-[#ededed] mb-2">
                  Instant Alerts
                </h3>
                <p className="text-sm text-[#6E7681]">
                  Get notified when hot deals match your criteria
                </p>
              </div>
            </div>

            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-[#4FF0E6] text-[#0D1117] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#3dd9cf] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-[#0D1117] border-t-transparent"></div>
                  Completing setup...
                </span>
              ) : (
                'Go to Dashboard'
              )}
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-[#4FF0E6]'
                    : s < step
                    ? 'w-2 bg-[#4FF0E6]/50'
                    : 'w-2 bg-[#2a2a2a]'
                }`}
              />
            ))}
          </div>
        </div>

        {renderStep()}
      </div>
    </div>
  );
}
