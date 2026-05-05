import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NewEvaluationPage from "./pages/NewEvaluationPage";
import SimulationResultsPage from "./pages/SimulationResultsPage";
import AdvancedEvaluationPage from "./pages/AdvancedEvaluationPage";
import ValidationRunnerPage from "./pages/ValidationRunnerPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/evaluate" element={<NewEvaluationPage />} />
          <Route path="/results" element={<SimulationResultsPage />} />
          <Route path="/evaluate/advanced" element={<AdvancedEvaluationPage />} />
          <Route path="/validate" element={<ValidationRunnerPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
