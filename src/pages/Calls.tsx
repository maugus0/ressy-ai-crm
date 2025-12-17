/**
 * Calls Page
 * View call logs for the restaurant
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Phone, Search, Clock, Download, Eye } from "lucide-react";
import { UiOnlyNotice } from "@/components/UiOnlyNotice";
import type { Call, CallTranscriptSegment } from "@/types/api.types";

export function Calls() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [transcript, setTranscript] = useState<CallTranscriptSegment[]>([]);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  const handleViewTranscript = async (call: Call) => {
    setSelectedCall(call);
    setLoadingTranscript(true);

    try {
      // UI-only: no backend yet. Use local fallback if present.
      if (call.transcript) {
        setTranscript([{ speaker: "transcript", text: call.transcript }]);
      } else {
        setTranscript([]);
      }
    } catch (err) {
      // Use the call's transcript if available
      if (call.transcript) {
        setTranscript([{ speaker: "transcript", text: call.transcript }]);
      }
    } finally {
      setLoadingTranscript(false);
    }
  };

  const filteredCalls = calls.filter((call) => {
    const query = searchQuery.toLowerCase();
    return (
      call.from_number.toLowerCase().includes(query) ||
      call.call_id.toLowerCase().includes(query) ||
      (call.outcome?.toLowerCase().includes(query) ?? false)
    );
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      missed: "destructive",
      voicemail: "secondary",
      in_progress: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getOutcomeBadge = (outcome?: string) => {
    if (!outcome) return null;
    const colors: Record<string, string> = {
      booking: "bg-green-100 text-green-800",
      inquiry: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
      other: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[outcome] || colors.other}`}
      >
        {outcome}
      </span>
    );
  };

  const handleExportCSV = () => {
    const headers = ["Call ID", "From", "Date", "Duration", "Status", "Outcome"];
    const rows = filteredCalls.map((call) => [
      call.call_id,
      call.from_number,
      formatDate(call.start_time),
      formatDuration(call.duration_seconds),
      call.status,
      call.outcome || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calls.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <UiOnlyNotice />
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calls</h2>
          <p className="text-muted-foreground">View and manage your call history</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={calls.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Phone className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calls.filter((c) => c.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missed</CardTitle>
            <Phone className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calls.filter((c) => c.status === "missed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calls.length > 0
                ? formatDuration(
                    Math.round(calls.reduce((a, c) => a + c.duration_seconds, 0) / calls.length)
                  )
                : "0:00"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calls Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Call History</CardTitle>
              <CardDescription>All incoming calls to your restaurant</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No calls found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-mono">{call.from_number}</TableCell>
                      <TableCell>{formatDate(call.start_time)}</TableCell>
                      <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
                      <TableCell>{getStatusBadge(call.status)}</TableCell>
                      <TableCell>{getOutcomeBadge(call.outcome)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTranscript(call)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript Dialog */}
      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call Transcript</DialogTitle>
            <DialogDescription>
              {selectedCall && (
                <span>
                  Call from {selectedCall.from_number} on {formatDate(selectedCall.start_time)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {loadingTranscript ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : transcript.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No transcript available</p>
            ) : (
              transcript.map((segment, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    segment.speaker === "caller" || segment.speaker === "user"
                      ? "bg-blue-50 ml-4"
                      : "bg-gray-50 mr-4"
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1 capitalize">
                    {segment.speaker}
                  </p>
                  <p className="text-sm">{segment.text}</p>
                </div>
              ))
            )}
          </div>
          {selectedCall?.summary && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Summary</p>
              <p className="text-sm text-muted-foreground">{selectedCall.summary}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Calls;
