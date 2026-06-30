import { Clock, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface PurchaseRequest {
  id: string;
  ingredient: string;
  quantity: number;
  unit: string;
  requestedBy: string;
  requestDate: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "approved" | "rejected" | "ordered";
  reason: string;
  estimatedCost?: number;
  approvedBy?: string;
  approvalDate?: string;
}

const purchaseRequests: PurchaseRequest[] = [
  {
    id: "PR-1234",
    ingredient: "Tomatoes",
    quantity: 100,
    unit: "kg",
    requestedBy: "Chef Sharma",
    requestDate: "2026-06-29",
    priority: "high",
    status: "pending",
    reason: "Out of stock - urgent kitchen requirement",
    estimatedCost: 6000,
  },
  {
    id: "PR-1233",
    ingredient: "Fresh Milk",
    quantity: 80,
    unit: "L",
    requestedBy: "Chef Sharma",
    requestDate: "2026-06-29",
    priority: "high",
    status: "pending",
    reason: "Critical stock level",
    estimatedCost: 12000,
  },
  {
    id: "PR-1232",
    ingredient: "Basmati Rice",
    quantity: 50,
    unit: "kg",
    requestedBy: "Store Keeper",
    requestDate: "2026-06-28",
    priority: "medium",
    status: "approved",
    reason: "Below par level",
    estimatedCost: 9000,
    approvedBy: "Manager Patel",
    approvalDate: "2026-06-28",
  },
  {
    id: "PR-1231",
    ingredient: "Olive Oil (Premium)",
    quantity: 30,
    unit: "L",
    requestedBy: "Chef Sharma",
    requestDate: "2026-06-27",
    priority: "low",
    status: "rejected",
    reason: "Quality upgrade request",
    estimatedCost: 25000,
    approvedBy: "Manager Patel",
    approvalDate: "2026-06-27",
  },
  {
    id: "PR-1230",
    ingredient: "Chicken Breast",
    quantity: 80,
    unit: "kg",
    requestedBy: "Chef Sharma",
    requestDate: "2026-06-26",
    priority: "medium",
    status: "ordered",
    reason: "Restocking",
    estimatedCost: 56000,
    approvedBy: "Manager Patel",
    approvalDate: "2026-06-26",
  },
];

const priorityConfig = {
  high: { label: "High", className: "bg-red-100 text-red-700 hover:bg-red-100" },
  medium: { label: "Medium", className: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
  low: { label: "Low", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
};

const statusConfig = {
  pending: { 
    label: "Pending", 
    icon: Clock,
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    color: "text-yellow-600"
  },
  approved: { 
    label: "Approved", 
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 hover:bg-green-100",
    color: "text-green-600"
  },
  rejected: { 
    label: "Rejected", 
    icon: XCircle,
    className: "bg-red-100 text-red-700 hover:bg-red-100",
    color: "text-red-600"
  },
  ordered: { 
    label: "Ordered", 
    icon: CheckCircle,
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    color: "text-blue-600"
  },
};

export function PurchaseRequests() {
  const pendingRequests = purchaseRequests.filter((r) => r.status === "pending");
  const approvedRequests = purchaseRequests.filter((r) => r.status === "approved");
  const allRequests = purchaseRequests;

  const renderRequestCard = (request: PurchaseRequest) => {
    const StatusIcon = statusConfig[request.status].icon;
    
    return (
      <Card key={request.id}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{request.ingredient}</h3>
                <Badge className={priorityConfig[request.priority].className}>
                  {priorityConfig[request.priority].label} Priority
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{request.id}</p>
            </div>
            <Badge className={statusConfig[request.status].className}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig[request.status].label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Quantity</p>
              <p className="font-semibold text-lg">
                {request.quantity} {request.unit}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Cost</p>
              <p className="font-semibold text-lg">
                ₹{request.estimatedCost?.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Reason</p>
            <p className="text-sm mt-1">{request.reason}</p>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              <span>Requested by </span>
              <span className="font-medium text-foreground">{request.requestedBy}</span>
              <span> on {request.requestDate}</span>
            </div>
          </div>

          {request.approvedBy && (
            <div className="text-sm text-muted-foreground">
              <span>Processed by </span>
              <span className="font-medium text-foreground">{request.approvedBy}</span>
              <span> on {request.approvalDate}</span>
            </div>
          )}

          {request.status === "pending" && (
            <div className="flex gap-2">
              <Button className="flex-1" size="sm">
                Approve
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                Reject
              </Button>
            </div>
          )}

          {request.status === "approved" && (
            <Button className="w-full" size="sm">
              Create Purchase Order
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Purchase Requests</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve purchase requests
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-50 p-2">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Pending</div>
              <div className="text-2xl font-semibold">{pendingRequests.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Approved</div>
              <div className="text-2xl font-semibold">{approvedRequests.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">High Priority</div>
              <div className="text-2xl font-semibold">
                {purchaseRequests.filter((r) => r.priority === "high").length}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">This Month</div>
              <div className="text-2xl font-semibold">{purchaseRequests.length}</div>
            </div>
          </div>
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
          <TabsTrigger value="all">
            All Requests ({allRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.map(renderRequestCard)}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedRequests.map(renderRequestCard)}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {allRequests.map(renderRequestCard)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
