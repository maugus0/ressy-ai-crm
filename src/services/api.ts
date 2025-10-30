// Resolve API base URL with sane dev fallback
type ViteEnv = { [k: string]: string | undefined };
const meta = (import.meta as unknown as { env?: ViteEnv });
let resolvedApi = meta.env?.VITE_API_URL;
if (resolvedApi) resolvedApi = resolvedApi.replace(/\/$/, "");
const API_URL = resolvedApi || (typeof window !== "undefined" && window.location.port === "8080" ? "http://localhost:5001/api" : "/api");

// One-time debug log to help diagnose misrouted requests
const w = (typeof window !== "undefined" ? (window as unknown as { __RESSY_API_LOGGED__?: boolean }) : undefined);
if (w && !w.__RESSY_API_LOGGED__) {
  w.__RESSY_API_LOGGED__ = true;
  console.info("Ressy API base:", API_URL);
}

function getToken() {
  return localStorage.getItem("ressy_token");
}

// Registration API (creates user in DynamoDB via backend)
export async function register(email: string, password: string, role: string = "client", companyName: string = "") {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role, company_name: companyName }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "Registration failed");
    throw new Error(err || "Registration failed");
  }
  return res.json();
}

function setToken(token: string) {
  localStorage.setItem("ressy_token", token);
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

// Auth: FastAPI expects OAuth2PasswordRequestForm (username/password)
export async function login(email: string, password: string) {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);
  body.append("grant_type", "password");

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Login failed");
    throw new Error(err || "Login failed");
  }
  const data = await res.json();
  if (data?.access_token) setToken(data.access_token);
  return data;
}

// Calls API (JWT protected)
export async function getCallHistory(limit: number = 50) {
  return request(`/calls/history?limit=${encodeURIComponent(limit)}`);
}

export async function getCallTranscripts(callId: string) {
  return request(`/calls/${encodeURIComponent(callId)}/transcripts`);
}

export async function getAnalyticsSummary() {
  return request(`/calls/analytics/summary`);
}

// --- Compatibility wrappers used by existing components ---
export async function getCalls(_restaurantId: string) {
  // Current backend does not scope by restaurant. Return user's call history.
  return getCallHistory();
}

export async function getAnalytics(_restaurantId: string) {
  // Current backend returns overall summary for the authenticated user.
  return getAnalyticsSummary();
}

export type Restaurant = { restaurantId: string; name: string };

export async function getRestaurants(): Promise<Restaurant[]> {
  // No restaurants API yet. Return an empty array for now.
  return [];
}