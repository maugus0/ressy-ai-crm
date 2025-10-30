import { useState, useEffect, useRef, useMemo } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { CallTranscriptsTable } from "./CallTranscriptsTable";
import { CallDetailModal } from "./CallDetailModal";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { DatabaseTable } from "./DatabaseTable";
import type { DatabaseCustomer } from "./DatabaseTable";
import { IntegrationsPage } from "./IntegrationsPage";
import { SettingsPage } from "./SettingsPage";
import { Landing } from "./Landing";
import { getCalls, getRestaurants, getAnalytics, getCallTranscripts } from "@/services/api";
import type { Restaurant } from "@/types";

type Segment = { speaker: string; text: string; timestamp?: string };

type IncomingCall = {
  callId?: string; call_id?: string;
  timestamp?: string; start_time?: string;
  restaurantId?: string; restaurant_id?: string;
  branchId?: string; branch_id?: string;
  duration?: number; duration_seconds?: number;
  transcript?: string;
  segments?: Segment[];
  sentiment?: string;
  topics?: string[];
};
type CallDetail = {
  callId: string;
  timestamp: string;
  restaurantId: string;
  branchId: string;
  duration: number;
  transcript: string;
  segments: Segment[];
  sentiment?: string;
  topics?: string[];
};

type TableRow = {
  call_id: string;
  start_time: string;
  duration_seconds: number;
  cost: number;
  status: string;
  from_number?: string;
  outcome?: string;
};

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("landing"); 
  const [companyName, setCompanyName] = useState<string>("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Restaurant | null>(null);
  const [calls, setCalls] = useState<CallDetail[]>([]);
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [analytics, setAnalytics] = useState({
    total_calls: 0,
    total_bookings: 0,
    answer_rate: 0,
    avg_duration: 0,
    calls_over_time: [] as { day: string; calls: number; bookings: number }[],
    outcomes: [] as { intent: string; value: number }[],
    intents: [] as { name: string; value: number; color?: string }[],
  });
  const [selectedCall, setSelectedCall] = useState<CallDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("ressy_token");
    navigate("/login");
  };

  // Build filtered table rows (used for Calls table + export)
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tableRows;
    return tableRows.filter((r) =>
      r.call_id.toLowerCase().includes(q) ||
      (r.from_number || "").toLowerCase().includes(q) ||
      new Date(r.start_time).toLocaleString().toLowerCase().includes(q)
    );
  }, [tableRows, searchQuery]);

  // Reset to first page on search change
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const pageSize = 15;
  const totalResults = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (pageClamped - 1) * pageSize;
    const end = start + pageSize;
    return filteredRows.slice(start, end);
  }, [filteredRows, pageClamped]);



  useEffect(() => {
    // Decode company_name from JWT if available
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("ressy_token") : null;
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        if (payload?.company_name) setCompanyName(payload.company_name as string);
      }
    } catch {
      // ignore decoding errors
    }

    setLoading(true);
    getRestaurants()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setRestaurants(res);
          setSelectedCustomer(res[0]);
        } else {
          setRestaurants([]);
        }
      })
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, []);

  // Fetch calls & analytics when customer changes or when there is no customer
  useEffect(() => {
    const restaurantId = selectedCustomer?.restaurantId || "";
    setLoading(true);
    Promise.all([getCalls(restaurantId), getAnalytics(restaurantId)])
      .then(([callsRes, analyticsRes]) => {
        const mapped: CallDetail[] = Array.isArray(callsRes)
          ? callsRes.map((c: IncomingCall) => ({
              callId: c.callId || c.call_id || "unknown",
              timestamp: c.timestamp || c.start_time || new Date().toISOString(),
              restaurantId: c.restaurantId || c.restaurant_id || "",
              branchId: c.branchId || c.branch_id || "",
              duration: c.duration ?? c.duration_seconds ?? 0,
              transcript: c.transcript ?? "",
              segments: c.segments ?? [],
              sentiment: c.sentiment,
              topics: c.topics ?? [],
            }))
          : [];
        setCalls(mapped);
        // Build table rows aligned with backend fields
        const rows: TableRow[] = (Array.isArray(callsRes) ? callsRes : []).map((c: IncomingCall) => ({
          call_id: (c.call_id as string) || (c.callId as string) || "unknown",
          start_time: (c.start_time as string) || (c.timestamp as string) || new Date().toISOString(),
          duration_seconds: (c.duration_seconds as number) ?? (c.duration as number) ?? 0,
          cost: (c as any).cost ? Number((c as any).cost) : 0,
          status: (c as any).status || "completed",
          from_number: (c as any).from_number,
          outcome: (c as any).outcome,
        }));
        setTableRows(rows);
        type AnalyticsIn = Partial<{
          total_calls: number;
          total_bookings: number;
          answer_rate: number;
          avg_duration: number;
          calls_over_time: { day: string; calls: number; bookings: number }[];
          outcomes: { intent: string; value: number }[];
          intents: { name: string; value: number; color?: string }[];
        }>;
        const a = (analyticsRes || {}) as AnalyticsIn;
        // Compute frontend analytics from mapped calls for charts
        const byDay = new Map<string, { calls: number; bookings: number }>();
        rows.forEach((r) => {
          const d = new Date(r.start_time);
          const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
          const cur = byDay.get(key) || { calls: 0, bookings: 0 };
          cur.calls += 1;
          byDay.set(key, cur);
        });
        const calls_over_time = Array.from(byDay.entries())
          .sort((a,b)=>a[0]<b[0]? -1: 1)
          .map(([day, v]) => ({ day, calls: v.calls, bookings: v.bookings }));

        const total_calls = rows.length;
        const total_duration = rows.reduce((acc, r) => acc + (r.duration_seconds || 0), 0);
        const avg_duration = total_calls ? Math.round(total_duration / total_calls) : 0;

        setAnalytics({
          total_calls,
          total_bookings: a.total_bookings ?? 0,
          answer_rate: a.answer_rate ?? 0,
          avg_duration,
          calls_over_time,
          outcomes: a.outcomes ?? [],
          intents: a.intents ?? [],
        });
      })
      .catch(() => {
        setCalls([]);
        setAnalytics({
          total_calls: 0,
          total_bookings: 0,
          answer_rate: 0,
          avg_duration: 0,
          calls_over_time: [],
          outcomes: [],
          intents: [],
        });
      })
      .finally(() => setLoading(false));
  }, [selectedCustomer]);

  // Accessibility: trap focus inside mobile sidebar and lock body scroll
  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const container = sidebarRef.current;
    if (!container) return () => { document.body.style.overflow = previousOverflow; };

    const focusableSelectors = [
      'a[href]','button','textarea','input[type="text"]','input[type="radio"]','input[type="checkbox"]','select','[tabindex]:not([tabindex="-1"])'
    ].join(',');
    const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(el => !el.hasAttribute('disabled'));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // move focus into the drawer
    const focusable = getFocusable();
    if (focusable[0]) focusable[0].focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  // Close sidebar on Escape
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    if (sidebarOpen) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [sidebarOpen]);

  // (kept for backward compatibility in other parts if referenced)
  // const filteredRows = useMemo(...); now defined above

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      </div>

      {/* Sidebar drawer for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Sidebar navigation"
        >
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full w-auto max-w-[80vw]">
            <div
              ref={sidebarRef}
              className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-sidebar z-50 outline-none shadow-xl transform transition-transform duration-300 translate-x-0"
              tabIndex={-1}
            >
              <Sidebar
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setSidebarOpen(false);
                }}
                onLogout={() => {
                  handleLogout();
                  setSidebarOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with hamburger */}
        <div className="md:hidden flex items-center justify-between bg-card border-b border-border px-4 py-3">
          <h1 className="text-lg font-semibold text-foreground">
            {companyName || "Your Company"}
          </h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop header */}
        <header className="hidden md:flex items-center justify-between bg-card border-b border-border px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {companyName || "Your Company"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Transcripts, analytics, and database
            </p>
          </div>
          
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto pt-14 md:pt-0">
          {/* Overview / Landing Tab */}
          {activeTab === "landing" && (
            <Landing customer={selectedCustomer || undefined} />
          )}
          {/* Calls Tab */}
          {activeTab === "calls" && (
            <div className="p-4 md:p-6 space-y-4">
              <div className="bg-card rounded-lg border border-border p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                  <h2 className="text-lg font-semibold text-foreground">Call transcripts</h2>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search calls, numbers, dates..."
                      className="w-full sm:w-64 px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const rows = filteredRows.map((r) => [
                          r.call_id,
                          new Date(r.start_time).toISOString(),
                          r.from_number || "",
                          String(r.duration_seconds),
                          r.outcome || "",
                        ]);
                        const header = ["Call ID","Time","From","Duration (s)","Outcome"];
                        const esc = (s: string) => s.replace(/"/g, '""');
                        const csv = [header, ...rows]
                          .map(r => r.map(x => `"${esc(String(x))}"`).join(","))
                          .join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "calls.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export CSV
                    </Button>
                  </div>
                </div>
                <CallTranscriptsTable
                  calls={paginatedRows.map((r) => ({
                    call_id: r.call_id,
                    start_time: r.start_time,
                    duration_seconds: r.duration_seconds,
                    from_number: r.from_number,
                    outcome: r.outcome,
                  }))}
                  onCallSelect={async (row) => {
                    const base = calls.find((c) => c.callId === row.call_id) || null;
                    if (!base) { setSelectedCall(null); return; }
                    try {
                      const items = await getCallTranscripts(base.callId) as Array<{ text: string; timestamp: string }>;
                      let lastSpeaker: "caller" | "assistant" = "assistant";
                      const segments = Array.isArray(items)
                        ? items.map((t: { text: string; timestamp: string }) => {
                            const raw = (t.text || "").trim();
                            const mCaller = raw.match(/^\s*(?:user|caller)\s*[:-]\s*(.*)$/i);
                            const mAgent = raw.match(/^\s*(?:ressy|agent|assistant)\s*[:-]\s*(.*)$/i);
                            let speaker: "caller" | "assistant";
                            let text = raw;
                            if (mCaller) {
                              speaker = "caller";
                              text = mCaller[1] || "";
                            } else if (mAgent) {
                              speaker = "assistant";
                              text = mAgent[1] || "";
                            } else {
                              // fallback alternate speaker if not labeled
                              speaker = lastSpeaker === "caller" ? "assistant" : "caller";
                            }
                            lastSpeaker = speaker;
                            return { speaker, text, timestamp: t.timestamp };
                          })
                        : [];
                      const transcript = Array.isArray(items) ? items.map((t) => t.text).join("\n") : base.transcript || "";
                      setSelectedCall({ ...base, segments, transcript });
                    } catch {
                      setSelectedCall(base);
                    }
                  }}
                />
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">
                    {totalResults} results · Page {pageClamped} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pageClamped <= 1}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={pageClamped >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Tab */}
          {activeTab === "customer" && (
            <div className="p-4 md:p-6">
              <div className="bg-card rounded-lg border border-border p-4 md:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Customer Database</h2>
                {tableRows.length === 0 ? (
                  <div className="text-center text-muted-foreground border border-dashed rounded p-8">No records yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-table-header dark:bg-muted/30">
                        <tr>
                          <th className="text-left px-6 py-4 text-sm font-medium text-foreground">Call ID</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-foreground">Customer Name</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-foreground">Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((r) => (
                          <tr
                            key={r.call_id}
                            className="border-t border-border hover:bg-table-row-hover dark:hover:bg-white/5 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm font-mono text-foreground">{r.call_id.slice(0, 8)}</td>
                            <td className="px-6 py-4 text-sm text-foreground">-</td>
                            <td className="px-6 py-4 text-sm text-foreground">{r.from_number || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <AnalyticsDashboard
              data={analytics}
              loading={loading}
              calls={tableRows.map(r => ({
                callId: r.call_id,
                timestamp: r.start_time,
                duration: r.duration_seconds,
              }))}
            />
          )}

          {/* Database Tab */}
          {activeTab === "database" && (
            <div className="p-4 md:p-6">
              {restaurants.length === 0 ? (
                <div className="text-center text-muted-foreground border p-6 rounded">
                  No restaurants found.
                </div>
              ) : (
                <DatabaseTable
                  customers={restaurants.map<DatabaseCustomer>((r) => ({
                    id: r.restaurantId,
                    name: r.name,
                    phone: "-",
                    tags: [],
                  }))}
                />
              )}
            </div>
          )}

          {/* Other Tabs */}
          {activeTab === "integrations" && <IntegrationsPage />}
          {activeTab === "settings" && <SettingsPage />}
        </main>
      </div>

      {/* Call Detail Modal */}
      <CallDetailModal
        call={selectedCall}
        onClose={() => setSelectedCall(null)}
      />
    </div>
  );
}