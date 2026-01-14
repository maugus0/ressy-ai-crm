/**
 * Menu Page
 * Manage menu items, categories, and specials
 * Integrates with /api/v1/client/menu endpoints
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Search,
  Star,
  StarOff,
  Eye,
  EyeOff,
  UtensilsCrossed,
  Clock,
  Filter,
  X,
  CheckSquare,
  RefreshCw,
  AlertCircle,
  Loader2,
  FileText,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMenuItems,
  getMenuItem,
  getMenuCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuAvailability,
  toggleMenuSpecial,
  bulkUpdateMenuAvailability,
} from "@/services/menu";
import {
  parseCSVLine,
  sanitizeCSVValue,
  validateCSVFileSize,
  MAX_CSV_FILE_SIZE,
} from "@/lib/utils/csv";
import { formatLocalDate } from "@/lib/utils/timezone";
import type {
  ClientMenuItem,
  ClientMenuItemCreateRequest,
  MenuCategoriesResponse,
} from "@/types/api.types";

// ============================================================================
// Types
// ============================================================================

interface MenuFormData {
  item_name: string;
  price: string;
  category: string;
  sub_category: string;
  item_desc: string;
  avg_prep_time: string;
  is_available: boolean;
  is_special: boolean;
}

interface FormErrors {
  item_name?: string;
  price?: string;
  category?: string;
  sub_category?: string;
  item_desc?: string;
  avg_prep_time?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const defaultFormData: MenuFormData = {
  item_name: "",
  price: "",
  category: "",
  sub_category: "",
  item_desc: "",
  avg_prep_time: "15", // Default to 15 minutes
  is_available: true,
  is_special: false,
};

// ============================================================================
// Component
// ============================================================================

export function Menu() {
  // Menu items state
  const [menuItems, setMenuItems] = useState<ClientMenuItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Categories state
  const [categories, setCategories] = useState<MenuCategoriesResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAvailable, setFilterAvailable] = useState<boolean | undefined>(undefined);
  const [filterSpecial, setFilterSpecial] = useState<boolean | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<ClientMenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk selection state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkAvailability, setBulkAvailability] = useState(true);

  // CSV upload state
  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParsing, setCsvParsing] = useState(false);

  // ============================================================================
  // Fetch Functions
  // ============================================================================

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getMenuCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  const fetchMenuItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMenuItems({
        page: currentPage,
        limit: 20,
        category: selectedCategory || undefined,
        sub_category: selectedSubCategory || undefined,
        is_available: filterAvailable,
        is_special: filterSpecial,
        search: searchQuery || undefined,
      });
      setMenuItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu items");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    selectedCategory,
    selectedSubCategory,
    filterAvailable,
    filterSpecial,
    searchQuery,
  ]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  useEffect(() => {
    if (selectedCategory && categories?.categories[selectedCategory]) {
      setAvailableSubCategories(categories.categories[selectedCategory]);
    } else {
      setAvailableSubCategories([]);
    }
    setSelectedSubCategory("");
  }, [selectedCategory, categories]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMenuItems();
  };

  const handleClearFilters = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setFilterAvailable(undefined);
    setFilterSpecial(undefined);
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    const itemName = formData.item_name.trim();
    if (!itemName) {
      errors.item_name = "Item name is required";
    } else if (itemName.length > 200) {
      errors.item_name = "Item name must be less than 200 characters";
    }

    const priceStr = formData.price.trim();
    if (!priceStr) {
      errors.price = "Price is required";
    } else {
      const price = parseFloat(priceStr);
      if (isNaN(price)) {
        errors.price = "Please enter a valid price";
      } else if (price < 0) {
        errors.price = "Price cannot be negative";
      } else if (price > 99999.99) {
        errors.price = "Price is too high";
      }
    }

    const category = formData.category.trim();
    if (!category) {
      errors.category = "Category is required";
    } else if (category.length > 100) {
      errors.category = "Category must be less than 100 characters";
    }

    if (formData.sub_category && formData.sub_category.length > 100) {
      errors.sub_category = "Sub-category must be less than 100 characters";
    }

    // Prep time is mandatory
    if (!formData.avg_prep_time || !formData.avg_prep_time.trim()) {
      errors.avg_prep_time = "Prep time is required";
    } else {
      const prepTime = parseInt(formData.avg_prep_time);
      if (isNaN(prepTime)) {
        errors.avg_prep_time = "Please enter a valid number";
      } else if (prepTime < 1) {
        errors.avg_prep_time = "Prep time must be at least 1 minute";
      } else if (prepTime > 999) {
        errors.avg_prep_time = "Prep time is too high (max 999 minutes)";
      }
    }

    if (formData.item_desc && formData.item_desc.length > 1000) {
      errors.item_desc = "Description must be less than 1000 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setFormErrors({});
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (item: ClientMenuItem) => {
    setSelectedMenuItem(item);
    setFormData({
      item_name: item.item_name,
      price: item.price,
      category: item.category,
      sub_category: item.sub_category || "",
      item_desc: item.item_desc || "",
      avg_prep_time: String(item.avg_prep_time),
      is_available: item.is_available,
      is_special: item.is_special,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: ClientMenuItem) => {
    setSelectedMenuItem(item);
    setIsDeleteDialogOpen(true);
  };

  const openDetailsDialog = async (item: ClientMenuItem) => {
    try {
      const details = await getMenuItem(item.id);
      setSelectedMenuItem(details);
      setIsDetailsDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load details");
    }
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload: ClientMenuItemCreateRequest = {
        item_name: formData.item_name.trim(),
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        ...(formData.sub_category.trim() && { sub_category: formData.sub_category.trim() }),
        ...(formData.item_desc.trim() && { item_desc: formData.item_desc.trim() }),
        avg_prep_time: parseInt(formData.avg_prep_time), // Now mandatory
        is_available: formData.is_available,
        is_special: formData.is_special,
      };

      await createMenuItem(payload);
      toast.success("Menu item created successfully");
      setIsCreateDialogOpen(false);
      fetchMenuItems();
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedMenuItem || !validateForm()) return;

    try {
      setIsSubmitting(true);
      await updateMenuItem(selectedMenuItem.id, {
        item_name: formData.item_name.trim(),
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        ...(formData.sub_category.trim() && { sub_category: formData.sub_category.trim() }),
        ...(formData.item_desc.trim() && { item_desc: formData.item_desc.trim() }),
        avg_prep_time: parseInt(formData.avg_prep_time), // Now mandatory
        is_available: formData.is_available,
        is_special: formData.is_special,
      });
      toast.success("Menu item updated successfully");
      setIsEditDialogOpen(false);
      fetchMenuItems();
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMenuItem) return;

    try {
      setIsSubmitting(true);
      await deleteMenuItem(selectedMenuItem.id);
      toast.success("Menu item deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchMenuItems();
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (item: ClientMenuItem) => {
    try {
      await toggleMenuAvailability(item.id, { is_available: !item.is_available });
      toast.success(`${item.item_name} is now ${!item.is_available ? "available" : "unavailable"}`);
      fetchMenuItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update availability");
    }
  };

  const handleToggleSpecial = async (item: ClientMenuItem) => {
    try {
      await toggleMenuSpecial(item.id, { is_special: !item.is_special });
      toast.success(
        `${item.item_name} is ${!item.is_special ? "now a special" : "no longer a special"}`
      );
      fetchMenuItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update special status");
    }
  };

  // Bulk operations
  const handleSelectItem = (id: number, checked: boolean) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(new Set(menuItems.map((item) => item.id)));
    } else {
      setSelectedItemIds(new Set());
    }
  };

  const handleBulkAvailability = async () => {
    if (selectedItemIds.size === 0) return;

    try {
      setIsSubmitting(true);
      const result = await bulkUpdateMenuAvailability({
        menu_item_ids: Array.from(selectedItemIds),
        is_available: bulkAvailability,
      });
      toast.success(`Updated availability for ${result.updated_count} item(s)`);
      setIsBulkDialogOpen(false);
      setSelectedItemIds(new Set());
      fetchMenuItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to bulk update");
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV Upload Handler
  const handleCsvFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    // Validate file size
    if (!validateCSVFileSize(file)) {
      toast.error(`File size must be less than ${MAX_CSV_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    setCsvFile(file);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    try {
      setCsvParsing(true);
      const text = await csvFile.text();
      const lines = text.split("\n").filter((line) => line.trim() !== "");

      if (lines.length === 0) {
        toast.error("CSV file is empty");
        return;
      }

      // Parse CSV - expect format: menu_item_id (first column)
      // Optional header row - skip if first line doesn't look like a number
      let startIndex = 0;
      const firstLine = parseCSVLine(lines[0]);
      if (firstLine.length > 0 && isNaN(Number(sanitizeCSVValue(firstLine[0])))) {
        // First line is likely a header, skip it
        startIndex = 1;
      }

      const menuItemIds: number[] = [];
      const errors: string[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = parseCSVLine(line);
        if (columns.length === 0) continue;

        // Get first column (menu_item_id)
        const idStr = sanitizeCSVValue(columns[0]);
        const id = parseInt(idStr, 10);

        if (isNaN(id)) {
          errors.push(`Line ${i + 1}: Invalid menu item ID "${idStr}"`);
          continue;
        }

        if (id <= 0) {
          errors.push(`Line ${i + 1}: Menu item ID must be positive`);
          continue;
        }

        menuItemIds.push(id);
      }

      if (menuItemIds.length === 0) {
        toast.error("No valid menu item IDs found in CSV file");
        if (errors.length > 0) {
          console.error("CSV parsing errors:", errors);
        }
        return;
      }

      if (errors.length > 0) {
        toast.warning(
          `${errors.length} error(s) found, but processing ${menuItemIds.length} valid ID(s)`
        );
        console.warn("CSV parsing warnings:", errors);
      }

      // Perform bulk update
      setIsSubmitting(true);
      const result = await bulkUpdateMenuAvailability({
        menu_item_ids: menuItemIds,
        is_available: bulkAvailability,
      });

      toast.success(`Updated availability for ${result.updated_count} item(s) from CSV`);
      setIsCsvDialogOpen(false);
      setCsvFile(null);
      fetchMenuItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process CSV file");
    } finally {
      setCsvParsing(false);
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getCategoryList = (): string[] => {
    if (!categories?.categories) return [];
    return Object.keys(categories.categories).sort();
  };

  const formatDate = (dateStr: string) =>
    formatLocalDate(dateStr, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // ============================================================================
  // Render Form
  // ============================================================================

  const renderForm = () => (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="item_name">Item Name *</Label>
            <Input
              id="item_name"
              placeholder="e.g., Margherita Pizza"
              value={formData.item_name}
              onChange={(e) => {
                setFormData({ ...formData, item_name: e.target.value });
                if (formErrors.item_name) setFormErrors({ ...formErrors, item_name: undefined });
              }}
              className={formErrors.item_name ? "border-destructive" : ""}
              maxLength={200}
            />
            {formErrors.item_name && (
              <p className="text-sm text-destructive">{formErrors.item_name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                max="99999.99"
                placeholder="15.99"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (formErrors.price) setFormErrors({ ...formErrors, price: undefined });
                }}
                className={formErrors.price ? "border-destructive" : ""}
              />
              {formErrors.price && <p className="text-sm text-destructive">{formErrors.price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="avg_prep_time">Prep Time (min) *</Label>
              <Input
                id="avg_prep_time"
                type="number"
                min="1"
                max="999"
                placeholder="15"
                value={formData.avg_prep_time}
                onChange={(e) => {
                  setFormData({ ...formData, avg_prep_time: e.target.value });
                  if (formErrors.avg_prep_time)
                    setFormErrors({ ...formErrors, avg_prep_time: undefined });
                }}
                className={formErrors.avg_prep_time ? "border-destructive" : ""}
                required
              />
              {formErrors.avg_prep_time && (
                <p className="text-sm text-destructive">{formErrors.avg_prep_time}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <div className="space-y-2">
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    if (value === "__new__") {
                      setFormData({ ...formData, category: "" });
                    } else {
                      setFormData({ ...formData, category: value, sub_category: "" });
                    }
                    if (formErrors.category) setFormErrors({ ...formErrors, category: undefined });
                  }}
                >
                  <SelectTrigger className={formErrors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select or type new" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoryList().map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__">+ New Category</SelectItem>
                  </SelectContent>
                </Select>
                {(formData.category === "" || !getCategoryList().includes(formData.category)) && (
                  <Input
                    placeholder="Type new category..."
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      if (formErrors.category)
                        setFormErrors({ ...formErrors, category: undefined });
                    }}
                    maxLength={100}
                  />
                )}
              </div>
              {formErrors.category && (
                <p className="text-sm text-destructive">{formErrors.category}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub_category">Sub-Category</Label>
              <div className="space-y-2">
                {categories?.categories[formData.category]?.length ? (
                  <Select
                    value={formData.sub_category}
                    onValueChange={(value) => {
                      if (value === "__new__") {
                        setFormData({ ...formData, sub_category: "" });
                      } else {
                        setFormData({ ...formData, sub_category: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select or type new" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.categories[formData.category].map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__">+ New Sub-Category</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
                {(!categories?.categories[formData.category]?.length ||
                  formData.sub_category === "" ||
                  !categories?.categories[formData.category]?.includes(formData.sub_category)) && (
                  <Input
                    placeholder="Type sub-category (optional)..."
                    value={formData.sub_category}
                    onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                    maxLength={100}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="details" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="item_desc">Description</Label>
          <Textarea
            id="item_desc"
            placeholder="Describe the menu item..."
            value={formData.item_desc}
            onChange={(e) => {
              setFormData({ ...formData, item_desc: e.target.value });
              if (formErrors.item_desc) setFormErrors({ ...formErrors, item_desc: undefined });
            }}
            className={formErrors.item_desc ? "border-destructive" : ""}
            rows={3}
            maxLength={1000}
          />
          <div className="flex justify-between">
            {formErrors.item_desc ? (
              <p className="text-sm text-destructive">{formErrors.item_desc}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted-foreground">{formData.item_desc.length}/1000</p>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg border">
          <div className="space-y-0.5">
            <Label>Available</Label>
            <p className="text-sm text-muted-foreground">Item can be ordered</p>
          </div>
          <Switch
            checked={formData.is_available}
            onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
          />
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg border">
          <div className="space-y-0.5">
            <Label>Special</Label>
            <p className="text-sm text-muted-foreground">Mark as today's special</p>
          </div>
          <Switch
            checked={formData.is_special}
            onCheckedChange={(checked) => setFormData({ ...formData, is_special: checked })}
          />
        </div>
      </TabsContent>
    </Tabs>
  );

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading && menuItems.length === 0) {
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
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // Error State
  // ============================================================================

  if (error && menuItems.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading menu</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchMenuItems}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Menu Management</h2>
          <p className="text-muted-foreground">Manage menu items, categories, and specials</p>
        </div>
        <Button onClick={openCreateDialog} className="flex-shrink-0">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Menu Item</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          {/* Stats Row */}
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <CardTitle>Menu Items</CardTitle>
            {pagination && <Badge variant="secondary">{pagination.total} items</Badge>}
          </div>

          {/* Search and Filter Row */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Category Filter */}
              <Select
                value={selectedCategory || "all"}
                onValueChange={(v) => {
                  setSelectedCategory(v === "all" ? "" : v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getCategoryList().map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sub-Category Filter */}
              {availableSubCategories.length > 0 && (
                <Select
                  value={selectedSubCategory || "all"}
                  onValueChange={(v) => {
                    setSelectedSubCategory(v === "all" ? "" : v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {availableSubCategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* More Filters Toggle */}
              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>

              {/* Clear Filters */}
              {(selectedCategory || searchQuery || filterAvailable !== undefined) && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Additional Filters */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Availability:</Label>
                <Select
                  value={filterAvailable === undefined ? "all" : String(filterAvailable)}
                  onValueChange={(v) => {
                    setFilterAvailable(v === "all" ? undefined : v === "true");
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Available</SelectItem>
                    <SelectItem value="false">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Special:</Label>
                <Select
                  value={filterSpecial === undefined ? "all" : String(filterSpecial)}
                  onValueChange={(v) => {
                    setFilterSpecial(v === "all" ? undefined : v === "true");
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Specials Only</SelectItem>
                    <SelectItem value="false">Non-Specials</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 bg-muted/30 rounded-lg">
            {selectedItemIds.size > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {selectedItemIds.size} item(s) selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkAvailability(true);
                      setIsBulkDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Set Available</span>
                    <span className="sm:hidden">Available</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkAvailability(false);
                      setIsBulkDialogOpen(true);
                    }}
                  >
                    <EyeOff className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Set Unavailable</span>
                    <span className="sm:hidden">Unavailable</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedItemIds(new Set())}>
                    Clear
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Bulk update via CSV:</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkAvailability(true);
                    setIsCsvDialogOpen(true);
                  }}
                >
                  <Upload className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Upload CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Table */}
          <div className="overflow-x-auto border rounded-lg -mx-1 sm:mx-0">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={
                        menuItems.length > 0 &&
                        menuItems.every((item) => selectedItemIds.has(item.id))
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">Item</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Category</TableHead>
                  <TableHead className="font-semibold text-right hidden sm:table-cell">
                    Price
                  </TableHead>
                  <TableHead className="font-semibold text-center hidden lg:table-cell">
                    Prep
                  </TableHead>
                  <TableHead className="font-semibold text-center">Available</TableHead>
                  <TableHead className="font-semibold text-center hidden sm:table-cell">
                    Special
                  </TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Checkbox
                        checked={selectedItemIds.has(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[140px] sm:min-w-[200px]">
                        <p className="font-medium text-sm sm:text-base">{item.item_name}</p>
                        {item.item_desc && (
                          <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[180px] sm:max-w-[280px]">
                            {item.item_desc}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 sm:hidden">
                          <span className="text-xs font-semibold text-primary">${item.price}</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit">
                          {item.category}
                        </Badge>
                        {item.sub_category && (
                          <span className="text-xs text-muted-foreground">{item.sub_category}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <span className="font-semibold text-primary">${item.price}</span>
                    </TableCell>
                    <TableCell className="text-center hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-sm">{item.avg_prep_time}m</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                          item.is_available
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {item.is_available ? (
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
                      </button>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <button
                        onClick={() => handleToggleSpecial(item)}
                        className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                          item.is_special
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {item.is_special ? (
                          <>
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Special
                          </>
                        ) : (
                          <>
                            <StarOff className="h-3 w-3 mr-1" />
                            Regular
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 sm:gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDetailsDialog(item)}
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDeleteDialog(item)}
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

          {/* Empty State */}
          {!isLoading && menuItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No menu items found</p>
              <p className="text-sm">
                {searchQuery || selectedCategory
                  ? "Try adjusting your filters"
                  : "Add your first menu item to get started"}
              </p>
              {!searchQuery && !selectedCategory && (
                <Button className="mt-4" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Menu Item
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                Page {pagination.page} of {pagination.pages} ({pagination.total} items)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={currentPage === pagination.pages}
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
            <DialogDescription>Create a new menu item for your restaurant</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                isSubmitting || !formData.item_name || !formData.price || !formData.category
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>Update the menu item details</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                isSubmitting || !formData.item_name || !formData.price || !formData.category
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedMenuItem?.item_name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMenuItem?.item_name}</DialogTitle>
            <DialogDescription>Menu item details</DialogDescription>
          </DialogHeader>
          {selectedMenuItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedMenuItem.category}</p>
                  {selectedMenuItem.sub_category && (
                    <p className="text-sm text-muted-foreground">{selectedMenuItem.sub_category}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Price</Label>
                  <p className="font-medium text-lg">${selectedMenuItem.price}</p>
                </div>
              </div>

              {selectedMenuItem.item_desc && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="break-words">{selectedMenuItem.item_desc}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Prep Time</Label>
                  <p className="font-medium">{selectedMenuItem.avg_prep_time} minutes</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant={selectedMenuItem.is_available ? "default" : "secondary"}>
                      {selectedMenuItem.is_available ? "Available" : "Unavailable"}
                    </Badge>
                    {selectedMenuItem.is_special && <Badge variant="destructive">Special</Badge>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="text-sm">{formatDate(selectedMenuItem.created_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated</Label>
                  <p className="text-sm">{formatDate(selectedMenuItem.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedMenuItem && (
              <Button
                onClick={() => {
                  setIsDetailsDialogOpen(false);
                  openEditDialog(selectedMenuItem);
                }}
              >
                Edit Item
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Availability Dialog */}
      <AlertDialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Update Availability</AlertDialogTitle>
            <AlertDialogDescription>
              Set {selectedItemIds.size} item(s) to{" "}
              <span className="font-semibold">
                {bulkAvailability ? "Available" : "Unavailable"}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkAvailability}>
              {isSubmitting ? "Updating..." : "Update"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Upload Dialog */}
      <Dialog open={isCsvDialogOpen} onOpenChange={setIsCsvDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bulk Update via CSV
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file with menu item IDs to bulk update availability. CSV format: one menu
              item ID per line (first column).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleCsvFileSelect}
                disabled={csvParsing || isSubmitting}
              />
              {csvFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• CSV format: One menu item ID per line (first column)</p>
                <p>• Optional header row will be automatically skipped</p>
                <p>• Maximum file size: {(MAX_CSV_FILE_SIZE / 1024 / 1024).toFixed(0)}MB</p>
                <p>• Example:</p>
                <pre className="bg-muted p-2 rounded text-xs font-mono">
                  menu_item_id{`\n`}123{`\n`}456{`\n`}789
                </pre>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label>Set Availability To:</Label>
                <p className="text-sm text-muted-foreground">
                  {bulkAvailability ? "Available" : "Unavailable"}
                </p>
              </div>
              <Switch
                checked={bulkAvailability}
                onCheckedChange={setBulkAvailability}
                disabled={csvParsing || isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCsvDialogOpen(false);
                setCsvFile(null);
              }}
              disabled={csvParsing || isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCsvUpload} disabled={!csvFile || csvParsing || isSubmitting}>
              {csvParsing || isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Update
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Menu;
