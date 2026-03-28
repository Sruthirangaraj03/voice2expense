"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase puts tokens in URL hash — this picks them up automatically
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          // Try to get session from URL hash explicitly
          const hash = window.location.hash;
          if (hash && hash.includes("access_token")) {
            // Wait for Supabase to process the hash
            await new Promise((r) => setTimeout(r, 1000));
            const { data: retryData } = await supabase.auth.getSession();
            if (retryData.session) {
              await processSession(retryData.session);
              return;
            }
          }
          setError("Authentication failed. Please try again.");
          setTimeout(() => router.push("/login"), 2000);
          return;
        }

        await processSession(session);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    const processSession = async (session: any) => {
      const user = session.user;
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed" }));
        throw new Error(err.message);
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      document.cookie = "has_session=1; path=/; max-age=315360000; SameSite=Lax";

      router.push("/dashboard");
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="text-center">
        {error ? (
          <>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <p className="text-xs text-gray-400 mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-[#E65100] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 font-medium">Signing you in...</p>
            <p className="text-xs text-gray-400 mt-1">Please wait</p>
          </>
        )}
      </div>
    </div>
  );
}
