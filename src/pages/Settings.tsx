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
    if (formData.forward_minutes < 0 || formData.forward_minutes > 1440) {
      errors.forward_minutes = "Must be between 0 and 1440 minutes";
    }
    if (formData.backward_minutes < 0 || formData.backward_minutes > 1440) {
      errors.backward_minutes = "Must be between 0 and 1440 minutes";
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
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
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
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your restaurant's information and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              Discard Changes
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Unsaved changes indicator */}
      {hasChanges && (
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
          <AlertCircle className="h-4 w-4 text-yellow-700" />
          <AlertTitle className="text-yellow-800">Unsaved Changes</AlertTitle>
          <AlertDescription className="text-yellow-700">
            You have unsaved changes. Click "Save Changes" to apply them.
          </AlertDescription>
        </Alert>
      )}

      {/* Restaurant Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <CardTitle>Restaurant Information</CardTitle>
          </div>
          <CardDescription>Basic information about your restaurant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
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
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => {
                    updateFormData({ phone_number: e.target.value });
                    if (formErrors.phone_number)
                      setFormErrors((prev) => ({ ...prev, phone_number: undefined }));
                  }}
                  placeholder="+15551234567"
                  className={`pl-9 ${formErrors.phone_number ? "border-destructive" : ""}`}
                />
              </div>
              {formErrors.phone_number && (
                <p className="text-xs text-destructive">{formErrors.phone_number}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">
              Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => {
                  updateFormData({ address: e.target.value });
                  if (formErrors.address)
                    setFormErrors((prev) => ({ ...prev, address: undefined }));
                }}
                placeholder="123 Main St, City, State"
                className={`pl-9 ${formErrors.address ? "border-destructive" : ""}`}
              />
            </div>
            {formErrors.address && <p className="text-xs text-destructive">{formErrors.address}</p>}
          </div>

          {/* Twilio Phone (Read-only) */}
          {formData.twilio_phone_number && (
            <div className="space-y-2">
              <Label htmlFor="twilio_phone">
                Twilio Phone Number{" "}
                <span className="text-xs text-muted-foreground">(Read-only)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="twilio_phone"
                  value={formData.twilio_phone_number}
                  readOnly
                  disabled
                  className="pl-9 bg-muted cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This is your AI assistant's phone number. Contact support to change it.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Operating Hours</CardTitle>
          </div>
          <CardDescription>Set your restaurant's opening and closing times</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opening_time">Opening Time</Label>
              <Input
                id="opening_time"
                type="time"
                value={formData.opening_time}
                onChange={(e) => updateFormData({ opening_time: e.target.value })}
              />
              {formErrors.opening_time && (
                <p className="text-xs text-destructive">{formErrors.opening_time}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing_time">Closing Time</Label>
              <Input
                id="closing_time"
                type="time"
                value={formData.closing_time}
                onChange={(e) => updateFormData({ closing_time: e.target.value })}
              />
              {formErrors.closing_time && (
                <p className="text-xs text-destructive">{formErrors.closing_time}</p>
              )}
            </div>
          </div>
          {formData.opening_time && formData.closing_time && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                Open from {formData.opening_time} to {formData.closing_time}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reservation Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            <CardTitle>Reservation Settings</CardTitle>
          </div>
          <CardDescription>Configure reservation booking and cancellation windows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="forward_minutes">
                Forward Window (minutes)
                <span className="text-xs text-muted-foreground ml-2">Booking ahead</span>
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
                className={formErrors.forward_minutes ? "border-destructive" : ""}
              />
              {formErrors.forward_minutes ? (
                <p className="text-xs text-destructive">{formErrors.forward_minutes}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Customers can book up to {formData.forward_minutes} minutes ahead
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="backward_minutes">
                Backward Window (minutes)
                <span className="text-xs text-muted-foreground ml-2">Cancellation</span>
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
                className={formErrors.backward_minutes ? "border-destructive" : ""}
              />
              {formErrors.backward_minutes ? (
                <p className="text-xs text-destructive">{formErrors.backward_minutes}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Cancellations allowed up to {formData.backward_minutes} minutes before
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Credit Card Requirement */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="credit_card" className="text-sm font-medium cursor-pointer">
                  Credit Card Required for Reservations
                </Label>
                <p className="text-xs text-muted-foreground">
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
            />
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      {originalData && (
        <p className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(originalData.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default Settings;
