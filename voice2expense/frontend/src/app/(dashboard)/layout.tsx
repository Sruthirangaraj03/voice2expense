"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/dashboard/expenses", label: "Expenses", icon: "list" },
  { href: "/dashboard/insights", label: "AI Assistant", icon: "chart" },
  { href: "/dashboard/budget", label: "Budget", icon: "target" },
];

function NavIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? "#E65100" : "#9CA3AF";
  switch (type) {
    case "grid":
      return (
        <svg className="w-5 h-5" fill={color} viewBox="0 0 24 24">
          <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
        </svg>
      );
    case "list":
      return (
        <svg className="w-5 h-5" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 5h11M9 12h11M9 19h11M5 5h.01M5 12h.01M5 19h.01" strokeLinecap="round" />
        </svg>
      );
    case "chart":
      return (
        <svg className="w-5 h-5" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 3v18h18" strokeLinecap="round" />
          <path d="M7 16l4-4 4 2 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "target":
      return (
        <svg className="w-5 h-5" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    default:
      return null;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col fixed inset-y-0 left-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-50">
          <div className="w-10 h-10 bg-[#E65100] rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">🎙️</span>
          </div>
          <div>
            <p className="font-bold text-sm text-gray-800 uppercase tracking-wider">Vocal Ledger Pro</p>
            <p className="text-[10px] text-gray-400">Intelligent Finance</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-orange-50 text-[#E65100]"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <NavIcon type={item.icon} active={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-4 py-4 border-t border-gray-50">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#E65100] text-white rounded-xl text-sm font-semibold hover:bg-[#BF360C] transition"
          >
            <span>🎙️</span> Start Voice Log
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E65100] rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🎙️</span>
            </div>
            <span className="font-bold text-[#E65100] text-lg">Logger</span>
          </div>
          <Link
            href="/dashboard/expenses"
            className="px-4 py-2 bg-[#E65100] text-white rounded-full text-sm font-medium hover:bg-[#BF360C] transition"
          >
            Add Manual
          </Link>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {navItems.find((n) => pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href)))?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/expenses"
              className="px-5 py-2.5 bg-[#E65100] text-white rounded-xl text-sm font-medium hover:bg-[#BF360C] transition"
            >
              + Add Manual
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 md:px-8 py-4 md:py-6 pb-24 md:pb-6 overflow-auto">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-40">
        <div className="flex justify-around py-3">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1"
              >
                <NavIcon type={item.icon} active={active} />
                <span
                  className={`text-xs font-medium ${
                    active ? "text-[#E65100]" : "text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
