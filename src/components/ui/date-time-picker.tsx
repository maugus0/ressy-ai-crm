/**
 * DateTimePicker Component
 * A combined date and time picker using Calendar and time input
 * Uses Vancouver timezone for proper local time display
 */

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTimeFromDateTime } from "@/lib/utils/timezone";

interface DateTimePickerProps {
  value: string; // Format: YYYY-MM-DDTHH:mm (datetime-local format)
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  error,
  className,
  disabled = false,
  minDate,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [isTimeFocused, setIsTimeFocused] = React.useState(false);
  const timeInputRef = React.useRef<HTMLInputElement>(null);

  // Parse value to get date and time parts
  // value is in format YYYY-MM-DDTHH:mm
  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    const [datePart] = value.split("T");
    if (!datePart) return undefined;
    const [year, month, day] = datePart.split("-").map(Number);
    if (!year || !month || !day) return undefined;
    return new Date(year, month - 1, day);
  }, [value]);

  const timeValue = getTimeFromDateTime(value); // HH:mm format

  // Format time for beautiful display (12-hour format with AM/PM)
  const formattedTime = React.useMemo(() => {
    if (!timeValue) return "";
    const [hours, minutes] = timeValue.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return "";

    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? "PM" : "AM";
    return `${hour12}:${String(minutes).padStart(2, "0")} ${ampm}`;
  }, [timeValue]);

  // Handle date selection from calendar
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const datePart = `${year}-${month}-${day}`;

    // Preserve existing time or default to 12:00
    const timePart = timeValue || "12:00";
    onChange(`${datePart}T${timePart}`);
    setOpen(false);
  };

  // Handle time input change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (!newTime) return;

    // Get existing date or use today
    let datePart: string;
    if (value) {
      const [existingDate] = value.split("T");
      datePart = existingDate || "";
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      datePart = `${year}-${month}-${day}`;
    }

    if (datePart) {
      onChange(`${datePart}T${newTime}`);
    }
  };

  // Handle time input click - trigger native time picker
  const handleTimeInputClick = async (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const target = timeInputRef.current;
    if (!target || disabled) return;

    // Always try to show the picker programmatically
    // This allows clicking anywhere on the input to open the picker
    target.focus();

    // Use showPicker() API if available (works in Chrome, Edge, Safari 16.4+)
    const inputWithPicker = target as HTMLInputElement & { showPicker?: () => Promise<void> };
    if ("showPicker" in inputWithPicker && typeof inputWithPicker.showPicker === "function") {
      try {
        await inputWithPicker.showPicker();
      } catch {
        // If showPicker fails or is not supported, focus the input
        // The user can then use keyboard or click the native icon
        console.debug("showPicker not available or failed");
      }
    }
  };

  // Format date for display
  const formattedDate = React.useMemo(() => {
    if (!dateValue) return "Select date";
    return dateValue.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [dateValue]);

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2 w-full">
        {/* Date Picker */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "flex-1 min-w-0 h-10 justify-start text-left font-normal",
                !dateValue && "text-muted-foreground",
                error && "border-destructive"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{formattedDate}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleDateSelect}
              disabled={(date) => {
                if (minDate) {
                  // Disable dates before minDate (comparing just date parts)
                  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                  const minDateOnly = new Date(
                    minDate.getFullYear(),
                    minDate.getMonth(),
                    minDate.getDate()
                  );
                  return dateOnly < minDateOnly;
                }
                return false;
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Time Input */}
        <div className="relative shrink-0 w-[140px] group">
          <Input
            ref={timeInputRef}
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            onClick={handleTimeInputClick}
            onFocus={() => setIsTimeFocused(true)}
            onBlur={() => setIsTimeFocused(false)}
            disabled={disabled}
            className={cn(
              "h-10 px-3 py-0 leading-10 cursor-pointer",
              "text-base font-semibold tracking-wide",
              // Hide all native text when overlay is shown (not focused)
              !isTimeFocused &&
                timeValue &&
                "[&::-webkit-datetime-edit]:!opacity-0 [&::-webkit-datetime-edit-fields-wrapper]:!opacity-0",
              // Style webkit time input parts when focused (visible)
              isTimeFocused &&
                "[&::-webkit-datetime-edit-text]:text-foreground [&::-webkit-datetime-edit-text]:font-medium [&::-webkit-datetime-edit-text]:opacity-70",
              isTimeFocused &&
                "[&::-webkit-datetime-edit-hour-field]:text-foreground [&::-webkit-datetime-edit-hour-field]:font-bold [&::-webkit-datetime-edit-hour-field]:text-lg",
              isTimeFocused &&
                "[&::-webkit-datetime-edit-minute-field]:text-foreground [&::-webkit-datetime-edit-minute-field]:font-bold [&::-webkit-datetime-edit-minute-field]:text-lg",
              isTimeFocused &&
                "[&::-webkit-datetime-edit-ampm-field]:text-foreground [&::-webkit-datetime-edit-ampm-field]:font-medium [&::-webkit-datetime-edit-ampm-field]:text-sm",
              isTimeFocused &&
                "[&::-webkit-datetime-edit-hour-field]:focus:bg-accent/50 [&::-webkit-datetime-edit-hour-field]:focus:rounded-sm [&::-webkit-datetime-edit-hour-field]:focus:px-1",
              isTimeFocused &&
                "[&::-webkit-datetime-edit-minute-field]:focus:bg-accent/50 [&::-webkit-datetime-edit-minute-field]:focus:rounded-sm [&::-webkit-datetime-edit-minute-field]:focus:px-1",
              isTimeFocused &&
                "[&::-webkit-datetime-edit-ampm-field]:focus:bg-accent/50 [&::-webkit-datetime-edit-ampm-field]:focus:rounded-sm [&::-webkit-datetime-edit-ampm-field]:focus:px-1",
              "hover:border-primary/50 transition-colors",
              error && "border-destructive"
            )}
            style={{
              paddingRight: "2.5rem",
              color: !isTimeFocused && timeValue ? "transparent" : "inherit",
            }}
          />
          {/* Beautiful formatted time display overlay (shows when not focused and time is selected) */}
          {!isTimeFocused && formattedTime && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-start px-3 pr-10 cursor-pointer rounded-md border border-transparent",
                "text-base font-semibold text-foreground tracking-wide",
                "pointer-events-auto",
                error && "border-destructive"
              )}
              onClick={handleTimeInputClick}
              aria-hidden="true"
            >
              <span>{formattedTime}</span>
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
