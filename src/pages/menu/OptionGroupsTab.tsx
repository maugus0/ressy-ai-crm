import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Settings2,
  RefreshCw,
  AlertCircle,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  getOptionGroups,
  getOptionGroup,
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  createOptionValue,
  updateOptionValue,
  deleteOptionValue,
} from "@/services/menuOptions";
import type {
  OptionGroup,
  OptionValue,
  OptionGroupCreateRequest,
  OptionGroupUpdateRequest,
} from "@/types/api.types";

// ============================================================================
// Types
// ============================================================================

interface GroupFormData {
  name: string;
  description: string;
  selection_type: "single" | "multiple";
  min_select: string;
  max_select: string;
  free_allowance: string;
  free_allowance_strategy: string;
  allows_quantity: boolean;
  max_quantity_per_option: string;
  prompt_style: "ASK_ALWAYS" | "ASK_IF_MENTIONED" | "SUGGEST_POPULAR";
  is_required: boolean;
  is_available: boolean;
  sort_order: string;
}

interface InlineValue {
  name: string;
  price_delta: string;
  is_default: boolean;
  sort_order: string;
}

interface ValueFormData {
  name: string;
  price_delta: string;
  is_default: boolean;
  is_available: boolean;
  sort_order: string;
}

interface GroupFormErrors {
  name?: string;
  min_select?: string;
  max_select?: string;
}

interface ValueFormErrors {
  name?: string;
  price_delta?: string;
}

const defaultGroupForm: GroupFormData = {
  name: "",
  description: "",
  selection_type: "single",
  min_select: "0",
  max_select: "1",
  free_allowance: "0",
  free_allowance_strategy: "HIGHEST_PRICE_FIRST",
  allows_quantity: false,
  max_quantity_per_option: "",
  prompt_style: "ASK_ALWAYS",
  is_required: false,
  is_available: true,
  sort_order: "0",
};

const defaultValueForm: ValueFormData = {
  name: "",
  price_delta: "0",
  is_default: false,
  is_available: true,
  sort_order: "0",
};

// ============================================================================
// Helpers
// ============================================================================

function formatPriceDelta(delta: number): string {
  if (delta === 0) return "Free";
  if (delta > 0) return `+$${delta.toFixed(2)}`;
  return `-$${Math.abs(delta).toFixed(2)}`;
}

function promptStyleLabel(style: string): string {
  switch (style) {
    case "ASK_ALWAYS":
      return "Always Ask";
    case "ASK_IF_MENTIONED":
      return "If Mentioned";
    case "SUGGEST_POPULAR":
      return "Suggest Popular";
    default:
      return style;
  }
}

// ============================================================================
// Component
// ============================================================================

