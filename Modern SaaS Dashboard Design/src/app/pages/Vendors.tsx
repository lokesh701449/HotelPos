import { Plus, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useState, useEffect } from "react";
import { vendorAPI } from "../services/api";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add vendor modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    leadTime: "2",
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await vendorAPI.list();
      setVendors(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newVendor,
        leadTime: parseInt(newVendor.leadTime) || 2,
      };
      await vendorAPI.create(payload);
      toast.success("Vendor added successfully!");
      setShowAddModal(false);
      setNewVendor({
        name: "",
        email: "",
        contact: "",
        address: "",
        leadTime: "2",
      });
      fetchVendors();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to add vendor");
    }
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
          <h1 className="text-3xl font-semibold">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage supplier relationships
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Vendors</p>
            <p className="text-2xl font-semibold mt-1">{vendors.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Active Vendors</p>
            <p className="text-2xl font-semibold mt-1">
              {vendors.length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Lead Time Avg</p>
            <p className="text-2xl font-semibold mt-1">
              {(vendors.reduce((sum, v) => sum + (v.leadTime || 2), 0) / (vendors.length || 1)).toFixed(1)} days
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Reliability Rate</p>
            <p className="text-2xl font-semibold mt-1">98.5%</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {vendors.map((vendor) => (
          <Card key={vendor.id || vendor._id} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{vendor.name}</h3>
                  <p className="text-sm text-muted-foreground">Supplier Partner</p>
                </div>
                <Badge className="bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20">
                  Active
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.contact || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.address || "India Office"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Lead Time</p>
                  <p className="font-semibold">{vendor.leadTime || 2} days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-semibold">Preferred</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-card border border-border shadow-lg space-y-4 animate-in fade-in zoom-in duration-150">
            <h2 className="text-xl font-semibold">Add Supplier Vendor</h2>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vName">Vendor / Supplier Name</Label>
                <Input
                  id="vName"
                  required
                  placeholder="e.g. Quality Foods Pvt Ltd"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vEmail">Email Address</Label>
                <Input
                  id="vEmail"
                  type="email"
                  placeholder="e.g. sales@qualityfoods.com"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vPhone">Contact Number</Label>
                <Input
                  id="vPhone"
                  placeholder="e.g. +91 99887 76655"
                  value={newVendor.contact}
                  onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vAddress">Office/Warehouse Address</Label>
                <Input
                  id="vAddress"
                  placeholder="e.g. Phase 2, Industrial Area, Mumbai"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vLead">Average Lead Time (Days)</Label>
                <Input
                  id="vLead"
                  type="number"
                  required
                  min="1"
                  value={newVendor.leadTime}
                  onChange={(e) => setNewVendor({ ...newVendor, leadTime: e.target.value })}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Vendor
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
