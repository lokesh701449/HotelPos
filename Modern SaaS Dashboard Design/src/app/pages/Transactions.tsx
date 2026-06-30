import { useState, useEffect } from "react";
import { Search, Filter, Download, ArrowDownToLine, ArrowUpFromLine, RefreshCw, AlertTriangle, Package } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { transactionAPI } from "../services/api";
import { toast } from "sonner";

export function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (typeFilter !== "all") {
        filters.type = typeFilter;
      }
      const data = await transactionAPI.list(filters);
      setTransactions(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.ingredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const typeConfig: Record<string, { label: string; icon: any; className: string }> = {
    received: {
      label: "Received",
      icon: ArrowDownToLine,
      className: "bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20",
    },
    issued: {
      label: "Issued",
      icon: ArrowUpFromLine,
      className: "bg-[#EFF6FF] text-[#3B82F6] border-[#3B82F6]/20",
    },
    consumed: {
      label: "Consumed",
      icon: Package,
      className: "bg-[#F5F3FF] text-[#8B5CF6] border-[#8B5CF6]/20",
    },
    adjustment: {
      label: "Adjustment",
      icon: RefreshCw,
      className: "bg-[#FFFBEB] text-[#F59E0B] border-[#F59E0B]/20",
    },
    waste: {
      label: "Waste/Spoilage",
      icon: AlertTriangle,
      className: "bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]/20",
    },
    spoilage: {
      label: "Waste/Spoilage",
      icon: AlertTriangle,
      className: "bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]/20",
    },
  };

  // Dynamic calculations based on current fetched transaction set
  const totalReceived = transactions
    .filter((t) => t.type === "received" || t.type === "receive")
    .reduce((sum, t) => sum + (t.value || 0), 0);

  const totalIssued = transactions
    .filter((t) => t.type === "issued" || t.type === "issue")
    .reduce((sum, t) => sum + (t.value || 0), 0);

  const totalConsumed = transactions
    .filter((t) => t.type === "consumed" || t.type === "consume")
    .reduce((sum, t) => sum + (t.value || 0), 0);

  const totalWastage = transactions
    .filter((t) => ["waste", "spoilage"].includes(t.type))
    .reduce((sum, t) => sum + (t.value || 0), 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View all inventory transactions and movements
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="consumed">Consumed</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
              <SelectItem value="waste">Wastage / Spoilage</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline" className="sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((txn) => {
            const config = typeConfig[txn.type] || typeConfig.adjustment;
            const Icon = config.icon;

            return (
              <Card key={txn.id} className="p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className={`${config.className} p-3 rounded-lg h-fit`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{txn.ingredient}</h3>
                          <Badge variant="outline" className={config.className}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {txn.date}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {txn.quantity} {txn.unit}
                        </p>
                        <p
                          className={`text-sm ${
                            ["received", "receive", "adjust"].includes(txn.type)
                              ? "text-[#10B981]"
                              : "text-[#EF4444]"
                          }`}
                        >
                          ₹{txn.value.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Transaction ID: </span>
                        <span className="font-medium text-xs">{txn.id}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">By: </span>
                        <span className="font-medium">{txn.by}</span>
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="text-muted-foreground">Reference/Note: </span>
                      <span>{txn.reference} {txn.notes && `(${txn.notes})`}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <p className="text-center py-8 text-muted-foreground">No matching transactions found.</p>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Received Value</p>
          <p className="text-2xl font-semibold mt-1 text-[#10B981]">
            ₹{totalReceived.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Issued Value</p>
          <p className="text-2xl font-semibold mt-1 text-[#3B82F6]">
            ₹{totalIssued.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Consumed Value</p>
          <p className="text-2xl font-semibold mt-1 text-[#8B5CF6]">
            ₹{totalConsumed.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Wastage Cost</p>
          <p className="text-2xl font-semibold mt-1 text-[#EF4444]">
            ₹{totalWastage.toLocaleString()}
          </p>
        </Card>
      </div>
    </div>
  );
}