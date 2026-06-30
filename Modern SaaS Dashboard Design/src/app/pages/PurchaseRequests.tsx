import { Plus, CheckCircle, Clock, XCircle, FileText, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { purchaseRequestAPI, purchaseOrderAPI, ingredientAPI } from "../services/api";
import { toast } from "sonner";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";

export function PurchaseRequests() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [ingredientsList, setIngredientsList] = useState<any[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [priority, setPriority] = useState("medium");
  const [reason, setReason] = useState("");

  // Consolidated PO generation state
  const [selectedRequests, setSelectedRequests] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      setUser(JSON.parse(userJson));
    }
    fetchRequests();
    fetchIngredients();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await purchaseRequestAPI.list();
      setRequests(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load purchase requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const data = await ingredientAPI.list();
      setIngredientsList(data);
      if (data.length > 0) {
        setSelectedIngredientId(data[0].id);
        setUnit(data[0].unit);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredientId || !quantity) return;

    try {
      await purchaseRequestAPI.create({
        ingredientId: selectedIngredientId,
        quantity: parseFloat(quantity),
        unit,
        priority,
        reason,
      });

      toast.success("Purchase request created!");
      setShowAddModal(false);
      setQuantity("");
      setReason("");
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create request");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await purchaseRequestAPI.approve(id);
      toast.success("Request approved!");
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to approve request");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await purchaseRequestAPI.reject(id, "Rejected by F&B Manager");
      toast.success("Request rejected!");
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to reject request");
    }
  };

  const handleGenerateConsolidatedPO = async () => {
    const selectedIds = Object.keys(selectedRequests).filter((id) => selectedRequests[id]);

    if (selectedIds.length === 0) {
      toast.error("Please select at least one approved request to order");
      return;
    }

    try {
      const result = await purchaseOrderAPI.generateConsolidated(selectedIds);
      toast.success(result.message || "Purchase Orders generated successfully!");
      setSelectedRequests({});
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to generate PO(s)");
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");
  const orderedRequests = requests.filter((r) => r.status === "ordered");

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    pending: {
      label: "Pending Approval",
      icon: Clock,
      className: "bg-[#FFFBEB] text-[#F59E0B] border-[#F59E0B]/20",
    },
    approved: {
      label: "Approved",
      icon: CheckCircle,
      className: "bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20",
    },
    rejected: {
      label: "Rejected",
      icon: XCircle,
      className: "bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]/20",
    },
    ordered: {
      label: "Ordered",
      icon: CheckCircle,
      className: "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20",
    },
  };

  const priorityConfig: Record<string, { label: string; className: string }> = {
    high: { label: "High", className: "bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]/20" },
    medium: { label: "Medium", className: "bg-[#FFFBEB] text-[#F59E0B] border-[#F59E0B]/20" },
    low: { label: "Low", className: "bg-[#F1F5F9] text-[#64748B] border-[#64748B]/20" },
  };

  const isChefOrStoreKeeper = user?.role === "Head Chef" || user?.role === "Store Keeper" || user?.role === "Admin";
  const isManager = user?.role === "F&B Manager" || user?.role === "Admin";
  const isPurchaseManager = user?.role === "Purchase Manager" || user?.role === "Admin";

  const RequestCard = ({ request }: { request: any }) => {
    const statusConf = statusConfig[request.status] || statusConfig.pending;
    const priorityConf = priorityConfig[request.priority] || priorityConfig.medium;
    const StatusIcon = statusConf.icon;

    return (
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isPurchaseManager && request.status === "approved" && (
                  <Checkbox
                    checked={!!selectedRequests[request.id]}
                    onCheckedChange={(checked) => {
                      setSelectedRequests({
                        ...selectedRequests,
                        [request.id]: !!checked,
                      });
                    }}
                    className="mr-2"
                  />
                )}
                <h3 className="font-semibold">{request.ingredient}</h3>
                <Badge variant="outline" className={statusConf.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConf.label}
                </Badge>
                <Badge variant="outline" className={priorityConf.className}>
                  {priorityConf.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Requested by: {request.requestedBy} • {request.date} ({request.property})
              </p>
            </div>
            <p className="text-lg font-semibold">
              ₹{request.estimatedValue.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium">Items requested:</p>
            {request.items && request.items.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between text-sm py-2 border-t border-border"
              >
                <span>{item.name}</span>
                <span className="text-muted-foreground">
                  {item.qty} {item.unit}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reason:</span>
              <span>{request.reason}</span>
            </div>
            {request.approvedBy && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processed by:</span>
                <span className={request.status === "rejected" ? "text-[#EF4444]" : "text-[#10B981]"}>
                  {request.approvedBy} on {request.approvalDate}
                </span>
              </div>
            )}
            {request.notes && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Note:</span>
                <span>{request.notes}</span>
              </div>
            )}
          </div>

          {request.status === "pending" && isManager && (
            <div className="flex gap-2 mt-4">
              <Button className="flex-1" onClick={() => handleApprove(request.id)}>Approve</Button>
              <Button variant="outline" className="flex-1 text-[#EF4444] border-[#EF4444]/20 hover:bg-[#FEF2F2]" onClick={() => handleReject(request.id)}>
                Reject
              </Button>
            </div>
          )}
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
          <h1 className="text-3xl">Purchase Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve purchase requests
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isPurchaseManager && approvedRequests.length > 0 && (
            <Button variant="outline" onClick={handleGenerateConsolidatedPO} className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Consolidated PO(s)
            </Button>
          )}
          {isChefOrStoreKeeper && (
            <Button onClick={() => setShowAddModal(true)} className="sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#FFFBEB] p-3 rounded-lg">
                <Clock className="h-5 w-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold">{pendingRequests.length}</p>
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
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-semibold">{approvedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#FEF2F2] p-3 rounded-lg">
                <XCircle className="h-5 w-5 text-[#EF4444]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-semibold">{rejectedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#EFF6FF] p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ordered POs</p>
                <p className="text-2xl font-semibold">{orderedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="ordered">
            Ordered POs ({orderedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No pending purchase requests found.</p>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedRequests.length > 0 ? (
            approvedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No approved purchase requests found.</p>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedRequests.length > 0 ? (
            rejectedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No rejected purchase requests found.</p>
          )}
        </TabsContent>

        <TabsContent value="ordered" className="space-y-4">
          {orderedRequests.length > 0 ? (
            orderedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No ordered purchase requests found.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* New Purchase Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-card border border-border shadow-lg space-y-4">
            <h2 className="text-xl font-semibold">New Purchase Request</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ingredient">Select Raw Material</Label>
                <select
                  id="ingredient"
                  className="w-full p-2 border rounded-md text-sm bg-background border-input"
                  value={selectedIngredientId}
                  onChange={(e) => {
                    setSelectedIngredientId(e.target.value);
                    const ing = ingredientsList.find((i) => i.id === e.target.value);
                    if (ing) setUnit(ing.unit);
                  }}
                >
                  {ingredientsList.map((i) => (
                    <option key={i.id} value={i.id}>{i.ingredient}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    required
                    placeholder="e.g. 50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input id="unit" disabled value={unit} className="bg-muted" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason / Urgent Notes</Label>
                <Input
                  id="reason"
                  required
                  placeholder="e.g. below par levels, high weekend demand"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Request
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
