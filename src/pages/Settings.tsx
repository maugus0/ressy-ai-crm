/**
 * Settings Page
 * Manage restaurant settings and information
 * Integrates with GET/PUT /api/v1/client/restaurant
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PhoneInput } from "@/components/ui/phone-input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Sun,
  Lock,
  Link,
  MessageSquare,
  Eye,
  ChevronDown,
  ChevronUp,
  Power,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  RestaurantKillSwitchError,
  getRestaurant,
  updateRestaurant,
  updateRestaurantKillSwitch,
} from "@/services/restaurant";
import { formatLocalDateTime, VANCOUVER_TIMEZONE } from "@/lib/utils/timezone";
import { DAYS_OF_WEEK, DAY_LABELS, type DayOfWeek } from "@/lib/utils/time";
import type {
  ClientRestaurant,
  ClientRestaurantUpdateRequest,
  OperatingHours,
  SMSRedirectConfig,
} from "@/types/api.types";

// Phone number validation regex (E.164 format)
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

// URL validation regex (requires http:// or https:// and a basic valid structure)
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

// Max length for custom SMS message (instruction text only; backend adds URL + signature)
const SMS_MESSAGE_MAX_LENGTH = 500;

// Default SMS redirect messages (instruction text only; URL and signature are added by the backend)
const DEFAULT_ORDERS_SMS_MESSAGE = "Please place your order using the link below.";

const DEFAULT_RESERVATIONS_SMS_MESSAGE = "Please make your reservation using the link below.";

const KILL_SWITCH_BLOCKER_MESSAGES: Record<string, string> = {
  forward_escalations_disabled: "Escalation forwarding is currently disabled.",
  escalation_phone_number_missing: "Escalation phone number is not configured.",
};

// Default SMS redirect config
const DEFAULT_SMS_REDIRECT_CONFIG: SMSRedirectConfig = {
  enabled: false,
  redirect_url: null,
  redirect_message: null,
};

// Default operating hours for initialization (when API returns null we still need display values)
const DEFAULT_OPERATING_HOURS: OperatingHours = {
  monday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
  tuesday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
  wednesday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
  thursday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
  friday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
  saturday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
  sunday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
};

/** Props for the shared SMS Redirect URL + message + preview block */
interface SmsRedirectConfigFieldsProps {
  urlInputId: string;
  messageInputId: string;
  previewContentId: string;
  redirectUrl: string;
  redirectMessage: string;
  redirectUrlError?: string;
  redirectMessageError?: string;
  defaultMessagePlaceholder: string;
  urlPlaceholder: string;
  urlHelpText: string;
  showPreview: boolean;
  onTogglePreview: () => void;
  onRedirectUrlChange: (value: string) => void;
  onRedirectMessageChange: (value: string) => void;
  onClearUrlError: () => void;
  maxMessageLength: number;
  previewContent: string;
}

