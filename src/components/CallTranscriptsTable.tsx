import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CallData {
  call_id: string;
  start_time: string; // ISO
  duration_seconds: number;
  from_number?: string;
  outcome?: string;
}

interface CallTranscriptsTableProps {
  calls: CallData[];
  onCallSelect: (call: CallData) => void;
}

const fmtTime = (iso: string) => new Date(iso).toLocaleString();

export function CallTranscriptsTable({ calls, onCallSelect }: CallTranscriptsTableProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {(!calls || calls.length === 0) && (
        <div className="p-8 text-center text-muted-foreground">No calls to display yet.</div>
      )}
      {/* Mobile list (stacked cards) */}
      <div className="md:hidden divide-y divide-border">
        {calls.map((call) => (
          <button
            key={call.call_id}
            onClick={() => onCallSelect(call)}
            className="w-full text-left px-4 py-4 hover:bg-table-row-hover dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-foreground">
                    {call.call_id.slice(0, 8)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {fmtTime(call.start_time)} • From {call.from_number || "—"} •{" "}
                  {call.duration_seconds}s
                </div>
              </div>
              <div className="shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCallSelect(call);
                  }}
                >
                  Open
                </Button>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-table-header dark:bg-muted/30">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-foreground">Call ID</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-foreground">Time</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-foreground">From</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-foreground">Duration</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-foreground">Outcome</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {calls.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No calls found.
                </td>
              </tr>
            )}
            {calls.map((call) => (
              <tr
                key={call.call_id}
                className="border-t border-border hover:bg-table-row-hover dark:hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => onCallSelect(call)}
              >
                <td className="px-6 py-4 text-sm font-mono text-foreground">
                  {call.call_id.slice(0, 8)}
                </td>
                <td className="px-6 py-4 text-sm text-foreground">{fmtTime(call.start_time)}</td>
                <td className="px-6 py-4 text-sm text-foreground">{call.from_number || "—"}</td>
                <td className="px-6 py-4 text-sm text-foreground">{call.duration_seconds}s</td>
                <td className="px-6 py-4 text-sm text-foreground">{call.outcome || "—"}</td>
                <td className="px-6 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCallSelect(call);
                    }}
                  >
                    Open
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
