/**
 * Callers Page
 * View all callers and mark spam/fraud
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  Phone,
  AlertTriangle,
  ShieldX,
  MoreHorizontal,
  CheckCircle,
} from "lucide-react";
import { UiOnlyNotice } from "@/components/UiOnlyNotice";
import type { Caller } from "@/types/api.types";

export function Callers() {
  const [callers] = useState<Caller[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // UI-only: no backend integration yet
  const handleMarkSpam = async (_caller: Caller) => {
    // TODO: integrate backend API
  };
  const handleMarkFraud = async (_caller: Caller) => {
    // TODO: integrate backend API
  };

  const filteredCallers = callers.filter((caller) => {
    const query = searchQuery.toLowerCase();
    return (
      caller.phone_number.toLowerCase().includes(query) ||
      (caller.name?.toLowerCase().includes(query) ?? false) ||
      (caller.email?.toLowerCase().includes(query) ?? false)
    );
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <UiOnlyNotice />
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Callers</h2>
        <p className="text-muted-foreground">Manage your caller database and mark spam/fraud</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Callers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Legitimate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {callers.filter((c) => !c.is_spam && !c.is_fraud).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spam</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callers.filter((c) => c.is_spam).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fraud</CardTitle>
            <ShieldX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callers.filter((c) => c.is_fraud).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Callers Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Caller Database</CardTitle>
              <CardDescription>All callers who have contacted your restaurant</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search callers..."
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
          ) : filteredCallers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No callers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Total Calls</TableHead>
                    <TableHead>Last Call</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCallers.map((caller) => (
                    <TableRow key={caller.id}>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {caller.phone_number}
                        </div>
                      </TableCell>
                      <TableCell>{caller.name || "—"}</TableCell>
                      <TableCell>{caller.total_calls}</TableCell>
                      <TableCell>{formatDate(caller.last_call_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {caller.is_spam && (
                            <Badge
                              variant="outline"
                              className="bg-yellow-50 text-yellow-700 border-yellow-200"
                            >
                              Spam
                            </Badge>
                          )}
                          {caller.is_fraud && <Badge variant="destructive">Fraud</Badge>}
                          {!caller.is_spam && !caller.is_fraud && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              Legitimate
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleMarkSpam(caller)}>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              {caller.is_spam ? "Remove Spam Flag" : "Mark as Spam"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleMarkFraud(caller)}
                              className="text-destructive"
                            >
                              <ShieldX className="h-4 w-4 mr-2" />
                              {caller.is_fraud ? "Remove Fraud Flag" : "Mark as Fraud"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

export default Callers;
