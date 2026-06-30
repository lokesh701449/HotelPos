import { useParams, Link } from "react-router";
import { ArrowLeft, TrendingUp, Package, Users, MapPin } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { inventoryAPI } from "../services/api";
import { toast } from "sonner";

export function IngredientDetails() {
  const { id } = useParams();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDetails(id);
    }
  }, [id]);

  const fetchDetails = async (ingredientId: string) => {
    setLoading(true);
    try {
      const data = await inventoryAPI.get(ingredientId);
      setDetails(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load ingredient details");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !details) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate status label
  const isLow = details.available < details.parLevel;
  const isOut = details.available <= 0;

  // Usage trends
  const usageData = [
    { date: "Jun 1", consumed: 8.5, received: 0 },
    { date: "Jun 5", consumed: 6.2, received: 50 },
    { date: "Jun 10", consumed: 7.8, received: 0 },
    { date: "Jun 15", consumed: 9.1, received: 0 },
    { date: "Jun 20", consumed: 8.3, received: 50 },
    { date: "Jun 25", consumed: 7.5, received: 0 },
    { date: "Jun 29", consumed: details.available, received: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/inventory">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-foreground">{details.ingredient}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {details.category} • SKU: {details.sku}
          </p>
        </div>
        {isOut ? (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            Out of Stock
          </Badge>
        ) : isLow ? (
          <Badge className="bg-[#FFFBEB] text-[#F59E0B] border-[#F59E0B]/20">
            Low Stock
          </Badge>
        ) : (
          <Badge className="bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20">
            Healthy
          </Badge>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#EFF6FF] p-3 rounded-lg">
                <Package className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p className="text-2xl font-semibold">
                  {details.available} {details.unit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#ECFDF5] p-3 rounded-lg">
                <TrendingUp className="h-5 w-5 text-[#10B981]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-semibold">₹{details.value?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#FEF2F2] p-3 rounded-lg">
                <Users className="h-5 w-5 text-[#EF4444]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Supplier</p>
                <p className="text-lg font-semibold truncate max-w-[130px]" title={details.supplier}>
                  {details.supplier}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#FFFBEB] p-3 rounded-lg">
                <Package className="h-5 w-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lead Time</p>
                <p className="text-2xl font-semibold">{details.leadTime || 2} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#F5F3FF] p-3 rounded-lg">
                <MapPin className="h-5 w-5 text-[#8B5CF6]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Storage</p>
                <p className="text-lg font-semibold">{details.storageLocation || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Stock Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Stock</span>
                  <span className="font-semibold">
                    {details.available} {details.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Par Level</span>
                  <span className="font-semibold">
                    {details.parLevel} {details.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit Cost</span>
                  <span className="font-semibold">₹{details.unitCost || 0} / {details.unit}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Supplier Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier Name</span>
                  <span className="font-semibold">{details.supplier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lead Time</span>
                  <span className="font-semibold">{details.leadTime || 2} days</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Usage Trend (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="consumed"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="Consumed"
                  />
                  <Line
                    type="monotone"
                    dataKey="received"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Received"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {details.history && details.history.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.history.map((txn: any) => (
                      <TableRow key={txn.id}>
                        <TableCell>{txn.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              txn.type === "Receive" || txn.type === "Received"
                                ? "bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20"
                                : txn.type === "Issue" || txn.type === "Issued"
                                ? "bg-[#EFF6FF] text-[#3B82F6] border-[#3B82F6]/20"
                                : "bg-[#FFFBEB] text-[#F59E0B] border-[#F59E0B]/20"
                            }
                          >
                            {txn.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {txn.type === "Receive" || txn.type === "Received" ? "+" : "-"}
                          {txn.quantity} {txn.unit}
                        </TableCell>
                        <TableCell>{txn.by}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {txn.notes || txn.source || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">No transaction history found for this ingredient.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Avg Daily Consumption</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">5.4 {details.unit}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Based on recent activity
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Days Until Reorder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-[#F59E0B]">
                  {Math.max(0, Math.round((details.available - details.parLevel) / 5.4))} days
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  At current usage rate
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Monthly Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">₹{(5.4 * 30 * details.unitCost)?.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Estimated based on usage
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
