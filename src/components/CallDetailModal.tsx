import { X, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Segment {
  speaker: string;
  text: string;
  timestamp?: string;
}

interface CallDetailModalProps {
  call: {
    callId: string;
    timestamp: string;
    restaurantId: string;
    branchId: string;
    duration: number;
    transcript: string;
    segments: Segment[];
    sentiment?: string;
    topics?: string[];
  } | null;
  onClose: () => void;
}

export function CallDetailModal({ call, onClose }: CallDetailModalProps) {
  if (!call) return null;

  const ratePerMinute = 0.25; // USD per minute
  const durationInSeconds = call.duration || 0;
  const durationInMinutes = (durationInSeconds / 60).toFixed(2);
  const callExpense = (durationInSeconds / 60 * ratePerMinute).toFixed(2);

  const copyTranscript = () => {
    navigator.clipboard.writeText(call.transcript || "");
  };

  const downloadTranscript = () => {
    const blob = new Blob([call.transcript || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${call.callId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-full md:max-w-3xl mx-0 md:mx-4 h-[100dvh] md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Call {call.callId.slice(0, 8)} • {new Date(call.timestamp).toLocaleString()}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Call meta */}
          <div className="text-sm text-muted-foreground">
            Branch: {call.branchId} • Duration: {durationInSeconds}s • Topics:{" "}
            {call.topics?.length ? call.topics.join(", ") : "—"} • Sentiment:{" "}
            {call.sentiment || "—"}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversation */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Transcript</h3>
              {call.segments && call.segments.length > 0 ? (
                <div className="space-y-3">
                  {call.segments.map((seg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        seg.speaker === "caller" ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm text-foreground">
                        <span
                          className={
                            seg.speaker === "caller"
                              ? "text-primary font-medium"
                              : "font-medium"
                          }
                        >
                          {seg.speaker === "caller" ? "Caller" : "Ressy"}
                        </span>
                      </p>
                      <p className="text-sm text-foreground mt-1">{seg.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted text-sm text-foreground whitespace-pre-wrap">
                  {call.transcript || "No transcript available."}
                </div>
              )}
            </div>

            {/* Call Expense */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Call Expense</h3>
              <Card className="p-4">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-foreground">${callExpense}</div>
                  <div className="text-xs text-muted-foreground">
                    ${ratePerMinute}/min • billed per second
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="text-foreground">{durationInMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="text-foreground">${ratePerMinute}/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Computation</span>
                    <span className="text-foreground">
                      {durationInSeconds}s ÷ 60 × ${ratePerMinute} = ${callExpense}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={downloadTranscript}>
                    <Download className="w-4 h-4 mr-2" />
                    Download .txt
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={copyTranscript}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Button className="w-full mt-2" size="sm">
                  Create Task
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}