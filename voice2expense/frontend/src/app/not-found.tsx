import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-600 mb-4">404</h1>
        <p className="text-xl text-slate-400 mb-8">Page not found</p>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
