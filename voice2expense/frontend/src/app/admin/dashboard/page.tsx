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
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-[#1a1a1a] text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <span className="text-sm font-bold">A</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin Panel</h1>
              <p className="text-xs text-gray-400">Voice2Expense</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 uppercase mb-1">Total Clients</p>
            <p className="text-3xl font-bold text-gray-900">
              {loading ? "-" : stats?.totalClients ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 uppercase mb-1">Active Clients</p>
            <p className="text-3xl font-bold text-green-600">
              {loading ? "-" : stats?.activeClients ?? 0}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Logged in within 30 days</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 uppercase mb-1">Inactive Clients</p>
            <p className="text-3xl font-bold text-red-500">
              {loading ? "-" : stats?.inactiveClients ?? 0}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">No login in 30+ days</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 uppercase font-medium mr-2">Filter by login:</span>
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filter === f.value
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Clients {clients.length > 0 && <span className="text-gray-400 font-normal">({clients.length})</span>}
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No clients found for this filter</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
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
                    <tr key={c.email} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3.5 text-gray-400">{c.client_no}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">{c.name}</td>
                      <td className="px-5 py-3.5 text-gray-500">{c.email}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                          {c.expense_count}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{langMap[c.language] || c.language}</td>
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
