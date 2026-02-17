/**
 * Escalation Detail Page
 * Displays full details of a single escalation with status update capability
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ArrowLeft,
  Phone,
  Clock,
  User,
  Building,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { getClientEscalation, updateClientEscalationStatus } from "@/services/escalations";
import { formatRelativeTimeLong } from "@/lib/utils/formatRelativeTime";
import { formatLocalDateTime } from "@/lib/utils/timezone";
import {
  getEscalationStatusColor,
  getEscalationUrgencyColor,
  escalationStatusLabels,
  escalationUrgencyLabels,
} from "@/lib/utils/escalationStyles";
import type { Escalation, EscalationStatus } from "@/types/escalation.types";

// ============================================================================
// Component
// ============================================================================

export function EscalationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [escalation, setEscalation] = useState<Escalation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Parse ID
  const escalationId = id ? parseInt(id, 10) : NaN;

  // Fetch escalation
  const fetchEscalation = useCallback(async () => {
    if (Number.isNaN(escalationId)) {
      setError("Invalid escalation ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getClientEscalation(escalationId);
      setEscalation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load escalation");
    } finally {
      setLoading(false);
    }
  }, [escalationId]);

  // Fetch on mount
  useEffect(() => {
    fetchEscalation();
  }, [fetchEscalation]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: EscalationStatus) => {
    if (!escalation) return;

    setUpdating(true);
    try {
      await updateClientEscalationStatus(escalation.id, newStatus);
      setEscalation((prev) =>
        prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : null
      );
      toast.success(`Escalation status updated to ${escalationStatusLabels[newStatus]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  // Handle view call
  const handleViewCall = () => {
    if (escalation?.call_id) {
      navigate(`/dashboard/calls?call_id=${escalation.call_id}`);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !escalation) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard/escalations")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Escalations
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Escalation not found"}</AlertDescription>
        </Alert>
        <Button onClick={fetchEscalation}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/escalations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <h1 className="text-xl sm:text-2xl font-bold">Escalation #{escalation.id}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getEscalationStatusColor(escalation.status)}>
            {escalationStatusLabels[escalation.status]}
          </Badge>
          <Badge className={getEscalationUrgencyColor(escalation.urgency)}>
            {escalationUrgencyLabels[escalation.urgency]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Main Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Escalation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reason */}
            {escalation.reason && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Reason</p>
                <p className="text-sm bg-muted/50 p-3 rounded-md">{escalation.reason}</p>
              </div>
            )}

            {/* Caller Phone */}
            {escalation.caller_phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Caller Phone</p>
                  <p className="text-sm">{escalation.caller_phone}</p>
                </div>
              </div>
            )}

            {/* Escalation Phone */}
            {escalation.escalation_phone_number && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Escalation Phone</p>
                  <p className="text-sm">{escalation.escalation_phone_number}</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Timestamps */}
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Requested At</p>
                <p className="text-sm">
                  {formatLocalDateTime(escalation.requested_at, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTimeLong(escalation.requested_at)}
                </p>
              </div>
            </div>

            {escalation.updated_at && (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-sm">
                    {formatLocalDateTime(escalation.updated_at, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions & Call Info */}
        <div className="space-y-4 sm:space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={escalation.status}
                onValueChange={(v) => handleStatusUpdate(v as EscalationStatus)}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raised">Raised</SelectItem>
                  <SelectItem value="forwarded">Forwarded</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              {updating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating status...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Call Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {escalation.call_id && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Call ID</p>
                  <p className="text-sm font-mono bg-muted/50 p-2 rounded-md break-all">
                    {escalation.call_id}
                  </p>
                </div>
              )}

              {escalation.twilio_call_sid && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Twilio Call SID</p>
                  <p className="text-sm font-mono bg-muted/50 p-2 rounded-md break-all">
                    {escalation.twilio_call_sid}
                  </p>
                </div>
              )}

              {escalation.call_id && (
                <Button variant="outline" className="w-full" onClick={handleViewCall}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Call Details
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Restaurant Info */}
          {escalation.restaurant_name && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Restaurant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{escalation.restaurant_name}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default EscalationDetail;
