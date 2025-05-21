
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AdminPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPedido, setCurrentPedido] = useState(null);
  const [pedidoItems, setPedidoItems] = useState([]);
  const [selectedEstado, setSelectedEstado] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      setIsLoading(true);
      console.log('Cargando pedidos...');
      
      // Verificar si el usuario está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }
      
      // Temporalmente desactivamos la verificación de rol para pruebas
      /*
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', session.user.id)
        .single();
      
      if (perfilError) {
        console.error('Error al verificar rol:', perfilError);
        throw perfilError;
      }
      
      if (perfilData?.rol !== 'admin') {
        throw new Error('No tienes permisos de administrador');
      }
      */
      
      console.log('Verificación de rol desactivada temporalmente para pruebas');
      
      // Cargar todos los pedidos - simplificando la consulta para evitar errores
      const { data, error } = await supabase
        .from("pedidos")
        .select('*')
        .order("fecha_pedido", { ascending: false });
        
      // Nota: Hemos simplificado la consulta para evitar problemas con las relaciones
      // En una implementación completa, podríamos cargar los datos de perfiles en una consulta separada

      if (error) {
        console.error('Error al cargar pedidos:', error);
        throw error;
      }
      
      console.log('Pedidos cargados:', data?.length || 0);
      setPedidos(data || []);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos. " + (error instanceof Error ? error.message : ''),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para obtener el nombre del cliente (autenticado o no)
  const getNombreCliente = (pedido) => {
    // Ahora solo usamos el campo cliente_nombre para todos los clientes
    if (pedido.cliente_nombre) {
      return pedido.cliente_nombre;
    }
    // Si no hay información
    return "Cliente";
  };
  
  // Función para obtener el email del cliente
  const getEmailCliente = (pedido) => {
    // Ahora solo usamos el campo cliente_email para todos los clientes
    return pedido.cliente_email || "";
  };
  
  // Función para obtener el teléfono del cliente
  const getTelefonoCliente = (pedido) => {
    return pedido.cliente_telefono || "";
  };
  
  // Función para determinar si el cliente está registrado
  const isClienteRegistrado = (pedido) => {
    return !!pedido.usuario_id;
  };

  const fetchPedidoItems = async (pedidoId) => {
    try {
      console.log('Cargando items del pedido:', pedidoId);
      const { data, error } = await supabase
        .from("pedido_items")
        .select(`
          *,
          productos:producto_id (
            nombre,
            imagen
          )
        `)
        .eq("pedido_id", pedidoId);

      if (error) {
        console.error('Error al cargar items del pedido:', error);
        throw error;
      }
      
      console.log('Items del pedido cargados:', data?.length || 0);
      return data;
    } catch (error) {
      console.error("Error al cargar items del pedido:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del pedido",
        variant: "destructive",
      });
      return [];
    }
  };

  const handleViewPedido = async (pedido) => {
    setCurrentPedido(pedido);
    setSelectedEstado(pedido.estado);
    const items = await fetchPedidoItems(pedido.id);
    setPedidoItems(items || []);
    setIsDialogOpen(true);
  };

  const handleUpdateEstado = async () => {
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({ estado: selectedEstado })
        .eq("id", currentPedido.id);

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Estado del pedido actualizado correctamente",
      });
      
      setIsDialogOpen(false);
      fetchPedidos();
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      });
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "-";
    return format(new Date(fecha), "dd/MM/yyyy HH:mm", { locale: es });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "procesando":
        return "bg-blue-100 text-blue-800";
      case "enviado":
        return "bg-green-100 text-green-800";
      case "entregado":
        return "bg-emerald-100 text-emerald-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-blue-900 p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Panel de Pedidos</h2>
            <p className="text-orange-100 mt-1">Gestiona todos los pedidos de la tienda</p>
          </div>
          <Button 
            variant="secondary" 
            onClick={fetchPedidos}
            className="flex gap-2 items-center bg-white text-orange-600 hover:bg-orange-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-orange-100">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Total de Pedidos</h3>
          <p className="text-3xl font-bold text-orange-600">{pedidos.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-blue-100">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Pedidos Pendientes</h3>
          <p className="text-3xl font-bold text-blue-600">
            {pedidos.filter(p => p.estado === 'pendiente').length}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-green-100">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Pedidos Completados</h3>
          <p className="text-3xl font-bold text-green-600">
            {pedidos.filter(p => p.estado === 'entregado').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Listado de Pedidos</h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
              <p className="text-gray-500">Cargando pedidos...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Total</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 font-medium">No hay pedidos disponibles</p>
                        <p className="text-gray-400 text-sm mt-1">Los pedidos aparecerán aquí cuando los clientes realicen compras</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pedidos.map((pedido) => (
                    <TableRow key={pedido.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-mono text-sm">
                        <span className="bg-gray-100 px-2 py-1 rounded">{pedido.id.slice(0, 8)}...</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{getNombreCliente(pedido)}</span>
                          {!isClienteRegistrado(pedido) ? (
                            <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded-full w-fit mt-1">No registrado</span>
                          ) : (
                            <span className="text-xs text-gray-500 mt-1">{getEmailCliente(pedido)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatFecha(pedido.fecha_pedido).split(' ')[0]}</span>
                          <span className="text-xs text-gray-500">{formatFecha(pedido.fecha_pedido).split(' ')[1]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">${pedido.total.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getEstadoColor(pedido.estado)}`}>
                          {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPedido(pedido)}
                          className="flex gap-1 items-center hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {currentPedido && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getEstadoColor(currentPedido.estado)}`}></div>
                <DialogTitle>Detalles del pedido</DialogTitle>
              </div>
              <DialogDescription className="flex items-center gap-2">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">
                  {currentPedido.id.slice(0, 8)}...
                </span>
                <span className="text-gray-500">•</span>
                <span>{formatFecha(currentPedido.fecha_pedido)}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700">Información del Cliente</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${isClienteRegistrado(currentPedido) ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                  {isClienteRegistrado(currentPedido) ? 'Cliente registrado' : 'Cliente no registrado'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-lg">{getNombreCliente(currentPedido)}</p>
                  
                  {getEmailCliente(currentPedido) && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {getEmailCliente(currentPedido)}
                    </p>
                  )}
                  
                  {getTelefonoCliente(currentPedido) && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {getTelefonoCliente(currentPedido)}
                    </p>
                  )}
                </div>
                
                <div>
                  <div className="mb-2">
                    <h4 className="text-sm font-medium text-gray-500">Dirección de envío</h4>
                    <p className="whitespace-pre-wrap text-sm flex items-start gap-1 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{currentPedido.direccion_envio || "-"}</span>
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Método de pago</h4>
                    <p className="mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      {currentPedido.metodo_pago || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">Productos</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Estado:</span>
                  <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                    <SelectTrigger className="h-8 w-[140px] text-sm">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          <span>Pendiente</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="procesando">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span>Procesando</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="enviado">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span>Enviado</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="entregado">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Entregado</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelado">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span>Cancelado</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-medium">Producto</TableHead>
                      <TableHead className="text-right font-medium">Precio</TableHead>
                      <TableHead className="text-right font-medium">Cantidad</TableHead>
                      <TableHead className="text-right font-medium">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidoItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                          No hay productos en este pedido
                        </TableCell>
                      </TableRow>
                    ) : (
                      pedidoItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{item.productos?.nombre || "Producto"}</TableCell>
                          <TableCell className="text-right">${item.precio_unitario.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.cantidad}</TableCell>
                          <TableCell className="text-right font-medium">
                            ${(item.precio_unitario * item.cantidad).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={3} className="text-right font-semibold">
                        Total:
                      </TableCell>
                      <TableCell className="text-right font-bold text-orange-600">
                        ${currentPedido.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cerrar</Button>
              </DialogClose>
              <Button 
                onClick={handleUpdateEstado}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                Actualizar estado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminPedidos;
