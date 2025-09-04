import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChatPanel } from "./components/ChatPanel";
import { ChatSettings } from "./components/ChatSettings";
import { VoiceNavigationWrapper } from "./components/VoiceNavigationWrapper";
import { ProgressBar } from "./components/ProgressBar";

// Pages
import Landing from "./pages/Landing";
import Start from "./pages/Start";
import PanCapture from "./pages/PanCapture";
import AddressCapture from "./pages/AddressCapture";
import KycSelfie from "./pages/KycSelfie";
import BackgroundChecks from "./pages/BackgroundChecks";
import Offers from "./pages/Offers";
import Terms from "./pages/Terms";
import OtpSign from "./pages/OtpSign";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";
import { EscalationModal } from "./components/EscalationModal";

const queryClient = new QueryClient();

const App = () => {
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [chatSettingsOpen, setChatSettingsOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ProgressBar />
          <VoiceNavigationWrapper>
            <div className="h-screen flex overflow-hidden">
              <main className="flex-1 w-0 overflow-auto">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/start" element={<Start />} />
                  <Route path="/pii/pan" element={<PanCapture onEscalate={() => setEscalationOpen(true)} />} />
                  <Route path="/pii/address" element={<AddressCapture onEscalate={() => setEscalationOpen(true)} />} />
                  <Route path="/kyc/selfie" element={<KycSelfie onEscalate={() => setEscalationOpen(true)} />} />
                  <Route path="/checks" element={<BackgroundChecks onEscalate={() => setEscalationOpen(true)} />} />
                  <Route path="/offers" element={<Offers onEscalate={() => setEscalationOpen(true)} />} />
                  <Route path="/terms" element={<Terms onEscalate={() => setEscalationOpen(true)} />} />
                  <Route path="/sign" element={<OtpSign onEscalate={() => setEscalationOpen(true)} />} />
                  <Route path="/success" element={<Success />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <ChatPanel onOpenSettings={() => setChatSettingsOpen(true)} />
            </div>
          </VoiceNavigationWrapper>
          <EscalationModal 
            open={escalationOpen} 
            onClose={() => setEscalationOpen(false)} 
          />
          <ChatSettings 
            open={chatSettingsOpen}
            onClose={() => setChatSettingsOpen(false)}
          />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
