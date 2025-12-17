/**
 * Settings Page
 * Manage restaurant settings and information
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Settings as SettingsIcon,
  Building,
  Clock,
  CalendarDays,
  Save,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UiOnlyNotice } from "@/components/UiOnlyNotice";
import type { RestaurantSettings, OpeningHours } from "@/types/api.types";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_HOURS: OpeningHours[] = DAYS_OF_WEEK.map((day) => ({
  day,
  open: "09:00",
  close: "22:00",
  is_closed: false,
}));

export function Settings() {
  const { restaurantName } = useAuth();
  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error] = useState<string | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings>({
    name: restaurantName || "",
    address: "",
    phone: "",
    email: "",
    timezone: "America/New_York",
    opening_hours: DEFAULT_HOURS,
    reservation_settings: {
      max_party_size: 10,
      min_advance_hours: 2,
      max_advance_days: 30,
      slot_duration_minutes: 60,
      buffer_minutes: 15,
    },
  });

  const handleSave = async () => {
    setSaving(true);
    // UI-only: simulate save delay
    window.setTimeout(() => setSaving(false), 450);
  };

  const handleHoursChange = (index: number, field: keyof OpeningHours, value: string | boolean) => {
    const newHours = [...(settings.opening_hours || DEFAULT_HOURS)];
    newHours[index] = { ...newHours[index], [field]: value };
    setSettings({ ...settings, opening_hours: newHours });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <UiOnlyNotice />
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your restaurant's information and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
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

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Restaurant Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            <CardTitle>Restaurant Information</CardTitle>
          </div>
          <CardDescription>Basic information about your restaurant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                placeholder="Restaurant name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={settings.phone || ""}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={settings.address || ""}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="Street address"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email || ""}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="restaurant@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={settings.timezone || ""}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                placeholder="America/New_York"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opening Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle>Opening Hours</CardTitle>
          </div>
          <CardDescription>Set your restaurant's opening and closing times</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(settings.opening_hours || DEFAULT_HOURS).map((hours, index) => (
              <div
                key={hours.day}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
              >
                <div className="w-24 font-medium">{hours.day}</div>
                <div className="flex items-center gap-2 flex-1">
                  <Switch
                    checked={!hours.is_closed}
                    onCheckedChange={(checked) => handleHoursChange(index, "is_closed", !checked)}
                  />
                  <span className="text-sm text-muted-foreground w-16">
                    {hours.is_closed ? "Closed" : "Open"}
                  </span>
                </div>
                {!hours.is_closed && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) => handleHoursChange(index, "open", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) => handleHoursChange(index, "close", e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reservation Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            <CardTitle>Reservation Settings</CardTitle>
          </div>
          <CardDescription>Configure how reservations work at your restaurant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_party">Maximum Party Size</Label>
              <Input
                id="max_party"
                type="number"
                min="1"
                value={settings.reservation_settings?.max_party_size || 10}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reservation_settings: {
                      ...settings.reservation_settings!,
                      max_party_size: parseInt(e.target.value) || 10,
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Max guests per reservation</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_advance">Minimum Advance (hours)</Label>
              <Input
                id="min_advance"
                type="number"
                min="0"
                value={settings.reservation_settings?.min_advance_hours || 2}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reservation_settings: {
                      ...settings.reservation_settings!,
                      min_advance_hours: parseInt(e.target.value) || 2,
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Hours before reservation</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_advance">Maximum Advance (days)</Label>
              <Input
                id="max_advance"
                type="number"
                min="1"
                value={settings.reservation_settings?.max_advance_days || 30}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reservation_settings: {
                      ...settings.reservation_settings!,
                      max_advance_days: parseInt(e.target.value) || 30,
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Days ahead for booking</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot_duration">Slot Duration (minutes)</Label>
              <Input
                id="slot_duration"
                type="number"
                min="15"
                step="15"
                value={settings.reservation_settings?.slot_duration_minutes || 60}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reservation_settings: {
                      ...settings.reservation_settings!,
                      slot_duration_minutes: parseInt(e.target.value) || 60,
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Time per reservation</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer">Buffer Time (minutes)</Label>
              <Input
                id="buffer"
                type="number"
                min="0"
                step="5"
                value={settings.reservation_settings?.buffer_minutes || 15}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reservation_settings: {
                      ...settings.reservation_settings!,
                      buffer_minutes: parseInt(e.target.value) || 15,
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Between reservations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;
