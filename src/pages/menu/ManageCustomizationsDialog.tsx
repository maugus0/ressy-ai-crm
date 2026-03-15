import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Trash2, Loader2, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { getMenuItem } from "@/services/menu";
import {
  getOptionGroups,
  attachOptionGroupToItem,
  detachOptionGroupFromItem,
} from "@/services/menuOptions";
import type { ClientMenuItem, OptionGroup } from "@/types/api.types";

// ============================================================================
// Props
// ============================================================================

interface ManageCustomizationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItemId: number | null;
  onChanged?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function ManageCustomizationsDialog({
  open,
  onOpenChange,
  menuItemId,
  onChanged,
}: ManageCustomizationsDialogProps) {
  const [menuItem, setMenuItem] = useState<ClientMenuItem | null>(null);
  const [allGroups, setAllGroups] = useState<OptionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Attach form
  const [showAttachForm, setShowAttachForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [overrides, setOverrides] = useState({
    min_select_override: "",
    max_select_override: "",
    free_allowance_override: "",
    allows_quantity_override: false,
    has_allows_quantity_override: false,
    max_quantity_per_option_override: "",
    is_required_override: false,
    has_is_required_override: false,
    sort_order: "0",
  });

  // Detach confirmation
  const [detachGroupId, setDetachGroupId] = useState<number | null>(null);
  const [isDetachDialogOpen, setIsDetachDialogOpen] = useState(false);

  // ============================================================================
  // Fetch
  // ============================================================================

  const fetchData = useCallback(async () => {
    if (!menuItemId) return;
    try {
      setIsLoading(true);
      const [item, groups] = await Promise.all([getMenuItem(menuItemId), getOptionGroups()]);
      setMenuItem(item);
      setAllGroups(groups);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [menuItemId]);

  useEffect(() => {
    if (open && menuItemId) {
      fetchData();
      setShowAttachForm(false);
      setSelectedGroupId("");
    }
  }, [open, menuItemId, fetchData]);

  // ============================================================================
  // Derived
  // ============================================================================

  const attachedGroupIds = new Set((menuItem?.option_groups || []).map((g) => g.id));

  const availableGroups = allGroups.filter((g) => !attachedGroupIds.has(g.id));

  const attachedGroups = [...(menuItem?.option_groups || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleAttach = async () => {
    if (!menuItemId || !selectedGroupId) return;

    try {
      setIsSubmitting(true);
      const payload: Record<string, unknown> = {
        group_id: parseInt(selectedGroupId),
        sort_order: parseInt(overrides.sort_order) || 0,
      };

      // Use explicit empty-string checks so "0" is sent when user overrides to zero
      if (overrides.min_select_override !== "") {
        const n = parseInt(overrides.min_select_override, 10);
        if (!Number.isNaN(n)) payload.min_select_override = n;
      }
      if (overrides.max_select_override !== "") {
        const n = parseInt(overrides.max_select_override, 10);
        if (!Number.isNaN(n)) payload.max_select_override = n;
      }
      if (overrides.free_allowance_override !== "") {
        const n = parseInt(overrides.free_allowance_override, 10);
        if (!Number.isNaN(n)) payload.free_allowance_override = n;
      }
      if (overrides.has_allows_quantity_override)
        payload.allows_quantity_override = overrides.allows_quantity_override;
      if (overrides.max_quantity_per_option_override !== "") {
        const n = parseInt(overrides.max_quantity_per_option_override, 10);
        if (!Number.isNaN(n)) payload.max_quantity_per_option_override = n;
      }
      if (overrides.has_is_required_override)
        payload.is_required_override = overrides.is_required_override;

      await attachOptionGroupToItem(
        menuItemId,
        payload as Parameters<typeof attachOptionGroupToItem>[1]
      );
      toast.success("Option group attached");
      setShowAttachForm(false);
      setSelectedGroupId("");
      setOverrides({
        min_select_override: "",
        max_select_override: "",
        free_allowance_override: "",
        allows_quantity_override: false,
        has_allows_quantity_override: false,
        max_quantity_per_option_override: "",
        is_required_override: false,
        has_is_required_override: false,
        sort_order: "0",
      });
      await fetchData();
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to attach group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetach = async () => {
    if (!menuItemId || !detachGroupId) return;

    try {
      setIsSubmitting(true);
      await detachOptionGroupFromItem(menuItemId, detachGroupId);
      toast.success("Option group detached");
      setIsDetachDialogOpen(false);
      setDetachGroupId(null);
      await fetchData();
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to detach group");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Customizations</DialogTitle>
            <DialogDescription>{menuItem ? menuItem.item_name : "Loading..."}</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Attached Groups */}
              <div>
                <Label className="text-sm font-semibold">Attached Option Groups</Label>
                {attachedGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    No customization groups attached. Add one below.
                  </p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {attachedGroups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-start justify-between p-3 border rounded-lg"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{group.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {group.selection_type}
                            </Badge>
                            {group.is_required && <Badge className="text-xs">Required</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {group.values.length} value{group.values.length !== 1 ? "s" : ""} ·{" "}
                            {group.min_select}–{group.max_select ?? "∞"} selections
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => {
                            setDetachGroupId(group.id);
                            setIsDetachDialogOpen(true);
                          }}
                          title="Detach group"
                        >
                          <Link2Off className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attach Form */}
              {showAttachForm ? (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm font-semibold">Attach Option Group</p>

                  <div className="space-y-2">
                    <Label className="text-xs">Option Group *</Label>
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableGroups.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            No groups available
                          </SelectItem>
                        ) : (
                          availableGroups.map((g) => (
                            <SelectItem key={g.id} value={String(g.id)}>
                              {g.name} ({g.selection_type}, {g.values.length} values)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedGroupId && selectedGroupId !== "__none" && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground font-medium">
                        Per-item overrides (leave blank to inherit group defaults)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Min Select</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Inherit"
                            value={overrides.min_select_override}
                            onChange={(e) =>
                              setOverrides({ ...overrides, min_select_override: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Max Select</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Inherit"
                            value={overrides.max_select_override}
                            onChange={(e) =>
                              setOverrides({ ...overrides, max_select_override: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Free Allowance</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Inherit"
                            value={overrides.free_allowance_override}
                            onChange={(e) =>
                              setOverrides({
                                ...overrides,
                                free_allowance_override: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-xs">
                          <Switch
                            checked={overrides.has_allows_quantity_override}
                            onCheckedChange={(c) =>
                              setOverrides({ ...overrides, has_allows_quantity_override: c })
                            }
                          />
                          Override Quantity
                        </label>
                        {overrides.has_allows_quantity_override && (
                          <>
                            <label className="flex items-center gap-2 text-xs">
                              <Switch
                                checked={overrides.allows_quantity_override}
                                onCheckedChange={(c) =>
                                  setOverrides({ ...overrides, allows_quantity_override: c })
                                }
                              />
                              Allow Qty
                            </label>
                            {overrides.allows_quantity_override && (
                              <div className="space-y-1 w-full sm:w-auto">
                                <Label className="text-xs">Max Qty Per Option</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Inherit"
                                  value={overrides.max_quantity_per_option_override}
                                  onChange={(e) =>
                                    setOverrides({
                                      ...overrides,
                                      max_quantity_per_option_override: e.target.value,
                                    })
                                  }
                                  className="w-24 h-8"
                                />
                              </div>
                            )}
                          </>
                        )}
                        <label className="flex items-center gap-2 text-xs">
                          <Switch
                            checked={overrides.has_is_required_override}
                            onCheckedChange={(c) =>
                              setOverrides({ ...overrides, has_is_required_override: c })
                            }
                          />
                          Override Required
                        </label>
                        {overrides.has_is_required_override && (
                          <label className="flex items-center gap-2 text-xs">
                            <Switch
                              checked={overrides.is_required_override}
                              onCheckedChange={(c) =>
                                setOverrides({ ...overrides, is_required_override: c })
                              }
                            />
                            Required
                          </label>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Sort Order</Label>
                        <Input
                          type="number"
                          min="0"
                          value={overrides.sort_order}
                          onChange={(e) =>
                            setOverrides({ ...overrides, sort_order: e.target.value })
                          }
                          className="w-24"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowAttachForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAttach}
                      disabled={isSubmitting || !selectedGroupId || selectedGroupId === "__none"}
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Attach"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAttachForm(true)}
                  disabled={availableGroups.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Attach Option Group
                  {availableGroups.length === 0 && (
                    <span className="ml-1 text-muted-foreground">(none available)</span>
                  )}
                </Button>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detach Confirmation */}
      <AlertDialog open={isDetachDialogOpen} onOpenChange={setIsDetachDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Detach Option Group</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this option group from the menu item? The group itself will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDetach}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Detaching...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Detach
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
