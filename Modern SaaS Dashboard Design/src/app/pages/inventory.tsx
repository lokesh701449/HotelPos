import { useState, useEffect } from "react";
import { Search, Filter, Download, Plus, MoreVertical, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card } from "../components/ui/card";
import { inventoryAPI, ingredientAPI, transactionAPI } from "../services/api";
import { toast } from "sonner";

export function Inventory() {
  const [user, setUser] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("Audit Adjustment");
  const [adjustType, setAdjustType] = useState("ADJUST"); // ADJUST, ISSUE, WASTE, SPOILAGE

  // Add ingredient state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Vegetables",
    sku: "",
    parLevel: "",
    unit: "kg",
    baseUnit: "kg",
    supplier: "",
    value: "",
    storageLocation: "Dry Pantry",
  });

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      setUser(JSON.parse(userJson));
    }
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await inventoryAPI.list();
      setInventoryData(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !adjustQty) return;

    try {
      const qtyNum = parseFloat(adjustQty);
      const data = {
        ingredientId: selectedItem.id,
        quantity: qtyNum,
        unit: selectedItem.unit,
        notes: adjustReason,
      };

      if (adjustType === "ADJUST") {
        await transactionAPI.adjust(data);
      } else if (adjustType === "ISSUE") {
        await transactionAPI.issue(data);
      } else if (adjustType === "WASTE") {
        await transactionAPI.waste(data);
      } else if (adjustType === "SPOILAGE") {
        await transactionAPI.spoilage(data);
      }

      toast.success("Stock updated successfully");
      setShowAdjustModal(false);
      setAdjustQty("");
      fetchInventory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to adjust stock");
    }
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newItem,
        parLevel: parseFloat(newItem.parLevel),
        value: parseFloat(newItem.value),
      };

      await ingredientAPI.create(payload);
      toast.success("Ingredient added successfully!");
      setShowAddModal(false);
      setNewItem({
        name: "",
        category: "Vegetables",
        sku: "",
        parLevel: "",
        unit: "kg",
        baseUnit: "kg",
        supplier: "",
        value: "",
        storageLocation: "Dry Pantry",
      });
      fetchInventory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to add ingredient");
    }
  };

  const filteredData = inventoryData.filter((item) => {
    const matchesSearch = item.ingredient.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalValue = inventoryData.reduce((sum, item) => sum + item.value, 0);
  const lowStockCount = inventoryData.filter((item) => item.status === "low" || item.status === "critical" || item.status === "out").length;

  const statusConfig: Record<string, { label: string; className: string }> = {
    healthy: { label: "Healthy", className: "bg-green-100 text-green-700 hover:bg-green-100" },
    low: { label: "Low Stock", className: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
    critical: { label: "Critical", className: "bg-red-100 text-red-700 hover:bg-red-100" },
    out: { label: "Out of Stock", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isStoreKeeper = user?.role === "Store Keeper";
  const isAdmin = user?.role === "Admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your raw materials
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Ingredient
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Items</div>
          <div className="mt-2 text-2xl font-semibold">{inventoryData.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Value</div>
          <div className="mt-2 text-2xl font-semibold">₹{totalValue.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Low/Critical Stock Items</div>
          <div className="mt-2 text-2xl font-semibold text-orange-600">{lowStockCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Categories</div>
          <div className="mt-2 text-2xl font-semibold">
            {new Set(inventoryData.map((item) => item.category)).size}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Meat">Meat</SelectItem>
              <SelectItem value="Dairy">Dairy</SelectItem>
              <SelectItem value="Vegetables">Vegetables</SelectItem>
              <SelectItem value="Grains">Grains</SelectItem>
              <SelectItem value="Spices">Spices</SelectItem>
              <SelectItem value="Oils">Oils</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            More Filters
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingredient</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Par Level</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => {
              const percentage = (item.available / item.parLevel) * 100;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <Link to={`/inventory/${item.id}`} className="hover:text-primary underline">
                      {item.ingredient}
                    </Link>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.available}
                      {percentage > 100 && <TrendingUp className="h-4 w-4 text-green-600" />}
                      {percentage < 50 && <TrendingDown className="h-4 w-4 text-red-600" />}
                    </div>
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{item.parLevel}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.supplier}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[item.status]?.className || "bg-gray-100 text-gray-700"}>
                      {statusConfig[item.status]?.label || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{item.value.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {(isStoreKeeper || isAdmin) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/inventory/${item.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedItem(item);
                            setAdjustType("ADJUST");
                            setShowAdjustModal(true);
                          }}>
                            Adjust Stock
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-card border border-border shadow-lg space-y-4">
            <h2 className="text-xl font-semibold">Adjust Stock: {selectedItem.ingredient}</h2>
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Adjustment Type</label>
                <Select value={adjustType} onValueChange={setAdjustType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADJUST">General Audit Adjustment (signed quantity)</SelectItem>
                    <SelectItem value="ISSUE">Issue to Kitchen (negative quantity)</SelectItem>
                    <SelectItem value="WASTE">Discard as Waste (negative quantity)</SelectItem>
                    <SelectItem value="SPOILAGE">Discard as Spoilage (negative quantity)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity ({selectedItem.unit})</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder={adjustType === "ADJUST" ? "e.g., -5 or 10" : "e.g., 5"}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Current stock: {selectedItem.available} {selectedItem.unit}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason / Note</label>
                <Input
                  required
                  placeholder="Reason for adjustment"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAdjustModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Ingredient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-card border border-border shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold">Add New Ingredient</h2>
            <form onSubmit={handleAddIngredient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    required
                    placeholder="Chicken Breast"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={newItem.category}
                    onValueChange={(val) => setNewItem({ ...newItem, category: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Meat">Meat</SelectItem>
                      <SelectItem value="Dairy">Dairy</SelectItem>
                      <SelectItem value="Vegetables">Vegetables</SelectItem>
                      <SelectItem value="Grains">Grains</SelectItem>
                      <SelectItem value="Spices">Spices</SelectItem>
                      <SelectItem value="Oils">Oils</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU (Unique)</label>
                  <Input
                    required
                    placeholder="CHK-002"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Storage Location</label>
                  <Input
                    placeholder="Cold Room A"
                    value={newItem.storageLocation}
                    onChange={(e) => setNewItem({ ...newItem, storageLocation: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Display Unit</label>
                  <Input
                    required
                    placeholder="kg"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Base Unit (Calculations)</label>
                  <Input
                    required
                    placeholder="g"
                    value={newItem.baseUnit}
                    onChange={(e) => setNewItem({ ...newItem, baseUnit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Par Level (Alerts)</label>
                  <Input
                    type="number"
                    required
                    placeholder="100"
                    value={newItem.parLevel}
                    onChange={(e) => setNewItem({ ...newItem, parLevel: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price per Unit (₹)</label>
                  <Input
                    type="number"
                    required
                    placeholder="500"
                    value={newItem.value}
                    onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier / Vendor Name</label>
                <Input
                  placeholder="Fresh Farms Ltd"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Ingredient
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
