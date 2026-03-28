import Link from "next/link";

const languages = [
  { name: "English", script: "English" },
  { name: "Hindi", script: "हिन्दी" },
  { name: "Tamil", script: "தமிழ்" },
  { name: "Telugu", script: "తెలుగు" },
  { name: "Kannada", script: "ಕನ್ನಡ" },
  { name: "Malayalam", script: "മലയാളം" },
  { name: "Bengali", script: "বাংলা" },
  { name: "Gujarati", script: "ગુજરાતી" },
  { name: "Marathi", script: "मराठी" },
  { name: "Punjabi", script: "ਪੰਜਾਬੀ" },
];

const features = [
  {
    title: "Voice-to-Expense",
    desc: "Speak your expenses naturally and watch them get logged instantly. No typing, no forms, no friction.",
    iconBg: "bg-[#E65100]/10",
    iconColor: "text-[#E65100]",
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    ),
  },
  {
    title: "Smart AI Categorization",
    desc: "Our AI understands context — food, transport, bills, shopping — and categorizes every expense automatically.",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    title: "Budget Alerts",
    desc: "Set weekly or monthly spending limits per category. Get real-time notifications before you overspend.",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    title: "AI-Powered Insights",
    desc: "Ask \"How much did I spend on food this week?\" and get instant answers. Your personal finance assistant.",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
];

const steps = [
  { num: "1", title: "Speak into the app", desc: "Tap the mic and say your expenses naturally in any language. No typing required." },
  { num: "2", title: "AI extracts everything", desc: "Amount, category, date — all extracted and logged automatically in seconds." },
  { num: "3", title: "Stay on budget", desc: "Set spending limits, get alerts, and ask AI about your spending anytime." },
];

