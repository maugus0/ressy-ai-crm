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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { getRestaurant, updateRestaurant } from "@/services/restaurant";
import { formatTimeForApi, formatTimeForInput } from "@/lib/utils/time";
import { formatLocalDateTime, VANCOUVER_TIMEZONE } from "@/lib/utils/timezone";
import type { ClientRestaurant, ClientRestaurantUpdateRequest } from "@/types/api.types";

// Phone number validation regex (E.164 format)
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

// Form validation errors interface
interface FormErrors {
  name?: string;
  address?: string;
  phone_number?: string;
  forward_minutes?: string;
  backward_minutes?: string;
  opening_time?: string;
  closing_time?: string;
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
  opening_time: string;
  closing_time: string;
  reservation_seating_capacity: number;
  reservation_advance_days: number;
}

export function Settings() {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<ClientRestaurant | null>(null);

  // Collapsible section states - all collapsed by default for cleaner initial view
  const [sectionsOpen, setSectionsOpen] = useState({
    restaurantInfo: false,
    operatingHours: false,
    reservationCapacity: false,
    reservationTiming: false,
  });

  const [formData, setFormData] = useState<SettingsFormData>({
    name: "",
    address: "",
    phone_number: "",
    twilio_phone_number: "",
    forward_minutes: 60,
    backward_minutes: 30,
    is_credit_card_required_for_reservation: false,
    opening_time: "",
    closing_time: "",
    reservation_seating_capacity: 50,
    reservation_advance_days: 30,
  });

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
        opening_time: formatTimeForInput(data.opening_time),
        closing_time: formatTimeForInput(data.closing_time),
        reservation_seating_capacity: data.reservation_seating_capacity ?? 50,
        reservation_advance_days: data.reservation_advance_days ?? 30,
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
        const hasChanged =
          newData.name !== originalData.name ||
          newData.address !== originalData.address ||
          newData.phone_number !== originalData.phone_number ||
          newData.forward_minutes !== originalData.forward_minutes ||
          newData.backward_minutes !== originalData.backward_minutes ||
          newData.is_credit_card_required_for_reservation !==
            originalData.is_credit_card_required_for_reservation ||
          newData.opening_time !== formatTimeForInput(originalData.opening_time) ||
          newData.closing_time !== formatTimeForInput(originalData.closing_time) ||
          newData.reservation_seating_capacity !==
            (originalData.reservation_seating_capacity ?? 50) ||
          newData.reservation_advance_days !== (originalData.reservation_advance_days ?? 30);
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
        opening_time: formatTimeForApi(formData.opening_time),
        closing_time: formatTimeForApi(formData.closing_time),
        reservation_seating_capacity: formData.reservation_seating_capacity,
        reservation_advance_days: formData.reservation_advance_days,
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
        opening_time: formatTimeForInput(updatedData.opening_time),
        closing_time: formatTimeForInput(updatedData.closing_time),
        reservation_seating_capacity: updatedData.reservation_seating_capacity ?? 50,
        reservation_advance_days: updatedData.reservation_advance_days ?? 30,
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
        opening_time: formatTimeForInput(originalData.opening_time),
        closing_time: formatTimeForInput(originalData.closing_time),
        reservation_seating_capacity: originalData.reservation_seating_capacity ?? 50,
        reservation_advance_days: originalData.reservation_advance_days ?? 30,
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
        <Collapsible
          open={sectionsOpen.restaurantInfo}
          onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, restaurantInfo: open }))}
          className="group rounded-lg border bg-card transition-all data-[state=open]:ring-2 data-[state=open]:ring-primary/20"
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm sm:text-base">Restaurant Information</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Basic information about your restaurant
                  </p>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="px-4 pb-4">
              <div className="border-t pt-4 space-y-3 sm:space-y-4">
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
                        if (formErrors.name)
                          setFormErrors((prev) => ({ ...prev, name: undefined }));
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
                      <p className="text-[10px] sm:text-xs text-destructive">
                        {formErrors.phone_number}
                      </p>
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
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        (Read-only)
                      </span>
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
                      <span className="text-xs sm:text-sm font-medium">
                        Call Escalation Settings
                      </span>
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
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Operating Hours */}
        <Collapsible
          open={sectionsOpen.operatingHours}
          onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, operatingHours: open }))}
          className="group rounded-lg border bg-card transition-all data-[state=open]:ring-2 data-[state=open]:ring-primary/20"
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm sm:text-base">Operating Hours</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Set your restaurant's opening and closing times
                  </p>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="px-4 pb-4">
              <div className="border-t pt-4 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="opening_time" className="text-xs sm:text-sm">
                      Opening Time
                    </Label>
                    <Input
                      id="opening_time"
                      type="time"
                      value={formData.opening_time}
                      onChange={(e) => updateFormData({ opening_time: e.target.value })}
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                    />
                    {formErrors.opening_time && (
                      <p className="text-[10px] sm:text-xs text-destructive">
                        {formErrors.opening_time}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="closing_time" className="text-xs sm:text-sm">
                      Closing Time
                    </Label>
                    <Input
                      id="closing_time"
                      type="time"
                      value={formData.closing_time}
                      onChange={(e) => updateFormData({ closing_time: e.target.value })}
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                    />
                    {formErrors.closing_time && (
                      <p className="text-[10px] sm:text-xs text-destructive">
                        {formErrors.closing_time}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="restaurant_timezone" className="text-xs sm:text-sm">
                    Restaurant Timezone{" "}
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      (Read-only)
                    </span>
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
                {formData.opening_time && formData.closing_time && (
                  <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-900">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 shrink-0" />
                    <span className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                      Open from {formData.opening_time} to {formData.closing_time}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Reservation Capacity Settings */}
        <Collapsible
          open={sectionsOpen.reservationCapacity}
          onOpenChange={(open) =>
            setSectionsOpen((prev) => ({ ...prev, reservationCapacity: open }))
          }
          className="group rounded-lg border bg-card transition-all data-[state=open]:ring-2 data-[state=open]:ring-primary/20"
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm sm:text-base">Reservation Capacity</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Configure your restaurant's seating capacity and booking limits
                  </p>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="px-4 pb-4">
              <div className="border-t pt-4 space-y-4 sm:space-y-6">
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
                {formData.reservation_seating_capacity > 0 &&
                  formData.reservation_advance_days > 0 && (
                    <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
                      <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                        Accepting reservations for up to {formData.reservation_seating_capacity}{" "}
                        guests per slot, up to {formData.reservation_advance_days} days in advance
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Reservation Timing Settings */}
        <Collapsible
          open={sectionsOpen.reservationTiming}
          onOpenChange={(open) => setSectionsOpen((prev) => ({ ...prev, reservationTiming: open }))}
          className="group rounded-lg border bg-card transition-all data-[state=open]:ring-2 data-[state=open]:ring-primary/20"
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Timer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm sm:text-base">Reservation Timing</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Configure booking and cancellation time buffers
                  </p>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="px-4 pb-4">
              <div className="border-t pt-4 space-y-4 sm:space-y-6">
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
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
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
