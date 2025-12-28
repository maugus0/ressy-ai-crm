/**
 * Reservations Page
 * Manage restaurant reservations with full API integration
 * Auto-scoped to the authenticated restaurant via JWT token
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { PhoneInput } from "@/components/ui/phone-input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CalendarDays,
  Search,
  Plus,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Pencil,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Calendar,
  RefreshCw,
  History,
  ArrowRight,
} from "lucide-react";
import {
  vancouverDateTimeToISO,
  isWithinOpeningHours,
  getTimeFromDateTime,
} from "@/lib/utils/timezone";
import { formatVancouverDateTimeDirect } from "@/lib/utils/format";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSSE } from "@/contexts/SSEContext";
import {
  getReservations,
  getReservation,
  createReservation,
  updateReservation,
  finalizeReservation,
  cancelReservation,
} from "@/services/reservations";
import { getRestaurant } from "@/services/restaurant";
import type {
  Reservation,
  ReservationWithHistory,
  ReservationStatus,
  ReservationCreateRequest,
  ReservationUpdateRequest,
  ReservationHistoryEntry,
  ClientRestaurant,
} from "@/types/api.types";

// ============================================================================
// Types
// ============================================================================

interface ReservationFormData {
  date_time: string;
  party_size: string;
  name: string;
  phone_number: string;
  email_address: string;
  special_request: string;
  notes: string;
  status?: ReservationStatus;
}

const defaultFormData: ReservationFormData = {
  date_time: "",
  party_size: "2",
  name: "",
  phone_number: "",
  email_address: "",
  special_request: "",
  notes: "",
};

// ============================================================================
// Constants
// ============================================================================

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

// ============================================================================
// Reservation History Item Component
// ============================================================================

interface ReservationHistoryItemProps {
  entry: ReservationHistoryEntry;
  isLast: boolean;
}

const getReservationHistoryIcon = (action: string) => {
  switch (action) {
    case "created":
      return <Plus className="h-3 w-3" />;
    case "status_changed":
      return <ArrowRight className="h-3 w-3" />;
    case "updated":
      return <Pencil className="h-3 w-3" />;
    case "confirmed":
      return <CheckCircle className="h-3 w-3" />;
    case "cancelled":
      return <XCircle className="h-3 w-3" />;
    case "finalized":
      return <CheckCircle className="h-3 w-3" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
};

const getReservationHistoryColor = (action: string) => {
  switch (action) {
    case "created":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "status_changed":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "updated":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "confirmed":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "finalized":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    default:
      return "bg-muted text-muted-foreground";
  }
};

function ReservationHistoryItem({ entry, isLast }: ReservationHistoryItemProps) {
  const { date, time } = formatVancouverDateTimeDirect(entry.created_at, MONTH_NAMES);
  const formattedDate = `${date}, ${time}`;

  return (
    <div className={`px-3 sm:px-4 py-3 ${!isLast ? "border-b" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`p-1.5 rounded-full flex-shrink-0 ${getReservationHistoryColor(entry.action)}`}
        >
          {getReservationHistoryIcon(entry.action)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
            <Badge variant="outline" className="w-fit text-[10px] sm:text-xs capitalize">
              {entry.action.replace(/_/g, " ")}
            </Badge>
            <span className="text-[10px] sm:text-xs text-muted-foreground">{formattedDate}</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words leading-relaxed">
            {entry.change_summary}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function Reservations() {
  const navigate = useNavigate();
  const { restaurantId } = useAuth();

  // Reservations state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Debounce search query
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithHistory | null>(
    null
  );
  const [formData, setFormData] = useState<ReservationFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Date range validation
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  // Restaurant data state
  const [restaurant, setRestaurant] = useState<ClientRestaurant | null>(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(false);

  // ============================================================================
  // Fetch Restaurant Data
  // ============================================================================

  const fetchRestaurant = useCallback(async () => {
    try {
      setIsLoadingRestaurant(true);
      const data = await getRestaurant();
      setRestaurant(data);
    } catch (err) {
      console.error("Failed to fetch restaurant data:", err);
      // Don't show error toast - just log it, validation will be skipped if restaurant data isn't available
    } finally {
      setIsLoadingRestaurant(false);
    }
  }, []);

  // ============================================================================
  // Fetch Reservations
  // ============================================================================

  const fetchReservations = useCallback(async () => {
    if (!restaurantId) return;

    try {
      setIsLoading(true);
      setError(null);

      const params: {
        status?: ReservationStatus;
        start_date?: string;
        end_date?: string;
        limit: number;
        offset: number;
      } = {
        // When searching, fetch more results to enable client-side filtering
        // Note: API doesn't support server-side search, so we fetch up to 1000 records
        // for client-side filtering. This is a temporary limitation until server-side search is implemented.
        limit: debouncedSearchQuery.trim() ? 1000 : limit,
        offset: debouncedSearchQuery.trim() ? 0 : offset,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter as ReservationStatus;
      }
      if (startDate) {
        // Convert date string (YYYY-MM-DD) to datetime-local format, then to ISO in Vancouver timezone
        const startDateTimeLocal = `${startDate}T00:00`;
        params.start_date = vancouverDateTimeToISO(startDateTimeLocal);
      }
      if (endDate) {
        // Convert date string (YYYY-MM-DD) to datetime-local format, then to ISO in Vancouver timezone
        const endDateTimeLocal = `${endDate}T23:59`;
        params.end_date = vancouverDateTimeToISO(endDateTimeLocal);
      }

      const data = await getReservations(restaurantId, params);
      let filteredReservations = data.reservations || [];
      let filteredTotal = data.total || 0;

      // Apply client-side search filter (backend doesn't support search)
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase().trim();
        filteredReservations = filteredReservations.filter((reservation) => {
          return (
            reservation.name?.toLowerCase()?.includes(query) ||
            reservation.phone_number?.includes(query) ||
            reservation.email?.toLowerCase()?.includes(query) ||
            reservation.confirmation_number?.toLowerCase()?.includes(query)
          );
        });
        filteredTotal = filteredReservations.length;

        // Apply pagination to filtered results
        const startIdx = offset;
        const endIdx = offset + limit;
        filteredReservations = filteredReservations.slice(startIdx, endIdx);
      }

      setReservations(filteredReservations);
      setTotal(filteredTotal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reservations");
      setReservations([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, statusFilter, startDate, endDate, debouncedSearchQuery, limit, offset]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Fetch restaurant data on mount
  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setOffset(0);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch reservations on filter/pagination change
  useEffect(() => {
    if (restaurantId) {
      fetchReservations();
    }
  }, [fetchReservations, restaurantId]);

  // Validate date range
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        setDateRangeError("End date must be after start date");
      } else {
        setDateRangeError(null);
      }
    } else {
      setDateRangeError(null);
    }
  }, [startDate, endDate]);

  // SSE Integration: Auto-refresh on reservation events
  const { reservationEvents } = useSSE();
  const lastReservationEventRef = useRef<string | null>(null);

  useEffect(() => {
    // Only refresh if we have new reservation events since last check
    if (reservationEvents.length > 0) {
      const latestEventId = reservationEvents[0].id;
      if (lastReservationEventRef.current !== latestEventId) {
        lastReservationEventRef.current = latestEventId;
        // Skip refresh on initial mount
        if (reservations.length > 0) {
          console.log("SSE: Reservation event received, refreshing reservations...");
          fetchReservations();
        }
      }
    }
  }, [reservationEvents, fetchReservations, reservations.length]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleClearFilters = () => {
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setOffset(0);
    setError(null);
  };

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setFormErrors({});
    setSelectedReservation(null);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (reservation: Reservation) => {
    setSelectedReservation({ ...reservation, history: [] } as ReservationWithHistory);
    // API returns date_time in Vancouver time already (e.g., "2025-12-28T19:00:00")
    // Convert to datetime-local format (YYYY-MM-DDTHH:mm) by extracting parts directly
    let dateTimeLocal = "";
    if (reservation.date_time) {
      // The API string is already in Vancouver time, extract date/time parts directly
      // Format: "2025-12-28T19:00:00" -> "2025-12-28T19:00"
      const [datePart, timePart] = reservation.date_time.split("T");
      if (datePart && timePart) {
        // Extract just HH:mm from HH:mm:ss
        const [hour, minute] = timePart.split(":");
        dateTimeLocal = `${datePart}T${hour}:${minute}`;
      }
    }
    setFormData({
      date_time: dateTimeLocal,
      party_size: String(reservation.party_size),
      name: reservation.name,
      phone_number: reservation.phone_number,
      email_address: reservation.email || "",
      special_request: reservation.special_request || "",
      notes: reservation.notes || "",
      status: reservation.status,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openDetailsDialog = async (reservation: Reservation) => {
    try {
      const details = await getReservation(reservation.id);
      setSelectedReservation(details);
      setIsDetailsDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load reservation details");
    }
  };

  const openFinalizeDialog = (reservation: Reservation) => {
    setSelectedReservation({ ...reservation, history: [] } as ReservationWithHistory);
    setIsFinalizeDialogOpen(true);
  };

  const openCancelDialog = (reservation: Reservation) => {
    setSelectedReservation({ ...reservation, history: [] } as ReservationWithHistory);
    setIsCancelDialogOpen(true);
  };

  // Form validation
  const validateForm = (isEditMode: boolean = false): boolean => {
    const errors: Record<string, string> = {};

    // Date/time validation
    if (!formData.date_time) {
      errors.date_time = "Date and time is required";
    } else {
      // Parse the datetime-local value
      const [datePart, timePart] = formData.date_time.split("T");
      if (!datePart || !timePart) {
        errors.date_time = "Please enter a valid date and time";
      } else {
        const [year, month, day] = datePart.split("-").map(Number);

        // Validate date components
        if (
          isNaN(year) ||
          isNaN(month) ||
          isNaN(day) ||
          year < 1900 ||
          year > 2100 ||
          month < 1 ||
          month > 12 ||
          day < 1 ||
          day > 31
        ) {
          errors.date_time = "Please enter a valid date";
        } else {
          const selectedDate = new Date(year, month - 1, day);
          // Check if date is valid (handles cases like Feb 30)
          if (
            selectedDate.getFullYear() !== year ||
            selectedDate.getMonth() !== month - 1 ||
            selectedDate.getDate() !== day
          ) {
            errors.date_time = "Please enter a valid date";
          } else {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);

            // For create mode, don't allow past dates
            // For edit mode, allow past dates (for historical records)
            if (!isEditMode && selectedDate < now) {
              errors.date_time = "Reservation date cannot be in the past";
            }
          }
        }

        // Validate opening hours if restaurant data is available
        if (restaurant?.opening_time && restaurant?.closing_time) {
          const reservationTime = getTimeFromDateTime(formData.date_time);
          if (
            !isWithinOpeningHours(reservationTime, restaurant.opening_time, restaurant.closing_time)
          ) {
            // Format opening and closing times for error message
            const formatTime = (timeStr: string) => {
              const [hours, minutes] = timeStr.split(":");
              const hour = parseInt(hours, 10);
              const minute = parseInt(minutes, 10);
              const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
              const ampm = hour >= 12 ? "PM" : "AM";
              return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
            };
            errors.date_time = `Reservation time must be within opening hours (${formatTime(restaurant.opening_time)} - ${formatTime(restaurant.closing_time)})`;
          }
        }
      }
    }

    // Party size validation
    if (!formData.party_size) {
      errors.party_size = "Party size is required";
    } else {
      const partySize = parseInt(formData.party_size, 10);
      if (isNaN(partySize)) {
        errors.party_size = "Please enter a valid number";
      } else if (partySize < 1) {
        errors.party_size = "Party size must be at least 1";
      } else if (partySize > 20) {
        errors.party_size = "Party size cannot exceed 20 (contact for larger groups)";
      }
    }

    // Name and phone validation (only for create mode)
    if (!isEditMode) {
      if (!formData.name.trim()) {
        errors.name = "Customer name is required";
      } else if (formData.name.trim().length < 2) {
        errors.name = "Name must be at least 2 characters";
      } else if (formData.name.trim().length > 100) {
        errors.name = "Name must be less than 100 characters";
      }

      if (!formData.phone_number.trim()) {
        errors.phone_number = "Phone number is required";
      } else {
        // Normalize phone number: extract digits only for validation
        const rawPhone = formData.phone_number.trim();
        const digitsOnly = rawPhone.replace(/\D/g, "");
        const digitCount = digitsOnly.length;
        if (digitCount < 10 || digitCount > 15) {
          errors.phone_number = "Please enter a valid phone number (10-15 digits)";
        }
      }

      // Email validation (optional)
      if (formData.email_address && formData.email_address.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email_address.trim())) {
          errors.email_address = "Please enter a valid email address";
        }
      }
    }

    // Special request and notes validation (max length)
    if (formData.special_request && formData.special_request.length > 500) {
      errors.special_request = "Special request must be less than 500 characters";
    }

    if (formData.notes && formData.notes.length > 1000) {
      errors.notes = "Notes must be less than 1000 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!restaurantId) return;
    if (!validateForm(false)) return;

    try {
      setIsSubmitting(true);
      // Convert Vancouver local time to ISO string
      const payload: ReservationCreateRequest = {
        date_time: vancouverDateTimeToISO(formData.date_time),
        party_size: parseInt(formData.party_size, 10),
        name: formData.name.trim(),
        phone_number: formData.phone_number.trim(),
        ...(formData.email_address.trim() ? { email_address: formData.email_address.trim() } : {}),
        ...(formData.special_request.trim()
          ? { special_request: formData.special_request.trim() }
          : {}),
        ...(formData.notes.trim() ? { notes: formData.notes.trim() } : {}),
      };

      await createReservation(restaurantId, payload);
      toast.success("Reservation created successfully");
      setIsCreateDialogOpen(false);
      fetchReservations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedReservation) return;
    if (!validateForm(true)) return;

    try {
      setIsSubmitting(true);
      // Convert Vancouver local time to ISO string
      const payload: ReservationUpdateRequest = {
        date_time: vancouverDateTimeToISO(formData.date_time),
        party_size: parseInt(formData.party_size, 10),
        ...(formData.special_request.trim()
          ? { special_request: formData.special_request.trim() }
          : {}),
        ...(formData.notes.trim() ? { notes: formData.notes.trim() } : {}),
        ...(formData.status ? { status: formData.status } : {}),
      };

      await updateReservation(selectedReservation.id, payload);
      toast.success("Reservation updated successfully");
      setIsEditDialogOpen(false);
      fetchReservations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedReservation) return;

    try {
      setIsSubmitting(true);
      await finalizeReservation(selectedReservation.id);
      toast.success("Reservation confirmed successfully");
      setIsFinalizeDialogOpen(false);
      fetchReservations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedReservation) return;

    try {
      setIsSubmitting(true);
      await cancelReservation(selectedReservation.id);
      toast.success("Reservation cancelled successfully");
      setIsCancelDialogOpen(false);
      fetchReservations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case "confirmed":
        return "default" as const;
      case "pending":
        return "secondary" as const;
      case "completed":
        return "outline" as const;
      case "cancelled":
        return "destructive" as const;
      case "no_show":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const formatStatusLabel = (status: ReservationStatus) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Calculate stats
  const pendingCount = reservations.filter((r) => r.status === "pending").length;
  const confirmedCount = reservations.filter((r) => r.status === "confirmed").length;
  const todaysGuests = reservations
    .filter((r) => {
      const today = new Date().toDateString();
      return new Date(r.date_time).toDateString() === today && r.status !== "cancelled";
    })
    .reduce((sum, r) => sum + r.party_size, 0);

  const totalPages = Math.ceil(total / limit);

  // ============================================================================
  // Render Form
  // ============================================================================

  const renderForm = (isEditMode: boolean = false) => (
    <div className="space-y-4">
      {isEditMode && selectedReservation && (
        <>
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Guest Information</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{selectedReservation.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{selectedReservation.phone_number}</p>
              </div>
              {selectedReservation.email && (
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedReservation.email}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as ReservationStatus })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <DateTimePicker
            label="Date & Time *"
            value={formData.date_time}
            onChange={(value) => {
              setFormData({ ...formData, date_time: value });
              if (formErrors.date_time) setFormErrors({ ...formErrors, date_time: "" });
            }}
            error={formErrors.date_time}
            minDate={!isEditMode ? new Date() : undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="party_size">Party Size *</Label>
          <Input
            id="party_size"
            type="number"
            min="1"
            max="20"
            value={formData.party_size}
            onChange={(e) => {
              setFormData({ ...formData, party_size: e.target.value });
              if (formErrors.party_size) setFormErrors({ ...formErrors, party_size: "" });
            }}
            className={formErrors.party_size ? "border-destructive" : ""}
          />
          {formErrors.party_size && (
            <p className="text-sm text-destructive">{formErrors.party_size}</p>
          )}
        </div>
      </div>

      {!isEditMode && (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Guest Name *</Label>
            <Input
              id="name"
              placeholder="John Smith"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
              }}
              className={formErrors.name ? "border-destructive" : ""}
              maxLength={100}
            />
            {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <PhoneInput
                id="phone_number"
                placeholder="1234567890"
                value={formData.phone_number}
                onChange={(value) => {
                  setFormData({ ...formData, phone_number: value });
                  if (formErrors.phone_number) setFormErrors({ ...formErrors, phone_number: "" });
                }}
                error={!!formErrors.phone_number}
              />
              {formErrors.phone_number && (
                <p className="text-sm text-destructive">{formErrors.phone_number}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_address">Email Address</Label>
              <Input
                id="email_address"
                type="email"
                placeholder="john@example.com"
                value={formData.email_address}
                onChange={(e) => {
                  setFormData({ ...formData, email_address: e.target.value });
                  if (formErrors.email_address) setFormErrors({ ...formErrors, email_address: "" });
                }}
                className={formErrors.email_address ? "border-destructive" : ""}
              />
              {formErrors.email_address && (
                <p className="text-sm text-destructive">{formErrors.email_address}</p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="special_request">
          Special Request
          {formData.special_request && (
            <span className="text-xs text-muted-foreground ml-2">
              ({formData.special_request.length}/500)
            </span>
          )}
        </Label>
        <Textarea
          id="special_request"
          placeholder="Window seat preferred, dietary restrictions, etc."
          value={formData.special_request}
          onChange={(e) => {
            setFormData({ ...formData, special_request: e.target.value });
            if (formErrors.special_request) setFormErrors({ ...formErrors, special_request: "" });
          }}
          rows={2}
          maxLength={500}
          className={formErrors.special_request ? "border-destructive" : ""}
        />
        {formErrors.special_request && (
          <p className="text-sm text-destructive">{formErrors.special_request}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">
          Internal Notes
          {formData.notes && (
            <span className="text-xs text-muted-foreground ml-2">
              ({formData.notes.length}/1000)
            </span>
          )}
        </Label>
        <Textarea
          id="notes"
          placeholder="VIP customer, birthday celebration, etc."
          value={formData.notes}
          onChange={(e) => {
            setFormData({ ...formData, notes: e.target.value });
            if (formErrors.notes) setFormErrors({ ...formErrors, notes: "" });
          }}
          rows={2}
          maxLength={1000}
          className={formErrors.notes ? "border-destructive" : ""}
        />
        {formErrors.notes && <p className="text-sm text-destructive">{formErrors.notes}</p>}
      </div>
    </div>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reservations</h2>
          <p className="text-muted-foreground">Manage your restaurant's reservations</p>
        </div>
        <div className="flex items-center gap-2">
          {reservationEvents.length > 0 && (
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/reservation-events")}
              className="flex items-center gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              Reservation Updates ({reservationEvents.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={fetchReservations}
            disabled={isLoading || !restaurantId}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={openCreateDialog} disabled={!restaurantId} className="flex-shrink-0">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">New Reservation</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysGuests}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reservations Table */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              <CardTitle>All Reservations</CardTitle>
              {total > 0 && <Badge variant="secondary">{total} total</Badge>}
            </div>
          </div>

          {/* Search and Filter Row */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, email, or confirmation number..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>

              {(statusFilter !== "all" || startDate || endDate || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>
          </div>

          {/* Additional Filters */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg border">
              <div className="space-y-2 flex-1 min-w-0">
                <Label className="text-sm font-medium">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setOffset(0);
                  }}
                  max={endDate || undefined}
                />
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <Label className="text-sm font-medium">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setOffset(0);
                  }}
                  min={startDate || undefined}
                />
              </div>
              {dateRangeError && (
                <div className="w-full">
                  <p className="text-sm text-destructive">{dateRangeError}</p>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {(error || dateRangeError) && (
            <div className="flex items-center gap-3 p-4 mb-4 text-sm bg-destructive/10 border border-destructive/20 rounded-lg">
              <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-destructive">{error || dateRangeError}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setError(null);
                  setDateRangeError(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : reservations.length > 0 ? (
            <>
              <div className="overflow-x-auto border rounded-lg -mx-1 sm:mx-0">
                <TooltipProvider>
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold hidden sm:table-cell">ID</TableHead>
                        <TableHead className="font-semibold">Guest</TableHead>
                        <TableHead className="font-semibold text-center hidden md:table-cell">
                          Party
                        </TableHead>
                        <TableHead className="font-semibold hidden lg:table-cell">
                          Date & Time
                        </TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell">
                          Confirmation
                        </TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservations.map((reservation) => {
                        const { date, time } = formatVancouverDateTimeDirect(
                          reservation.date_time,
                          MONTH_NAMES
                        );
                        return (
                          <TableRow
                            key={reservation.id}
                            className="group hover:bg-muted/30 transition-colors"
                          >
                            <TableCell className="font-mono text-sm hidden sm:table-cell">
                              {reservation.id}
                            </TableCell>
                            <TableCell>
                              <div className="min-w-[140px] sm:min-w-[200px]">
                                <p className="font-medium text-sm sm:text-base">
                                  {reservation.name}
                                </p>
                                <div className="flex flex-col gap-0.5 mt-1">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {reservation.phone_number}
                                  </p>
                                  {reservation.email && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {reservation.email}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 lg:hidden">
                                  <span className="text-xs text-muted-foreground">{date}</span>
                                  <span className="text-xs text-muted-foreground">{time}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center hidden md:table-cell">
                              <div className="flex items-center justify-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{reservation.party_size}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {date}
                                </span>
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {time}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs hidden sm:table-cell">
                              {reservation.confirmation_number}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={getStatusColor(reservation.status)}
                                className="capitalize"
                              >
                                {formatStatusLabel(reservation.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1 sm:gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950"
                                      onClick={() => openDetailsDialog(reservation)}
                                    >
                                      <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>

                                {reservation.status === "pending" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-green-50 dark:hover:bg-green-950"
                                        onClick={() => openFinalizeDialog(reservation)}
                                      >
                                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Confirm Reservation</TooltipContent>
                                  </Tooltip>
                                )}

                                {(reservation.status === "pending" ||
                                  reservation.status === "confirmed") && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 hover:bg-muted"
                                          onClick={() => openEditDialog(reservation)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Edit Reservation</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 hover:bg-destructive/10"
                                          onClick={() => openCancelDialog(reservation)}
                                        >
                                          <XCircle className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Cancel Reservation</TooltipContent>
                                    </Tooltip>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center sm:text-left">
                    Showing {reservations.length > 0 ? offset + 1 : 0} to{" "}
                    {Math.min(offset + reservations.length, total)} of {total} reservation
                    {total !== 1 ? "s" : ""}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset((p) => Math.max(0, p - limit))}
                      disabled={offset === 0 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset((p) => p + limit)}
                      disabled={offset + limit >= total || isLoading}
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <CalendarDays className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-2">No reservations found</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery || statusFilter !== "all" || startDate || endDate
                  ? "Try adjusting your search criteria or filters to see more results."
                  : "Get started by creating your first reservation."}
              </p>
              {!searchQuery && statusFilter === "all" && !startDate && !endDate && (
                <Button onClick={openCreateDialog} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Reservation
                </Button>
              )}
              {(searchQuery || statusFilter !== "all" || startDate || endDate) && (
                <Button variant="outline" onClick={handleClearFilters} className="mt-2">
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Create Reservation</DialogTitle>
            <DialogDescription>Create a new confirmed reservation</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Reservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Reservation</DialogTitle>
            <DialogDescription>
              Update reservation details for {selectedReservation?.name}
            </DialogDescription>
          </DialogHeader>
          {renderForm(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
            <DialogDescription>{selectedReservation?.confirmation_number}</DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Guest Name</Label>
                  <p className="font-medium">{selectedReservation.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Party Size</Label>
                  <p className="font-medium">{selectedReservation.party_size} guests</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedReservation.phone_number}</p>
                </div>
                {selectedReservation.email && (
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedReservation.email}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground">Date & Time</Label>
                <p className="font-medium">
                  {formatVancouverDateTimeDirect(selectedReservation.date_time, MONTH_NAMES).date}{" "}
                  at{" "}
                  {formatVancouverDateTimeDirect(selectedReservation.date_time, MONTH_NAMES).time}
                </p>
              </div>

              {selectedReservation.special_request && (
                <div>
                  <Label className="text-muted-foreground">Special Request</Label>
                  <p className="font-medium">{selectedReservation.special_request}</p>
                </div>
              )}

              {selectedReservation.notes && (
                <div>
                  <Label className="text-muted-foreground">Internal Notes</Label>
                  <p className="font-medium">{selectedReservation.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant={getStatusColor(selectedReservation.status)}
                      className="capitalize"
                    >
                      {formatStatusLabel(selectedReservation.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reservation Type</Label>
                  <p className="text-sm mt-1">{selectedReservation.reservation_type}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="text-sm">
                    {
                      formatVancouverDateTimeDirect(selectedReservation.created_at, MONTH_NAMES)
                        .date
                    }{" "}
                    {
                      formatVancouverDateTimeDirect(selectedReservation.created_at, MONTH_NAMES)
                        .time
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated</Label>
                  <p className="text-sm">
                    {
                      formatVancouverDateTimeDirect(selectedReservation.updated_at, MONTH_NAMES)
                        .date
                    }{" "}
                    {
                      formatVancouverDateTimeDirect(selectedReservation.updated_at, MONTH_NAMES)
                        .time
                    }
                  </p>
                </div>
              </div>

              {/* Reservation History */}
              {selectedReservation.history && selectedReservation.history.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Reservation History</Label>
                    <Badge variant="secondary" className="text-xs">
                      {selectedReservation.history.length}
                    </Badge>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[250px] overflow-y-auto">
                      {selectedReservation.history.map((entry, index) => (
                        <ReservationHistoryItem
                          key={entry.id}
                          entry={entry}
                          isLast={index === selectedReservation.history.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedReservation &&
              (selectedReservation.status === "pending" ||
                selectedReservation.status === "confirmed") && (
                <Button
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    openEditDialog(selectedReservation);
                  }}
                >
                  Edit Reservation
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finalize Dialog */}
      <AlertDialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm this reservation? This will change the status from
              "pending" to "confirmed".
              {selectedReservation && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm">{selectedReservation.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatVancouverDateTimeDirect(selectedReservation.date_time, MONTH_NAMES).date}{" "}
                    at{" "}
                    {formatVancouverDateTimeDirect(selectedReservation.date_time, MONTH_NAMES).time}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalize} disabled={isSubmitting}>
              {isSubmitting ? "Confirming..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this reservation? This action cannot be undone and
              will release the time slot.
              {selectedReservation && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm">{selectedReservation.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatVancouverDateTimeDirect(selectedReservation.date_time, MONTH_NAMES).date}{" "}
                    at{" "}
                    {formatVancouverDateTimeDirect(selectedReservation.date_time, MONTH_NAMES).time}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cancelling..." : "Cancel Reservation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Reservations;
