import { useState, useEffect } from "react";
import { 
  Package, 
  TrendingDown, 
  AlertTriangle, 
  FileText, 
  Truck, 
  Trash2,
  Users,
  Warehouse,
  ChefHat 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { dashboardAPI } from "../services/api";
import { toast } from "sonner";

export function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [kpi, setKpi] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [foodCostTrend, setFoodCostTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const parsedUser = JSON.parse(userJson);
      setUser(parsedUser);
      fetchDashboardData(parsedUser.role);
    }
  }, []);

  const fetchDashboardData = async (role: string) => {
    setLoading(true);
    try {
      let data: any = {};
      if (role === "Store Keeper") {
        data = await dashboardAPI.storeKeeper();
      } else if (role === "Head Chef") {
        data = await dashboardAPI.chef();
      } else if (role === "F&B Manager") {
        data = await dashboardAPI.manager();
      } else if (role === "Purchase Manager") {
        data = await dashboardAPI.purchaseManager();
      } else {
        data = await dashboardAPI.admin();
      }

      setKpi(data.kpi);
      setActivities(data.recentActivities || []);
      setFoodCostTrend(data.foodCostTrend || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Generate dynamic KPI cards list based on role
  const getKpiCards = () => {
    if (!kpi) return [];
    
    const role = user.role;
    if (role === "Store Keeper") {
      return [
        { title: "Inventory Value", value: `₹${kpi.inventoryValue?.toLocaleString()}`, change: "Live stock balance", icon: Package, color: "text-primary", bgColor: "bg-blue-50" },
        { title: "Low Stock Items", value: kpi.lowStockItems, change: "Need reordering", icon: AlertTriangle, color: "text-warning", bgColor: "bg-orange-50" },
        { title: "Today's Deliveries", value: kpi.todayDeliveries, change: "Expected POs", icon: Truck, color: "text-green-600", bgColor: "bg-green-50" },
        { title: "Monthly Wastage %", value: `${kpi.monthlyWastage}%`, change: "Waste & Spoilage", icon: Trash2, color: "text-red-600", bgColor: "bg-red-50" },
      ];
    }

    if (role === "Head Chef") {
      return [
        { title: "Inventory Value", value: `₹${kpi.inventoryValue?.toLocaleString()}`, change: "Store stock value", icon: Package, color: "text-primary", bgColor: "bg-blue-50" },
        { title: "Low Stock Items", value: kpi.lowStockItems, change: "Below par limit", icon: AlertTriangle, color: "text-warning", bgColor: "bg-orange-50" },
        { title: "Recipes Count", value: kpi.recipesCount, change: "Assigned menu items", icon: ChefHat, color: "text-green-600", bgColor: "bg-green-50" },
        { title: "Pending Requests", value: kpi.pendingRequests, change: "Awaiting approval", icon: FileText, color: "text-blue-600", bgColor: "bg-blue-50" },
      ];
    }

    if (role === "F&B Manager") {
      return [
        { title: "Inventory Value", value: `₹${kpi.inventoryValue?.toLocaleString()}`, change: "Live stock value", icon: Package, color: "text-primary", bgColor: "bg-blue-50" },
        { title: "Food Cost %", value: `${kpi.foodCostPercent}%`, change: "Target: 30%", icon: TrendingDown, color: "text-green-600", bgColor: "bg-green-50" },
        { title: "Low Stock Items", value: kpi.lowStockItems, change: "Par level alerts", icon: AlertTriangle, color: "text-warning", bgColor: "bg-orange-50" },
        { title: "Pending Approvals", value: kpi.pendingRequests, change: "Material requests", icon: FileText, color: "text-blue-600", bgColor: "bg-blue-50" },
        { title: "Monthly Wastage %", value: `${kpi.monthlyWastage}%`, change: "Wastage rate", icon: Trash2, color: "text-red-600", bgColor: "bg-red-50" },
      ];
    }

    if (role === "Purchase Manager") {
      return [
        { title: "Chain Inventory Value", value: `₹${kpi.chainInventoryValue?.toLocaleString()}`, change: "All properties", icon: Package, color: "text-primary", bgColor: "bg-blue-50" },
        { title: "Pending Requests", value: kpi.pendingRequests, change: "Needs conversion to PO", icon: FileText, color: "text-warning", bgColor: "bg-orange-50" },
        { title: "Approved Requests", value: kpi.approvedRequests, change: "Ready to order", icon: FileText, color: "text-green-600", bgColor: "bg-green-50" },
        { title: "Total Purchase Orders", value: kpi.totalPurchaseOrders, change: "Active POs", icon: Truck, color: "text-blue-600", bgColor: "bg-blue-50" },
      ];
    }

    // Admin
    return [
      { title: "Total Users", value: kpi.totalUsers, change: "System users", icon: Users, color: "text-primary", bgColor: "bg-blue-50" },
      { title: "Total Properties", value: kpi.totalProperties, change: "Hotels in chain", icon: Warehouse, iconName: "Building", color: "text-green-600", bgColor: "bg-green-50" },
      { title: "Total Ingredients", value: kpi.totalIngredients, change: "Material definitions", icon: Package, color: "text-warning", bgColor: "bg-orange-50" },
      { title: "Total Recipes", value: kpi.totalRecipes, change: "Dishes configured", icon: ChefHat, color: "text-blue-600", bgColor: "bg-blue-50" },
    ];
  };

  const kpiData = getKpiCards();

  // Mock static values for charts that are shared or generic
  const inventoryTrendData = [
    { month: "Jan", value: 1200000 },
    { month: "Feb", value: 1180000 },
    { month: "Mar", value: 1250000 },
    { month: "Apr", value: 1210000 },
    { month: "May", value: 1280000 },
    { month: "Jun", value: kpi?.inventoryValue || kpi?.chainInventoryValue || 1245890 },
  ];

  const categoryData = [
    { name: "Vegetables", value: 280000, color: "#10B981" },
    { name: "Dairy", value: 220000, color: "#3B82F6" },
    { name: "Meat", value: 350000, color: "#EF4444" },
    { name: "Grains", value: 180000, color: "#F59E0B" },
    { name: "Spices", value: 95890, color: "#8B5CF6" },
    { name: "Others", value: 120000, color: "#EC4899" },
  ];

  const topIngredientsData = [
    { name: "Chicken", quantity: 450 },
    { name: "Rice", quantity: 380 },
    { name: "Tomatoes", quantity: 320 },
    { name: "Onions", quantity: 290 },
    { name: "Milk", quantity: 250 },
  ];

  const activityTypeColors: Record<string, string> = {
    received: "bg-green-100 text-green-700",
    issued: "bg-blue-100 text-blue-700",
    consumed: "bg-orange-100 text-orange-700",
    adjustment: "bg-gray-100 text-gray-700",
    alert: "bg-red-100 text-red-700",
    approved: "bg-green-100 text-green-700",
    waste: "bg-red-100 text-red-700",
    spoilage: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Good Morning, {user.name} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Role: <span className="font-semibold">{user.role}</span>
          </p>
        </div>
        <div className="rounded-lg bg-green-100 px-4 py-2">
          <span className="text-sm font-medium text-green-700">
            ● System Status: Connected
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpiCard: any) => (
          <Card key={kpiCard.title} className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{kpiCard.title}</p>
                  <p className="mt-2 text-3xl font-semibold">{kpiCard.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {kpiCard.change}
                  </p>
                </div>
                <div className={`rounded-lg ${kpiCard.bgColor} p-3`}>
                  <kpiCard.icon className={`h-6 w-6 ${kpiCard.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      {user.role !== "Admin" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Inventory Trend */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Inventory Value Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={inventoryTrendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2563EB" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Food Cost Trend */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Food Cost % - Target vs Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={foodCostTrend.length > 0 ? foodCostTrend : [
                  { month: "Jan", target: 30, actual: 32.5 },
                  { month: "Feb", target: 30, actual: 31.8 },
                  { month: "Mar", target: 30, actual: 33.2 },
                  { month: "Apr", target: 30, actual: 34.5 },
                  { month: "May", target: 30, actual: 32.8 },
                  { month: "Jun", target: 30, actual: 32.5 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activities */}
      {activities.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 border-l-2 border-border pl-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${activityTypeColors[activity.type] || "bg-gray-100"}`}>
                        {activity.type}
                      </span>
                      <p className="font-medium text-foreground">{activity.title}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{activity.user}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
