import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface Call {
  callId: string;
  timestamp: string;
  duration: number; // seconds
}

interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  calls: Call[];
}

const RATE_PER_MINUTE = 0.25; // USD

export function ExpensesModal({ isOpen, onClose, calls }: ExpensesModalProps) {
  if (!isOpen) return null;

  const expenses = calls.map((c) => {
    const durationMinutes = c.duration / 60;
    const cost = durationMinutes * RATE_PER_MINUTE;
    return {
      ...c,
      durationFormatted: `${Math.floor(c.duration / 60)}m ${c.duration % 60}s`,
      cost: cost.toFixed(2)
    };
  });

  const total = expenses.reduce((sum, c) => sum + parseFloat(c.cost), 0).toFixed(2);

  const downloadCSV = () => {
    const csv = [
      ["Call ID", "Date", "Duration", "Cost"],
      ...expenses.map((c) => [
        c.callId,
        new Date(c.timestamp).toLocaleString(),
        c.durationFormatted,
        `$${c.cost}`
      ]),
      ["", "Total", "", `$${total}`]
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0 shadow-2xl rounded-2xl [&>button.absolute.right-4.top-4]:hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Expense breakdown <span className="text-muted-foreground">(${RATE_PER_MINUTE}/min)</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="rounded-lg border border-border overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-muted text-sm font-medium sticky top-0">
              <div>Call ID</div>
              <div>Date</div>
              <div>Duration</div>
              <div className="text-right">Cost</div>
            </div>

            {/* Table Body */}
            <div className="max-h-[55vh] overflow-y-auto">
              {expenses.length > 0 ? (
                expenses.map((expense, index) => (
                  <div
                    key={expense.callId}
                    className={`grid grid-cols-4 gap-4 px-4 py-3 text-sm ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/50"
                    } hover:bg-accent/10 transition-colors`}
                  >
                    <div className="font-mono">{expense.callId.slice(0, 8)}</div>
                    <div>{new Date(expense.timestamp).toLocaleString()}</div>
                    <div>{expense.durationFormatted}</div>
                    <div className="text-right font-semibold">${expense.cost}</div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  No calls recorded yet.
                </div>
              )}
            </div>

            {/* Total Row */}
            {expenses.length > 0 && (
              <div className="grid grid-cols-4 gap-4 px-4 py-4 bg-muted/70 border-t border-border font-semibold text-sm">
                <div className="col-span-3">Total ({expenses.length} calls)</div>
                <div className="text-right">${total}</div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {expenses.length > 0 && (
            <div className="flex justify-end mt-4">
              <Button onClick={downloadCSV} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}