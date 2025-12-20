"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../marketing-swoopa/components/ui/dialog";
import { Button } from "../../marketing-swoopa/components/ui/button";
import { Input } from "../../marketing-swoopa/components/ui/input";

type Mode = "login" | "signup";

export function AuthModal({
  open,
  mode,
  onModeChange,
  onOpenChange,
  getClient,
}: {
  open: boolean;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onOpenChange: (open: boolean) => void;
  getClient: () => SupabaseClient | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const title = mode === "login" ? "Sign in" : "Create account";
  const description =
    mode === "login"
      ? "Sign in to save searches and enable watch/notify."
      : "Create an account to save searches and enable watch/notify.";

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length >= 6 && !submitting;
  }, [email, password, submitting]);

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setError(null);
      setNote(null);
      setPassword("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNote(null);

    const client = getClient();
    if (!client) {
      setError("Auth unavailable (Supabase not configured).");
      return;
    }

    if (!email.trim() || password.trim().length < 6) {
      setError("Enter a valid email and password (6+ characters).");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error: signInError } = await client.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        onOpenChange(false);
        return;
      }

      const { data, error: signUpError } = await client.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data?.user && !data.session) {
        setNote("Check your email to confirm your account, then sign in.");
        onModeChange("login");
        return;
      }

      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0A] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-white/70">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/80">Email</label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-[#121212] border border-white/10 text-white placeholder-white/40 focus-visible:ring-[#00E5FF]/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/80">
              Password
            </label>
            <Input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-[#121212] border border-white/10 text-white placeholder-white/40 focus-visible:ring-[#00E5FF]/40"
            />
            <div className="text-[11px] text-white/50">
              Minimum 6 characters.
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
              {error}
            </div>
          )}

          {note && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70">
              {note}
            </div>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full"
          >
            {submitting
              ? mode === "login"
                ? "Signing in…"
                : "Creating account…"
              : mode === "login"
              ? "Sign in"
              : "Create account"}
          </Button>

          <div className="flex items-center justify-between text-xs text-white/70">
            {mode === "login" ? (
              <>
                <span>New here?</span>
                <button
                  type="button"
                  className="font-semibold text-[#00E5FF] hover:underline"
                  onClick={() => {
                    setError(null);
                    setNote(null);
                    onModeChange("signup");
                  }}
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                <span>Already have an account?</span>
                <button
                  type="button"
                  className="font-semibold text-[#00E5FF] hover:underline"
                  onClick={() => {
                    setError(null);
                    setNote(null);
                    onModeChange("login");
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

