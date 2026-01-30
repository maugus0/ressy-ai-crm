/**
 * Settings Page
 * Manage restaurant settings and information
 * Integrates with GET/PUT /api/v1/client/restaurant
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PhoneInput } from "@/components/ui/phone-input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  Building,
  Clock,
  CreditCard,
  Timer,
  Save,
  Loader2,
  Phone,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Users,
  CalendarDays,
  Bot,
  ShoppingBag,
  HelpCircle,
  AlertTriangle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { getRestaurant, updateRestaurant } from "@/services/restaurant";
import { formatLocalDateTime, VANCOUVER_TIMEZONE } from "@/lib/utils/timezone";
import type {
  ClientRestaurant,
  ClientRestaurantUpdateRequest,
  OperatingHours,
} from "@/types/api.types";

// Phone number validation regex (E.164 format)
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

// Days of week constant
const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// Day display names
const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

// Default operating hours for initialization
const DEFAULT_OPERATING_HOURS: OperatingHours = {
  monday: { open: "09:00:00", close: "22:00:00", is_closed: false },
  tuesday: { open: "09:00:00", close: "22:00:00", is_closed: false },
  wednesday: { open: "09:00:00", close: "22:00:00", is_closed: false },
  thursday: { open: "09:00:00", close: "22:00:00", is_closed: false },
  friday: { open: "09:00:00", close: "22:00:00", is_closed: false },
  saturday: { open: "09:00:00", close: "22:00:00", is_closed: false },
  sunday: { open: "09:00:00", close: "22:00:00", is_closed: false },
};

// Form validation errors interface
interface FormErrors {
  name?: string;
  address?: string;
  phone_number?: string;
  forward_minutes?: string;
  backward_minutes?: string;
  reservation_seating_capacity?: string;
  reservation_advance_days?: string;
}

// Form data structure for editing
interface SettingsFormData {
  name: string;
  address: string;
  phone_number: string;
  twilio_phone_number: string;
  forward_minutes: number;
  backward_minutes: number;
  is_credit_card_required_for_reservation: boolean;
  operating_hours: OperatingHours;
  reservation_seating_capacity: number;
  reservation_advance_days: number;
  features_orders_enabled: boolean;
  features_reservations_enabled: boolean;
  features_faqs_enabled: boolean;
}

export function Settings() {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<ClientRestaurant | null>(null);

  // Collapsible section states - Restaurant Info open by default, persist to localStorage
  const [sectionsOpen, setSectionsOpen] = useState(() => {
    const defaultState = {
      restaurantInfo: true,
      operatingHours: false,
      reservationCapacity: false,
      reservationTiming: false,
      agentCapabilities: false,
    };
    if (typeof window === "undefined") {
      return defaultState;
    }
    try {
      const stored = window.localStorage.getItem("settingsSectionsOpen");
      if (!stored) {
        return defaultState;
      }
      const parsed = JSON.parse(stored) as Partial<typeof defaultState>;
      return {
        restaurantInfo: parsed.restaurantInfo ?? defaultState.restaurantInfo,
        operatingHours: parsed.operatingHours ?? defaultState.operatingHours,
        reservationCapacity: parsed.reservationCapacity ?? defaultState.reservationCapacity,
        reservationTiming: parsed.reservationTiming ?? defaultState.reservationTiming,
        agentCapabilities: parsed.agentCapabilities ?? defaultState.agentCapabilities,
      };
    } catch {
      return defaultState;
    }
  });

  // Persist section open states to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem("settingsSectionsOpen", JSON.stringify(sectionsOpen));
    } catch {
      // Ignore persistence errors (e.g., private mode or disabled storage)
    }
  }, [sectionsOpen]);

  const [formData, setFormData] = useState<SettingsFormData>({
    name: "",
    address: "",
    phone_number: "",
    twilio_phone_number: "",
    forward_minutes: 60,
    backward_minutes: 30,
    is_credit_card_required_for_reservation: false,
    operating_hours: DEFAULT_OPERATING_HOURS,
    reservation_seating_capacity: 50,
    reservation_advance_days: 30,
    features_orders_enabled: true,
    features_reservations_enabled: true,
    features_faqs_enabled: true,
  });

  /**
   * Format time from HH:MM:SS to HH:MM for input fields
   */
  const formatTimeForInputLocal = (time: string | null | undefined): string => {
    if (!time) return "";
    return time.slice(0, 5); // "09:00:00" -> "09:00"
  };

  /**
   * Format time from HH:MM to HH:MM:SS for API
   */
  const formatTimeForApiLocal = (time: string): string => {
    if (!time) return "";
    if (time.length === 5) return `${time}:00`; // "09:00" -> "09:00:00"
    return time;
  };

  /**
   * Copy hours from one day to all days
   */
  const copyToAllDays = (sourceDay: DayOfWeek) => {
    const sourceDayHours = formData.operating_hours[sourceDay];
    const newOperatingHours = { ...formData.operating_hours };

    DAYS_OF_WEEK.forEach((day) => {
      newOperatingHours[day] = { ...sourceDayHours };
    });

    updateFormData({ operating_hours: newOperatingHours });
    toast.success(`Copied ${DAY_LABELS[sourceDay]}'s hours to all days`);
  };

  /**
   * Update a specific day's hours
   */
  const updateDayHours = (
    day: DayOfWeek,
    field: "open" | "close" | "is_closed",
    value: string | boolean
  ) => {
    updateFormData({
      operating_hours: {
        ...formData.operating_hours,
        [day]: {
          ...formData.operating_hours[day],
          [field]: value,
        },
      },
    });
  };

  /**
   * Check if all days have the same hours
   */
  const allDaysSame = (): boolean => {
    const firstDay = formData.operating_hours.monday;
    return DAYS_OF_WEEK.every((day) => {
      const dayHours = formData.operating_hours[day];
      return (
        dayHours.open === firstDay.open &&
        dayHours.close === firstDay.close &&
        dayHours.is_closed === firstDay.is_closed
      );
    });
  };

  // Fetch restaurant data
  const fetchRestaurant = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getRestaurant();
      setOriginalData(data);
      setFormData({
        name: data.name,
        address: data.address,
        phone_number: data.phone_number,
        twilio_phone_number: data.twilio_phone_number || "",
        forward_minutes: data.forward_minutes,
        backward_minutes: data.backward_minutes,
        is_credit_card_required_for_reservation: data.is_credit_card_required_for_reservation,
        operating_hours: data.operating_hours || DEFAULT_OPERATING_HOURS,
        reservation_seating_capacity: data.reservation_seating_capacity ?? 50,
        reservation_advance_days: data.reservation_advance_days ?? 30,
        features_orders_enabled: data.features?.orders_enabled ?? true,
        features_reservations_enabled: data.features?.reservations_enabled ?? true,
        features_faqs_enabled: data.features?.faqs_enabled ?? true,
      });
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load restaurant settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  // Track changes
  const updateFormData = (updates: Partial<SettingsFormData>) => {
    setFormData((prev) => {
      const newData = { ...prev, ...updates };
      // Check if data has changed from original
      if (originalData) {
        // Check if operating hours have changed
        const origHours = originalData.operating_hours || DEFAULT_OPERATING_HOURS;
        const operatingHoursChanged = DAYS_OF_WEEK.some((day) => {
          const newDay = newData.operating_hours[day];
          const origDay = origHours[day];
          return (
            newDay.open !== origDay.open ||
            newDay.close !== origDay.close ||
            newDay.is_closed !== origDay.is_closed
          );
        });

        const hasChanged =
          newData.name !== originalData.name ||
          newData.address !== originalData.address ||
          newData.phone_number !== originalData.phone_number ||
          newData.forward_minutes !== originalData.forward_minutes ||
          newData.backward_minutes !== originalData.backward_minutes ||
          newData.is_credit_card_required_for_reservation !==
            originalData.is_credit_card_required_for_reservation ||
          operatingHoursChanged ||
          newData.reservation_seating_capacity !==
            (originalData.reservation_seating_capacity ?? 50) ||
          newData.reservation_advance_days !== (originalData.reservation_advance_days ?? 30) ||
          newData.features_orders_enabled !== (originalData.features?.orders_enabled ?? true) ||
          newData.features_reservations_enabled !==
            (originalData.features?.reservations_enabled ?? true) ||
          newData.features_faqs_enabled !== (originalData.features?.faqs_enabled ?? true);
        setHasChanges(hasChanged);
      }
      return newData;
    });
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Restaurant name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      errors.name = "Name must be less than 100 characters";
    }

    // Address validation
    if (!formData.address.trim()) {
      errors.address = "Address is required";
    } else if (formData.address.length < 5) {
      errors.address = "Please enter a complete address";
    }

    // Phone validation
    if (!formData.phone_number.trim()) {
      errors.phone_number = "Phone number is required";
    } else if (!PHONE_REGEX.test(formData.phone_number)) {
      errors.phone_number = "Phone must be in E.164 format (e.g., +15551234567)";
    }

    // Forward/backward minutes validation
    if (formData.forward_minutes < 1 || formData.forward_minutes > 1440) {
      errors.forward_minutes = "Must be between 1 and 1440 minutes";
    }
    if (formData.backward_minutes < 1 || formData.backward_minutes > 1440) {
      errors.backward_minutes = "Must be between 1 and 1440 minutes";
    }

    // Seating capacity validation
    if (formData.reservation_seating_capacity < 1 || formData.reservation_seating_capacity > 1000) {
      errors.reservation_seating_capacity = "Must be between 1 and 1000 seats";
    }

    // Advance days validation
    if (formData.reservation_advance_days < 1 || formData.reservation_advance_days > 365) {
      errors.reservation_advance_days = "Must be between 1 and 365 days";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save changes
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors before saving");
      return;
    }

    setSaving(true);

    try {
      const payload: ClientRestaurantUpdateRequest = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone_number: formData.phone_number.trim(),
        forward_minutes: formData.forward_minutes,
        backward_minutes: formData.backward_minutes,
        is_credit_card_required_for_reservation: formData.is_credit_card_required_for_reservation,
        operating_hours: formData.operating_hours,
        reservation_seating_capacity: formData.reservation_seating_capacity,
        reservation_advance_days: formData.reservation_advance_days,
        features: {
          orders_enabled: formData.features_orders_enabled,
          reservations_enabled: formData.features_reservations_enabled,
          faqs_enabled: formData.features_faqs_enabled,
        },
      };

      const updatedData = await updateRestaurant(payload);
      setOriginalData(updatedData);
      setFormData({
        name: updatedData.name,
        address: updatedData.address,
        phone_number: updatedData.phone_number,
        twilio_phone_number: updatedData.twilio_phone_number || "",
        forward_minutes: updatedData.forward_minutes,
        backward_minutes: updatedData.backward_minutes,
        is_credit_card_required_for_reservation:
          updatedData.is_credit_card_required_for_reservation,
        operating_hours: updatedData.operating_hours || DEFAULT_OPERATING_HOURS,
        reservation_seating_capacity: updatedData.reservation_seating_capacity ?? 50,
        reservation_advance_days: updatedData.reservation_advance_days ?? 30,
        features_orders_enabled: updatedData.features?.orders_enabled ?? true,
        features_reservations_enabled: updatedData.features?.reservations_enabled ?? true,
        features_faqs_enabled: updatedData.features?.faqs_enabled ?? true,
      });
      setHasChanges(false);
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Reset to original values
  const handleReset = () => {
    if (originalData) {
      setFormData({
        name: originalData.name,
        address: originalData.address,
        phone_number: originalData.phone_number,
        twilio_phone_number: originalData.twilio_phone_number || "",
        forward_minutes: originalData.forward_minutes,
        backward_minutes: originalData.backward_minutes,
        is_credit_card_required_for_reservation:
          originalData.is_credit_card_required_for_reservation,
        operating_hours: originalData.operating_hours || DEFAULT_OPERATING_HOURS,
        reservation_seating_capacity: originalData.reservation_seating_capacity ?? 50,
        reservation_advance_days: originalData.reservation_advance_days ?? 30,
        features_orders_enabled: originalData.features?.orders_enabled ?? true,
        features_reservations_enabled: originalData.features?.reservations_enabled ?? true,
        features_faqs_enabled: originalData.features?.faqs_enabled ?? true,
      });
      setFormErrors({});
      setHasChanges(false);
      toast.info("Changes discarded");
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <Skeleton className="h-7 sm:h-8 w-40 sm:w-48 mb-1.5 sm:mb-2" />
            <Skeleton className="h-3 sm:h-4 w-56 sm:w-64" />
          </div>
          <Skeleton className="h-9 sm:h-10 w-28 sm:w-32" />
        </div>
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <Skeleton className="h-5 sm:h-6 w-40 sm:w-48 mb-1.5 sm:mb-2" />
            <Skeleton className="h-3 sm:h-4 w-56 sm:w-64" />
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1.5 sm:space-y-2">
                  <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                  <Skeleton className="h-9 sm:h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <Skeleton className="h-5 sm:h-6 w-40 sm:w-48" />
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1.5 sm:space-y-2">
                  <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                  <Skeleton className="h-9 sm:h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading settings</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchRestaurant}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const forwardEscalationsEnabled = originalData?.forward_escalations ?? false;
  const escalationPhoneNumber = originalData?.escalation_phone_number ?? "";
  const restaurantTimezone = originalData?.timezone || VANCOUVER_TIMEZONE;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Manage your restaurant's information and preferences
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={saving}
              className="text-xs sm:text-sm"
            >
              <span className="hidden xs:inline">Discard Changes</span>
              <span className="xs:hidden">Discard</span>
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            size="sm"
            className="text-xs sm:text-sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                <span className="hidden xs:inline">Saving...</span>
                <span className="xs:hidden">Saving</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Save Changes</span>
                <span className="xs:hidden">Save</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Unsaved changes indicator */}
      {hasChanges && (
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
          <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-700 shrink-0" />
          <AlertTitle className="text-xs sm:text-sm text-yellow-800">Unsaved Changes</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm text-yellow-700">
            You have unsaved changes. Click "Save Changes" to apply them.
          </AlertDescription>
        </Alert>
      )}

      {/* All Sections Container */}
      <div className="space-y-4">
        {/* Restaurant Information */}
        <CollapsibleSection
          icon={Building}
          title="Restaurant Information"
          description="Basic information about your restaurant"
          isOpen={sectionsOpen.restaurantInfo}
          onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, restaurantInfo: open }))}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm">
                Restaurant Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  updateFormData({ name: e.target.value });
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g., Ressy's Kitchen"
                className={`h-9 sm:h-10 text-xs sm:text-sm ${formErrors.name ? "border-destructive" : ""}`}
              />
              {formErrors.name && (
                <p className="text-[10px] sm:text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="phone_number" className="text-xs sm:text-sm">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <PhoneInput
                id="phone_number"
                value={formData.phone_number}
                onChange={(value) => {
                  updateFormData({ phone_number: value });
                  if (formErrors.phone_number)
                    setFormErrors((prev) => ({ ...prev, phone_number: undefined }));
                }}
                placeholder="5551234567"
                error={!!formErrors.phone_number}
                className="[&>button]:h-9 sm:[&>button]:h-10 [&>input]:h-9 sm:[&>input]:h-10 [&>button]:text-xs sm:[&>button]:text-sm [&>input]:text-xs sm:[&>input]:text-sm"
              />
              {formErrors.phone_number && (
                <p className="text-[10px] sm:text-xs text-destructive">{formErrors.phone_number}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="address" className="text-xs sm:text-sm">
              Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => {
                  updateFormData({ address: e.target.value });
                  if (formErrors.address)
                    setFormErrors((prev) => ({ ...prev, address: undefined }));
                }}
                placeholder="123 Main St, City, State"
                className={`pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm ${formErrors.address ? "border-destructive" : ""}`}
              />
            </div>
            {formErrors.address && (
              <p className="text-[10px] sm:text-xs text-destructive">{formErrors.address}</p>
            )}
          </div>

          {/* Twilio Phone (Read-only) */}
          {formData.twilio_phone_number && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="twilio_phone" className="text-xs sm:text-sm">
                RessyAI Phone Number{" "}
                <span className="text-[10px] sm:text-xs text-muted-foreground">(Read-only)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  id="twilio_phone"
                  value={formData.twilio_phone_number}
                  readOnly
                  disabled
                  className="pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm bg-muted cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                This is your AI assistant's phone number. Contact support to change it.
              </p>
            </div>
          )}

          {/* Call Escalation Settings - Read-only card */}
          <div className="rounded-lg border bg-gradient-to-br from-muted/50 to-muted/30 overflow-hidden">
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b bg-muted/40">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm font-medium">Call Escalation Settings</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Read-only
                </span>
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Forward Escalations Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-medium">Forward Escalations</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Automatically forward urgent calls to staff
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${
                      forwardEscalationsEnabled
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {forwardEscalationsEnabled ? "Enabled" : "Disabled"}
                  </span>
                  <Switch
                    id="forward_escalations"
                    checked={forwardEscalationsEnabled}
                    disabled
                    className="cursor-not-allowed opacity-60"
                  />
                </div>
              </div>

              {/* Escalation Phone Number */}
              <div className="space-y-1.5">
                <p className="text-xs sm:text-sm font-medium">Escalation Phone Number</p>
                <div
                  className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-md ${
                    escalationPhoneNumber
                      ? "bg-background border"
                      : "bg-muted/50 border border-dashed"
                  }`}
                >
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <span
                    className={`text-xs sm:text-sm ${
                      escalationPhoneNumber ? "font-mono" : "text-muted-foreground italic"
                    }`}
                  >
                    {escalationPhoneNumber || "Not configured"}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Contact support to update escalation settings
                </p>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Operating Hours - Per Day */}
        <CollapsibleSection
          icon={Clock}
          title="Weekly Operating Hours"
          description="Set your restaurant's hours for each day of the week"
          isOpen={sectionsOpen.operatingHours}
          onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, operatingHours: open }))}
        >
          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Configure hours for each day individually
            </p>
            {!allDaysSame() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToAllDays("monday")}
                className="h-7 text-xs"
              >
                <Copy className="h-3 w-3 mr-1.5" />
                Copy Monday to All
              </Button>
            )}
          </div>

          {/* Per-Day Hours */}
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day) => {
              const dayHours = formData.operating_hours[day];
              const isToday =
                new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === day;

              return (
                <div
                  key={day}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 sm:p-3 rounded-lg border ${
                    isToday ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                  }`}
                >
                  {/* Day Name + Today Badge */}
                  <div className="flex items-center gap-2 min-w-[100px] sm:min-w-[110px]">
                    <Label className="text-xs sm:text-sm font-medium capitalize">
                      {DAY_LABELS[day]}
                    </Label>
                    {isToday && (
                      <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Closed Toggle */}
                  <div className="flex items-center gap-1.5 sm:min-w-[90px]">
                    <Switch
                      checked={dayHours.is_closed}
                      onCheckedChange={(checked) => {
                        updateDayHours(day, "is_closed", checked);
                      }}
                      className="scale-75 sm:scale-100"
                    />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Closed</span>
                  </div>

                  {/* Time Inputs - Only show if not closed */}
                  {!dayHours.is_closed && (
                    <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                      <Input
                        type="time"
                        value={formatTimeForInputLocal(dayHours.open)}
                        onChange={(e) => {
                          updateDayHours(day, "open", formatTimeForApiLocal(e.target.value));
                        }}
                        className="h-8 text-xs flex-1"
                        placeholder="Open"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">to</span>
                      <Input
                        type="time"
                        value={formatTimeForInputLocal(dayHours.close)}
                        onChange={(e) => {
                          updateDayHours(day, "close", formatTimeForApiLocal(e.target.value));
                        }}
                        className="h-8 text-xs flex-1"
                        placeholder="Close"
                      />
                    </div>
                  )}

                  {/* Copy Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToAllDays(day)}
                    className="h-7 w-7 shrink-0 ml-auto sm:ml-0"
                    title={`Copy ${DAY_LABELS[day]}'s hours to all days`}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Timezone (Read-only) */}
          <div className="space-y-1.5 sm:space-y-2 mt-4 pt-4 border-t">
            <Label htmlFor="restaurant_timezone" className="text-xs sm:text-sm">
              Restaurant Timezone{" "}
              <span className="text-[10px] sm:text-xs text-muted-foreground">(Read-only)</span>
            </Label>
            <Input
              id="restaurant_timezone"
              value={restaurantTimezone}
              readOnly
              disabled
              className="h-9 sm:h-10 text-xs sm:text-sm bg-muted cursor-not-allowed"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Timezone for your restaurant. Contact support to change it.
            </p>
          </div>

          {/* Summary Card */}
          {(() => {
            const openDays = DAYS_OF_WEEK.filter((day) => !formData.operating_hours[day].is_closed);
            const closedDays = DAYS_OF_WEEK.filter(
              (day) => formData.operating_hours[day].is_closed
            );

            return (
              <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 mt-3">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 space-y-0.5">
                  <p>
                    <span className="font-medium">
                      Open {openDays.length} {openDays.length === 1 ? "day" : "days"} per week
                    </span>
                  </p>
                  {closedDays.length > 0 && (
                    <p className="text-[10px] sm:text-xs">
                      Closed on: {closedDays.map((day) => DAY_LABELS[day]).join(", ")}
                    </p>
                  )}
                  {allDaysSame() && openDays.length === 7 && (
                    <p className="text-[10px] sm:text-xs">
                      Same hours every day:{" "}
                      {formatTimeForInputLocal(formData.operating_hours.monday.open)} -{" "}
                      {formatTimeForInputLocal(formData.operating_hours.monday.close)}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </CollapsibleSection>

        {/* Reservation Capacity Settings */}
        <CollapsibleSection
          icon={Users}
          title="Reservation Capacity"
          description="Configure your restaurant's seating capacity and booking limits"
          isOpen={sectionsOpen.reservationCapacity}
          onOpenChange={(open) =>
            setSectionsOpen((prev) => ({ ...prev, reservationCapacity: open }))
          }
          contentClassName="space-y-4 sm:space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Maximum Seating Capacity */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="seating_capacity" className="text-xs sm:text-sm">
                Maximum Seating Capacity
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="seating_capacity"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.reservation_seating_capacity}
                  onChange={(e) => {
                    updateFormData({
                      reservation_seating_capacity: Number(e.target.value) || 1,
                    });
                    if (formErrors.reservation_seating_capacity)
                      setFormErrors((prev) => ({
                        ...prev,
                        reservation_seating_capacity: undefined,
                      }));
                  }}
                  className={`h-9 sm:h-10 text-xs sm:text-sm w-24 sm:w-32 ${formErrors.reservation_seating_capacity ? "border-destructive" : ""}`}
                />
                <span className="text-xs sm:text-sm text-muted-foreground">seats</span>
              </div>
              {formErrors.reservation_seating_capacity ? (
                <p className="text-[10px] sm:text-xs text-destructive">
                  {formErrors.reservation_seating_capacity}
                </p>
              ) : (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Maximum number of guests your restaurant can accommodate at any time
                </p>
              )}
            </div>

            {/* Advance Booking Window */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="advance_days" className="text-xs sm:text-sm">
                Advance Booking Window
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="advance_days"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.reservation_advance_days}
                  onChange={(e) => {
                    updateFormData({ reservation_advance_days: Number(e.target.value) || 1 });
                    if (formErrors.reservation_advance_days)
                      setFormErrors((prev) => ({
                        ...prev,
                        reservation_advance_days: undefined,
                      }));
                  }}
                  className={`h-9 sm:h-10 text-xs sm:text-sm w-24 sm:w-32 ${formErrors.reservation_advance_days ? "border-destructive" : ""}`}
                />
                <span className="text-xs sm:text-sm text-muted-foreground">days</span>
              </div>
              {formErrors.reservation_advance_days ? (
                <p className="text-[10px] sm:text-xs text-destructive">
                  {formErrors.reservation_advance_days}
                </p>
              ) : (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  How far in advance customers can make reservations
                </p>
              )}
            </div>
          </div>

          {/* Summary */}
          {formData.reservation_seating_capacity > 0 && formData.reservation_advance_days > 0 && (
            <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                Accepting reservations for up to {formData.reservation_seating_capacity} guests per
                slot, up to {formData.reservation_advance_days} days in advance
              </span>
            </div>
          )}
        </CollapsibleSection>

        {/* Reservation Timing Settings */}
        <CollapsibleSection
          icon={Timer}
          title="Reservation Timing"
          description="Configure booking and cancellation time buffers"
          isOpen={sectionsOpen.reservationTiming}
          onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, reservationTiming: open }))}
          contentClassName="space-y-4 sm:space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="forward_minutes" className="text-xs sm:text-sm">
                Minimum Booking Notice
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="forward_minutes"
                  type="number"
                  min="0"
                  max="1440"
                  value={formData.forward_minutes}
                  onChange={(e) => {
                    updateFormData({ forward_minutes: Number(e.target.value) || 0 });
                    if (formErrors.forward_minutes)
                      setFormErrors((prev) => ({ ...prev, forward_minutes: undefined }));
                  }}
                  className={`h-9 sm:h-10 text-xs sm:text-sm w-24 sm:w-32 ${formErrors.forward_minutes ? "border-destructive" : ""}`}
                />
                <span className="text-xs sm:text-sm text-muted-foreground">minutes</span>
              </div>
              {formErrors.forward_minutes ? (
                <p className="text-[10px] sm:text-xs text-destructive">
                  {formErrors.forward_minutes}
                </p>
              ) : (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Minimum time before a reservation can be booked
                </p>
              )}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="backward_minutes" className="text-xs sm:text-sm">
                Cancellation Window
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="backward_minutes"
                  type="number"
                  min="0"
                  max="1440"
                  value={formData.backward_minutes}
                  onChange={(e) => {
                    updateFormData({ backward_minutes: Number(e.target.value) || 0 });
                    if (formErrors.backward_minutes)
                      setFormErrors((prev) => ({ ...prev, backward_minutes: undefined }));
                  }}
                  className={`h-9 sm:h-10 text-xs sm:text-sm w-24 sm:w-32 ${formErrors.backward_minutes ? "border-destructive" : ""}`}
                />
                <span className="text-xs sm:text-sm text-muted-foreground">minutes</span>
              </div>
              {formErrors.backward_minutes ? (
                <p className="text-[10px] sm:text-xs text-destructive">
                  {formErrors.backward_minutes}
                </p>
              ) : (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Minimum time before reservation to allow free cancellation
                </p>
              )}
            </div>
          </div>

          <Separator className="my-3 sm:my-4" />

          {/* Credit Card Requirement */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <Label
                  htmlFor="credit_card"
                  className="text-xs sm:text-sm font-medium cursor-pointer block"
                >
                  Credit Card Required for Reservations
                </Label>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Require customers to provide credit card details when booking
                </p>
              </div>
            </div>
            <Switch
              id="credit_card"
              checked={formData.is_credit_card_required_for_reservation}
              onCheckedChange={(checked) =>
                updateFormData({ is_credit_card_required_for_reservation: checked })
              }
              className="shrink-0"
            />
          </div>
        </CollapsibleSection>

        {/* Agent Capabilities */}
        <CollapsibleSection
          icon={Bot}
          title="Agent Capabilities"
          description="Configure what RessyAI can handle for your restaurant"
          isOpen={sectionsOpen.agentCapabilities}
          onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, agentCapabilities: open }))}
        >
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                Disabling a capability will route those requests to your staff. Ensure call
                forwarding is configured.
              </p>
            </div>

            {/* Orders Toggle */}
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <Label
                    htmlFor="orders_enabled"
                    className="text-xs sm:text-sm font-medium cursor-pointer block"
                  >
                    Pickup Orders
                  </Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Allow RessyAI to take and manage pickup orders
                  </p>
                </div>
              </div>
              <Switch
                id="orders_enabled"
                checked={formData.features_orders_enabled}
                onCheckedChange={(checked) => updateFormData({ features_orders_enabled: checked })}
                className="shrink-0"
              />
            </div>

            {/* Reservations Toggle */}
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <Label
                    htmlFor="reservations_enabled"
                    className="text-xs sm:text-sm font-medium cursor-pointer block"
                  >
                    Reservations
                  </Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Allow RessyAI to book and manage table reservations
                  </p>
                </div>
              </div>
              <Switch
                id="reservations_enabled"
                checked={formData.features_reservations_enabled}
                onCheckedChange={(checked) =>
                  updateFormData({ features_reservations_enabled: checked })
                }
                className="shrink-0"
              />
            </div>

            {/* FAQs Toggle */}
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                  <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <Label
                    htmlFor="faqs_enabled"
                    className="text-xs sm:text-sm font-medium cursor-pointer block"
                  >
                    FAQs & General Questions
                  </Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Allow RessyAI to answer menu questions and general inquiries
                  </p>
                </div>
              </div>
              <Switch
                id="faqs_enabled"
                checked={formData.features_faqs_enabled}
                onCheckedChange={(checked) => updateFormData({ features_faqs_enabled: checked })}
                className="shrink-0"
              />
            </div>

            {/* Status Summary */}
            <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/50 border">
              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                RessyAI is handling:{" "}
                <span className="font-medium text-foreground">
                  {[
                    formData.features_orders_enabled && "Orders",
                    formData.features_reservations_enabled && "Reservations",
                    formData.features_faqs_enabled && "FAQs",
                  ]
                    .filter(Boolean)
                    .join(", ") || "Nothing (all requests forwarded to staff)"}
                </span>
              </span>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Last Updated */}
      {originalData && (
        <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
          Last updated:{" "}
          {formatLocalDateTime(originalData.updated_at, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      )}
    </div>
  );
}

export default Settings;
