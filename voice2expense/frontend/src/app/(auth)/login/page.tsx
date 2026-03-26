"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      document.cookie = "has_session=1; path=/; max-age=604800";
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            Voice<span className="text-emerald-400">2</span>Expense
          </h1>
          <p className="text-slate-400 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-emerald-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
