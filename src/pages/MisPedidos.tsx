
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  ShoppingBag, 
  Package,
  Check,
  Clock, 
  Truck,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const estadoIconos = {
  "pendiente": <Clock className="h-4 w-4 text-yellow-500" />,
  "procesando": <Package className="h-4 w-4 text-blue-500" />,
  "enviado": <Truck className="h-4 w-4 text-orange-500" />,
  "entregado": <Check className="h-4 w-4 text-green-500" />,
  "cancelado": <AlertCircle className="h-4 w-4 text-red-500" />
};

const estadoColores = {
  "pendiente": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "procesando": "bg-blue-100 text-blue-800 border-blue-200",
  "enviado": "bg-orange-100 text-orange-800 border-orange-200",
  "entregado": "bg-green-100 text-green-800 border-green-200",
  "cancelado": "bg-red-100 text-red-800 border-red-200"
};

const MisPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoItems, setPedidoItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          navigate("/auth");
          return;
        }
        
        setUser(session.user);
        await fetchPedidos(session.user.id);
      } catch (error) {
        console.error("Error al verificar sesión:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const fetchPedidos = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("usuario_id", userId)
        .order("fecha_pedido", { ascending: false });

      if (error) throw error;
      
      setPedidos(data || []);

      // Cargar detalles de los pedidos
      for (const pedido of data || []) {
        await fetchPedidoItems(pedido.id);
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus pedidos",
        variant: "destructive",
      });
    }
  };

  const fetchPedidoItems = async (pedidoId) => {
    try {
      const { data, error } = await supabase
        .from("pedido_items")
        .select(`
          id,
          cantidad,
          precio_unitario,
          producto:producto_id (
            id,
            nombre,
            imagen
          )
        `)
        .eq("pedido_id", pedidoId);

      if (error) throw error;
      
      setPedidoItems(prev => ({
        ...prev,
        [pedidoId]: data || []
      }));
    } catch (error) {
      console.error(`Error al cargar detalles del pedido ${pedidoId}:`, error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Mis Pedidos</h1>
          <p className="text-gray-600">Historial y seguimiento de tus compras</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Historial de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pedidos.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-800">No tienes pedidos aún</h3>
                <p className="text-gray-500 mt-2">Cuando realices una compra, aparecerá aquí</p>
                <Button 
                  className="mt-4 bg-orange-500 hover:bg-orange-600"
                  onClick={() => navigate("/productos")}
                >
                  Ver productos
                </Button>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {pedidos.map((pedido, index) => (
                  <AccordionItem key={pedido.id} value={pedido.id}>
                    <AccordionTrigger className="hover:bg-gray-50 px-4">
                      <div className="flex flex-col md:flex-row md:justify-between w-full text-left">
                        <div className="flex items-center gap-3">
                          <Badge className={`${estadoColores[pedido.estado]}`}>
                            <span className="flex items-center gap-1">
                              {estadoIconos[pedido.estado]}
                              {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                            </span>
                          </Badge>
                          <span className="font-medium">
                            Pedido #{pedido.id.slice(0, 8)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 md:text-right mt-2 md:mt-0">
                          <div>
                            {format(new Date(pedido.fecha_pedido), "d 'de' MMMM, yyyy", { locale: es })}
                          </div>
                          <div className="font-medium text-gray-800">
                            €{pedido.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        {/* Detalles del pedido */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-sm text-gray-500">Método de pago</h4>
                              <p>{pedido.metodo_pago}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-gray-500">Dirección de envío</h4>
                              <p>{pedido.direccion_envio || "No especificada"}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Lista de productos */}
                        <div>
                          <h4 className="font-medium mb-2">Productos</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pedidoItems[pedido.id]?.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      {item.producto?.imagen && (
                                        <img 
                                          src={item.producto.imagen} 
                                          alt={item.producto.nombre}
                                          className="h-10 w-10 object-cover rounded"
                                        />
                                      )}
                                      <span>{item.producto?.nombre}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">{item.cantidad}</TableCell>
                                  <TableCell className="text-right">€{item.precio_unitario.toFixed(2)}</TableCell>
                                  <TableCell className="text-right font-medium">
                                    €{(item.cantidad * item.precio_unitario).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default MisPedidos;
