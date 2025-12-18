/**
 * FAQ Page
 * Manage restaurant FAQs with CRUD operations and bulk upload
 * Integrates with /api/v1/client/faqs endpoints
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Search,
  HelpCircle,
  Eye,
  Upload,
  X,
  RefreshCw,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { getFAQs, getFAQ, createFAQ, updateFAQ, deleteFAQ, bulkCreateFAQs } from "@/services/faq";
import {
  parseCSVLine,
  sanitizeCSVValue,
  validateCSVFileSize,
  MAX_CSV_FILE_SIZE,
} from "@/lib/utils/csv";
import type { ClientFAQ } from "@/types/api.types";

// ============================================================================
// Types
// ============================================================================

interface FAQFormData {
  question: string;
  answer: string;
}

interface BulkFAQEntry {
  question: string;
  answer: string;
}

interface FormErrors {
  question?: string;
  answer?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const defaultFormData: FAQFormData = {
  question: "",
  answer: "",
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ============================================================================
// Component
// ============================================================================

export function FAQ() {
  // FAQs state
  const [faqs, setFaqs] = useState<ClientFAQ[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<ClientFAQ | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FAQFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Bulk create state
  const [bulkEntries, setBulkEntries] = useState<BulkFAQEntry[]>([{ question: "", answer: "" }]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

  // ============================================================================
  // Fetch FAQs
  // ============================================================================

  const fetchFAQs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getFAQs({
        page: currentPage,
        limit: 20,
        search: debouncedSearch || undefined,
      });
      setFaqs(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load FAQs");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev !== searchQuery) {
          setCurrentPage(1);
        }
        return searchQuery;
      });
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // ============================================================================
  // Form Validation
  // ============================================================================

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    const question = formData.question.trim();
    if (!question) {
      errors.question = "Question is required";
    } else if (question.length < 5) {
      errors.question = "Question must be at least 5 characters";
    } else if (question.length > 500) {
      errors.question = "Question must be less than 500 characters";
    }

    const answer = formData.answer.trim();
    if (!answer) {
      errors.answer = "Answer is required";
    } else if (answer.length < 5) {
      errors.answer = "Answer must be at least 5 characters";
    } else if (answer.length > 2000) {
      errors.answer = "Answer must be less than 2000 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setFormErrors({});
  };

  // ============================================================================
  // CRUD Handlers
  // ============================================================================

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await createFAQ({
        question: formData.question.trim(),
        answer: formData.answer.trim(),
      });
      toast.success("FAQ created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchFAQs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create FAQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFAQ || !validateForm()) return;

    try {
      setIsSubmitting(true);
      await updateFAQ(selectedFAQ.id, {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
      });
      toast.success("FAQ updated successfully");
      setIsEditDialogOpen(false);
      setSelectedFAQ(null);
      resetForm();
      fetchFAQs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update FAQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFAQ) return;

    try {
      setIsSubmitting(true);
      await deleteFAQ(selectedFAQ.id);
      toast.success("FAQ deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedFAQ(null);
      fetchFAQs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete FAQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Dialog Handlers
  // ============================================================================

  const openCreateDialog = () => {
    resetForm();
    setSelectedFAQ(null);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (faq: ClientFAQ) => {
    setSelectedFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (faq: ClientFAQ) => {
    setSelectedFAQ(faq);
    setIsDeleteDialogOpen(true);
  };

  const openDetailsDialog = async (faq: ClientFAQ) => {
    try {
      const details = await getFAQ(faq.id);
      setSelectedFAQ(details);
      setIsDetailsDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load FAQ details");
    }
  };

  const openBulkDialog = () => {
    setBulkEntries([{ question: "", answer: "" }]);
    setBulkErrors([]);
    setIsBulkDialogOpen(true);
  };

  // ============================================================================
  // Bulk Create Handlers
  // ============================================================================

  const addBulkEntry = () => {
    setBulkEntries([...bulkEntries, { question: "", answer: "" }]);
  };

  const removeBulkEntry = (index: number) => {
    if (bulkEntries.length > 1) {
      setBulkEntries(bulkEntries.filter((_, i) => i !== index));
    }
  };

  const updateBulkEntry = (index: number, field: keyof BulkFAQEntry, value: string) => {
    const updated = [...bulkEntries];
    updated[index][field] = value;
    setBulkEntries(updated);
  };

  const validateBulkEntries = (): boolean => {
    const errors: string[] = [];
    bulkEntries.forEach((entry, index) => {
      const question = entry.question.trim();
      const answer = entry.answer.trim();

      if (!question) {
        errors.push(`Entry ${index + 1}: Question is required`);
      } else if (question.length < 5) {
        errors.push(`Entry ${index + 1}: Question must be at least 5 characters`);
      } else if (question.length > 500) {
        errors.push(`Entry ${index + 1}: Question must be less than 500 characters`);
      }

      if (!answer) {
        errors.push(`Entry ${index + 1}: Answer is required`);
      } else if (answer.length < 5) {
        errors.push(`Entry ${index + 1}: Answer must be at least 5 characters`);
      } else if (answer.length > 2000) {
        errors.push(`Entry ${index + 1}: Answer must be less than 2000 characters`);
      }
    });
    setBulkErrors(errors);
    return errors.length === 0;
  };

  const handleBulkCreate = async () => {
    if (!validateBulkEntries()) return;

    try {
      setIsSubmitting(true);
      const validEntries = bulkEntries.filter((e) => e.question.trim() && e.answer.trim());

      const result = await bulkCreateFAQs({
        faqs: validEntries.map((e) => ({
          question: e.question.trim(),
          answer: e.answer.trim(),
        })),
      });

      toast.success(`Successfully created ${result.items.length} FAQ(s)`);
      setIsBulkDialogOpen(false);
      fetchFAQs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to bulk create FAQs");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // CSV Upload Handler
  // ============================================================================

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast.error("Please select a CSV or TXT file");
      event.target.value = "";
      return;
    }

    // Validate file size
    if (!validateCSVFileSize(file)) {
      toast.error(`File size must be less than ${MAX_CSV_FILE_SIZE / (1024 * 1024)}MB`);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const lines = text
          .split(/\r?\n/)
          .filter((line) => line.trim())
          .map((line) => line.trim());

        if (lines.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        const parsed: BulkFAQEntry[] = [];
        const errors: string[] = [];

        lines.forEach((line, lineIndex) => {
          // Skip header if present
          if (
            lineIndex === 0 &&
            (line.toLowerCase().includes("question") || line.toLowerCase().includes("answer"))
          ) {
            return;
          }

          // Parse CSV line with quote handling
          const parts = parseCSVLine(line);
          if (parts.length < 2) {
            errors.push(`Line ${lineIndex + 1}: Invalid format (need question and answer)`);
            return;
          }

          const question = sanitizeCSVValue(parts[0]);
          const answer = sanitizeCSVValue(parts[1]);

          if (!question || !answer) {
            errors.push(`Line ${lineIndex + 1}: Both question and answer are required`);
            return;
          }

          parsed.push({ question, answer });
        });

        if (parsed.length > 0) {
          setBulkEntries(parsed);
          setBulkErrors(errors);
          toast.success(`Loaded ${parsed.length} FAQ(s) from CSV`);
        } else {
          toast.error("No valid FAQs found in CSV file");
          setBulkErrors(errors);
        }
      } catch (err) {
        console.error("Error parsing CSV file:", err);
        toast.error(
          err instanceof Error
            ? `Failed to parse CSV file: ${err.message}`
            : "Failed to parse CSV file. Please check the format."
        );
      }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = "";
  };

  // ============================================================================
  // Render Form
  // ============================================================================

  const renderForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">Question *</Label>
        <Input
          id="question"
          placeholder="e.g., What are your hours of operation?"
          value={formData.question}
          onChange={(e) => {
            setFormData({ ...formData, question: e.target.value });
            if (formErrors.question) setFormErrors({ ...formErrors, question: undefined });
          }}
          className={formErrors.question ? "border-destructive" : ""}
          maxLength={500}
        />
        <div className="flex justify-between">
          {formErrors.question ? (
            <p className="text-sm text-destructive">{formErrors.question}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-muted-foreground">{formData.question.length}/500</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">Answer *</Label>
        <Textarea
          id="answer"
          placeholder="Provide a clear and helpful answer..."
          value={formData.answer}
          onChange={(e) => {
            setFormData({ ...formData, answer: e.target.value });
            if (formErrors.answer) setFormErrors({ ...formErrors, answer: undefined });
          }}
          className={formErrors.answer ? "border-destructive" : ""}
          rows={4}
          maxLength={2000}
        />
        <div className="flex justify-between">
          {formErrors.answer ? (
            <p className="text-sm text-destructive">{formErrors.answer}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-muted-foreground">{formData.answer.length}/2000</p>
        </div>
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
          <h2 className="text-2xl font-bold tracking-tight">FAQs</h2>
          <p className="text-muted-foreground">
            Manage frequently asked questions for your restaurant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openBulkDialog}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Add
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">All FAQs</CardTitle>
                {pagination && (
                  <p className="text-sm text-muted-foreground">
                    {pagination.total} FAQ{pagination.total !== 1 ? "s" : ""} total
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  className="pl-9 w-[200px] sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchFAQs()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : faqs.length > 0 ? (
            <>
              {/* Table View */}
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[60px] font-semibold hidden sm:table-cell">
                        ID
                      </TableHead>
                      <TableHead className="font-semibold">Question</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell max-w-[300px]">
                        Answer
                      </TableHead>
                      <TableHead className="font-semibold w-[100px] hidden lg:table-cell">
                        Created
                      </TableHead>
                      <TableHead className="font-semibold text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faqs.map((faq) => (
                      <TableRow key={faq.id} className="group hover:bg-muted/30">
                        <TableCell className="font-mono text-sm hidden sm:table-cell">
                          #{faq.id}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium line-clamp-2">{faq.question}</p>
                          {/* Mobile only: show truncated answer */}
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 md:hidden">
                            {faq.answer}
                          </p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-muted-foreground text-sm truncate max-w-[300px]">
                            {faq.answer}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                          {formatDate(faq.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDetailsDialog(faq)}
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(faq)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog(faq)}
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

              {/* Accordion Preview */}
              <div className="mt-8 pt-6 border-t">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    FAQ Preview
                  </h3>
                  <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                    {faqs.length} {faqs.length === 1 ? "question" : "questions"}
                  </Badge>
                </div>
                <div className="bg-muted/30 rounded-lg p-6 border">
                  <Accordion type="single" collapsible className="w-full space-y-3">
                    {faqs.map((faq) => (
                      <AccordionItem
                        key={faq.id}
                        value={`faq-${faq.id}`}
                        className="bg-background rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                      >
                        <AccordionTrigger className="text-left hover:no-underline px-5 py-4 group">
                          <div className="flex items-start gap-4 w-full">
                            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm mt-0.5">
                              Q
                            </div>
                            <span className="font-medium text-base sm:text-lg leading-relaxed text-foreground tracking-tight group-hover:text-primary transition-colors">
                              {faq.question}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5">
                          <div className="flex items-start gap-4 pt-2">
                            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium mt-0.5">
                              A
                            </div>
                            <p className="text-muted-foreground text-[15px] sm:text-base leading-7 font-normal tracking-wide max-w-none whitespace-pre-wrap">
                              {faq.answer}
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} items)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={currentPage === pagination.pages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-12 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No FAQs found</p>
              <p className="text-sm">
                {searchQuery ? "Try a different search term" : "Add your first FAQ to get started"}
              </p>
              {!searchQuery && (
                <div className="flex gap-2 justify-center mt-4">
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add FAQ
                  </Button>
                  <Button variant="outline" onClick={openBulkDialog}>
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Add
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add FAQ</DialogTitle>
            <DialogDescription>Create a new frequently asked question</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !formData.question.trim() || !formData.answer.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create FAQ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>Update the question and answer</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSubmitting || !formData.question.trim() || !formData.answer.trim()}
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
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{selectedFAQ?.question}</p>
              </div>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>FAQ Details</DialogTitle>
            <DialogDescription>ID: #{selectedFAQ?.id}</DialogDescription>
          </DialogHeader>
          {selectedFAQ && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Question</Label>
                <p className="font-medium text-lg mt-1">{selectedFAQ.question}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Answer</Label>
                <p className="mt-1 whitespace-pre-wrap">{selectedFAQ.answer}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="text-sm">{formatDate(selectedFAQ.created_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated</Label>
                  <p className="text-sm">{formatDate(selectedFAQ.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedFAQ && (
              <Button
                onClick={() => {
                  setIsDetailsDialogOpen(false);
                  openEditDialog(selectedFAQ);
                }}
              >
                Edit FAQ
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bulk Add FAQs
            </DialogTitle>
            <DialogDescription>
              Add multiple FAQs at once via manual entry or CSV upload
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="manual" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="flex-1 overflow-auto mt-4">
              <div className="space-y-4">
                {bulkEntries.map((entry, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        FAQ #{index + 1}
                      </span>
                      {bulkEntries.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeBulkEntry(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Question"
                      value={entry.question}
                      onChange={(e) => updateBulkEntry(index, "question", e.target.value)}
                      maxLength={500}
                    />
                    <Textarea
                      placeholder="Answer"
                      value={entry.answer}
                      onChange={(e) => updateBulkEntry(index, "answer", e.target.value)}
                      rows={2}
                      maxLength={2000}
                    />
                  </div>
                ))}

                <Button variant="outline" className="w-full" onClick={addBulkEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another FAQ
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="csv" className="flex-1 overflow-auto mt-4">
              <div className="space-y-4">
                <div className="p-6 border-2 border-dashed rounded-lg text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a CSV file with questions and answers
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Format: question,answer (one per line)
                  </p>
                  <label>
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleCSVUpload}
                    />
                  </label>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• CSV format: question,answer (one FAQ per line)</p>
                  <p>• Optional header row will be automatically skipped</p>
                  <p>• Use quotes for values containing commas</p>
                  <p>• Maximum file size: {(MAX_CSV_FILE_SIZE / 1024 / 1024).toFixed(0)}MB</p>
                  <p>• Example:</p>
                  <pre className="bg-muted p-2 rounded text-xs font-mono">
                    question,answer{`\n`}"What are your hours?","Mon-Fri 9am-9pm"{`\n`}"Do you take
                    reservations?","Yes, call us!"
                  </pre>
                </div>

                {bulkEntries.length > 0 && bulkEntries[0].question && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      Preview ({bulkEntries.length} FAQs loaded)
                    </p>
                    <div className="max-h-[200px] overflow-auto space-y-2">
                      {bulkEntries.slice(0, 5).map((entry, i) => (
                        <div key={i} className="text-sm p-2 bg-background rounded">
                          <p className="font-medium truncate">{entry.question}</p>
                          <p className="text-muted-foreground truncate">{entry.answer}</p>
                        </div>
                      ))}
                      {bulkEntries.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{bulkEntries.length - 5} more...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Errors */}
          {bulkErrors.length > 0 && (
            <div className="p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <p className="font-medium mb-1">Validation Errors:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {bulkErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {bulkErrors.length > 5 && <li>+{bulkErrors.length - 5} more errors...</li>}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkCreate}
              disabled={
                isSubmitting ||
                bulkEntries.length === 0 ||
                !bulkEntries.some((e) => e.question.trim() && e.answer.trim())
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create ${bulkEntries.filter((e) => e.question.trim() && e.answer.trim()).length} FAQ(s)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FAQ;
