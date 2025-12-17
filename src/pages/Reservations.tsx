/**
 * Reservations Page
 * Manage restaurant reservations
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Search, Plus, Users, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { UiOnlyNotice } from "@/components/UiOnlyNotice";
import type { Reservation, ReservationStatus, CreateReservationRequest } from "@/types/api.types";

export function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState<CreateReservationRequest>({
    date_time: "",
    party_size: 2,
    name: "",
    phone_number: "",
    email: "",
    special_request: "",
    notes: "",
  });

  const handleSubmit = async () => {
    // UI-only: close modal without persisting
    closeDialog();
  };

  const handleUpdateStatus = async (reservation: Reservation, newStatus: ReservationStatus) => {
    setReservations((prev) =>
      prev.map((x) => (x.id === reservation.id ? { ...x, status: newStatus } : x))
    );
  };

  const handleConfirm = async (reservation: Reservation) => {
    await handleUpdateStatus(reservation, "confirmed");
  };

  const handleCancel = async (reservation: Reservation) => {
    if (!confirm("Cancel this reservation?")) return;
    await handleUpdateStatus(reservation, "cancelled");
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      date_time: "",
      party_size: 2,
      name: "",
      phone_number: "",
      email: "",
      special_request: "",
      notes: "",
    });
  };

  const filteredReservations = reservations.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.phone_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.confirmation_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || res.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusBadge = (status: ReservationStatus) => {
    const variants: Record<
      ReservationStatus,
      { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
    > = {
      pending: { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      confirmed: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
      cancelled: { variant: "destructive" },
      completed: { variant: "default" },
      no_show: { variant: "secondary" },
    };
    const config = variants[status] || { variant: "default" };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
      </Badge>
    );
  };

  // Get today's date in YYYY-MM-DDTHH:mm format for datetime-local input
  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <UiOnlyNotice />
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reservations</h2>
          <p className="text-muted-foreground">Manage your restaurant's reservations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => closeDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Reservation</DialogTitle>
              <DialogDescription>Create a new reservation</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_time">Date & Time</Label>
                  <Input
                    id="date_time"
                    type="datetime-local"
                    value={formData.date_time}
                    onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                    min={getMinDateTime()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="party_size">Party Size</Label>
                  <Input
                    id="party_size"
                    type="number"
                    min="1"
                    value={formData.party_size}
                    onChange={(e) =>
                      setFormData({ ...formData, party_size: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Guest Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="special_request">Special Requests (optional)</Label>
                <Textarea
                  id="special_request"
                  value={formData.special_request}
                  onChange={(e) => setFormData({ ...formData, special_request: e.target.value })}
                  placeholder="Any special requests..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.date_time || !formData.name || !formData.phone_number}
              >
                Create Reservation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reservations.filter((r) => r.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reservations.filter((r) => r.status === "confirmed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reservations
                .filter((r) => {
                  const today = new Date().toDateString();
                  return new Date(r.date_time).toDateString() === today && r.status !== "cancelled";
                })
                .reduce((sum, r) => sum + r.party_size, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Reservations</CardTitle>
              <CardDescription>Manage your restaurant's reservations</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reservations..."
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
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
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reservations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Confirmation #</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-mono">{reservation.confirmation_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reservation.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {reservation.phone_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDateShort(reservation.date_time)}</TableCell>
                      <TableCell>{formatTime(reservation.date_time)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {reservation.party_size}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReservation(reservation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {reservation.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConfirm(reservation)}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {!["completed", "cancelled", "no_show"].includes(reservation.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(reservation)}
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

      {/* Reservation Detail Dialog */}
      <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
            <DialogDescription>
              Confirmation: {selectedReservation?.confirmation_number}
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Guest</p>
                  <p className="font-medium">{selectedReservation.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedReservation.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                  <p>{formatDate(selectedReservation.date_time)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Party Size</p>
                  <p>{selectedReservation.party_size} guests</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{selectedReservation.phone_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{selectedReservation.email || "—"}</p>
                </div>
              </div>
              {selectedReservation.special_request && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Special Requests</p>
                  <p className="bg-muted p-3 rounded-lg text-sm">
                    {selectedReservation.special_request}
                  </p>
                </div>
              )}
              {selectedReservation.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="bg-muted p-3 rounded-lg text-sm">{selectedReservation.notes}</p>
                </div>
              )}

              {!["completed", "cancelled", "no_show"].includes(selectedReservation.status) && (
                <div className="flex gap-2 justify-end pt-4 border-t">
                  {selectedReservation.status === "pending" && (
                    <Button
                      onClick={() => {
                        handleConfirm(selectedReservation);
                        setSelectedReservation(null);
                      }}
                    >
                      Confirm
                    </Button>
                  )}
                  {selectedReservation.status === "confirmed" && (
                    <>
                      <Button
                        onClick={() => {
                          handleUpdateStatus(selectedReservation, "completed");
                          setSelectedReservation(null);
                        }}
                      >
                        Mark Completed
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          handleUpdateStatus(selectedReservation, "no_show");
                          setSelectedReservation(null);
                        }}
                      >
                        No Show
                      </Button>
                    </>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleCancel(selectedReservation);
                      setSelectedReservation(null);
                    }}
                  >
                    Cancel
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

export default Reservations;
