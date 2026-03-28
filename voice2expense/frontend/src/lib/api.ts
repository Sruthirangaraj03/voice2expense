function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, { ...options, headers });

  // If 401, token expired — try refresh
  if (res.status === 401 && token) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          // Retry original request with new token
          headers["Authorization"] = `Bearer ${data.access_token}`;
          const retryRes = await fetch(endpoint, { ...options, headers });
          if (!retryRes.ok) {
            const error = await retryRes.json().catch(() => ({ message: "Request failed" }));
            throw new Error(error.message || `HTTP ${retryRes.status}`);
          }
          return retryRes.json();
        }
      } catch {
        // Refresh failed — clear and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        document.cookie = "has_session=; path=/; max-age=0";
        window.location.href = "/login";
        throw new Error("Session expired. Please login again.");
      }
    }
    // No refresh token — redirect
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "has_session=; path=/; max-age=0";
    window.location.href = "/login";
    throw new Error("Session expired. Please login again.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: (endpoint: string) => fetchApi(endpoint),
  post: (endpoint: string, data: unknown) =>
    fetchApi(endpoint, { method: "POST", body: JSON.stringify(data) }),
  put: (endpoint: string, data: unknown) =>
    fetchApi(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  delete: (endpoint: string) =>
    fetchApi(endpoint, { method: "DELETE" }),
};
