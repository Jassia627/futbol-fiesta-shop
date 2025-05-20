
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
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          *,
          perfiles:usuario_id (
            nombre,
            apellido,
            email:auth.users(email)
          )
        `)
        .order("fecha_pedido", { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPedidoItems = async (pedidoId) => {
    try {
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

      if (error) throw error;
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Pedidos</h2>
        <Button 
          variant="outline" 
          onClick={fetchPedidos}
          className="flex gap-2 items-center"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No hay pedidos disponibles
                  </TableCell>
                </TableRow>
              ) : (
                pedidos.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-mono text-sm">
                      {pedido.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {pedido.perfiles?.nombre 
                        ? `${pedido.perfiles.nombre} ${pedido.perfiles.apellido || ""}`
                        : "Cliente"}
                    </TableCell>
                    <TableCell>{formatFecha(pedido.fecha_pedido)}</TableCell>
                    <TableCell>${pedido.total.toFixed(2)}</TableCell>
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
                        className="flex gap-1 items-center"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {currentPedido && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalles del pedido</DialogTitle>
              <DialogDescription>
                Pedido #{currentPedido.id.slice(0, 8)}... - {formatFecha(currentPedido.fecha_pedido)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <h3 className="font-medium text-sm text-gray-500">Cliente</h3>
                <p>{currentPedido.perfiles?.nombre 
                  ? `${currentPedido.perfiles.nombre} ${currentPedido.perfiles.apellido || ""}`
                  : "Cliente"}</p>
                <p className="text-sm text-gray-500">
                  {currentPedido.perfiles?.email?.[0]?.email || ""}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-500">Método de pago</h3>
                <p>{currentPedido.metodo_pago || "-"}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-500">Dirección de envío</h3>
                <p className="whitespace-pre-wrap text-sm">
                  {currentPedido.direccion_envio || "-"}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-500">Estado del pedido</h3>
                <div className="mt-1">
                  <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="procesando">Procesando</SelectItem>
                      <SelectItem value="enviado">Enviado</SelectItem>
                      <SelectItem value="entregado">Entregado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="mt-2 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidoItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productos?.nombre || "Producto"}</TableCell>
                      <TableCell className="text-right">${item.precio_unitario.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.cantidad}</TableCell>
                      <TableCell className="text-right">
                        ${(item.precio_unitario * item.cantidad).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Total:
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${currentPedido.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cerrar</Button>
              </DialogClose>
              <Button 
                onClick={handleUpdateEstado}
                className="bg-orange-500 hover:bg-orange-600"
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
