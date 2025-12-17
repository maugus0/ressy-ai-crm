import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/components/LoginPage";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, DashboardLayout } from "@/components/layout";
import {
  DashboardPage,
  CallsPage,
  CallersPage,
  MenuPage,
  FAQsPage,
  OrdersPage,
  ReservationsPage,
} from "@/pages/dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Get base path for GitHub Pages
const getBasePath = () => {
  // Check if we're on GitHub Pages
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/ressy-ai-crm")) {
    return "/ressy-ai-crm";
  }
  return "";
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={getBasePath()}>
          <Routes>
            {/* Default to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="calls" element={<CallsPage />} />
              <Route path="callers" element={<CallersPage />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="menu" element={<MenuPage />} />
              <Route path="faqs" element={<FAQsPage />} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
