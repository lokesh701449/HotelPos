import { Plus, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useState, useEffect } from "react";
import { purchaseOrderAPI, transactionAPI } from "../services/api";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";

export function Deliveries() {
  const [user, setUser] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Receive modal state
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [receivedItems, setReceivedItems] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [isShort, setIsShort] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      setUser(JSON.parse(userJson));
    }
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const data = await purchaseOrderAPI.list();
      setDeliveries(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceive = (delivery: any) => {
    setSelectedPO(delivery);
    const initialQtys: Record<string, number> = {};
    delivery.items.forEach((item: any) => {
      // Find matching item ingredient id
      initialQtys[item.name] = item.qty;
    });
    setReceivedItems(initialQtys);
    setNotes("");
    setIsShort(false);
    setIsDamaged(false);
    setShowReceiveModal(true);
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    try {
      // Record a RECEIVE transaction for each item in the PO
      for (const item of selectedPO.items) {
        // Look up ingredient by name to retrieve the ID (or we got it populated in items inside PO)
        // Wait, the items array inside selectedPO contains name, qty, unit, and backend returns populated ingredientId.
        // Let's find the item in selectedPO.items where the name matches
        const originalItem = selectedPO.items.find((it: any) => it.name === item.name);
        const qtyToSave = receivedItems[item.name] || item.qty;

        // Fetch po API might store item.ingredientId. Let's make sure we find the real ingredientId
        // In purchaseOrderController, po.items maps: `{ ingredientId: it.ingredient._id, qty: it.qty, unit: it.unit, price: it.ingredient.value }`
        // And when getPurchaseOrders runs, it populates `items.ingredientId` with `name unit sku`.
        // So the item object has `ingredientId` populated, but let's check selectedPO item details.
        // Yes, the actual raw items list returned from backend is returned from po.items.
        // Let's call the transaction API.
        await transactionAPI.receive({
          ingredientId: item.ingredientId || item._id, // fallback
          quantity: qtyToSave,
          unit: item.unit,
          poId: selectedPO.id,
          isShort: isShort || qtyToSave < item.qty,
          isDamaged,
          notes: notes || `Received PO ${selectedPO.poNumber}`,
        });
      }

      toast.success("Delivery recorded successfully, stock updated.");
      setShowReceiveModal(false);
      fetchDeliveries();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record delivery");
    }
  };

  const pendingDeliveries = deliveries.filter((d) => d.status !== "completed");
  const completedDeliveries = deliveries.filter((d) => d.status === "completed");

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    pending: {
      label: "Pending",
      icon: Clock,
      className: "bg-[#FFFBEB] text-[#F59E0B] border-[#F59E0B]/20",
    },
    sent: {
      label: "Partially Received",
      icon: AlertCircle,
      className: "bg-[#EFF6FF] text-[#3B82F6] border-[#3B82F6]/20",
    },
    completed: {
      label: "Completed",
      icon: CheckCircle,
      className: "bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20",
    },
  };

  const DeliveryCard = ({ delivery }: { delivery: any }) => {
    const config = statusConfig[delivery.status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{delivery.poNumber}</h3>
                <Badge variant="outline" className={config.className}>
                  <Icon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{delivery.supplier}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">₹{delivery.value?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{delivery.property}</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {delivery.items.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm py-2 border-t border-border"
              >
                <span>{item.name}</span>
                <span className="font-medium">
                  {item.qty} {item.unit}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Expected: {delivery.expectedDate}</span>
            </div>
            {delivery.status !== "completed" && (user?.role === "Store Keeper" || user?.role === "Admin") && (
              <Button size="sm" onClick={() => handleOpenReceive(delivery)}>Receive Delivery</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl">Deliveries</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage incoming deliveries
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#FFFBEB] p-3 rounded-lg">
                <Clock className="h-5 w-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold">
                  {deliveries.filter((d) => d.status === "pending").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#EFF6FF] p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 text-[#3B82F6]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Partial</p>
                <p className="text-2xl font-semibold">
                  {deliveries.filter((d) => d.status === "sent").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#ECFDF5] p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 text-[#10B981]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold">
                  {deliveries.filter((d) => d.status === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#F5F3FF] p-3 rounded-lg">
                <Truck className="h-5 w-5 text-[#8B5CF6]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total orders</p>
                <p className="text-2xl font-semibold">{deliveries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending & Partial ({pendingDeliveries.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedDeliveries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingDeliveries.length > 0 ? (
            pendingDeliveries.map((delivery) => (
              <DeliveryCard key={delivery.id} delivery={delivery} />
            ))
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Deliveries</h3>
                <p className="text-sm text-muted-foreground">
                  All deliveries have been received
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedDeliveries.length > 0 ? (
            completedDeliveries.map((delivery) => (
              <DeliveryCard key={delivery.id} delivery={delivery} />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No completed deliveries found.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Receive Delivery Modal */}
      {showReceiveModal && selectedPO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-card border border-border shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold">Record PO Delivery: {selectedPO.poNumber}</h2>
            <form onSubmit={handleReceiveSubmit} className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-semibold border-b pb-1">Received Quantities</p>
                {selectedPO.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <span className="text-sm">{item.name} (Ordered: {item.qty} {item.unit})</span>
                    <Input
                      type="number"
                      step="0.1"
                      className="w-24"
                      required
                      value={receivedItems[item.name] || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setReceivedItems({ ...receivedItems, [item.name]: val });
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t pt-2">
                <p className="text-sm font-semibold mb-2">Quality & Delivery Flags</p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="shortQty"
                    checked={isShort}
                    onCheckedChange={(checked) => setIsShort(!!checked)}
                  />
                  <Label htmlFor="shortQty" className="cursor-pointer">Flag Short Quantity Delivery</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="damagedQty"
                    checked={isDamaged}
                    onCheckedChange={(checked) => setIsDamaged(!!checked)}
                  />
                  <Label htmlFor="damagedQty" className="cursor-pointer">Flag Damaged/Shortage Stock</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Observations</Label>
                <Input
                  id="notes"
                  placeholder="e.g. standard delivery checked by Kavitha"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowReceiveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Complete Receipt
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
