"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = supabaseBrowser();

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signupError) {
      console.error("Signup failed:", signupError);
      setError(signupError.message);
      toast.error("Signup failed", {
        description: signupError.message,
      });
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
      });

      if (insertError) {
        console.error("Error creating user record:", insertError);
      }

      router.push("/free");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Magnus Flipper AI</h1>
          <p className="text-[#a0a0a0]">Create your account</p>
        </div>

        <form onSubmit={handleSignup} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-[#666] mt-1">
                Minimum 6 characters
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-3 rounded-lg font-semibold transition-colors mb-4"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <div className="text-center text-sm text-[#a0a0a0]">
            Already have an account?{" "}
            <a href="/login" className="text-blue-500 hover:text-blue-400">
              Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