const faqs = [
  { q: "Is Voice2Expense free?", a: "Yes! Voice2Expense is completely free to use. Sign up and start tracking your expenses with voice instantly." },
  { q: "Which languages are supported?", a: "We support 10+ Indian languages including Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Marathi, Punjabi, and English. You can even mix languages freely." },
  { q: "How accurate is the voice recognition?", a: "Our AI is trained on Indian accents and regional dialects. It handles mixed-language input (like Hinglish or Tanglish) with high accuracy." },
  { q: "Can I set budgets for different categories?", a: "Absolutely. Set weekly or monthly budgets for food, transport, shopping, bills, or any category. You'll get notified when approaching your limit." },
  { q: "Does it work on mobile?", a: "Yes! Voice2Expense works on any browser — phone, tablet, or desktop. Your data syncs everywhere. Just open the website and start speaking." },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ═══ NAVBAR ═══ */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#E65100] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-gray-900">Voice2Expense</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-500 hover:text-gray-900 transition duration-100">
              Sign In
            </Link>
            <Link href="/register"
              className="bg-[#E65100] text-white px-5 py-2 rounded-md font-semibold text-sm hover:bg-[#BF360C] transition duration-100 ease-linear">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-20">

        {/* ═══ HERO ═══ */}
        <section className="px-6 py-8 md:py-20 max-w-7xl mx-auto flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E65100]/10 text-[#E65100] text-xs font-bold mb-6">
            <span className="w-1.5 h-1.5 bg-[#E65100] rounded-full animate-pulse" />
            AI-POWERED EXPENSE TRACKING
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6 max-w-4xl text-gray-900">
            Track expenses in under{" "}
            <span className="text-[#E65100]">5 seconds</span>{" "}
            with voice
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-2xl mb-10 leading-relaxed">
            The smartest way to log expenses. Speak naturally in any Indian language — we handle categorization, budgets, and insights automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-10">
            <Link href="/register"
              className="bg-gray-900 text-white px-8 py-4 rounded-md font-bold text-lg shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition duration-100 ease-linear">
              Start for free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </section>

        {/* ═══ LANGUAGE MARQUEE ═══ */}
        <section className="py-12 bg-[#FAFAF8] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Speak in your mother tongue</h2>
            <p className="text-gray-500 text-sm">We support 10+ languages and regional dialects</p>
          </div>
          <div className="relative flex overflow-hidden">
            <div className="flex gap-4 md:gap-6 px-4 animate-marquee hover:[animation-play-state:paused]">
              {[...languages, ...languages].map((lang, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm border border-gray-100 whitespace-nowrap shrink-0">
                  <span className="font-bold text-[#E65100] text-sm">{lang.name}</span>
                  <span className="text-gray-400 text-sm">{lang.script}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section className="px-6 py-20 bg-[#FAFAF8]/50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Powerful Features</h2>
              <p className="text-gray-500 max-w-xl">Everything you need to track spending effortlessly — without touching a keyboard.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <div key={i} className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition duration-100 ease-linear">
                  <div className={`w-12 h-12 rounded-md flex items-center justify-center mb-6 ${f.iconBg} ${f.iconColor}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="px-6 py-24 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">Simple 3-Step Process</h2>
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 relative">
            {steps.map((s) => (
              <div key={s.num} className="flex-1 text-center">
                <div className="w-16 h-16 rounded-full bg-[#E65100] text-white flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  {s.num}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{s.title}</h3>
                <p className="text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ WHY VOICE2EXPENSE (white card section) ═══ */}
        <section className="px-6 py-24 bg-[#FAFAF8]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Why Voice2Expense?</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Built for people who hate expense tracking. Designed for real life.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                { title: "No more forgotten expenses", desc: "Most people forget 30% of small daily expenses. Voice logging captures them in real-time — while they happen." },
                { title: "Works in your language", desc: "Speak in Hindi, Tamil, Telugu, Kannada, English, or mix them. Our AI adapts to how you actually talk." },
                { title: "Budget warnings, not surprises", desc: "Get alerted before you overspend. Set limits per category — food, transport, shopping — and stay in control." },
                { title: "Web + Mobile. Always in sync.", desc: "Access from any browser or save to your phone's home screen. Your expenses follow you everywhere." },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-lg p-6 border border-gray-100 flex gap-4">
                  <div className="w-10 h-10 rounded-md bg-[#E65100]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] text-gray-900 mb-1.5">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="px-6 py-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-gray-900">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="bg-[#FAFAF8] border border-gray-100 rounded-md p-6 group">
                  <summary className="font-bold flex justify-between items-center cursor-pointer list-none text-gray-900">
                    {faq.q}
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="px-6 py-20 bg-[#E65100]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Ready to stop typing expenses?
            </h2>
            <p className="text-orange-100 text-base mb-8 max-w-md mx-auto">
              Sign up free. No credit card needed. Start tracking in 30 seconds.
            </p>
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-white text-[#E65100] px-8 py-4 rounded-md font-bold text-lg hover:bg-gray-50 transition duration-100 ease-linear shadow-lg">
              Get Started Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            <p className="text-orange-200 text-xs mt-4">Free forever for personal use</p>
          </div>
        </section>

      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-[#E65100] rounded-md flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-gray-900">Voice2Expense</span>
              </div>
              <p className="text-xs text-gray-400">AI-powered voice expense tracking for everyone</p>
              <p className="text-xs text-gray-400 mt-1">&copy; {new Date().getFullYear()} Voice2Expense. All rights reserved.</p>
            </div>

            {/* Links */}
            <div className="flex flex-col sm:flex-row gap-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Product</h4>
                <ul className="space-y-2">
                  <li><Link href="/register" className="text-sm text-gray-500 hover:text-[#E65100] transition">Voice Logging</Link></li>
                  <li><Link href="/register" className="text-sm text-gray-500 hover:text-[#E65100] transition">AI Categorization</Link></li>
                  <li><Link href="/register" className="text-sm text-gray-500 hover:text-[#E65100] transition">Budget Alerts</Link></li>
                  <li><Link href="/register" className="text-sm text-gray-500 hover:text-[#E65100] transition">AI Insights</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Languages</h4>
                <ul className="space-y-2">
                  <li><span className="text-sm text-gray-500">English, Hindi</span></li>
                  <li><span className="text-sm text-gray-500">Tamil, Telugu</span></li>
                  <li><span className="text-sm text-gray-500">Kannada, Malayalam</span></li>
                  <li><span className="text-sm text-gray-500">Bengali, Gujarati +</span></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Get Started</h4>
                <ul className="space-y-2">
                  <li><Link href="/register" className="text-sm text-gray-500 hover:text-[#E65100] transition">Create Account</Link></li>
                  <li><Link href="/login" className="text-sm text-gray-500 hover:text-[#E65100] transition">Sign In</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
