/**
 * FAQs Page
 * Manage restaurant FAQs
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Search, Plus, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { toast } from "sonner";
import type { FAQ, CreateFAQRequest } from "@/types/api.types";

export default function FAQsPage() {
  const { restaurantId } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState<CreateFAQRequest>({
    question: "",
    answer: "",
    category: "",
    is_active: true,
  });

  useEffect(() => {
    fetchFAQs();
  }, [restaurantId]);

  async function fetchFAQs() {
    if (!restaurantId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<FAQ[]>(ENDPOINTS.FAQ.LIST(restaurantId));
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setFaqs(response.data);
      }
    } catch (err) {
      setError("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async () => {
    if (!restaurantId) return;

    try {
      if (editingFaq) {
        const response = await api.put(ENDPOINTS.FAQ.UPDATE(editingFaq.id), formData);
        if (response.error) {
          toast.error(response.error);
        } else {
          toast.success("FAQ updated");
          fetchFAQs();
          closeDialog();
        }
      } else {
        const response = await api.post(ENDPOINTS.FAQ.CREATE(restaurantId), formData);
        if (response.error) {
          toast.error(response.error);
        } else {
          toast.success("FAQ created");
          fetchFAQs();
          closeDialog();
        }
      }
    } catch (err) {
      toast.error("Failed to save FAQ");
    }
  };

  const handleDelete = async (faq: FAQ) => {
    if (!confirm("Delete this FAQ?")) return;

    try {
      const response = await api.delete(ENDPOINTS.FAQ.DELETE(faq.id));
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success("FAQ deleted");
        fetchFAQs();
      }
    } catch (err) {
      toast.error("Failed to delete FAQ");
    }
  };

  const handleToggleActive = async (faq: FAQ) => {
    try {
      const response = await api.put(ENDPOINTS.FAQ.UPDATE(faq.id), {
        is_active: !faq.is_active,
      });
      if (response.error) {
        toast.error(response.error);
      } else {
        fetchFAQs();
      }
    } catch (err) {
      toast.error("Failed to update FAQ");
    }
  };

  const openEditDialog = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "",
      is_active: faq.is_active,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingFaq(null);
    setFormData({
      question: "",
      answer: "",
      category: "",
      is_active: true,
    });
  };

  const filteredFaqs = faqs.filter((faq) => {
    const query = searchQuery.toLowerCase();
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      (faq.category?.toLowerCase().includes(query) ?? false)
    );
  });

  const categories = [...new Set(faqs.filter((f) => f.category).map((f) => f.category!))];
  const groupedFaqs = categories.length > 0
    ? categories.reduce((acc, cat) => {
        acc[cat] = filteredFaqs.filter((f) => f.category === cat);
        return acc;
      }, {} as Record<string, FAQ[]>)
    : { "General": filteredFaqs };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">FAQs</h2>
          <p className="text-muted-foreground">Manage frequently asked questions for your restaurant</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => closeDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
              <DialogDescription>
                {editingFaq ? "Update the FAQ details" : "Add a new FAQ"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="What is your question?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Enter the answer..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category (optional)</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Reservations, Hours, Parking"
                  list="faq-categories"
                />
                <datalist id="faq-categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.question || !formData.answer}>
                {editingFaq ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total FAQs</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faqs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {faqs.filter((f) => f.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {faqs.filter((f) => !f.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* FAQ List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-center text-destructive">{error}</CardContent>
        </Card>
      ) : filteredFaqs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No FAQs found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
                <CardDescription>{categoryFaqs.length} FAQs</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {categoryFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          {!faq.is_active && (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <p className="text-muted-foreground">{faq.answer}</p>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`active-${faq.id}`} className="text-sm">Active</Label>
                              <Switch
                                id={`active-${faq.id}`}
                                checked={faq.is_active}
                                onCheckedChange={() => handleToggleActive(faq)}
                              />
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(faq)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(faq)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
