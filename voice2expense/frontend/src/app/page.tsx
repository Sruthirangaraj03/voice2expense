import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-8 px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-white">
          Voice<span className="text-emerald-400">2</span>Expense
        </h1>
        <p className="text-xl text-slate-300 max-w-xl mx-auto">
          Log expenses in seconds with your voice. AI-powered categorization,
          smart insights, and predictive budgeting.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-slate-500 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 transition"
          >
            Sign In
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="text-3xl mb-3">🎙️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Voice Logging</h3>
            <p className="text-slate-400 text-sm">
              Tap, speak, done. Log expenses in under 3 seconds.
            </p>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Assistant</h3>
            <p className="text-slate-400 text-sm">
              Ask questions about your spending in plain English.
            </p>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart Insights</h3>
            <p className="text-slate-400 text-sm">
              Charts, trends, and predictions to control spending.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
