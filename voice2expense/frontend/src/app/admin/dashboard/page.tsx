"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Stats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
}

interface Client {
  client_no: number;
  name: string;
  email: string;
  expense_count: number;
  language: string;
  last_login_at: string;
}

const FILTERS = [
  { label: "All Time", value: "" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last Week", value: "last_week" },
  { label: "Last 2 Weeks", value: "last_biweek" },
  { label: "Last Month", value: "last_month" },
];

async function adminFetch(endpoint: string) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("admin_token");
    document.cookie = "admin_session=; path=/; max-age=0";
    window.location.href = "/admin/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const query = f ? `?filter=${f}` : "";
      const [s, c] = await Promise.all([
        adminFetch(`/api/admin/stats${query}`),
        adminFetch(`/api/admin/clients${query}`),
      ]);
      setStats(s);
      setClients(c);
    } catch {
      console.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    fetchData(filter);
  }, [filter, fetchData, router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    document.cookie = "admin_session=; path=/; max-age=0";
    router.push("/admin/login");
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const langMap: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    ta: "Tamil",
    te: "Telugu",
    kn: "Kannada",
    ml: "Malayalam",
    bn: "Bengali",
    mr: "Marathi",
    gu: "Gujarati",
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      {/* Header - matches dashboard sidebar header style */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E65100] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm text-gray-800 uppercase tracking-wider">Admin Panel</p>
              <p className="text-[10px] text-gray-400">Voice2Expense Management</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-[#E65100] text-white rounded-xl text-sm font-medium hover:bg-[#BF360C] transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-400 uppercase font-medium">Total Clients</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-gray-100 rounded-lg animate-pulse" />
              ) : stats?.totalClients ?? 0}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-400 uppercase font-medium">Active Clients</p>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-gray-100 rounded-lg animate-pulse" />
              ) : stats?.activeClients ?? 0}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Logged in within 30 days</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-xs text-gray-400 uppercase font-medium">Inactive Clients</p>
            </div>
            <p className="text-3xl font-bold text-red-500">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-gray-100 rounded-lg animate-pulse" />
              ) : stats?.inactiveClients ?? 0}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">No login in 30+ days</p>
          </div>
        </div>

        {/* Filter Bar - matches dashboard category filter style */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                filter === f.value
                  ? "bg-[#E65100] text-white"
                  : "bg-white text-gray-500 shadow-sm hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Clients {clients.length > 0 && <span className="text-gray-400 font-normal">({clients.length})</span>}
            </h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm">No clients found for this filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 text-left">
                    <th className="px-5 py-3 text-xs text-gray-400 uppercase font-medium">No</th>
                    <th className="px-5 py-3 text-xs text-gray-400 uppercase font-medium">Name</th>
                    <th className="px-5 py-3 text-xs text-gray-400 uppercase font-medium">Email</th>
                    <th className="px-5 py-3 text-xs text-gray-400 uppercase font-medium text-center">Expenses</th>
                    <th className="px-5 py-3 text-xs text-gray-400 uppercase font-medium">Language</th>
                    <th className="px-5 py-3 text-xs text-gray-400 uppercase font-medium">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clients.map((c) => (
                    <tr key={c.email} className="hover:bg-orange-50/30 transition">
                      <td className="px-5 py-3.5 text-gray-400 font-medium">{c.client_no}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[#E65100]">
                              {c.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{c.email}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-orange-50 text-[#E65100] rounded-full text-xs font-medium">
                          {c.expense_count}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full text-xs">
                          {langMap[c.language] || c.language}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(c.last_login_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
