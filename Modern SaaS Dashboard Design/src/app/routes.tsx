import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { MainLayout } from "./components/MainLayout";
import { Dashboard } from "./pages/dashboard"; // note: lowercased filename matches actual file
import { Inventory } from "./pages/inventory"; // note: lowercased filename matches actual file
import { IngredientDetails } from "./pages/IngredientDetails";
import { Transactions } from "./pages/Transactions";
import { Deliveries } from "./pages/Deliveries";
import { Recipes } from "./pages/Recipes";
import { PurchaseRequests } from "./pages/PurchaseRequests";
import { Vendors } from "./pages/Vendors";
import { Analytics } from "./pages/Analytics";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";

// Helper component for Route protection
function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        path: "",
        Component: MainLayout,
        children: [
          { index: true, Component: Dashboard },
          
          // Inventory - All roles have access to view, but page itself will limit actions
          {
            path: "inventory",
            Component: Inventory,
          },
          {
            path: "inventory/:id",
            Component: IngredientDetails,
          },
          
          // Transactions - Store Keeper, F&B Manager, Admin
          {
            element: <ProtectedRoute allowedRoles={["Store Keeper", "F&B Manager", "Admin"]} />,
            children: [{ path: "transactions", Component: Transactions }],
          },
          
          // Deliveries - Store Keeper, Admin
          {
            element: <ProtectedRoute allowedRoles={["Store Keeper", "Admin"]} />,
            children: [{ path: "deliveries", Component: Deliveries }],
          },
          
          // Recipes - Head Chef, Admin
          {
            element: <ProtectedRoute allowedRoles={["Head Chef", "Admin"]} />,
            children: [{ path: "recipes", Component: Recipes }],
          },
          
          // Purchase Requests - Head Chef, F&B Manager, Purchase Manager, Admin
          {
            element: <ProtectedRoute allowedRoles={["Head Chef", "F&B Manager", "Purchase Manager", "Admin"]} />,
            children: [{ path: "purchase-requests", Component: PurchaseRequests }],
          },
          
          // Vendors - Purchase Manager, Admin
          {
            element: <ProtectedRoute allowedRoles={["Purchase Manager", "Admin"]} />,
            children: [{ path: "vendors", Component: Vendors }],
          },
          
          // Analytics - F&B Manager, Purchase Manager, Admin
          {
            element: <ProtectedRoute allowedRoles={["F&B Manager", "Purchase Manager", "Admin"]} />,
            children: [{ path: "analytics", Component: Analytics }],
          },
          
          // Reports - F&B Manager, Admin
          {
            element: <ProtectedRoute allowedRoles={["F&B Manager", "Admin"]} />,
            children: [{ path: "reports", Component: Reports }],
          },
          
          // Settings - Admin (mostly system settings) and generally accessible for profile
          {
            path: "settings",
            Component: Settings,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
