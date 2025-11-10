import { Users, Phone, BarChart3, LogOut, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
}

const menuItems = [
  { id: "landing", label: "Overview", icon: Home },
  { id: "customer", label: "Customer Database", icon: Users },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
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
            const isActive = activeTab === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "group w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md"
                      : "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground text-sidebar-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )}
                  />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout action */}
      {onLogout && (
        <div className="px-4 pb-2">
          <button
            onClick={onLogout}
            className={cn(
              "group w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground text-sidebar-foreground"
            )}
          >
            <LogOut className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border text-center bg-gradient-to-t from-sidebar/90 to-transparent">
        <p className="text-xs text-sidebar-foreground/60 tracking-wide">
          &copy; 2025 <span className="font-semibold">Ressy</span>
        </p>
      </div>
    </div>
  );
}
