/**
 * Settings Page
 * Manage restaurant settings and information
 * Integrates with GET/PUT /api/v1/client/restaurant
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PhoneInput } from "@/components/ui/phone-input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
} from "lucide-react";
import { toast } from "sonner";
import { getRestaurant, updateRestaurant } from "@/services/restaurant";
import { formatTimeForApi, formatTimeForInput } from "@/lib/utils/time";
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
}

export function Settings() {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<ClientRestaurant | null>(null);
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
          newData.closing_time !== formatTimeForInput(originalData.closing_time);
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

      {/* Restaurant Information */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <CardTitle className="text-base sm:text-lg">Restaurant Information</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm mt-1">
            Basic information about your restaurant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
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
                Twilio Phone Number{" "}
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
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <CardTitle className="text-base sm:text-lg">Operating Hours</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm mt-1">
            Set your restaurant's opening and closing times
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
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
                <p className="text-[10px] sm:text-xs text-destructive">{formErrors.opening_time}</p>
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
                <p className="text-[10px] sm:text-xs text-destructive">{formErrors.closing_time}</p>
              )}
            </div>
          </div>
          {formData.opening_time && formData.closing_time && (
            <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />
              <span className="text-xs sm:text-sm text-green-700">
                Open from {formData.opening_time} to {formData.closing_time}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reservation Settings */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <CardTitle className="text-base sm:text-lg">Reservation Settings</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm mt-1">
            Configure reservation booking and cancellation windows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="forward_minutes" className="text-xs sm:text-sm">
                Forward Window (minutes)
                <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 sm:ml-2">
                  Booking ahead
                </span>
              </Label>
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
                className={`h-9 sm:h-10 text-xs sm:text-sm ${formErrors.forward_minutes ? "border-destructive" : ""}`}
              />
              {formErrors.forward_minutes ? (
                <p className="text-[10px] sm:text-xs text-destructive">
                  {formErrors.forward_minutes}
                </p>
              ) : (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Customers can book up to {formData.forward_minutes} minutes ahead
                </p>
              )}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="backward_minutes" className="text-xs sm:text-sm">
                Backward Window (minutes)
                <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 sm:ml-2">
                  Cancellation
                </span>
              </Label>
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
                className={`h-9 sm:h-10 text-xs sm:text-sm ${formErrors.backward_minutes ? "border-destructive" : ""}`}
              />
              {formErrors.backward_minutes ? (
                <p className="text-[10px] sm:text-xs text-destructive">
                  {formErrors.backward_minutes}
                </p>
              ) : (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Cancellations allowed up to {formData.backward_minutes} minutes before
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
        </CardContent>
      </Card>

      {/* Last Updated */}
      {originalData && (
        <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
          Last updated:{" "}
          {new Date(originalData.updated_at).toLocaleString("en-US", {
            timeZone: "America/Vancouver",
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      )}
    </div>
  );
}

export default Settings;
