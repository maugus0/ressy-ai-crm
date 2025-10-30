import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
export function SettingsPage() {
  const { toast } = useToast();

  // Settings state
  const [businessName, setBusinessName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [industry, setIndustry] = useState("");
  const [voiceStyle, setVoiceStyle] = useState("");
  const [escalationRule, setEscalationRule] = useState("");
  const [noShowPolicy, setNoShowPolicy] = useState("");

  const restaurantId = "restaurant_1"; // TODO: dynamically set based on logged-in user

  // Load settings on mount
  useEffect(() => {
    fetch(`${API_URL}/settings/${restaurantId}`)
      .then((res) => res.json())
      .then((data) => {
        setBusinessName(data.businessName || "");
        setTimezone(data.timezone || "");
        setIndustry(data.industry || "");
        setVoiceStyle(data.voiceStyle || "");
        setEscalationRule(data.escalationRule || "");
        setNoShowPolicy(data.noShowPolicy || "");
      })
      .catch((err) => console.error("Failed to load settings:", err));
  }, []);

  const handleSave = async () => {
    const payload = {
      businessName,
      timezone,
      industry,
      voiceStyle,
      escalationRule,
      noShowPolicy,
    };

    try {
      const res = await fetch(`${API_URL}/settings/${restaurantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Profile Card */}
        <Card className="p-6 bg-card border border-border space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Business profile</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Vancouver">America/Vancouver</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                  <SelectItem value="America/Chicago">America/Chicago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Restaurant">Restaurant</SelectItem>
                  <SelectItem value="Salon">Salon</SelectItem>
                  <SelectItem value="Spa">Spa</SelectItem>
                  <SelectItem value="Clinic">Clinic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Receptionist Behavior Card */}
        <Card className="p-6 bg-card border border-border space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Receptionist behavior</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Voice style</Label>
              <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select voice style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Escalation rule</Label>
              <Input
                value={escalationRule}
                onChange={(e) => setEscalationRule(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>No-show policy</Label>
              <Input
                value={noShowPolicy}
                onChange={(e) => setNoShowPolicy(e.target.value)}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          onClick={handleSave}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Save All
        </Button>
      </div>
    </div>
  );
}