/** Shared UI for SMS Redirect: URL input, custom message textarea, and SMS Preview. */
function SmsRedirectConfigFields({
  urlInputId,
  messageInputId,
  previewContentId,
  redirectUrl,
  redirectMessage,
  redirectUrlError,
  redirectMessageError,
  defaultMessagePlaceholder,
  urlPlaceholder,
  urlHelpText,
  showPreview,
  onTogglePreview,
  onRedirectUrlChange,
  onRedirectMessageChange,
  onClearUrlError,
  maxMessageLength,
  previewContent,
}: SmsRedirectConfigFieldsProps) {
  return (
    <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={urlInputId} className="text-xs sm:text-sm">
          Redirect URL <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Link className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            id={urlInputId}
            type="url"
            value={redirectUrl}
            onChange={(e) => {
              onRedirectUrlChange(e.target.value);
              onClearUrlError();
            }}
            placeholder={urlPlaceholder}
            className={`pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm ${
              redirectUrlError ? "border-destructive" : ""
            }`}
          />
        </div>
        {redirectUrlError ? (
          <p className="text-[10px] sm:text-xs text-destructive">{redirectUrlError}</p>
        ) : (
          <p className="text-[10px] sm:text-xs text-muted-foreground">{urlHelpText}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={messageInputId} className="text-xs sm:text-sm">
          Custom SMS Message <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id={messageInputId}
          value={redirectMessage}
          onChange={(e) => onRedirectMessageChange(e.target.value)}
          placeholder={defaultMessagePlaceholder}
          rows={4}
          maxLength={maxMessageLength}
          className={`text-xs sm:text-sm resize-none ${
            redirectMessageError ? "border-destructive" : ""
          }`}
        />
        <div className="flex justify-between items-start gap-2">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Optional. Customize the instruction text customers see in the SMS. Leave blank to use
            the default message. The link and signature are added automatically.
          </p>
          <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
            {redirectMessage.length}/{maxMessageLength}
          </span>
        </div>
        {redirectMessageError && (
          <p className="text-[10px] sm:text-xs text-destructive">{redirectMessageError}</p>
        )}
      </div>

      {/* SMS Preview */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={onTogglePreview}
          aria-expanded={showPreview}
          aria-controls={previewContentId}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          SMS Preview
          {showPreview ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        {showPreview && (
          <div id={previewContentId} className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                SMS Preview
              </span>
            </div>
            <p className="text-xs sm:text-sm whitespace-pre-wrap font-mono bg-background p-2 rounded border">
              {previewContent}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Form validation errors interface
interface FormErrors {
  name?: string;
  address?: string;
  phone_number?: string;
  forward_minutes?: string;
  backward_minutes?: string;
  reservation_seating_capacity?: string;
  reservation_advance_days?: string;
  orders_sms_redirect_url?: string;
  reservations_sms_redirect_url?: string;
  orders_sms_redirect_message?: string;
  reservations_sms_redirect_message?: string;
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
  // SMS Redirect for Orders
  orders_sms_redirect_enabled: boolean;
  orders_sms_redirect_url: string;
  orders_sms_redirect_message: string;
  // SMS Redirect for Reservations
  reservations_sms_redirect_enabled: boolean;
  reservations_sms_redirect_url: string;
  reservations_sms_redirect_message: string;
}

export function Settings() {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<ClientRestaurant | null>(null);

  // Track operating hours: only send in PUT when backend had them set or user edited them
  const operatingHoursWereNull = useRef(false);
  const hasUserEditedOperatingHours = useRef(false);

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
    // SMS Redirect defaults
    orders_sms_redirect_enabled: false,
    orders_sms_redirect_url: "",
    orders_sms_redirect_message: "",
    reservations_sms_redirect_enabled: false,
    reservations_sms_redirect_url: "",
    reservations_sms_redirect_message: "",
  });

  // SMS Redirect message preview expansion states
  const [showOrdersMessagePreview, setShowOrdersMessagePreview] = useState(false);
  const [showReservationsMessagePreview, setShowReservationsMessagePreview] = useState(false);
  const [isKillSwitchDialogOpen, setIsKillSwitchDialogOpen] = useState(false);
  const [killSwitchTargetEnabled, setKillSwitchTargetEnabled] = useState<boolean | null>(null);
  const [killSwitchConfirmText, setKillSwitchConfirmText] = useState("");
  const [killSwitchSubmitting, setKillSwitchSubmitting] = useState(false);
  const [killSwitchError, setKillSwitchError] = useState<string | null>(null);
  const [killSwitchActionBlockers, setKillSwitchActionBlockers] = useState<string[]>([]);

  /**
   * Format time from HH:MM:SS to HH:MM for input fields
   */
  const formatTimeForInputLocal = (time: string | null | undefined): string => {
    if (!time) return "";
    return time.slice(0, 5); // "09:00:00" -> "09:00"
  };

  /**
   * Format time from HH:MM to HH:MM:SS for API.
   * Returns null for empty/whitespace so operating_hours.*.open/close stay null when unset (API type string | null).
   */
  const formatTimeForApiLocal = (time: string | null | undefined): string | null => {
    if (time == null) return null;
    const trimmed = time.trim();
    if (!trimmed) return null;
    if (trimmed.length === 5) return `${trimmed}:00`; // "09:00" -> "09:00:00"
    return trimmed;
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

    hasUserEditedOperatingHours.current = true;
    updateFormData({ operating_hours: newOperatingHours });
    toast.success(`Copied ${DAY_LABELS[sourceDay]}'s hours to all days`);
  };

  /**
   * Update a specific day's hours
   */
  const updateDayHours = (
    day: DayOfWeek,
    field: "open" | "close" | "is_closed" | "is_24_hours",
    value: string | boolean | null
  ) => {
    hasUserEditedOperatingHours.current = true;

    const currentDayHours = formData.operating_hours[day];
    const updatedDayHours = { ...currentDayHours, [field]: value };

    // Handle mutual exclusivity: is_closed and is_24_hours cannot both be true
    if (field === "is_closed" && value === true) {
      updatedDayHours.is_24_hours = false;
    } else if (field === "is_24_hours" && value === true) {
      updatedDayHours.is_closed = false;
    }

    updateFormData({
      operating_hours: {
        ...formData.operating_hours,
        [day]: updatedDayHours,
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
        dayHours.is_closed === firstDay.is_closed &&
        dayHours.is_24_hours === firstDay.is_24_hours
      );
    });
  };

  /**
   * Set all days to 24-hour operation
   */
  const setAll24Hours = () => {
    hasUserEditedOperatingHours.current = true;
    const newOperatingHours = { ...formData.operating_hours };

    DAYS_OF_WEEK.forEach((day) => {
      newOperatingHours[day] = {
        ...newOperatingHours[day],
        is_24_hours: true,
        is_closed: false,
      };
    });

    updateFormData({ operating_hours: newOperatingHours });
    toast.success("All days set to 24-hour operation");
  };

  // Fetch restaurant data
  const fetchRestaurant = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getRestaurant();
      setOriginalData(data);
      operatingHoursWereNull.current = data.operating_hours == null;
      hasUserEditedOperatingHours.current = false;

      // Normalize operating hours with is_24_hours default
      let normalizedOperatingHours = DEFAULT_OPERATING_HOURS;
      if (data.operating_hours) {
        normalizedOperatingHours = {} as OperatingHours;
        DAYS_OF_WEEK.forEach((day) => {
          const dayHours = data.operating_hours![day];
          normalizedOperatingHours[day] = {
            open: dayHours.open,
            close: dayHours.close,
            is_closed: dayHours.is_closed,
            is_24_hours: dayHours.is_24_hours ?? false,
          };
        });
      }

      // Extract SMS redirect configs with defaults
      const ordersSmsRedirect = data.features?.orders_sms_redirect ?? DEFAULT_SMS_REDIRECT_CONFIG;
      const reservationsSmsRedirect =
        data.features?.reservations_sms_redirect ?? DEFAULT_SMS_REDIRECT_CONFIG;

      setFormData({
        name: data.name,
        address: data.address,
        phone_number: data.phone_number,
        twilio_phone_number: data.twilio_phone_number || "",
        forward_minutes: data.forward_minutes,
        backward_minutes: data.backward_minutes,
        is_credit_card_required_for_reservation: data.is_credit_card_required_for_reservation,
        // Use defaults for display when API returns null so the form is editable; only send on save if user edited
        operating_hours: normalizedOperatingHours,
        reservation_seating_capacity: data.reservation_seating_capacity ?? 50,
        reservation_advance_days: data.reservation_advance_days ?? 30,
        features_orders_enabled: data.features?.orders_enabled ?? true,
        features_reservations_enabled: data.features?.reservations_enabled ?? true,
        features_faqs_enabled: true, // Always enabled for agent functionality
        // SMS Redirect for Orders
        orders_sms_redirect_enabled: ordersSmsRedirect.enabled,
        orders_sms_redirect_url: ordersSmsRedirect.redirect_url || "",
        orders_sms_redirect_message: ordersSmsRedirect.redirect_message || "",
        // SMS Redirect for Reservations
        reservations_sms_redirect_enabled: reservationsSmsRedirect.enabled,
        reservations_sms_redirect_url: reservationsSmsRedirect.redirect_url || "",
        reservations_sms_redirect_message: reservationsSmsRedirect.redirect_message || "",
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
      // FAQs must always be enabled; ignore any attempt to change it
      const { features_faqs_enabled: _faq, ...rest } = updates;
      const newData = { ...prev, ...rest, features_faqs_enabled: true };

      // Handle mutual exclusivity: SMS redirect requires direct handling to be disabled
      // When enabling direct orders, disable SMS redirect for orders
      if (updates.features_orders_enabled === true) {
        newData.orders_sms_redirect_enabled = false;
      }
      // When enabling SMS redirect for orders, disable direct orders
      if (updates.orders_sms_redirect_enabled === true) {
        newData.features_orders_enabled = false;
      }
      // When enabling direct reservations, disable SMS redirect for reservations
      if (updates.features_reservations_enabled === true) {
        newData.reservations_sms_redirect_enabled = false;
      }
      // When enabling SMS redirect for reservations, disable direct reservations
      if (updates.reservations_sms_redirect_enabled === true) {
        newData.features_reservations_enabled = false;
      }

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
            newDay.is_closed !== origDay.is_closed ||
            newDay.is_24_hours !== (origDay.is_24_hours ?? false)
          );
        });

        // Get original SMS redirect configs
        const origOrdersSmsRedirect =
          originalData.features?.orders_sms_redirect ?? DEFAULT_SMS_REDIRECT_CONFIG;
        const origReservationsSmsRedirect =
          originalData.features?.reservations_sms_redirect ?? DEFAULT_SMS_REDIRECT_CONFIG;

        // Check if SMS redirect settings have changed
        const ordersSmsRedirectChanged =
          newData.orders_sms_redirect_enabled !== origOrdersSmsRedirect.enabled ||
          newData.orders_sms_redirect_url !== (origOrdersSmsRedirect.redirect_url || "") ||
          newData.orders_sms_redirect_message !== (origOrdersSmsRedirect.redirect_message || "");

        const reservationsSmsRedirectChanged =
          newData.reservations_sms_redirect_enabled !== origReservationsSmsRedirect.enabled ||
          newData.reservations_sms_redirect_url !==
            (origReservationsSmsRedirect.redirect_url || "") ||
          newData.reservations_sms_redirect_message !==
            (origReservationsSmsRedirect.redirect_message || "");

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
          ordersSmsRedirectChanged ||
          reservationsSmsRedirectChanged;
        // FAQs are always on and not user-changeable, so we don't include them in hasChanges
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

    // SMS Redirect validation (when enabled)
    if (formData.orders_sms_redirect_enabled) {
      if (!formData.orders_sms_redirect_url.trim()) {
        errors.orders_sms_redirect_url = "URL is required when SMS redirect is enabled";
      } else if (!URL_REGEX.test(formData.orders_sms_redirect_url.trim())) {
        errors.orders_sms_redirect_url =
          "Please enter a valid URL (must start with http:// or https://)";
      }
      if (formData.orders_sms_redirect_message.length > SMS_MESSAGE_MAX_LENGTH) {
        errors.orders_sms_redirect_message = `Custom message must be ${SMS_MESSAGE_MAX_LENGTH} characters or less`;
      }
    }

    if (formData.reservations_sms_redirect_enabled) {
      if (!formData.reservations_sms_redirect_url.trim()) {
        errors.reservations_sms_redirect_url = "URL is required when SMS redirect is enabled";
      } else if (!URL_REGEX.test(formData.reservations_sms_redirect_url.trim())) {
        errors.reservations_sms_redirect_url =
          "Please enter a valid URL (must start with http:// or https://)";
      }
      if (formData.reservations_sms_redirect_message.length > SMS_MESSAGE_MAX_LENGTH) {
        errors.reservations_sms_redirect_message = `Custom message must be ${SMS_MESSAGE_MAX_LENGTH} characters or less`;
      }
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
        reservation_seating_capacity: formData.reservation_seating_capacity,
        reservation_advance_days: formData.reservation_advance_days,
        features: {
          orders_enabled: formData.features_orders_enabled,
          reservations_enabled: formData.features_reservations_enabled,
          faqs_enabled: true, // Always enabled for agent functionality
          orders_sms_redirect: {
            enabled: formData.orders_sms_redirect_enabled,
            redirect_url: formData.orders_sms_redirect_enabled
              ? formData.orders_sms_redirect_url.trim() || null
              : null,
            redirect_message: formData.orders_sms_redirect_enabled
              ? formData.orders_sms_redirect_message.trim() || null
              : null,
          },
          reservations_sms_redirect: {
            enabled: formData.reservations_sms_redirect_enabled,
            redirect_url: formData.reservations_sms_redirect_enabled
              ? formData.reservations_sms_redirect_url.trim() || null
              : null,
            redirect_message: formData.reservations_sms_redirect_enabled
              ? formData.reservations_sms_redirect_message.trim() || null
              : null,
          },
        },
      };
      // Only include operating_hours when backend already had them or user edited the section
      if (!operatingHoursWereNull.current || hasUserEditedOperatingHours.current) {
        payload.operating_hours = formData.operating_hours;
      }

      const updatedData = await updateRestaurant(payload);
      setOriginalData(updatedData);
      operatingHoursWereNull.current = updatedData.operating_hours == null;
      hasUserEditedOperatingHours.current = false;

      // Normalize operating hours with is_24_hours default
      let normalizedOperatingHours = DEFAULT_OPERATING_HOURS;
      if (updatedData.operating_hours) {
        normalizedOperatingHours = {} as OperatingHours;
        DAYS_OF_WEEK.forEach((day) => {
          const dayHours = updatedData.operating_hours![day];
          normalizedOperatingHours[day] = {
            open: dayHours.open,
            close: dayHours.close,
            is_closed: dayHours.is_closed,
            is_24_hours: dayHours.is_24_hours ?? false,
          };
        });
      }

      // Extract updated SMS redirect configs
      const updatedOrdersSmsRedirect =
        updatedData.features?.orders_sms_redirect ?? DEFAULT_SMS_REDIRECT_CONFIG;
      const updatedReservationsSmsRedirect =
        updatedData.features?.reservations_sms_redirect ?? DEFAULT_SMS_REDIRECT_CONFIG;

      setFormData({
        name: updatedData.name,
        address: updatedData.address,
        phone_number: updatedData.phone_number,
        twilio_phone_number: updatedData.twilio_phone_number || "",
        forward_minutes: updatedData.forward_minutes,
        backward_minutes: updatedData.backward_minutes,
        is_credit_card_required_for_reservation:
          updatedData.is_credit_card_required_for_reservation,
        operating_hours: normalizedOperatingHours,
        reservation_seating_capacity: updatedData.reservation_seating_capacity ?? 50,
        reservation_advance_days: updatedData.reservation_advance_days ?? 30,
        features_orders_enabled: updatedData.features?.orders_enabled ?? true,
        features_reservations_enabled: updatedData.features?.reservations_enabled ?? true,
        features_faqs_enabled: true, // Always enabled for agent functionality
        // SMS Redirect for Orders
        orders_sms_redirect_enabled: updatedOrdersSmsRedirect.enabled,
        orders_sms_redirect_url: updatedOrdersSmsRedirect.redirect_url || "",
        orders_sms_redirect_message: updatedOrdersSmsRedirect.redirect_message || "",
        // SMS Redirect for Reservations
        reservations_sms_redirect_enabled: updatedReservationsSmsRedirect.enabled,
        reservations_sms_redirect_url: updatedReservationsSmsRedirect.redirect_url || "",
        reservations_sms_redirect_message: updatedReservationsSmsRedirect.redirect_message || "",
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
      // Normalize operating hours with is_24_hours default
      let normalizedOperatingHours = DEFAULT_OPERATING_HOURS;
      if (originalData.operating_hours) {
        normalizedOperatingHours = {} as OperatingHours;
        DAYS_OF_WEEK.forEach((day) => {
          const dayHours = originalData.operating_hours![day];
          normalizedOperatingHours[day] = {
            open: dayHours.open,
            close: dayHours.close,
            is_closed: dayHours.is_closed,
            is_24_hours: dayHours.is_24_hours ?? false,
          };
        });
      }

      // Extract SMS redirect configs
      const ordersSmsRedirect =
        originalData.features?.orders_sms_redirect ?? DEFAULT_SMS_REDIRECT_CONFIG;
      const reservationsSmsRedirect =
        originalData.features?.reservations_sms_redirect ?? DEFAULT_SMS_REDIRECT_CONFIG;

      setFormData({
        name: originalData.name,
        address: originalData.address,
        phone_number: originalData.phone_number,
        twilio_phone_number: originalData.twilio_phone_number || "",
        forward_minutes: originalData.forward_minutes,
        backward_minutes: originalData.backward_minutes,
        is_credit_card_required_for_reservation:
          originalData.is_credit_card_required_for_reservation,
        operating_hours: normalizedOperatingHours,
        reservation_seating_capacity: originalData.reservation_seating_capacity ?? 50,
        reservation_advance_days: originalData.reservation_advance_days ?? 30,
        features_orders_enabled: originalData.features?.orders_enabled ?? true,
        features_reservations_enabled: originalData.features?.reservations_enabled ?? true,
        features_faqs_enabled: true, // Always enabled for agent functionality
        // SMS Redirect for Orders
        orders_sms_redirect_enabled: ordersSmsRedirect.enabled,
        orders_sms_redirect_url: ordersSmsRedirect.redirect_url || "",
        orders_sms_redirect_message: ordersSmsRedirect.redirect_message || "",
        // SMS Redirect for Reservations
        reservations_sms_redirect_enabled: reservationsSmsRedirect.enabled,
        reservations_sms_redirect_url: reservationsSmsRedirect.redirect_url || "",
        reservations_sms_redirect_message: reservationsSmsRedirect.redirect_message || "",
      });
      setFormErrors({});
      setHasChanges(false);
      hasUserEditedOperatingHours.current = false;
      toast.info("Changes discarded");
    }
  };

  /**
   * Generate SMS message preview in the same format as the backend:
   * Hello. + instruction text + URL + signature (URL and signature are always appended by backend)
   */
  const getSmsMessagePreview = (
    type: "orders" | "reservations",
    restaurantName: string
  ): string => {
    const isOrders = type === "orders";
    const instructionText = isOrders
      ? formData.orders_sms_redirect_message.trim() || DEFAULT_ORDERS_SMS_MESSAGE
      : formData.reservations_sms_redirect_message.trim() || DEFAULT_RESERVATIONS_SMS_MESSAGE;
    const url = isOrders
      ? formData.orders_sms_redirect_url.trim() || "https://your-link-here.com"
      : formData.reservations_sms_redirect_url.trim() || "https://your-link-here.com";

    return `Hello.\n${instructionText}\n\n${url}\n\nYours sincerely,\n${restaurantName} via Ressy AI`;
  };

  const formatKillSwitchBlocker = (blocker: string): string =>
    KILL_SWITCH_BLOCKER_MESSAGES[blocker] || "Escalation forwarding is not fully configured.";

  const openKillSwitchConfirmation = (enabled: boolean) => {
    setKillSwitchTargetEnabled(enabled);
    setKillSwitchConfirmText("");
    setKillSwitchError(null);
    setKillSwitchActionBlockers([]);
    setIsKillSwitchDialogOpen(true);
  };

  const handleKillSwitchConfirm = async () => {
    if (killSwitchTargetEnabled === null) {
      return;
    }

    if (killSwitchTargetEnabled && killSwitchConfirmText.trim().toUpperCase() !== "DISABLE") {
      setKillSwitchError("Type DISABLE to confirm this action.");
      return;
    }

    setKillSwitchSubmitting(true);
    setKillSwitchError(null);
    setKillSwitchActionBlockers([]);

    try {
      const updatedRestaurant = await updateRestaurantKillSwitch({
        enabled: killSwitchTargetEnabled,
      });
      setOriginalData(updatedRestaurant);
      setIsKillSwitchDialogOpen(false);
      setKillSwitchConfirmText("");
      toast.success(
        killSwitchTargetEnabled
          ? "Ressy AI has been disabled. Incoming calls will route to staff."
          : "Ressy AI has been re-enabled."
      );
    } catch (err) {
      if (err instanceof RestaurantKillSwitchError) {
        setKillSwitchError(err.message);
        setKillSwitchActionBlockers(err.killSwitchBlockers);
      } else {
        setKillSwitchError("Failed to update kill switch. Please try again.");
      }
    } finally {
      setKillSwitchSubmitting(false);
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
  const killSwitchEnabled = originalData?.kill_switch_enabled ?? false;
  const killSwitchCanRedirect = originalData?.kill_switch_can_redirect ?? false;
  const killSwitchBlockers = originalData?.kill_switch_blockers ?? [];

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

      <Card
        className={`border-2 ${
          killSwitchEnabled
            ? "border-destructive/40 bg-destructive/5"
            : "border-destructive/20 bg-destructive/5"
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <Power className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold">Emergency Control</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Disable Ressy AI to route incoming calls directly to your escalation staff line.
                </p>
              </div>
            </div>
            <Badge
              variant={killSwitchEnabled ? "destructive" : "secondary"}
              className="w-fit text-[10px] sm:text-xs uppercase tracking-wide"
            >
              {killSwitchEnabled ? "RessyAI Disabled" : "RessyAI Active"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {killSwitchEnabled ? (
            <Alert className="border-destructive/30 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertTitle className="text-xs sm:text-sm text-foreground">
                Ressy AI is currently disabled
              </AlertTitle>
              <AlertDescription className="text-xs sm:text-sm text-muted-foreground">
                Calls are bypassing AI handling and are being forwarded to staff.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-destructive/20 bg-background">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertTitle className="text-xs sm:text-sm text-foreground">
                High-impact operational switch
              </AlertTitle>
              <AlertDescription className="text-xs sm:text-sm text-muted-foreground">
                Use this only during incidents. This immediately bypasses the AI receptionist for
                incoming calls.
              </AlertDescription>
            </Alert>
          )}

          {!killSwitchCanRedirect && killSwitchBlockers.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-xs sm:text-sm">Kill switch is not ready</AlertTitle>
              <AlertDescription className="space-y-1.5 text-xs sm:text-sm">
                {killSwitchBlockers.map((blocker) => (
                  <p key={blocker}>{formatKillSwitchBlocker(blocker)}</p>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {hasChanges && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Save or discard unsaved settings before changing emergency control.
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {killSwitchEnabled ? (
              <Button
                variant="outline"
                onClick={() => openKillSwitchConfirmation(false)}
                disabled={killSwitchSubmitting || hasChanges}
                className="w-full sm:w-auto"
              >
                {killSwitchSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Re-enable RessyAI"
                )}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => openKillSwitchConfirmation(true)}
                disabled={killSwitchSubmitting || hasChanges || !killSwitchCanRedirect}
                className="w-full sm:w-auto"
              >
                {killSwitchSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Disable RessyAI"
                )}
              </Button>
            )}
            {!killSwitchEnabled && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Escalation line:{" "}
                <span className="font-mono">{escalationPhoneNumber || "Not configured"}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
            <div className="flex flex-wrap gap-2">
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
              <Button variant="outline" size="sm" onClick={setAll24Hours} className="h-7 text-xs">
                <Sun className="h-3 w-3 mr-1.5" />
                Set All 24 Hours
              </Button>
            </div>
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

                  {/* Status Toggles */}
                  <div className="flex items-center gap-3 sm:min-w-[180px]">
                    {/* Closed Toggle */}
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={dayHours.is_closed}
                        onCheckedChange={(checked) => {
                          updateDayHours(day, "is_closed", checked);
                        }}
                        className="scale-75 sm:scale-100"
                      />
                      <span className="text-[10px] sm:text-xs text-muted-foreground">Closed</span>
                    </div>

                    {/* 24 Hours Toggle - Only show if not closed */}
                    {!dayHours.is_closed && (
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={dayHours.is_24_hours}
                          onCheckedChange={(checked) => {
                            updateDayHours(day, "is_24_hours", checked);
                          }}
                          className="scale-75 sm:scale-100"
                        />
                        <span className="text-[10px] sm:text-xs text-muted-foreground">24h</span>
                      </div>
                    )}
                  </div>

                  {/* Hours Display/Input */}
                  <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    {dayHours.is_closed ? (
                      <span className="text-xs sm:text-sm text-red-500 font-medium">Closed</span>
                    ) : dayHours.is_24_hours ? (
                      <span className="text-xs sm:text-sm text-green-600 font-medium flex items-center gap-1">
                        <Sun className="h-3.5 w-3.5" />
                        Open 24 hours
                      </span>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>

                  {/* Copy Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToAllDays(day)}
                    className="h-7 w-7 shrink-0 ml-auto sm:ml-0"
                    title={`Copy ${DAY_LABELS[day]}'s hours to all days`}
                    aria-label={`Copy ${DAY_LABELS[day]}'s hours to all days`}
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
            const twentyFourHourDays = DAYS_OF_WEEK.filter(
              (day) =>
                formData.operating_hours[day].is_24_hours &&
                !formData.operating_hours[day].is_closed
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
                  {twentyFourHourDays.length > 0 && (
                    <p className="text-[10px] sm:text-xs flex items-center gap-1">
                      <Sun className="h-3 w-3 text-green-600 dark:text-green-400" />
                      24 hours:{" "}
                      {twentyFourHourDays.map((day) => DAY_LABELS[day].slice(0, 3)).join(", ")}
                    </p>
                  )}
                  {closedDays.length > 0 && (
                    <p className="text-[10px] sm:text-xs">
                      Closed on: {closedDays.map((day) => DAY_LABELS[day]).join(", ")}
                    </p>
                  )}
                  {allDaysSame() &&
                    openDays.length === 7 &&
                    !formData.operating_hours.monday.is_24_hours && (
                      <p className="text-[10px] sm:text-xs">
                        Same hours every day:{" "}
                        {formatTimeForInputLocal(formData.operating_hours.monday.open)} -{" "}
                        {formatTimeForInputLocal(formData.operating_hours.monday.close)}
                      </p>
                    )}
                  {allDaysSame() &&
                    openDays.length === 7 &&
                    formData.operating_hours.monday.is_24_hours && (
                      <p className="text-[10px] sm:text-xs flex items-center gap-1">
                        <Sun className="h-3 w-3" />
                        Open 24 hours every day
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
                Disabling a capability will route those requests to your staff. Enable SMS Redirect
                to send customers a link instead of processing requests directly.
              </p>
            </div>

            {/* ==================== ORDERS SECTION ==================== */}
            <div className="rounded-lg border overflow-hidden">
              {/* Orders (Direct) Toggle */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                    <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <Label
                      htmlFor="orders_enabled"
                      className="text-xs sm:text-sm font-medium cursor-pointer block"
                    >
                      Pickup Orders (Direct)
                    </Label>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Allow RessyAI to take and manage pickup orders directly
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {formData.features_orders_enabled && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  )}
                  <Switch
                    id="orders_enabled"
                    checked={formData.features_orders_enabled}
                    onCheckedChange={(checked) =>
                      updateFormData({ features_orders_enabled: checked })
                    }
                    disabled={formData.orders_sms_redirect_enabled}
                    className="shrink-0"
                  />
                </div>
              </div>

              {/* Orders SMS Redirect Sub-section */}
              <div className="border-t bg-muted/10">
                <div className="flex items-center justify-between p-3 sm:p-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10 shrink-0">
                      <Link className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <Label
                        htmlFor="orders_sms_redirect"
                        className="text-xs sm:text-sm font-medium cursor-pointer block flex items-center gap-1.5"
                      >
                        SMS Redirect for Orders
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label="Learn more about SMS redirect for orders"
                              className="inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[280px]">
                            <p>
                              Instead of RessyAI processing orders, customers receive an SMS with a
                              link to your online ordering platform.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Send customers an SMS with your online ordering link
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.orders_sms_redirect_enabled && (
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Active
                      </span>
                    )}
                    <Switch
                      id="orders_sms_redirect"
                      checked={formData.orders_sms_redirect_enabled}
                      onCheckedChange={(checked) => {
                        // Clear URL validation error when disabling
                        if (!checked) {
                          setFormErrors((prev) => ({
                            ...prev,
                            orders_sms_redirect_url: undefined,
                          }));
                        }
                        updateFormData({ orders_sms_redirect_enabled: checked });
                      }}
                      disabled={formData.features_orders_enabled}
                      className="shrink-0"
                    />
                  </div>
                </div>

                {/* SMS Redirect Configuration (shown when enabled) */}
                {formData.orders_sms_redirect_enabled && (
                  <SmsRedirectConfigFields
                    urlInputId="orders_redirect_url"
                    messageInputId="orders_redirect_message"
                    previewContentId="orders-sms-preview"
                    redirectUrl={formData.orders_sms_redirect_url}
                    redirectMessage={formData.orders_sms_redirect_message}
                    redirectUrlError={formErrors.orders_sms_redirect_url}
                    redirectMessageError={formErrors.orders_sms_redirect_message}
                    defaultMessagePlaceholder={DEFAULT_ORDERS_SMS_MESSAGE}
                    urlPlaceholder="https://order.yourrestaurant.com"
                    urlHelpText="URL to your online ordering platform (must start with http:// or https://)"
                    showPreview={showOrdersMessagePreview}
                    onTogglePreview={() => setShowOrdersMessagePreview(!showOrdersMessagePreview)}
                    onRedirectUrlChange={(value) =>
                      updateFormData({ orders_sms_redirect_url: value })
                    }
                    onRedirectMessageChange={(value) => {
                      updateFormData({ orders_sms_redirect_message: value });
                      if (formErrors.orders_sms_redirect_message) {
                        setFormErrors((prev) => ({
                          ...prev,
                          orders_sms_redirect_message: undefined,
                        }));
                      }
                    }}
                    onClearUrlError={() =>
                      setFormErrors((prev) => ({ ...prev, orders_sms_redirect_url: undefined }))
                    }
                    maxMessageLength={SMS_MESSAGE_MAX_LENGTH}
                    previewContent={getSmsMessagePreview(
                      "orders",
                      formData.name || "Your Restaurant"
                    )}
                  />
                )}
              </div>
            </div>

            {/* ==================== RESERVATIONS SECTION ==================== */}
            <div className="rounded-lg border overflow-hidden">
              {/* Reservations (Direct) Toggle */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                    <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <Label
                      htmlFor="reservations_enabled"
                      className="text-xs sm:text-sm font-medium cursor-pointer block"
                    >
                      Reservations (Direct)
                    </Label>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Allow RessyAI to book and manage table reservations directly
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {formData.features_reservations_enabled && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  )}
                  <Switch
                    id="reservations_enabled"
                    checked={formData.features_reservations_enabled}
                    onCheckedChange={(checked) =>
                      updateFormData({ features_reservations_enabled: checked })
                    }
                    disabled={formData.reservations_sms_redirect_enabled}
                    className="shrink-0"
                  />
                </div>
              </div>

              {/* Reservations SMS Redirect Sub-section */}
              <div className="border-t bg-muted/10">
                <div className="flex items-center justify-between p-3 sm:p-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10 shrink-0">
                      <Link className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <Label
                        htmlFor="reservations_sms_redirect"
                        className="text-xs sm:text-sm font-medium cursor-pointer block flex items-center gap-1.5"
                      >
                        SMS Redirect for Reservations
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label="Learn more about SMS redirect for reservations"
                              className="inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[280px]">
                            <p>
                              Instead of RessyAI booking reservations, customers receive an SMS with
                              a link to your reservation platform.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Send customers an SMS with your reservation platform link
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.reservations_sms_redirect_enabled && (
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Active
                      </span>
                    )}
                    <Switch
                      id="reservations_sms_redirect"
                      checked={formData.reservations_sms_redirect_enabled}
                      onCheckedChange={(checked) => {
                        // Clear URL validation error when disabling
                        if (!checked) {
                          setFormErrors((prev) => ({
                            ...prev,
                            reservations_sms_redirect_url: undefined,
                          }));
                        }
                        updateFormData({ reservations_sms_redirect_enabled: checked });
                      }}
                      disabled={formData.features_reservations_enabled}
                      className="shrink-0"
                    />
                  </div>
                </div>

                {/* SMS Redirect Configuration (shown when enabled) */}
                {formData.reservations_sms_redirect_enabled && (
                  <SmsRedirectConfigFields
                    urlInputId="reservations_redirect_url"
                    messageInputId="reservations_redirect_message"
                    previewContentId="reservations-sms-preview"
                    redirectUrl={formData.reservations_sms_redirect_url}
                    redirectMessage={formData.reservations_sms_redirect_message}
                    redirectUrlError={formErrors.reservations_sms_redirect_url}
                    redirectMessageError={formErrors.reservations_sms_redirect_message}
                    defaultMessagePlaceholder={DEFAULT_RESERVATIONS_SMS_MESSAGE}
                    urlPlaceholder="https://reserve.yourrestaurant.com"
                    urlHelpText="URL to your reservation platform (must start with http:// or https://)"
                    showPreview={showReservationsMessagePreview}
                    onTogglePreview={() =>
                      setShowReservationsMessagePreview(!showReservationsMessagePreview)
                    }
                    onRedirectUrlChange={(value) =>
                      updateFormData({ reservations_sms_redirect_url: value })
                    }
                    onRedirectMessageChange={(value) => {
                      updateFormData({ reservations_sms_redirect_message: value });
                      if (formErrors.reservations_sms_redirect_message) {
                        setFormErrors((prev) => ({
                          ...prev,
                          reservations_sms_redirect_message: undefined,
                        }));
                      }
                    }}
                    onClearUrlError={() =>
                      setFormErrors((prev) => ({
                        ...prev,
                        reservations_sms_redirect_url: undefined,
                      }))
                    }
                    maxMessageLength={SMS_MESSAGE_MAX_LENGTH}
                    previewContent={getSmsMessagePreview(
                      "reservations",
                      formData.name || "Your Restaurant"
                    )}
                  />
                )}
              </div>
            </div>

            {/* ==================== FAQs SECTION ==================== */}
            {/* FAQs Toggle - Always ON for agent functionality (not user-editable) */}
            <div
              className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-muted/30 opacity-80 cursor-not-allowed"
              aria-disabled="true"
              role="group"
              aria-labelledby="faqs_label"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                  <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" aria-hidden />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <Label
                    id="faqs_label"
                    htmlFor="faqs_enabled"
                    className="text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-default"
                  >
                    FAQs & General Questions
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          aria-label="FAQ capability is required for RessyAI and cannot be disabled"
                        >
                          <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px]">
                        <p>FAQ capability is required for RessyAI and cannot be disabled.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Allow RessyAI to answer menu questions and general inquiries
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 italic">
                    Always enabled for the agent to function correctly
                  </p>
                </div>
              </div>
              <Switch
                id="faqs_enabled"
                checked={true}
                disabled={true}
                aria-disabled="true"
                className="shrink-0 pointer-events-none"
              />
            </div>

            {/* ==================== STATUS SUMMARY ==================== */}
            <div className="flex flex-col gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2">
                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  RessyAI is handling:{" "}
                  <span className="font-medium text-foreground">
                    {[
                      formData.features_orders_enabled && "Orders (Direct)",
                      formData.orders_sms_redirect_enabled && "Orders (SMS Redirect)",
                      formData.features_reservations_enabled && "Reservations (Direct)",
                      formData.reservations_sms_redirect_enabled && "Reservations (SMS Redirect)",
                      "FAQs",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </span>
              </div>
              {(formData.orders_sms_redirect_enabled ||
                formData.reservations_sms_redirect_enabled) && (
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <Link className="h-3 w-3 shrink-0" />
                  <span>
                    SMS redirects active for:{" "}
                    {[
                      formData.orders_sms_redirect_enabled && "Orders",
                      formData.reservations_sms_redirect_enabled && "Reservations",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <AlertDialog
        open={isKillSwitchDialogOpen}
        onOpenChange={(open) => {
          if (!killSwitchSubmitting) {
            setIsKillSwitchDialogOpen(open);
            if (!open) {
              setKillSwitchConfirmText("");
              setKillSwitchError(null);
              setKillSwitchActionBlockers([]);
            }
          }
        }}
      >
        <AlertDialogContent className="w-[95vw] sm:w-full max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {killSwitchTargetEnabled ? "Disable RessyAI" : "Re-enable RessyAI"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed">
              {killSwitchTargetEnabled
                ? "Incoming calls will stop using AI and will be forwarded directly to your escalation line."
                : "Incoming calls will return to normal AI handling."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {killSwitchTargetEnabled && (
            <div className="space-y-1.5">
              <Label htmlFor="kill_switch_confirm" className="text-xs sm:text-sm font-medium">
                Type <span className="font-mono">DISABLE</span> to confirm
              </Label>
              <Input
                id="kill_switch_confirm"
                value={killSwitchConfirmText}
                onChange={(e) => {
                  setKillSwitchConfirmText(e.target.value);
                  if (killSwitchError) {
                    setKillSwitchError(null);
                  }
                }}
                placeholder="DISABLE"
                disabled={killSwitchSubmitting}
                className="h-9 sm:h-10 text-xs sm:text-sm font-mono"
              />
            </div>
          )}

          {killSwitchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs sm:text-sm">Could not update kill switch</AlertTitle>
              <AlertDescription className="space-y-1.5 text-xs sm:text-sm">
                <p>{killSwitchError}</p>
                {killSwitchActionBlockers.map((blocker) => (
                  <p key={blocker}>{formatKillSwitchBlocker(blocker)}</p>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={killSwitchSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleKillSwitchConfirm();
              }}
              disabled={
                killSwitchSubmitting ||
                (killSwitchTargetEnabled === true &&
                  killSwitchConfirmText.trim().toUpperCase() !== "DISABLE")
              }
              className={killSwitchTargetEnabled ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {killSwitchSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : killSwitchTargetEnabled ? (
                "Yes, disable now"
              ) : (
                "Yes, re-enable"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
