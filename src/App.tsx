import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/shell/ThemeProvider";
import { AppLayout } from "@/components/shell/AppLayout";
import Dashboard from "./pages/Dashboard";
import Intake from "./pages/Intake";
import IntakeDetail from "./pages/IntakeDetail";
import Pipeline from "./pages/Pipeline";
import Prompts from "./pages/Prompts";
import Deliveries from "./pages/Deliveries";
import Review from "./pages/Review";
import Rules from "./pages/Rules";
import Dictionary from "./pages/Dictionary";
import Templates from "./pages/Templates";
import Targets from "./pages/Targets";
import Logs from "./pages/Logs";
import Health from "./pages/Health";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: false } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/intake" element={<Intake />} />
              <Route path="/intake/:id" element={<IntakeDetail />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/pipeline/:intakeNoteId" element={<Pipeline />} />
              <Route path="/prompts" element={<Prompts />} />
              <Route path="/deliveries" element={<Deliveries />} />
              <Route path="/review" element={<Review />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/dictionary" element={<Dictionary />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/targets" element={<Targets />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/health" element={<Health />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
