import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DatabaseCustomer {
  id: string;
  name: string;
  phone: string;
  tags: string[];
}

interface DatabaseTableProps {
  customers: DatabaseCustomer[];
  onCustomerSelect?: (customer: DatabaseCustomer) => void;
}

const getTagVariant = (tag: string) => {
  switch (tag.toLowerCase()) {
    case "vip":
      return "default";
    case "returning":
      return "secondary";
    case "allergy":
      return "destructive";
    case "new":
      return "outline";
    default:
      return "secondary";
  }
};

export function DatabaseTable({ customers, onCustomerSelect }: DatabaseTableProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-table-header border-b border-border">
            <TableHead className="text-foreground font-medium">ID</TableHead>
            <TableHead className="text-foreground font-medium">Name</TableHead>
            <TableHead className="text-foreground font-medium">Phone</TableHead>
            <TableHead className="text-foreground font-medium">Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow
              key={customer.id}
              className="border-b border-border hover:bg-table-row-hover cursor-pointer transition-colors"
              onClick={() => onCustomerSelect?.(customer)}
            >
              <TableCell className="font-medium text-foreground">{customer.id}</TableCell>
              <TableCell className="text-foreground">{customer.name}</TableCell>
              <TableCell className="text-foreground font-mono">{customer.phone}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {customer.tags.map((tag, index) => (
                    <Badge key={index} variant={getTagVariant(tag)} className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
