"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Home", icon: "grid" },
  { href: "/dashboard/expenses", label: "Expenses", icon: "list" },
  { href: "/dashboard/insights", label: "AI Chat", icon: "chart" },
  { href: "/dashboard/budget", label: "Budget", icon: "target" },
];

function NavIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? "#E65100" : "#9CA3AF";
  switch (type) {
    case "grid":
      return (
        <svg className="w-6 h-6 md:w-5 md:h-5" fill={color} viewBox="0 0 24 24">
          <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
        </svg>
      );
    case "list":
      return (
        <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 5h11M9 12h11M9 19h11M5 5h.01M5 12h.01M5 19h.01" strokeLinecap="round" />
        </svg>
      );
    case "chart":
      return (
        <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 3v18h18" strokeLinecap="round" />
          <path d="M7 16l4-4 4 2 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "target":
      return (
        <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
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
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ message: string; severity: string }[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setUserEmail(user.email || "");
    } catch {}
  }, []);

  useEffect(() => {
    const fetchNotifs = () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      fetch("/api/analytics/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setNotifications(data); })
        .catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  // Close dropdowns on outside click — only for desktop dropdowns, not modals
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Don't interfere with modals — they handle their own close via backdrop
      if (profileOpen || notifOpen) return;
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen, notifOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    document.cookie = "has_session=; path=/; max-age=0";
    router.push("/login");
  };

  const currentPage = navItems.find((n) => pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href)))?.label || "Home";

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col fixed inset-y-0 left-0">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-50">
          <div className="w-10 h-10 bg-[#E65100] rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm text-gray-800 uppercase tracking-wider">Voice2Expense</p>
            <p className="text-[10px] text-gray-400">AI Expense Tracker</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${active ? "bg-orange-50 text-[#E65100]" : "text-gray-500 hover:bg-gray-50"}`}>
                <NavIcon type={item.icon} active={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-gray-50">
          <Link href="/dashboard?record=true"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#E65100] text-white rounded-xl text-sm font-semibold hover:bg-[#BF360C] transition">
            Start Voice Log
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex md:hidden items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#E65100] rounded-xl flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
            <span className="font-bold text-[#E65100] text-sm">Voice2Expense</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="w-11 h-11 rounded-xl flex items-center justify-center relative active:bg-orange-50 transition"
              >
                <svg className="w-[22px] h-[22px] text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              {/* Notification modal rendered at root level below */}
            </div>
            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center active:bg-orange-100 transition"
              >
                <svg className="w-5 h-5 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </button>
              {/* Profile modal rendered at root level below */}
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-3 bg-white border-b border-gray-100">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{currentPage}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center hover:bg-orange-100 transition relative"
              >
                <svg className="w-5 h-5 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notifications.length}+
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget Alerts</p>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">No alerts right now</p>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className={`px-4 py-3 border-b border-gray-50 last:border-0 flex items-start gap-2 ${n.severity === "danger" ? "bg-red-50" : n.severity === "warning" ? "bg-amber-50" : ""}`}>
                        <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.severity === "danger" ? "bg-red-500" : n.severity === "warning" ? "bg-amber-500" : "bg-green-500"}`} />
                        <p className="text-sm text-gray-700">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center hover:bg-orange-100 transition"
              >
                <svg className="w-5 h-5 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
                  </div>
                  <button onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 md:px-8 py-3 md:py-3 pb-28 md:pb-6 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation — full width, safe area, bigger touch targets */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 h-[68px]">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl mx-1 transition ${active ? "text-[#E65100] bg-orange-50" : "text-gray-400 active:bg-gray-50"}`}
              >
                <NavIcon type={item.icon} active={active} />
                <span className={`text-xs font-semibold ${active ? "text-[#E65100]" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Notification Modal — rendered at root level to avoid z-index issues */}
      {notifOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={() => setNotifOpen(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-5" onClick={() => setNotifOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[75vh] flex flex-col animate-[slideUp_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-gray-900">Budget Alerts</p>
                </div>
                <button onClick={() => setNotifOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-400">No alerts right now</p>
                    <p className="text-xs text-gray-300 mt-1">Set budgets to get spending alerts</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((n, i) => (
                      <div key={i} className={`px-5 py-4 flex items-start gap-3 ${n.severity === "danger" ? "bg-red-50/50" : n.severity === "warning" ? "bg-amber-50/50" : ""}`}>
                        <span className={`mt-1.5 w-3 h-3 rounded-full shrink-0 ${n.severity === "danger" ? "bg-red-500" : n.severity === "warning" ? "bg-amber-500" : "bg-green-500"}`} />
                        <p className="text-sm leading-relaxed text-gray-700">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Profile Modal — rendered at root level */}
      {profileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={() => setProfileOpen(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-5" onClick={() => setProfileOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs animate-[slideUp_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-5 text-center border-b border-gray-100">
                <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">{userEmail}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                className="w-full px-5 py-4 text-base text-red-500 font-medium flex items-center justify-center gap-2 active:bg-red-50 transition rounded-b-2xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
