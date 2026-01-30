"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TimezoneComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  timezones: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Searchable timezone dropdown component
 * Groups timezones by region (Americas, Europe, Asia, etc.)
 */
export function TimezoneCombobox({
  value,
  onValueChange,
  timezones,
  placeholder = "Select timezone...",
  disabled = false,
  className,
}: TimezoneComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Group timezones by region
  const groupedTimezones = React.useMemo(() => {
    const groups: Record<string, string[]> = {
      Americas: [],
      Europe: [],
      Asia: [],
      Africa: [],
      Australia: [],
      Pacific: [],
      Other: [],
    };

    timezones.forEach((tz) => {
      const [region] = tz.split("/");
      if (region === "America") {
        groups.Americas.push(tz);
      } else if (region === "Europe") {
        groups.Europe.push(tz);
      } else if (region === "Asia") {
        groups.Asia.push(tz);
      } else if (region === "Africa") {
        groups.Africa.push(tz);
      } else if (region === "Australia" || region === "Antarctica") {
        groups.Australia.push(tz);
      } else if (region === "Pacific") {
        groups.Pacific.push(tz);
      } else {
        groups.Other.push(tz);
      }
    });

    // Remove empty groups and sort alphabetically within each group
    return Object.entries(groups)
      .filter(([, tzs]) => tzs.length > 0)
      .map(([region, tzs]) => [region, tzs.sort()] as [string, string[]]);
  }, [timezones]);

  // Filter timezones based on search
  const filteredGroups = React.useMemo(() => {
    if (!search) return groupedTimezones;

    const searchLower = search.toLowerCase();
    return groupedTimezones
      .map(([region, tzs]) => {
        const filtered = tzs.filter((tz) => tz.toLowerCase().includes(searchLower));
        return [region, filtered] as [string, string[]];
      })
      .filter(([, tzs]) => tzs.length > 0);
  }, [groupedTimezones, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search timezone..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            {filteredGroups.map(([region, tzs]) => (
              <CommandGroup key={region} heading={region}>
                {tzs.map((timezone) => (
                  <CommandItem
                    key={timezone}
                    value={timezone}
                    onSelect={() => {
                      onValueChange(timezone);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === timezone ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{timezone}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Common timezone options
 * Can be used as a default list when creating the combobox
 */
export const COMMON_TIMEZONES = [
  // Americas
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Vancouver",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  // Europe
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Moscow",
  // Asia
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Seoul",
  "Asia/Dubai",
  "Asia/Kolkata",
  // Australia/Pacific
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  "Pacific/Honolulu",
] as const;

/**
 * Get all IANA timezone names
 * Uses Intl.supportedValuesOf if available, falls back to common list
 */
export const getAllTimezones = (): string[] => {
  try {
    // Modern browsers support this (Chrome 93+, Firefox 93+, Safari 15.4+)
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      return (
        Intl as typeof Intl & { supportedValuesOf: (key: string) => string[] }
      ).supportedValuesOf("timeZone");
    }
  } catch {
    // Fallback if not supported
  }

  // Fallback to common timezones
  return [...COMMON_TIMEZONES];
};
