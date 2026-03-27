import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E65100] rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">🎙️</span>
          </div>
          <p className="font-bold text-sm text-gray-800 uppercase tracking-wider">Vocal Ledger Pro</p>
        </div>
        <Link
          href="/login"
          className="px-5 py-2.5 bg-white text-gray-700 rounded-xl text-sm font-medium shadow-sm hover:bg-gray-50 transition"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-lg mx-auto">
          <div className="w-20 h-20 bg-[#E65100] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
            <span className="text-4xl">🎙️</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            The Art of{" "}
            <span className="text-[#E65100]">Wealth.</span>
          </h1>
          <p className="text-gray-500 mt-4 text-lg max-w-md mx-auto">
            Financial intelligence for the modern curator. Log by voice, analyze with ease.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 max-w-md mx-auto w-full space-y-3">
        <Link
          href="/register"
          className="w-full block text-center px-6 py-4 bg-[#E65100] text-white rounded-2xl font-semibold text-lg hover:bg-[#BF360C] transition shadow-sm"
        >
          Get Started
        </Link>
        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-[#E65100] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
