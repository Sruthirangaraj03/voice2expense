import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold text-gray-300 mb-2">404</h1>
        <p className="text-gray-400 text-sm mb-6">This page doesn&apos;t exist</p>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-[#E65100] text-white rounded-2xl font-semibold hover:bg-[#BF360C] transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
