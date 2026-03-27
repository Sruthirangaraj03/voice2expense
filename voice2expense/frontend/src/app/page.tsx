import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white">🎙️</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            The Art of{" "}
            <span className="text-yellow-200">Wealth.</span>
          </h1>
          <p className="text-orange-100 mt-4 text-lg max-w-md mx-auto">
            Financial intelligence for the modern curator. Log by voice, analyze with ease.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-t-3xl px-6 py-8 space-y-4 max-w-md mx-auto w-full">
        <Link
          href="/dashboard"
          className="w-full block text-center px-6 py-4 bg-[#E65100] text-white rounded-2xl font-semibold text-lg hover:bg-[#BF360C] transition"
        >
          Get Started →
        </Link>
        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/dashboard" className="text-[#E65100] font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
