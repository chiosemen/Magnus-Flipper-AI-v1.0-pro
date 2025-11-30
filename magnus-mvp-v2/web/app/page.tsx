"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  const handleMagicLink = async () => {
    setStatus("Sending magic link...");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setStatus("Error: " + error.message);
    } else {
      setStatus("Check your email for the magic link.");
    }
  };

  const goDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <main>
      <h1>Magnus Flipper – Live Scraper</h1>
      <p>Login with email to view live scraper activity.</p>

      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        style={{ padding: 8, marginRight: 8 }}
      />

      <button onClick={handleMagicLink} style={{ padding: 8 }}>
        Send Magic Link
      </button>

      {status && <p>{status}</p>}

      <hr style={{ margin: "24px 0" }} />

      <button onClick={goDashboard} style={{ padding: 8 }}>
        View Dashboard (demo)
      </button>
    </main>
  );
}
