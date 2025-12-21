/**
 * Callers Page (Client Dashboard)
 * Manage customer information and view interaction history
 * Auto-scoped to the authenticated restaurant via JWT token
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneInput } from "@/components/ui/phone-input";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Phone,
  Mail,
  MapPin,
  Search,
  X,
  Eye,
  Pencil,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
  PhoneCall,
  ShoppingCart,
  CalendarCheck,
  AlertTriangle,
  XCircle,
  RefreshCw,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUsers,
  getUserDetails,
  createUser,
  updateUser,
  type DashboardUser,
  type DashboardUserDetailsResponse,
  type DashboardUserCreateRequest,
  type DashboardUserUpdateRequest,
} from "@/services/callers";

// ============================================================================
// Helper Functions
// ============================================================================

const formatDateTime = (dateTime: string) => {
  // Format in Vancouver timezone
  const date = new Date(dateTime);
  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Vancouver",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Vancouver",
    }),
  };
};

const isSpam = (value: number | boolean): boolean => {
  return value === 1 || value === true;
};

// ============================================================================
// Types
// ============================================================================

interface CallerFormData {
  name: string;
  phone_number: string;
  email: string;
  address: string;
  is_spam: boolean;
  credit_card: string;
}

const defaultFormData: CallerFormData = {
  name: "",
  phone_number: "",
  email: "",
  address: "",
  is_spam: false,
  credit_card: "",
};

// ============================================================================
// Component
// ============================================================================

export function Callers() {
  const { restaurantId } = useAuth();

  // Callers state
  const [callers, setCallers] = useState<DashboardUser[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [spamFilter, setSpamFilter] = useState<string>("all");

  // Pagination state
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCaller, setSelectedCaller] = useState<DashboardUserDetailsResponse | null>(null);
  const [selectedCallerForEdit, setSelectedCallerForEdit] = useState<DashboardUser | null>(null);
  const [formData, setFormData] = useState<CallerFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Debounce refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // Fetch Functions
  // ============================================================================

  const fetchCallers = useCallback(async () => {
    if (!restaurantId) return;

    try {
      setIsLoading(true);
      setError(null);

      const params: {
        search?: string;
        is_spam?: boolean;
        limit: number;
        offset: number;
      } = {
        limit,
        offset,
      };

      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }
      if (spamFilter !== "all") {
        params.is_spam = spamFilter === "spam";
      }

      const data = await getUsers(restaurantId, params);
      setCallers(data.users);
      setTotal(data.total);
      setHasMore(data.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
      setCallers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, debouncedSearchQuery, spamFilter, limit, offset]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setOffset(0);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    if (restaurantId) {
      fetchCallers();
    }
  }, [fetchCallers, restaurantId]);

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [spamFilter]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setSpamFilter("all");
    setOffset(0);
    setError(null);
  };

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setFormErrors({});
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (caller: DashboardUser) => {
    setSelectedCallerForEdit(caller);
    setFormData({
      name: caller.name,
      phone_number: caller.phone_number,
      email: caller.email || "",
      address: caller.address || "",
      is_spam: isSpam(caller.is_spam),
      credit_card: caller.credit_card || "",
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openDetailsDialog = async (caller: DashboardUser) => {
    try {
      setIsLoadingDetails(true);
      setIsDetailsDialogOpen(true);
      const details = await getUserDetails(caller.id);
      setSelectedCaller(details);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load customer details");
      setIsDetailsDialogOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (formData.name.trim().length > 100) {
      errors.name = "Name must be less than 100 characters";
    }

    // Phone validation
    // Note: This validates digit count (10-15) which covers most international formats
    // For stricter validation (country codes, format), consider using a library like libphonenumber-js
    if (!formData.phone_number.trim()) {
      errors.phone_number = "Phone number is required";
    } else {
      const digitsOnly = formData.phone_number.replace(/\D/g, "");
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        errors.phone_number = "Please enter a valid phone number (10-15 digits)";
      }
    }

    // Email validation (optional)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Please enter a valid email address";
      }
    }

    // Address validation (max length)
    if (formData.address && formData.address.length > 500) {
      errors.address = "Address must be less than 500 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!restaurantId) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload: DashboardUserCreateRequest = {
        name: formData.name.trim(),
        phone_number: formData.phone_number.trim(),
        ...(formData.email.trim() ? { email: formData.email.trim() } : {}),
        ...(formData.address.trim() ? { address: formData.address.trim() } : {}),
        is_spam: formData.is_spam,
        ...(formData.credit_card.trim() ? { credit_card: formData.credit_card.trim() } : {}),
      };

      const response = await createUser(restaurantId, payload);
      toast.success(
        response.is_new_user ? "Customer created successfully" : "Existing customer added"
      );
      setIsCreateDialogOpen(false);
      fetchCallers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCallerForEdit) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload: DashboardUserUpdateRequest = {
        name: formData.name.trim(),
        phone_number: formData.phone_number.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        is_spam: formData.is_spam,
        credit_card: formData.credit_card.trim() || undefined,
      };

      await updateUser(selectedCallerForEdit.id, payload);
      toast.success("Customer updated successfully");
      setIsEditDialogOpen(false);
      fetchCallers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const hasActiveFilters = searchQuery || spamFilter !== "all";

  // Stats
  const totalCustomers = total;
  const spamCustomers = callers.filter((c) => isSpam(c.is_spam)).length;
  const activeCustomers = callers.filter((c) => !isSpam(c.is_spam)).length;

  // ============================================================================
  // Render Form
  // ============================================================================

  const renderForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Full Name{" "}
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="name"
          placeholder="John Smith"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
          }}
          className={formErrors.name ? "border-destructive" : ""}
          maxLength={100}
        />
        {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone_number">
            Phone Number{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <PhoneInput
            id="phone_number"
            placeholder="1234567890"
            value={formData.phone_number}
            onChange={(value) => {
              setFormData({ ...formData, phone_number: value });
              if (formErrors.phone_number) setFormErrors({ ...formErrors, phone_number: "" });
            }}
            error={!!formErrors.phone_number}
          />
          {formErrors.phone_number && (
            <p className="text-sm text-destructive">{formErrors.phone_number}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
            }}
            className={formErrors.email ? "border-destructive" : ""}
          />
          {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          placeholder="123 Main St, City, State 12345"
          value={formData.address}
          onChange={(e) => {
            setFormData({ ...formData, address: e.target.value });
            if (formErrors.address) setFormErrors({ ...formErrors, address: "" });
          }}
          className={formErrors.address ? "border-destructive" : ""}
          maxLength={500}
        />
        {formErrors.address && <p className="text-sm text-destructive">{formErrors.address}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="credit_card">Card Last 4 Digits (non-sensitive)</Label>
        <Input
          id="credit_card"
          placeholder="1234"
          inputMode="numeric"
          maxLength={4}
          value={formData.credit_card}
          onChange={(e) => {
            // Only allow digits
            const digitsOnly = e.target.value.replace(/\D/g, "");
            if (digitsOnly.length <= 4) {
              setFormData({ ...formData, credit_card: digitsOnly });
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          Store only the last 4 digits of the card number. Do not enter full credit card details.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="is_spam" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Mark as Blocked
          </Label>
          <p className="text-sm text-muted-foreground">
            Block this customer from making orders and reservations
          </p>
        </div>
        <Switch
          id="is_spam"
          checked={formData.is_spam}
          onCheckedChange={(checked) => setFormData({ ...formData, is_spam: checked })}
        />
      </div>
    </div>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Manage customer information and view interaction history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openCreateDialog} disabled={!restaurantId} className="flex-shrink-0">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchCallers}
            disabled={isLoading || !restaurantId}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blocked</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spamCustomers}</div>
          </CardContent>
        </Card>
        <Card className="hidden lg:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Page
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="space-y-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Status Filter */}
              <Select value={spamFilter} onValueChange={setSpamFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="regular">Active</SelectItem>
                  <SelectItem value="spam">Blocked</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Clear all filters"
                >
                  <X className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="flex items-center gap-3 p-4 mb-4 text-sm bg-destructive/10 border border-destructive/20 rounded-lg">
              <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-destructive">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border rounded-lg -mx-1 sm:mx-0">
                <TooltipProvider>
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">
                          Contact
                        </TableHead>
                        <TableHead className="font-semibold text-center">Calls</TableHead>
                        <TableHead className="font-semibold text-center">Orders</TableHead>
                        <TableHead className="font-semibold text-center hidden sm:table-cell">
                          Reservations
                        </TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callers.map((caller) => {
                        const spam = isSpam(caller.is_spam);
                        return (
                          <TableRow
                            key={caller.id}
                            className={`group hover:bg-muted/30 transition-colors ${
                              spam ? "bg-red-50/50 dark:bg-red-950/20" : ""
                            }`}
                          >
                            <TableCell>
                              <div className="min-w-[150px]">
                                <p className="font-medium">{caller.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Phone className="h-3 w-3" />
                                  {caller.phone_number}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="space-y-1">
                                {caller.email && (
                                  <p className="text-sm flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    {caller.email}
                                  </p>
                                )}
                                {caller.address && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-[200px]">{caller.address}</span>
                                  </p>
                                )}
                                {!caller.email && !caller.address && (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="gap-1">
                                <PhoneCall className="h-3 w-3" />
                                {caller.statistics?.total_calls ?? 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="gap-1">
                                <ShoppingCart className="h-3 w-3" />
                                {caller.statistics?.total_orders ?? 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              <Badge variant="outline" className="gap-1">
                                <CalendarCheck className="h-3 w-3" />
                                {caller.statistics?.total_reservations ?? 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {spam ? (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Blocked
                                </Badge>
                              ) : (
                                <Badge variant="default" className="bg-green-600">
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1 sm:gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 sm:h-8 sm:w-8 hover:bg-blue-50 dark:hover:bg-blue-950"
                                      onClick={() => openDetailsDialog(caller)}
                                    >
                                      <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 sm:h-8 sm:w-8 hover:bg-muted"
                                      onClick={() => openEditDialog(caller)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Customer</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center sm:text-left">
                    Showing {callers.length > 0 ? offset + 1 : 0} to{" "}
                    {Math.min(offset + callers.length, total)} of {total} customers
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset((o) => Math.max(0, o - limit))}
                      disabled={offset === 0 || isLoading}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset((o) => o + limit)}
                      disabled={!hasMore || isLoading}
                      aria-label="Next page"
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {!isLoading && !error && callers.length === 0 && restaurantId && (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-2">No customers found</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your search criteria or filters to see more results."
                  : "Customers who call, make orders, or reservations will appear here."}
              </p>
              {!hasActiveFilters && (
                <Button onClick={openCreateDialog} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Customer
                </Button>
              )}
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          )}

          {!restaurantId && (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-2">Loading...</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Please wait while we load your restaurant data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Add a new customer to your restaurant's database</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information for {selectedCallerForEdit?.name}
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Details
            </DialogTitle>
            <DialogDescription>
              {selectedCaller ? `Customer #${selectedCaller.id}` : "Loading..."}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : selectedCaller ? (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                {isSpam(selectedCaller.is_spam) ? (
                  <Badge variant="destructive" className="gap-1 text-sm px-3 py-1">
                    <AlertTriangle className="h-4 w-4" />
                    Blocked Customer
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-green-600 text-sm px-3 py-1">
                    Active Customer
                  </Badge>
                )}
              </div>

              {/* Basic Info */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Full Name</Label>
                    <p className="font-medium">{selectedCaller.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Phone</Label>
                    <p className="font-medium font-mono">{selectedCaller.phone_number}</p>
                  </div>
                </div>

                {selectedCaller.email && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedCaller.email}
                    </p>
                  </div>
                )}

                {selectedCaller.address && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Address</Label>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {selectedCaller.address}
                    </p>
                  </div>
                )}

                {selectedCaller.credit_card && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Credit Card</Label>
                    <p className="font-medium flex items-center gap-1 font-mono">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {selectedCaller.credit_card}
                    </p>
                  </div>
                )}
              </div>

              {/* Statistics */}
              {selectedCaller.statistics && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-blue-700 dark:text-blue-300">
                      <PhoneCall className="h-5 w-5" />
                      {selectedCaller.statistics.total_calls}
                    </div>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
                      Calls
                    </p>
                  </div>
                  <div className="rounded-lg p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      <ShoppingCart className="h-5 w-5" />
                      {selectedCaller.statistics.total_orders}
                    </div>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">
                      Orders
                    </p>
                  </div>
                  <div className="rounded-lg p-3 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/50 dark:to-violet-900/30 border border-violet-200/50 dark:border-violet-800/50 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-violet-700 dark:text-violet-300">
                      <CalendarCheck className="h-5 w-5" />
                      {selectedCaller.statistics.total_reservations}
                    </div>
                    <p className="text-xs text-violet-600/70 dark:text-violet-400/70 font-medium">
                      Reservations
                    </p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t text-sm">
                <div>
                  <Label className="text-muted-foreground text-xs">Created</Label>
                  <p>
                    {formatDateTime(selectedCaller.created_at).date}{" "}
                    {formatDateTime(selectedCaller.created_at).time}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Last Updated</Label>
                  <p>
                    {formatDateTime(selectedCaller.updated_at).date}{" "}
                    {formatDateTime(selectedCaller.updated_at).time}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedCaller && (
              <Button
                onClick={() => {
                  setIsDetailsDialogOpen(false);
                  openEditDialog(selectedCaller as DashboardUser);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Customer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Callers;
