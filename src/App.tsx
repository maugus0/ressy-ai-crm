import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Dashboard } from "@/pages/Dashboard";
import { Calls } from "@/pages/Calls";
import { Callers } from "@/pages/Callers";
import { Menu } from "@/pages/Menu";
import { FAQ } from "@/pages/FAQ";
import { Orders } from "@/pages/Orders";
import { Reservations } from "@/pages/Reservations";
import { Settings } from "@/pages/Settings";
import { Login } from "@/pages/Login";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Get base path for GitHub Pages
const getBasePath = (): string => {
  try {
    // Check if we're on GitHub Pages
    if (typeof window !== "undefined" && window.location?.pathname?.startsWith("/ressy-ai-crm")) {
      return "/ressy-ai-crm";
    }
  } catch {
    // Fallback if window access fails
  }
  return "";
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={getBasePath()}>
            <Routes>
              {/* Default to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="calls" element={<Calls />} />
                <Route path="callers" element={<Callers />} />
                <Route path="reservations" element={<Reservations />} />
                <Route path="orders" element={<Orders />} />
                <Route path="menu" element={<Menu />} />
                <Route path="faqs" element={<FAQ />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
