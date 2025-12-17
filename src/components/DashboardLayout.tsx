/**
 * Dashboard Layout
 * Main layout wrapper for authenticated dashboard pages
 */

import { useState, useRef, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Menu, UserCircle2, LogOut } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const { restaurantName, user, logout } = useAuth();

  const companyName = restaurantName || "Your Restaurant";
  const email = user?.email || "manager@restaurant.com";

  const handleLogout = async () => {
    await logout();
  };

  // Accessibility: trap focus inside mobile sidebar and lock body scroll
  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const container = sidebarRef.current;
    if (!container)
      return () => {
        document.body.style.overflow = previousOverflow;
      };

    const focusableSelectors = [
      "a[href]",
      "button",
      "textarea",
      'input[type="text"]',
      'input[type="radio"]',
      'input[type="checkbox"]',
      "select",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");
    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => !el.hasAttribute("disabled")
      );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // move focus into the drawer
    const focusable = getFocusable();
    if (focusable[0]) focusable[0].focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  // Close sidebar on Escape
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    if (sidebarOpen) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Sidebar drawer for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Sidebar navigation"
        >
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative h-full w-auto max-w-[80vw]">
            <div
              ref={sidebarRef}
              className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-sidebar z-50 outline-none shadow-xl transform transition-transform duration-300 translate-x-0"
              tabIndex={-1}
            >
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with hamburger */}
        <div className="md:hidden flex items-center justify-between bg-card border-b border-border px-4 py-3">
          <h1 className="text-lg font-semibold text-foreground">{companyName}</h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop header */}
        <header className="hidden md:flex items-center justify-between bg-card border-b border-border px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{companyName}</h1>
            <p className="text-sm text-muted-foreground">Restaurant Manager Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-border bg-background/60 px-3 py-1.5">
              <UserCircle2 className="h-7 w-7 text-muted-foreground" />
              <div className="leading-tight">
                <p className="text-sm font-medium text-foreground">Restaurant Manager</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
