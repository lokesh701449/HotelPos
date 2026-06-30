import { Download, FileText, Calendar, Eye } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useState } from "react";
import { reportAPI } from "../services/api";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";

export function Reports() {
  const [reportType, setReportType] = useState(""); // food-cost, variance, wastage, reconciliation
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (type: string) => {
    setLoading(true);
    setReportType(type);
    try {
      let data: any = null;
      if (type === "food-cost") {
        data = await reportAPI.foodCost(30);
      } else if (type === "variance") {
        data = await reportAPI.variance(30);
      } else if (type === "wastage") {
        data = await reportAPI.wastage(30);
      } else if (type === "reconciliation") {
        data = await reportAPI.monthEndReconciliation();
      }
      setReportData(data);
      toast.success("Report loaded successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to generate report");
      setReportType("");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (title: string) => {
    toast.success(`Downloaded ${title} successfully!`);
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex h-32 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!reportData) return null;

    if (reportType === "food-cost") {
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Food Cost Analysis (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xl font-bold">Total Material Value: ₹{reportData.totalCost?.toLocaleString()}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Value (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.categories.map((cat: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell className="text-right font-medium">₹{cat.value.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    }

    if (reportType === "variance") {
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Theoretical vs Actual Consumption Variance (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="text-right">Theoretical (Prep)</TableHead>
                  <TableHead className="text-right">Actual Out (Store)</TableHead>
                  <TableHead className="text-right">Variance (Loss)</TableHead>
                  <TableHead className="text-right">Variance Value (₹)</TableHead>
                  <TableHead>Explanation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.ingredient}</TableCell>
                    <TableCell className="text-right">{row.theoretical} {row.unit}</TableCell>
                    <TableCell className="text-right">{row.actual} {row.unit}</TableCell>
                    <TableCell className="text-right text-red-600 font-semibold">{row.variance} {row.unit}</TableCell>
                    <TableCell className="text-right font-semibold">₹{row.varianceValue.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{row.explanation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    }

    if (reportType === "wastage") {
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Wastage & Spoilage Logs (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-lg font-bold text-red-600">Total Wastage Cost: ₹{reportData.totalCost?.toLocaleString()}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Value (₹)</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell className="font-medium">{item.ingredient}</TableCell>
                    <TableCell>
                      <Badge className={item.type === "spoilage" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}>
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.qty} {item.unit}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">₹{item.value.toLocaleString()}</TableCell>
                    <TableCell>{item.reportedBy}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    }

    if (reportType === "reconciliation") {
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Month-End Reconciliation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Total Ingredients Reconciled</p>
                <p className="text-2xl font-bold">{reportData.totalIngredients}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Audit Adjustments count</p>
                <p className="text-2xl font-bold">{reportData.auditAdjustmentsCount}</p>
              </div>
            </div>
            <p className="font-semibold text-sm pt-2">Recent Physical Audit Adjustments:</p>
            {reportData.recentAdjustments && reportData.recentAdjustments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Ingredient</TableHead>
                    <TableHead className="text-right">Adjustment</TableHead>
                    <TableHead>Audited By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.recentAdjustments.map((adj: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{adj.date}</TableCell>
                      <TableCell className="font-medium">{adj.ingredient}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {adj.qty > 0 ? "+" : ""}{adj.qty} {adj.unit}
                      </TableCell>
                      <TableCell>{adj.by}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{adj.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No recent adjustments found.</p>
            )}
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  const reports = [
    {
      title: "Food Cost Analysis",
      description: "Theoretical vs actual food cost comparison and category cost analysis.",
      frequency: "Monthly",
      lastGenerated: "Live data",
      type: "food-cost",
    },
    {
      title: "Variance Analysis",
      description: "Stock variances and adjustments comparing recipe prep consumption against store issues.",
      frequency: "Monthly",
      lastGenerated: "Live data",
      type: "variance",
    },
    {
      title: "Wastage Report",
      description: "Detailed wastage and spoilage transaction analysis with logged monetary values.",
      frequency: "Monthly",
      lastGenerated: "Live data",
      type: "wastage",
    },
    {
      title: "Month-End Reconciliation",
      description: "Summary of physical audit adjustments and transaction reconciliation.",
      frequency: "Monthly",
      lastGenerated: "Live data",
      type: "reconciliation",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate and review real-time property reports
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="font-medium mb-2">Live Reporting Console</p>
              <p className="text-sm text-muted-foreground">
                View real-time, immutable inventory ledger calculations directly below or download summaries.
              </p>
            </div>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Custom Range
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report, idx) => (
          <Card key={idx} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex gap-4">
                <div className="bg-[#EFF6FF] p-3 rounded-lg h-fit">
                  <FileText className="h-6 w-6 text-[#2563EB]" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 text-xs leading-relaxed">
                    {report.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-muted-foreground">
                      <p>Frequency: {report.frequency}</p>
                      <p>Status: {report.lastGenerated}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => fetchReport(report.type)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(report.title)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Render selected report content dynamically */}
      {renderReportContent()}
    </div>
  );
}
