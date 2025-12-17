/**
 * Sidebar Component
 * Navigation sidebar for the Client Dashboard
 */

import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Phone,
  Users,
  UtensilsCrossed,
  HelpCircle,
  ShoppingBag,
  CalendarDays,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "calls", label: "Calls", icon: Phone, path: "/dashboard/calls" },
  { id: "callers", label: "Callers", icon: Users, path: "/dashboard/callers" },
  { id: "reservations", label: "Reservations", icon: CalendarDays, path: "/dashboard/reservations" },
  { id: "orders", label: "Orders", icon: ShoppingBag, path: "/dashboard/orders" },
  { id: "menu", label: "Menu", icon: UtensilsCrossed, path: "/dashboard/menu" },
  { id: "faqs", label: "FAQs", icon: HelpCircle, path: "/dashboard/faqs" },
  { id: "settings", label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="w-64 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border flex items-center justify-center">
        <img
          src={`${import.meta.env.BASE_URL}ressy-white.png`}
          alt="Ressy Logo"
          className="h-8 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.path === "/dashboard"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md"
                        : "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground text-sidebar-foreground"
                    )
                  }
                >
                  <Icon
                    className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                  />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout action */}
      <div className="px-4 pb-2">
        <button
          onClick={handleLogout}
          className={cn(
            "group w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground text-sidebar-foreground"
          )}
        >
          <LogOut className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          <span>Logout</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border text-center bg-gradient-to-t from-sidebar/90 to-transparent">
        <p className="text-xs text-sidebar-foreground/60 tracking-wide">
          &copy; 2025 <span className="font-semibold">Ressy</span>
        </p>
      </div>
    </div>
  );
}
