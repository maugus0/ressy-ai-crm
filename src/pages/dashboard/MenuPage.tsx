/**
 * Menu Page
 * Manage restaurant menu items
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UtensilsCrossed, Search, Plus, Star, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { toast } from "sonner";
import type { MenuItem, CreateMenuItemRequest } from "@/types/api.types";

export default function MenuPage() {
  const { restaurantId } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<CreateMenuItemRequest>({
    name: "",
    description: "",
    price: 0,
    category: "",
    is_available: true,
    is_special: false,
  });

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  async function fetchMenuItems() {
    if (!restaurantId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<MenuItem[]>(ENDPOINTS.MENU.LIST(restaurantId));
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setMenuItems(response.data);
      }
    } catch (err) {
      setError("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async () => {
    if (!restaurantId) return;

    try {
      if (editingItem) {
        const response = await api.put(ENDPOINTS.MENU.UPDATE(editingItem.id), formData);
        if (response.error) {
          toast.error(response.error);
        } else {
          toast.success("Menu item updated");
          fetchMenuItems();
          closeDialog();
        }
      } else {
        const response = await api.post(ENDPOINTS.MENU.CREATE(restaurantId), formData);
        if (response.error) {
          toast.error(response.error);
        } else {
          toast.success("Menu item created");
          fetchMenuItems();
          closeDialog();
        }
      }
    } catch (err) {
      toast.error("Failed to save menu item");
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;

    try {
      const response = await api.delete(ENDPOINTS.MENU.DELETE(item.id));
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success("Menu item deleted");
        fetchMenuItems();
      }
    } catch (err) {
      toast.error("Failed to delete menu item");
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const response = await api.patch(ENDPOINTS.MENU.TOGGLE_AVAILABILITY(item.id));
      if (response.error) {
        toast.error(response.error);
      } else {
        fetchMenuItems();
      }
    } catch (err) {
      toast.error("Failed to update availability");
    }
  };

  const handleToggleSpecial = async (item: MenuItem) => {
    try {
      const response = await api.patch(ENDPOINTS.MENU.TOGGLE_SPECIAL(item.id));
      if (response.error) {
        toast.error(response.error);
      } else {
        fetchMenuItems();
      }
    } catch (err) {
      toast.error("Failed to update special status");
    }
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category,
      is_available: item.is_available,
      is_special: item.is_special,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      category: "",
      is_available: true,
      is_special: false,
    });
  };

  const filteredItems = menuItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      (item.description?.toLowerCase().includes(query) ?? false)
    );
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const categories = [...new Set(menuItems.map((item) => item.category))];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Menu</h2>
          <p className="text-muted-foreground">Manage your restaurant's menu items</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => closeDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update the menu item details" : "Add a new item to your menu"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Item description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Appetizers"
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="available">Available</Label>
                <Switch
                  id="available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="special">Today's Special</Label>
                <Switch
                  id="special"
                  checked={formData.is_special}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_special: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name || !formData.category}>
                {editingItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menuItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {menuItems.filter((i) => i.is_available).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Specials</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {menuItems.filter((i) => i.is_special).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>All items on your restaurant's menu</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No menu items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Special</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>{formatPrice(item.price)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={item.is_available}
                          onCheckedChange={() => handleToggleAvailability(item)}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.is_special}
                          onCheckedChange={() => handleToggleSpecial(item)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
