// Import mock data
import { mockCalls, mockAnalytics, mockRestaurants } from "@/data/mockData";

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

// Mock Auth: Validates credentials locally
export async function login(email: string, password: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock credentials
  const MOCK_EMAIL = "admin@ressy.com";
  const MOCK_PASSWORD = "Ressy123";

  // Validate credentials
  if (email !== MOCK_EMAIL || password !== MOCK_PASSWORD) {
    throw new Error("Invalid email or password");
  }

  // Generate mock token (simple base64 encoded string for demo purposes)
  const mockToken = btoa(JSON.stringify({
    email: MOCK_EMAIL,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
    iat: Date.now()
  }));

  const data = {
    access_token: mockToken,
    token_type: "bearer"
  };

  setToken(data.access_token);
  return data;
}

// Mock API functions - simulate network delay
const mockDelay = () => new Promise(resolve => setTimeout(resolve, 300));

// Calls API (Mocked)
export async function getCallHistory(limit: number = 50) {
  await mockDelay();
  // Return calls limited by the limit parameter
  return mockCalls.slice(0, limit).map(call => ({
    call_id: call.call_id,
    callId: call.callId,
    start_time: call.start_time,
    timestamp: call.timestamp,
    restaurant_id: call.restaurant_id,
    restaurantId: call.restaurantId,
    branch_id: call.branch_id,
    branchId: call.branchId,
    duration_seconds: call.duration_seconds,
    duration: call.duration,
    from_number: call.from_number,
    status: call.status,
    outcome: call.outcome,
    cost: call.cost,
    sentiment: call.sentiment,
    topics: call.topics,
    transcript: call.transcript,
    segments: call.segments,
  }));
}

export async function getCallTranscripts(callId: string) {
  await mockDelay();
  const call = mockCalls.find(c => c.call_id === callId || c.callId === callId);
  if (!call || !call.segments) {
    return [];
  }
  // Return transcript segments in the format expected by the component
  return call.segments.map(seg => ({
    text: `${seg.speaker === "caller" ? "Caller" : "Ressy"}: ${seg.text}`,
    timestamp: seg.timestamp || "",
  }));
}

export async function getAnalyticsSummary() {
  await mockDelay();
  return mockAnalytics;
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
  await mockDelay();
  return mockRestaurants;
}