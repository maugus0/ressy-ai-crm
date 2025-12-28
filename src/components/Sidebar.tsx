/**
 * Sidebar Component
 * Navigation sidebar for the Client Dashboard
 * Includes real-time escalation badge from SSE
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
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSSE } from "@/contexts/SSEContext";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "calls", label: "Calls", icon: Phone, path: "/dashboard/calls" },
  { id: "callers", label: "Callers", icon: Users, path: "/dashboard/callers" },
  {
    id: "reservations",
    label: "Reservations",
    icon: CalendarDays,
    path: "/dashboard/reservations",
  },
  { id: "orders", label: "Orders", icon: ShoppingBag, path: "/dashboard/orders" },
  { id: "menu", label: "Menu", icon: UtensilsCrossed, path: "/dashboard/menu" },
  { id: "faqs", label: "FAQs", icon: HelpCircle, path: "/dashboard/faqs" },
  {
    id: "escalations",
    label: "Escalations",
    icon: AlertTriangle,
    path: "/dashboard/escalations",
  },
  { id: "settings", label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { escalations } = useSSE();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Get escalation count for badge
  const escalationCount = escalations.length;

  return (
    <div className="w-64 h-full bg-sidebar text-sidebar-foreground flex flex-col shadow-lg border-r border-sidebar-border overflow-hidden">
      {/* Logo */}
      <div className="p-6 flex items-center justify-center flex-shrink-0">
        <img
          src={`${import.meta.env.BASE_URL}ressy-white.png`}
          alt="Ressy Logo"
          className="h-8 w-auto"
        />
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-4 min-h-0">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const showBadge = item.id === "escalations" && escalationCount > 0;

            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.path === "/dashboard"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      // Highlight escalations when there are active ones
                      item.id === "escalations" && escalationCount > 0 && "text-destructive"
                    )
                  }
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      item.id === "escalations" && escalationCount > 0 && "text-destructive"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <Badge
                      variant="destructive"
                      className="h-5 min-w-[20px] px-1.5 text-[10px] flex items-center justify-center flex-shrink-0"
                    >
                      {escalationCount > 99 ? "99+" : escalationCount}
                    </Badge>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout action - Fixed at bottom */}
      <div className="px-4 pb-2 flex-shrink-0">
        <button
          onClick={handleLogout}
          className={cn(
            "group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm",
            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          <span>Logout</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 text-center bg-gradient-to-t from-sidebar/90 to-transparent flex-shrink-0">
        <p className="text-xs text-sidebar-foreground/60 tracking-wide">
          &copy; 2025 <span className="font-semibold">Ressy</span>
        </p>
      </div>
    </div>
  );
}

export default Sidebar;
