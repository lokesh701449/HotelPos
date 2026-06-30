import { Outlet } from "react-router";
import { Sidebar } from "../components/sidebar";
import { TopNav } from "../components/top-nav";

export function RootLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
