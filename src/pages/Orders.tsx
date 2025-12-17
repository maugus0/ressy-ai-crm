/**
 * Orders Page
 * Manage takeout orders
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingBag, Search, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { UiOnlyNotice } from "@/components/UiOnlyNotice";
import type { Order, OrderStatus } from "@/types/api.types";

export function Orders() {
  const [orders] = useState<Order[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleUpdateStatus = async (order: Order, newStatus: OrderStatus) => {
    // UI-only: no backend yet. Update local state for demo purposes.
    if (selectedOrder?.id === order.id) setSelectedOrder({ ...order, status: newStatus });
  };

  const handleFinalizeOrder = async (order: Order) => {
    if (selectedOrder?.id === order.id) setSelectedOrder({ ...order, status: "completed" });
  };

  const handleCancelOrder = async (order: Order) => {
    if (!confirm("Cancel this order?")) return;
    if (selectedOrder?.id === order.id) setSelectedOrder({ ...order, status: "cancelled" });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const variants: Record<
      OrderStatus,
      { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
    > = {
      pending: { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      confirmed: { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
      preparing: {
        variant: "outline",
        className: "bg-purple-50 text-purple-700 border-purple-200",
      },
      ready: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
      completed: { variant: "default" },
      cancelled: { variant: "destructive" },
    };
    const config = variants[status] || { variant: "default" };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getOrderTypeBadge = (type: string) => {
    return (
      <Badge variant="secondary" className="text-xs">
        {type.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <UiOnlyNotice />
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
        <p className="text-muted-foreground">Manage takeout and delivery orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => ["confirmed", "preparing", "ready"].includes(o.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Order History</CardTitle>
              <CardDescription>All orders for your restaurant</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pickup Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getOrderTypeBadge(order.order_type)}</TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{formatDate(order.pickup_time)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(order, "confirmed")}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {!["completed", "cancelled"].includes(order.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelOrder(order)}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDate(selectedOrder.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <p className="text-sm">{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && (
                    <p className="text-sm">{selectedOrder.customer_email}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Type</p>
                  <p className="font-medium capitalize">
                    {selectedOrder.order_type.replace("_", " ")}
                  </p>
                  {selectedOrder.pickup_time && (
                    <>
                      <p className="text-sm font-medium text-muted-foreground mt-2">Pickup Time</p>
                      <p className="text-sm">{formatDate(selectedOrder.pickup_time)}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Items</p>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="p-3 flex justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        {item.special_instructions && (
                          <p className="text-sm text-muted-foreground italic">
                            "{item.special_instructions}"
                          </p>
                        )}
                      </div>
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div className="border-t pt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatCurrency(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.special_instructions && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Special Instructions
                  </p>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {selectedOrder.special_instructions}
                  </p>
                </div>
              )}

              {/* Actions */}
              {!["completed", "cancelled"].includes(selectedOrder.status) && (
                <div className="flex gap-2 justify-end pt-4 border-t">
                  {selectedOrder.status === "pending" && (
                    <Button onClick={() => handleUpdateStatus(selectedOrder, "confirmed")}>
                      Confirm Order
                    </Button>
                  )}
                  {selectedOrder.status === "confirmed" && (
                    <Button onClick={() => handleUpdateStatus(selectedOrder, "preparing")}>
                      Start Preparing
                    </Button>
                  )}
                  {selectedOrder.status === "preparing" && (
                    <Button onClick={() => handleUpdateStatus(selectedOrder, "ready")}>
                      Mark Ready
                    </Button>
                  )}
                  {selectedOrder.status === "ready" && (
                    <Button onClick={() => handleFinalizeOrder(selectedOrder)}>
                      Complete Order
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleCancelOrder(selectedOrder);
                      setSelectedOrder(null);
                    }}
                  >
                    Cancel Order
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Orders;
