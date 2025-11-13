import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { Staff } from "./pages/Staff";
import EmployeeArchives from "./pages/EmployeeArchives";
import { SelfRegistration } from "./pages/SelfRegistration";
import { useAuth } from "./hooks/useAuth";
import { useEmailConfirmation } from "./hooks/useEmailConfirmation";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  useEmailConfirmation(); // Handle profile creation after email confirmation

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<SelfRegistration />} />
            <Route path="/staff" element={
              <AuthWrapper>
                <Staff />
              </AuthWrapper>
            } />
            <Route path="/employee-archives" element={
              <AuthWrapper>
                <EmployeeArchives />
              </AuthWrapper>
            } />
            <Route path="/" element={
              <AuthWrapper>
                <Index />
              </AuthWrapper>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