export default function OptionGroupsTab() {
  // Data state
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create/Edit group dialog
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);
  const [groupForm, setGroupForm] = useState<GroupFormData>(defaultGroupForm);
  const [groupFormErrors, setGroupFormErrors] = useState<GroupFormErrors>({});
  const [inlineValues, setInlineValues] = useState<InlineValue[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete group dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<OptionGroup | null>(null);

  // Values management dialog
  const [isValuesDialogOpen, setIsValuesDialogOpen] = useState(false);
  const [valuesGroup, setValuesGroup] = useState<OptionGroup | null>(null);
  const [isLoadingValues, setIsLoadingValues] = useState(false);

  // Value create/edit
  const [isValueFormOpen, setIsValueFormOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<OptionValue | null>(null);
  const [valueForm, setValueForm] = useState<ValueFormData>(defaultValueForm);
  const [valueFormErrors, setValueFormErrors] = useState<ValueFormErrors>({});

  // Value delete
  const [isDeleteValueDialogOpen, setIsDeleteValueDialogOpen] = useState(false);
  const [deletingValue, setDeletingValue] = useState<OptionValue | null>(null);

  // ============================================================================
  // Fetch
  // ============================================================================

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOptionGroups();
      setOptionGroups([...data].sort((a, b) => a.sort_order - b.sort_order));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load option groups");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchGroupValues = useCallback(async (groupId: number) => {
    try {
      setIsLoadingValues(true);
      const data = await getOptionGroup(groupId);
      data.values = [...data.values].sort((a, b) => a.sort_order - b.sort_order);
      setValuesGroup(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load group values");
    } finally {
      setIsLoadingValues(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ============================================================================
  // Group Form Validation
  // ============================================================================

  const validateGroupForm = (): boolean => {
    const errors: GroupFormErrors = {};

    if (!groupForm.name.trim()) {
      errors.name = "Name is required";
    } else if (groupForm.name.trim().length > 100) {
      errors.name = "Name must be less than 100 characters";
    }

    const minSel = parseInt(groupForm.min_select) || 0;
    const maxSel = groupForm.max_select ? parseInt(groupForm.max_select) : null;

    if (minSel < 0) {
      errors.min_select = "Min selection cannot be negative";
    }

    if (maxSel !== null && maxSel < 1) {
      errors.max_select = "Max selection must be at least 1";
    }

    if (maxSel !== null && minSel > maxSel) {
      errors.min_select = "Min selection cannot exceed max selection";
    }

    if (groupForm.selection_type === "single" && maxSel !== null && maxSel > 1) {
      errors.max_select = "Single-choice groups allow max 1";
    }

    setGroupFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================================================
  // Group Handlers
  // ============================================================================

  const openCreateGroupDialog = () => {
    setEditingGroup(null);
    setGroupForm(defaultGroupForm);
    setGroupFormErrors({});
    setInlineValues([]);
    setIsGroupDialogOpen(true);
  };

  const openEditGroupDialog = (group: OptionGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || "",
      selection_type: group.selection_type,
      min_select: String(group.min_select),
      max_select: group.max_select !== null ? String(group.max_select) : "",
      free_allowance: String(group.free_allowance),
      free_allowance_strategy: group.free_allowance_strategy,
      allows_quantity: group.allows_quantity,
      max_quantity_per_option:
        group.max_quantity_per_option !== null ? String(group.max_quantity_per_option) : "",
      prompt_style: group.prompt_style,
      is_required: group.is_required,
      is_available: group.is_available,
      sort_order: String(group.sort_order),
    });
    setGroupFormErrors({});
    setInlineValues([]);
    setIsGroupDialogOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!validateGroupForm()) return;

    try {
      setIsSubmitting(true);
      const maxSelect = groupForm.max_select ? parseInt(groupForm.max_select) : null;

      if (editingGroup) {
        const payload: OptionGroupUpdateRequest = {
          name: groupForm.name.trim(),
          description: groupForm.description.trim() || null,
          selection_type: groupForm.selection_type,
          min_select: parseInt(groupForm.min_select) || 0,
          max_select: maxSelect,
          free_allowance: parseInt(groupForm.free_allowance) || 0,
          free_allowance_strategy: groupForm.free_allowance_strategy,
          allows_quantity: groupForm.allows_quantity,
          max_quantity_per_option:
            groupForm.allows_quantity && groupForm.max_quantity_per_option
              ? parseInt(groupForm.max_quantity_per_option)
              : null,
          prompt_style: groupForm.prompt_style,
          is_required: groupForm.is_required,
          is_available: groupForm.is_available,
          sort_order: parseInt(groupForm.sort_order) || 0,
        };
        await updateOptionGroup(editingGroup.id, payload);
        toast.success("Option group updated");
      } else {
        const payload: OptionGroupCreateRequest = {
          name: groupForm.name.trim(),
          description: groupForm.description.trim() || null,
          selection_type: groupForm.selection_type,
          min_select: parseInt(groupForm.min_select) || 0,
          max_select: maxSelect,
          free_allowance: parseInt(groupForm.free_allowance) || 0,
          free_allowance_strategy: groupForm.free_allowance_strategy,
          allows_quantity: groupForm.allows_quantity,
          max_quantity_per_option:
            groupForm.allows_quantity && groupForm.max_quantity_per_option
              ? parseInt(groupForm.max_quantity_per_option)
              : null,
          prompt_style: groupForm.prompt_style,
          is_required: groupForm.is_required,
          is_available: groupForm.is_available,
          sort_order: parseInt(groupForm.sort_order) || 0,
          values: inlineValues
            .filter((v) => v.name.trim())
            .map((v) => ({
              name: v.name.trim(),
              price_delta: parseFloat(v.price_delta) || 0,
              is_default: v.is_default,
              is_available: true,
              sort_order: parseInt(v.sort_order) || 0,
            })),
        };
        await createOptionGroup(payload);
        toast.success("Option group created");
      }

      setIsGroupDialogOpen(false);
      fetchGroups();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save option group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    try {
      setIsSubmitting(true);
      await deleteOptionGroup(deletingGroup.id);
      toast.success("Option group deleted");
      setIsDeleteDialogOpen(false);
      setDeletingGroup(null);
      fetchGroups();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete option group");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Values Handlers
  // ============================================================================

  const openValuesDialog = (group: OptionGroup) => {
    setValuesGroup(group);
    setIsValuesDialogOpen(true);
    fetchGroupValues(group.id);
  };

  const openCreateValueForm = () => {
    setEditingValue(null);
    setValueForm({
      ...defaultValueForm,
      sort_order: String(valuesGroup?.values.length || 0),
    });
    setValueFormErrors({});
    setIsValueFormOpen(true);
  };

  const openEditValueForm = (value: OptionValue) => {
    setEditingValue(value);
    setValueForm({
      name: value.name,
      price_delta: String(value.price_delta),
      is_default: value.is_default,
      is_available: value.is_available,
      sort_order: String(value.sort_order),
    });
    setValueFormErrors({});
    setIsValueFormOpen(true);
  };

  const validateValueForm = (): boolean => {
    const errors: ValueFormErrors = {};
    if (!valueForm.name.trim()) errors.name = "Name is required";
    const pd = parseFloat(valueForm.price_delta);
    if (isNaN(pd)) errors.price_delta = "Enter a valid number";
    setValueFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveValue = async () => {
    if (!valuesGroup || !validateValueForm()) return;

    try {
      setIsSubmitting(true);
      if (editingValue) {
        await updateOptionValue(editingValue.id, {
          name: valueForm.name.trim(),
          price_delta: parseFloat(valueForm.price_delta) || 0,
          is_default: valueForm.is_default,
          is_available: valueForm.is_available,
          sort_order: parseInt(valueForm.sort_order) || 0,
        });
        toast.success("Value updated");
      } else {
        await createOptionValue(valuesGroup.id, {
          name: valueForm.name.trim(),
          price_delta: parseFloat(valueForm.price_delta) || 0,
          is_default: valueForm.is_default,
          is_available: valueForm.is_available,
          sort_order: parseInt(valueForm.sort_order) || 0,
        });
        toast.success("Value created");
      }
      setIsValueFormOpen(false);
      fetchGroupValues(valuesGroup.id);
      fetchGroups();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save value");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteValue = async () => {
    if (!deletingValue || !valuesGroup) return;
    try {
      setIsSubmitting(true);
      await deleteOptionValue(deletingValue.id);
      toast.success("Value deleted");
      setIsDeleteValueDialogOpen(false);
      setDeletingValue(null);
      fetchGroupValues(valuesGroup.id);
      fetchGroups();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete value");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Inline Values (Create mode only)
  // ============================================================================

  const addInlineValue = () => {
    setInlineValues((prev) => [
      ...prev,
      { name: "", price_delta: "0", is_default: false, sort_order: String(prev.length) },
    ]);
  };

  const updateInlineValue = (index: number, field: keyof InlineValue, value: string | boolean) => {
    setInlineValues((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const removeInlineValue = (index: number) => {
    setInlineValues((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading && optionGroups.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && optionGroups.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading option groups</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchGroups}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Settings2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Option Groups</h3>
              <Badge variant="secondary">{optionGroups.length}</Badge>
            </div>
            <Button size="sm" onClick={openCreateGroupDialog}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Group</span>
            </Button>
          </div>

          {optionGroups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No option groups yet</p>
              <p className="text-sm">Create reusable customization groups for your menu items</p>
              <Button className="mt-4" onClick={openCreateGroupDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Option Group
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">Type</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Range</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Prompt</TableHead>
                    <TableHead className="font-semibold text-center hidden sm:table-cell">
                      Required
                    </TableHead>
                    <TableHead className="font-semibold text-center">Available</TableHead>
                    <TableHead className="font-semibold text-center hidden md:table-cell">
                      Values
                    </TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optionGroups.map((group) => (
                    <TableRow key={group.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium">{group.name}</p>
                          {group.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {group.description}
                            </p>
                          )}
                          <div className="flex gap-1 mt-1 sm:hidden">
                            <Badge variant="outline" className="text-xs">
                              {group.selection_type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {group.values.length} vals
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">
                          {group.selection_type === "single" ? "Single" : "Multiple"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {group.min_select}–{group.max_select ?? "∞"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {promptStyleLabel(group.prompt_style)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        <Badge variant={group.is_required ? "default" : "secondary"}>
                          {group.is_required ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            group.is_available
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {group.is_available ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Yes</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">No</span>
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        <Badge variant="secondary">{group.values.length}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openValuesDialog(group)}
                            title="Manage Values"
                          >
                            <Settings2 className="h-4 w-4 text-violet-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditGroupDialog(group)}
                            title="Edit Group"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setDeletingGroup(group);
                              setIsDeleteDialogOpen(true);
                            }}
                            title="Delete Group"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* Create / Edit Group Dialog                                         */}
      {/* ================================================================== */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Edit Option Group" : "Create Option Group"}</DialogTitle>
            <DialogDescription>
              {editingGroup
                ? "Update the option group settings"
                : "Create a reusable customization group for menu items"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="og-name">Name *</Label>
              <Input
                id="og-name"
                placeholder="e.g., Spice Level"
                value={groupForm.name}
                onChange={(e) => {
                  setGroupForm({ ...groupForm, name: e.target.value });
                  if (groupFormErrors.name)
                    setGroupFormErrors({ ...groupFormErrors, name: undefined });
                }}
                className={groupFormErrors.name ? "border-destructive" : ""}
                maxLength={100}
              />
              {groupFormErrors.name && (
                <p className="text-sm text-destructive">{groupFormErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="og-desc">Description</Label>
              <Textarea
                id="og-desc"
                placeholder="Optional description..."
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Selection Type + Range */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Selection Type</Label>
                <Select
                  value={groupForm.selection_type}
                  onValueChange={(v) => {
                    const st = v as "single" | "multiple";
                    setGroupForm({
                      ...groupForm,
                      selection_type: st,
                      max_select: st === "single" ? "1" : groupForm.max_select,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="multiple">Multiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Min Select</Label>
                <Input
                  type="number"
                  min="0"
                  value={groupForm.min_select}
                  onChange={(e) => {
                    setGroupForm({ ...groupForm, min_select: e.target.value });
                    if (groupFormErrors.min_select)
                      setGroupFormErrors({ ...groupFormErrors, min_select: undefined });
                  }}
                  className={groupFormErrors.min_select ? "border-destructive" : ""}
                />
                {groupFormErrors.min_select && (
                  <p className="text-sm text-destructive">{groupFormErrors.min_select}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Max Select</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="∞"
                  value={groupForm.max_select}
                  onChange={(e) => {
                    setGroupForm({ ...groupForm, max_select: e.target.value });
                    if (groupFormErrors.max_select)
                      setGroupFormErrors({ ...groupFormErrors, max_select: undefined });
                  }}
                  className={groupFormErrors.max_select ? "border-destructive" : ""}
                  disabled={groupForm.selection_type === "single"}
                />
                {groupFormErrors.max_select && (
                  <p className="text-sm text-destructive">{groupFormErrors.max_select}</p>
                )}
              </div>
            </div>

            {/* Free Allowance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Free Allowance</Label>
                <Input
                  type="number"
                  min="0"
                  value={groupForm.free_allowance}
                  onChange={(e) => setGroupForm({ ...groupForm, free_allowance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Free Strategy</Label>
                <Select
                  value={groupForm.free_allowance_strategy}
                  onValueChange={(v) => setGroupForm({ ...groupForm, free_allowance_strategy: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGHEST_PRICE_FIRST">Highest Price First</SelectItem>
                    <SelectItem value="LOWEST_PRICE_FIRST">Lowest Price First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg border">
              <div className="space-y-0.5">
                <Label>Allow Quantities</Label>
                <p className="text-sm text-muted-foreground">
                  Callers can order multiples of an option
                </p>
              </div>
              <Switch
                checked={groupForm.allows_quantity}
                onCheckedChange={(checked) =>
                  setGroupForm({ ...groupForm, allows_quantity: checked })
                }
              />
            </div>
            {groupForm.allows_quantity && (
              <div className="space-y-2">
                <Label>Max Quantity Per Option</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={groupForm.max_quantity_per_option}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, max_quantity_per_option: e.target.value })
                  }
                />
              </div>
            )}

            {/* Prompt Style */}
            <div className="space-y-2">
              <Label>Prompt Style</Label>
              <Select
                value={groupForm.prompt_style}
                onValueChange={(v) =>
                  setGroupForm({
                    ...groupForm,
                    prompt_style: v as GroupFormData["prompt_style"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASK_ALWAYS">Always Ask</SelectItem>
                  <SelectItem value="ASK_IF_MENTIONED">Ask If Mentioned</SelectItem>
                  <SelectItem value="SUGGEST_POPULAR">Suggest Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg border">
                <Label className="text-sm">Required</Label>
                <Switch
                  checked={groupForm.is_required}
                  onCheckedChange={(checked) =>
                    setGroupForm({ ...groupForm, is_required: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg border">
                <Label className="text-sm">Available</Label>
                <Switch
                  checked={groupForm.is_available}
                  onCheckedChange={(checked) =>
                    setGroupForm({ ...groupForm, is_available: checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  min="0"
                  value={groupForm.sort_order}
                  onChange={(e) => setGroupForm({ ...groupForm, sort_order: e.target.value })}
                />
              </div>
            </div>

            {/* Inline Values (create mode only) */}
            {!editingGroup && (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Initial Values (Optional)</Label>
                  <Button variant="outline" size="sm" onClick={addInlineValue}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Value
                  </Button>
                </div>
                {inlineValues.map((iv, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Name"
                      value={iv.name}
                      onChange={(e) => updateInlineValue(idx, "name", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="$0.00"
                      value={iv.price_delta}
                      onChange={(e) => updateInlineValue(idx, "price_delta", e.target.value)}
                      className="w-24"
                    />
                    <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={iv.is_default}
                        onChange={(e) => updateInlineValue(idx, "is_default", e.target.checked)}
                        className="rounded"
                      />
                      Default
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => removeInlineValue(idx)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGroup} disabled={isSubmitting || !groupForm.name.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingGroup ? (
                "Save Changes"
              ) : (
                "Create Group"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================== */}
      {/* Delete Group Dialog                                                */}
      {/* ================================================================== */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Option Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingGroup?.name}"? This will fail if the group
              is still attached to menu items or referenced by orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================================================================== */}
      {/* Values Management Dialog                                           */}
      {/* ================================================================== */}
      <Dialog open={isValuesDialogOpen} onOpenChange={setIsValuesDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Values — {valuesGroup?.name}</DialogTitle>
            <DialogDescription>
              {valuesGroup && (
                <span className="flex gap-2 mt-1 flex-wrap">
                  <Badge variant="outline">{valuesGroup.selection_type}</Badge>
                  <Badge variant="secondary">
                    {valuesGroup.min_select}–{valuesGroup.max_select ?? "∞"}
                  </Badge>
                  {valuesGroup.is_required && <Badge>Required</Badge>}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoadingValues ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : valuesGroup ? (
            <div className="space-y-4">
              {valuesGroup.values.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No values yet. Add your first value below.
                </p>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold text-right">Price</TableHead>
                        <TableHead className="font-semibold text-center hidden sm:table-cell">
                          Default
                        </TableHead>
                        <TableHead className="font-semibold text-center hidden sm:table-cell">
                          Available
                        </TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {valuesGroup.values.map((val) => (
                        <TableRow key={val.id} className="hover:bg-muted/30">
                          <TableCell>
                            <span className="font-medium text-sm">{val.name}</span>
                            <div className="flex gap-1 mt-1 sm:hidden">
                              {val.is_default && (
                                <Badge variant="default" className="text-xs">
                                  Default
                                </Badge>
                              )}
                              {!val.is_available && (
                                <Badge variant="secondary" className="text-xs">
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatPriceDelta(val.price_delta)}
                          </TableCell>
                          <TableCell className="text-center hidden sm:table-cell">
                            {val.is_default && <Badge variant="default">Default</Badge>}
                          </TableCell>
                          <TableCell className="text-center hidden sm:table-cell">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                                val.is_available
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {val.is_available ? "Yes" : "No"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openEditValueForm(val)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setDeletingValue(val);
                                  setIsDeleteValueDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Add / Edit Value Form */}
              {isValueFormOpen ? (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm font-semibold">
                    {editingValue ? "Edit Value" : "Add Value"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name *</Label>
                      <Input
                        placeholder="Value name"
                        value={valueForm.name}
                        onChange={(e) => {
                          setValueForm({ ...valueForm, name: e.target.value });
                          if (valueFormErrors.name)
                            setValueFormErrors({ ...valueFormErrors, name: undefined });
                        }}
                        className={valueFormErrors.name ? "border-destructive" : ""}
                      />
                      {valueFormErrors.name && (
                        <p className="text-xs text-destructive">{valueFormErrors.name}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price Delta ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={valueForm.price_delta}
                        onChange={(e) => {
                          setValueForm({ ...valueForm, price_delta: e.target.value });
                          if (valueFormErrors.price_delta)
                            setValueFormErrors({ ...valueFormErrors, price_delta: undefined });
                        }}
                        className={valueFormErrors.price_delta ? "border-destructive" : ""}
                      />
                      {valueFormErrors.price_delta && (
                        <p className="text-xs text-destructive">{valueFormErrors.price_delta}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={valueForm.is_default}
                        onCheckedChange={(c) => setValueForm({ ...valueForm, is_default: c })}
                      />
                      Default
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={valueForm.is_available}
                        onCheckedChange={(c) => setValueForm({ ...valueForm, is_available: c })}
                      />
                      Available
                    </label>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Sort</Label>
                      <Input
                        type="number"
                        min="0"
                        value={valueForm.sort_order}
                        onChange={(e) => setValueForm({ ...valueForm, sort_order: e.target.value })}
                        className="w-16 h-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsValueFormOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveValue}
                      disabled={isSubmitting || !valueForm.name.trim()}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : editingValue ? (
                        "Update"
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={openCreateValueForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Value
                </Button>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsValuesDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Value Dialog */}
      <AlertDialog open={isDeleteValueDialogOpen} onOpenChange={setIsDeleteValueDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Option Value</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingValue?.name}"? Default values and values
              used in orders cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteValue}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
