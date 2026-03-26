"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-400 mb-4">Something went wrong</h1>
        <p className="text-slate-400 mb-8">{error.message || 'An unexpected error occurred'}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
