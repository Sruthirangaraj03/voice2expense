"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/expenses", label: "Expenses", icon: "💰" },
  { href: "/dashboard/budget", label: "Budget", icon: "🎯" },
  { href: "/dashboard/insights", label: "Insights", icon: "🤖" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) {
      router.push("/login");
      return;
    }
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    document.cookie = "has_session=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <h1 className="text-xl font-bold text-white">
            Voice<span className="text-emerald-400">2</span>Expense
          </h1>
        </div>

        <nav className="px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                pathname === item.href
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="text-sm text-slate-300 mb-2 truncate">
            {user?.name || "User"}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-red-400 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center px-4 md:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-slate-300 mr-4"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <span className="text-sm text-slate-400">{user?.email}</span>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
