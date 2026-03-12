"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/events";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-jde-bg">
      <div className="w-full max-w-md p-8 rounded-lg bg-jde-surface border border-jde-border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-jde-cyan tracking-wide">
            JDE MISSION CONTROL
          </h1>
          <p className="text-jde-muted text-sm mt-2">
            Just Drive Events Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-jde-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded bg-jde-input border border-jde-border text-jde-cyan focus:outline-none focus:border-jde-cyan"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-jde-muted mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-jde-input border border-jde-border text-jde-cyan focus:outline-none focus:border-jde-cyan"
              required
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded bg-[#7f1d1d] text-jde-danger text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded border border-jde-cyan text-jde-cyan bg-transparent hover:bg-jde-cyan/10 transition-colors disabled:opacity-50"
          >
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full mt-4 text-sm text-jde-muted hover:text-jde-cyan transition-colors"
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
