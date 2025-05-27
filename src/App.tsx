
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CarritoProvider } from "@/contexts/CarritoContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Productos from "./pages/Productos";
import AdminIndex from "./pages/Admin/Index";
import NotFound from "./pages/NotFound";
import Perfil from "./pages/Perfil";
import MisPedidos from "./pages/MisPedidos";
import Ligas from "./pages/Ligas";
import Equipos from "./pages/Equipos";
import LigaDetalle from "./pages/LigaDetalle";
import EquipoDetalle from "./pages/EquipoDetalle";
import Carrito from "./pages/Carrito";
import AdminPedidos from "./components/Admin/AdminPedidos";
import AdminPanel from "./pages/AdminPanel";
import MisionVision from "./pages/MisionVision";
import AcercaDeNosotros from "./pages/AcercaDeNosotros";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CarritoProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/admin" element={<AdminIndex />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/ligas" element={<Ligas />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/liga/:id" element={<LigaDetalle />} />
          <Route path="/equipo/:id" element={<EquipoDetalle />} />
          <Route path="/pedidos" element={<AdminPedidos />} />
          <Route path="/mis-pedidos" element={<MisPedidos />} />
          <Route path="/mision-vision" element={<MisionVision />} />
          <Route path="/acerca-de-nosotros" element={<AcercaDeNosotros />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CarritoProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
