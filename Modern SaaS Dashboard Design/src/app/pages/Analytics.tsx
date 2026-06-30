import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

const monthlyTrendData = [
  { month: "Jan", purchases: 650000, consumption: 620000, waste: 18000 },
  { month: "Feb", purchases: 680000, consumption: 655000, waste: 15000 },
  { month: "Mar", purchases: 720000, consumption: 695000, waste: 20000 },
  { month: "Apr", purchases: 750000, consumption: 720000, waste: 22000 },
  { month: "May", purchases: 780000, consumption: 755000, waste: 19000 },
  { month: "Jun", purchases: 845320, consumption: 820000, waste: 16000 },
];

const categorySpendData = [
  { category: "Meat & Poultry", amount: 195000, color: "#EF4444" },
  { category: "Vegetables", amount: 95000, color: "#10B981" },
  { category: "Dairy", amount: 145000, color: "#3B82F6" },
  { category: "Dry Goods", amount: 125000, color: "#F59E0B" },
  { category: "Cooking Oils", amount: 65000, color: "#8B5CF6" },
  { category: "Others", amount: 85000, color: "#64748B" },
];

const supplierPerformance = [
  { name: "Fresh Meats Co.", orders: 12, onTime: 95, quality: 4.8 },
  { name: "Veggie Suppliers", orders: 18, onTime: 92, quality: 4.5 },
  { name: "Dairy Fresh", orders: 15, onTime: 98, quality: 4.9 },
  { name: "Grain Masters", orders: 8, onTime: 88, quality: 4.6 },
  { name: "Oil Traders", orders: 6, onTime: 90, quality: 4.3 },
];

const wasteAnalysis = [
  { reason: "Spoilage", percentage: 45, color: "#EF4444" },
  { reason: "Over-ordering", percentage: 25, color: "#F59E0B" },
  { reason: "Quality Issues", percentage: 15, color: "#8B5CF6" },
  { reason: "Spillage", percentage: 10, color: "#3B82F6" },
  { reason: "Others", percentage: 5, color: "#64748B" },
];

export function Analytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          In-depth insights and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Purchase Efficiency</p>
            <p className="text-2xl font-semibold mt-2">87.5%</p>
            <div className="flex items-center gap-1 mt-2 text-sm text-[#10B981]">
              <TrendingUp className="h-4 w-4" />
              <span>+3.2% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Inventory Turnover</p>
            <p className="text-2xl font-semibold mt-2">8.2x</p>
            <div className="flex items-center gap-1 mt-2 text-sm text-[#10B981]">
              <TrendingUp className="h-4 w-4" />
              <span>+0.5x vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Wastage Rate</p>
            <p className="text-2xl font-semibold mt-2">1.9%</p>
            <div className="flex items-center gap-1 mt-2 text-sm text-[#10B981]">
              <TrendingDown className="h-4 w-4" />
              <span>-0.3% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Avg Order Value</p>
            <p className="text-2xl font-semibold mt-2">₹58,450</p>
            <div className="flex items-center gap-1 mt-2 text-sm text-[#EF4444]">
              <TrendingDown className="h-4 w-4" />
              <span>-2.1% vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Purchase vs Consumption Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="purchases"
                  stroke="#2563EB"
                  strokeWidth={2}
                  name="Purchases"
                />
                <Line
                  type="monotone"
                  dataKey="consumption"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Consumption"
                />
                <Line
                  type="monotone"
                  dataKey="waste"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Waste"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Category-wise Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categorySpendData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="amount"
                  label
                >
                  {categorySpendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Supplier Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={supplierPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" angle={-15} textAnchor="end" height={80} />
                <YAxis stroke="#64748B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="onTime" fill="#10B981" name="On-Time Delivery %" />
                <Bar dataKey="quality" fill="#2563EB" name="Quality Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Waste Analysis by Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wasteAnalysis.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.reason}</span>
                    <span className="text-sm font-semibold">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3 p-4 bg-[#ECFDF5] rounded-lg border border-[#10B981]/20">
              <TrendingUp className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#10B981]">Improved Inventory Management</p>
                <p className="text-sm mt-1">
                  Your inventory turnover has increased by 0.5x this month, indicating better stock management.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 bg-[#ECFDF5] rounded-lg border border-[#10B981]/20">
              <TrendingDown className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#10B981]">Reduced Wastage</p>
                <p className="text-sm mt-1">
                  Wastage has decreased by 0.3% this month. Continue monitoring spoilage and over-ordering.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 bg-[#FFFBEB] rounded-lg border border-[#F59E0B]/20">
              <TrendingUp className="h-5 w-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#F59E0B]">Rising Food Costs</p>
                <p className="text-sm mt-1">
                  Purchase costs have increased by 8.5% this month. Consider negotiating with suppliers or exploring alternatives.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
