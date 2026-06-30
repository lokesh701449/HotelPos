import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  Truck,
  ChefHat,
  FileText,
  Users,
  BarChart3,
  FileBarChart,
  Settings,
  Search,
  Bell,
  Plus,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Toaster } from "./ui/sonner";
import { authAPI } from "../services/api";

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeProperty, setActiveProperty] = useState<any>(null);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const parsedUser = JSON.parse(userJson);
      setUser(parsedUser);
      
      // Determine active property
      const storedPropId = localStorage.getItem("propertyId");
      if (parsedUser.assignedProperties && parsedUser.assignedProperties.length > 0) {
        const matchingProp = parsedUser.assignedProperties.find(
          (p: any) => (p._id || p) === storedPropId
        );
        setActiveProperty(matchingProp || parsedUser.assignedProperties[0]);
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  if (!user) return null;

  // Filter navigation links dynamically based on user role
  const getNavigation = () => {
    const role = user.role;
    const baseNav = [{ name: "Dashboard", href: "/", icon: LayoutDashboard }];

    if (role === "Store Keeper") {
      return [
        ...baseNav,
        { name: "Receive Delivery", href: "/deliveries", icon: Truck },
        { name: "Transactions", href: "/transactions", icon: ArrowRightLeft },
        { name: "Inventory", href: "/inventory", icon: Package },
      ];
    }
    
    if (role === "Head Chef") {
      return [
        ...baseNav,
        { name: "Stock Check", href: "/inventory", icon: Package },
        { name: "Recipes", href: "/recipes", icon: ChefHat },
        { name: "Purchase Requests", href: "/purchase-requests", icon: FileText },
      ];
    }

    if (role === "F&B Manager") {
      return [
        ...baseNav,
        { name: "Approvals", href: "/purchase-requests", icon: FileText },
        { name: "Transactions", href: "/transactions", icon: ArrowRightLeft },
        { name: "Reports", href: "/reports", icon: FileBarChart },
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
      ];
    }

    if (role === "Purchase Manager") {
      return [
        ...baseNav,
        { name: "Purchase Requests", href: "/purchase-requests", icon: FileText },
        { name: "Chain Inventory", href: "/inventory", icon: Package },
        { name: "Vendor Info", href: "/vendors", icon: Users },
      ];
    }

    // Admin has access to all links
    return [
      ...baseNav,
      { name: "Inventory", href: "/inventory", icon: Package },
      { name: "Transactions", href: "/transactions", icon: ArrowRightLeft },
      { name: "Deliveries", href: "/deliveries", icon: Truck },
      { name: "Recipes", href: "/recipes", icon: ChefHat },
      { name: "Purchase Requests", href: "/purchase-requests", icon: FileText },
      { name: "Vendors", href: "/vendors", icon: Users },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Reports", href: "/reports", icon: FileBarChart },
      { name: "System Settings", href: "/settings", icon: Settings },
    ];
  };

  const navigation = getNavigation();

  // Avatar initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handlePropertyChange = (property: any) => {
    const propId = property._id || property;
    localStorage.setItem("propertyId", propId);
    setActiveProperty(property);
    setShowPropertyDropdown(false);
    // Reload page to refresh context
    window.location.reload();
  };

  const handleLogout = () => {
    authAPI.logout();
  };

  const propertyName = activeProperty
    ? typeof activeProperty === "string"
      ? "Property Assigned"
      : activeProperty.name
    : "Grand Hotel";

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">StockRoom</span>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary mx-auto">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={!sidebarOpen ? "hidden" : ""}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));
            return (
              <Link key={item.name} to={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  } ${!sidebarOpen ? "justify-center" : ""}`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout button at the bottom of sidebar */}
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive w-full ${
              !sidebarOpen ? "justify-center" : "justify-start"
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Log Out</span>}
          </Button>
        </div>

        {!sidebarOpen && (
          <div className="p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="w-full"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold">StockRoom</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
              {navigation.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== "/" && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 border-t border-border">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive w-full justify-start"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">Log Out</span>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1 flex items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search ingredients, transactions..."
                className="pl-9 bg-input-background"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Property Selector Dropdown */}
            {user.assignedProperties && user.assignedProperties.length > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowPropertyDropdown(!showPropertyDropdown)}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm">{propertyName}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                {showPropertyDropdown && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card border border-border z-50">
                    <div className="py-1">
                      {user.assignedProperties.map((prop: any) => (
                        <button
                          key={prop._id || prop}
                          onClick={() => handlePropertyChange(prop)}
                          className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          {prop.name || "Assigned Property"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-[10px]">
                2
              </Badge>
            </div>

            <Avatar className="cursor-pointer" onClick={() => navigate("/settings")}>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}