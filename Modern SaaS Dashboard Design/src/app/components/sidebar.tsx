import { Link, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  Truck, 
  ChefHat, 
  FileText, 
  Users, 
  BarChart3, 
  FileBarChart, 
  Settings,
  Box
} from "lucide-react";
import { cn } from "../components/ui/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Deliveries", href: "/deliveries", icon: Truck },
  { name: "Recipes", href: "/recipes", icon: ChefHat },
  { name: "Purchase Requests", href: "/purchase-requests", icon: FileText },
  { name: "Vendors", href: "/vendors", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Reports", href: "/reports", icon: FileBarChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Box className="h-8 w-8 text-primary" />
        <span className="text-xl font-semibold text-foreground">StockRoom</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = item.href === "/" 
            ? location.pathname === "/" 
            : location.pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="text-xs text-muted-foreground">
          StockRoom v1.0
        </div>
      </div>
    </div>
  );
}
