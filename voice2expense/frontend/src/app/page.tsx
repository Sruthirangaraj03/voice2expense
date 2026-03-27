import Link from "next/link";

const voiceExamples = [
  '"Tea 20 rupees, petrol 40 rupees"',
  '"Yesterday lunch 150, auto 30"',
  '"Groceries 800 and electricity bill 1200"',
  '"Coffee 50, movie tickets 350 for 2 people"',
];

const features = [
  {
    title: "Just Speak",
    desc: "Say your expenses naturally in any language. No typing, no forms.",
    icon: (
      <svg className="w-6 h-6 text-[#E65100]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    ),
  },
  {
    title: "AI Categorizes",
    desc: "Our AI understands context — food, transport, bills — sorted automatically.",
    icon: (
      <svg className="w-6 h-6 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    title: "Set Budgets",
    desc: "Weekly or monthly limits per category. Get warnings before you overspend.",
    icon: (
      <svg className="w-6 h-6 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    title: "Ask Anything",
    desc: '"How much did I spend this week?" — get instant, accurate answers.',
    icon: (
      <svg className="w-6 h-6 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E65100] rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <p className="font-bold text-sm text-gray-800 uppercase tracking-wider">Voice2Expense</p>
        </div>
        <Link
          href="/login"
          className="px-5 py-2.5 bg-white text-gray-700 rounded-xl text-sm font-medium shadow-sm hover:bg-gray-50 transition"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <section className="px-6 pt-12 pb-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Just say it.{" "}
              <span className="text-[#E65100]">We log it.</span>
            </h1>
            <p className="text-gray-500 mt-4 text-lg max-w-md">
              Stop typing expenses. Just speak naturally — &quot;tea 20 rupees, auto 30, lunch 150&quot; — and Voice2Expense handles the rest.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="/register"
                className="px-8 py-4 bg-[#E65100] text-white rounded-2xl font-semibold text-lg hover:bg-[#BF360C] transition shadow-sm text-center"
              >
                Start Free
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold text-lg shadow-sm hover:bg-gray-50 transition text-center"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Voice Demo Card */}
          <div className="flex-1 max-w-sm w-full">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-[#E65100] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Try saying...</p>
                  <p className="text-xs text-gray-400">Voice2Expense understands you</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {voiceExamples.map((ex, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-600 italic"
                  >
                    {ex}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                Works in English, Hindi, Tamil, and more
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-12 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">How it works</h2>
        <p className="text-gray-400 text-center mb-10 text-sm">Three taps. Zero typing.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-[#E65100] font-bold text-lg">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Tap & Speak</h3>
            <p className="text-sm text-gray-400">Hit the mic button and say your expenses naturally</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-[#E65100] font-bold text-lg">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">AI Parses</h3>
            <p className="text-sm text-gray-400">Amount, category, and date extracted automatically</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-[#E65100] font-bold text-lg">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Track & Save</h3>
            <p className="text-sm text-gray-400">Expenses logged, budgets tracked, insights ready</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Everything you need</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm flex gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-12 max-w-md mx-auto w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to stop typing expenses?</h2>
        <p className="text-gray-400 text-sm mb-6">Sign up free. No credit card needed.</p>
        <Link
          href="/register"
          className="w-full block text-center px-6 py-4 bg-[#E65100] text-white rounded-2xl font-semibold text-lg hover:bg-[#BF360C] transition shadow-sm"
        >
          Create Free Account
        </Link>
        <p className="text-center text-sm text-gray-400 mt-3">
          Already have an account?{" "}
          <Link href="/login" className="text-[#E65100] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-gray-200 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#E65100] rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
            <span className="text-xs text-gray-400 font-medium">Voice2Expense</span>
          </div>
          <p className="text-xs text-gray-400">Built with AI. Made for real life.</p>
        </div>
      </footer>
    </div>
  );
}
