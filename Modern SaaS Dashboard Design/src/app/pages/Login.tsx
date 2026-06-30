import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Package, Warehouse, ChefHat, BarChart3, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { authAPI } from "../services/api";
import { toast } from "sonner";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@stockroom.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authAPI.login(email, password);
      toast.success("Successfully logged in!");
      navigate("/");
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to log in. Please check credentials.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2563EB] to-[#1E40AF] p-12 flex-col justify-between text-white">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <Package className="h-6 w-6 text-[#2563EB]" />
            </div>
            <span className="text-2xl font-semibold">StockRoom</span>
          </div>

          <div className="space-y-8 max-w-lg">
            <div>
              <h1 className="text-4xl font-semibold mb-4">
                Hotel Raw Material & Inventory Management
              </h1>
              <p className="text-lg text-blue-100">
                Modern SaaS platform for seamless inventory tracking, food cost
                management, and real-time analytics.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="space-y-2">
                <div className="bg-white/10 p-3 rounded-lg w-fit">
                  <Warehouse className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">Store Management</h3>
                <p className="text-sm text-blue-100">
                  Track inventory movements and stock levels in real-time
                </p>
              </div>

              <div className="space-y-2">
                <div className="bg-white/10 p-3 rounded-lg w-fit">
                  <ChefHat className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">Recipe Costing</h3>
                <p className="text-sm text-blue-100">
                  Manage recipes and calculate accurate food costs
                </p>
              </div>

              <div className="space-y-2">
                <div className="bg-white/10 p-3 rounded-lg w-fit">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-blue-100">
                  Gain insights with comprehensive reports and dashboards
                </p>
              </div>

              <div className="space-y-2">
                <div className="bg-white/10 p-3 rounded-lg w-fit">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">Purchase Orders</h3>
                <p className="text-sm text-blue-100">
                  Streamline procurement and vendor management
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-blue-100">
          © 2026 StockRoom. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">StockRoom</span>
            </div>
            <h2 className="text-2xl font-semibold mt-4">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/15 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@stockroom.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input-background"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input-background"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" defaultChecked />
                <Label htmlFor="remember" className="cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Button type="button" variant="link" className="px-0">
                Forgot password?
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p className="font-semibold mb-1">Demo Credentials:</p>
              <div className="text-xs space-y-0.5">
                <p>Admin: admin@stockroom.com (PW: password123)</p>
                <p>Chef: chef@stockroom.com (PW: password123)</p>
                <p>Store Keeper: storekeeper@stockroom.com (PW: password123)</p>
                <p>F&B Manager: manager@stockroom.com (PW: password123)</p>
                <p>Purchase Manager: purchase@stockroom.com (PW: password123)</p>
              </div>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            Need help? Contact support@stockroom.com
          </div>
        </Card>
      </div>
    </div>
  );
}
