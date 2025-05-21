import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";

interface ProductoDetalleDialogProps {
  producto: any;
  isOpen: boolean;
  onClose: () => void;
}

const ProductoDetalleDialog = ({ producto, isOpen, onClose }: ProductoDetalleDialogProps) => {
  const [cantidad, setCantidad] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const incrementarCantidad = () => {
    setCantidad((prev) => prev + 1);
  };

  const decrementarCantidad = () => {
    if (cantidad > 1) {
      setCantidad((prev) => prev - 1);
    }
  };

  const agregarAlCarrito = async () => {
    try {
      setIsLoading(true);

      // Verificar si el usuario está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      
      // Permitir compras sin autenticación
      if (!session) {
        // Usar localStorage para guardar el carrito
        let carritoLocal = JSON.parse(localStorage.getItem('carritoLocal') || '[]');
        
        // Verificar si el producto ya está en el carrito
        const productoExistente = carritoLocal.find(item => item.producto_id === producto.id);
        
        if (productoExistente) {
          // Actualizar cantidad si ya existe
          productoExistente.cantidad += cantidad;
        } else {
          // Agregar nuevo item al carrito
          carritoLocal.push({
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            producto_id: producto.id,
            cantidad: cantidad,
            precio_unitario: producto.precio,
            producto: producto
          });
        }
        
        // Guardar carrito actualizado
        localStorage.setItem('carritoLocal', JSON.stringify(carritoLocal));
        
        toast({
          title: "Producto agregado",
          description: `Se ${cantidad > 1 ? 'han' : 'ha'} añadido ${cantidad} ${cantidad > 1 ? 'unidades' : 'unidad'} al carrito`,
        });
        
        // Cerrar el diálogo después de agregar al carrito
        onClose();
        // Resetear la cantidad
        setCantidad(1);
        
        setIsLoading(false);
        return;
      }

      // Buscar el carrito del usuario
      const { data: carritos, error: carritosError } = await supabase
        .from("carritos")
        .select("id")
        .eq("usuario_id", session.user.id)
        .single();

      if (carritosError) {
        // Si no existe, crear un nuevo carrito
        const { data: nuevoCarrito, error: nuevoError } = await supabase
          .from("carritos")
          .insert({ usuario_id: session.user.id })
          .select("id")
          .single();
        
        if (nuevoError) throw nuevoError;
        
        // Continuar con el nuevo carrito
        const { error: insertError } = await supabase
          .from("carrito_items")
          .insert({
            carrito_id: nuevoCarrito.id,
            producto_id: producto.id,
            cantidad: cantidad,
            precio_unitario: producto.precio
          });

        if (insertError) throw insertError;
      } else {
        // Verificar si el producto ya está en el carrito
        const { data: itemsExistentes, error: itemsError } = await supabase
          .from("carrito_items")
          .select("*")
          .eq("carrito_id", carritos.id)
          .eq("producto_id", producto.id);

        if (itemsError) throw itemsError;

        if (itemsExistentes && itemsExistentes.length > 0) {
          // Actualizar cantidad si ya existe
          const { error: updateError } = await supabase
            .from("carrito_items")
            .update({ 
              cantidad: itemsExistentes[0].cantidad + cantidad,
              precio_unitario: producto.precio
            })
            .eq("id", itemsExistentes[0].id);

          if (updateError) throw updateError;
        } else {
          // Agregar nuevo item al carrito
          const { error: insertError } = await supabase
            .from("carrito_items")
            .insert({
              carrito_id: carritos.id,
              producto_id: producto.id,
              cantidad: cantidad,
              precio_unitario: producto.precio
            });

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Producto agregado",
        description: `Se ${cantidad > 1 ? 'han' : 'ha'} añadido ${cantidad} ${cantidad > 1 ? 'unidades' : 'unidad'} al carrito`,
      });
      
      // Cerrar el diálogo después de agregar al carrito
      onClose();
      // Resetear la cantidad
      setCantidad(1);

    } catch (error) {
      console.error("Error al agregar al carrito:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!producto) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold">{producto.nombre}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X size={18} />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Imagen del producto */}
          <div className="overflow-hidden rounded-md">
            <img 
              src={producto.imagen || "/placeholder.svg"} 
              alt={producto.nombre} 
              className="w-full h-auto object-cover"
            />
          </div>
          
          {/* Detalles del producto */}
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold text-blue-900">${producto.precio?.toFixed(2)}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {producto.categoria && (
                  <Badge variant="outline" className="bg-blue-50">
                    {producto.categoria}
                  </Badge>
                )}
                {producto.liga && (
                  <Badge variant="outline" className="bg-green-50">
                    {producto.liga}
                  </Badge>
                )}
                {producto.equipo && (
                  <Badge variant="outline" className="bg-orange-50">
                    {producto.equipo}
                  </Badge>
                )}
              </div>
            </div>
            
            <DialogDescription className="text-gray-700">
              {producto.descripcion || "No hay descripción disponible para este producto."}
            </DialogDescription>
            
            <div className="pt-4">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium">Cantidad:</span>
                <div className="flex items-center border rounded-md">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-none"
                    onClick={decrementarCantidad}
                    disabled={cantidad <= 1}
                  >
                    <Minus size={16} />
                  </Button>
                  <span className="w-10 text-center">{cantidad}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-none"
                    onClick={incrementarCantidad}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
              
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-2"
                onClick={agregarAlCarrito}
                disabled={isLoading}
              >
                <ShoppingCart size={18} />
                {isLoading ? "Agregando..." : "Añadir al carrito"}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Información adicional */}
        {(producto.talla || producto.color || producto.material) && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">Detalles adicionales</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {producto.talla && (
                <div>
                  <span className="font-medium">Talla:</span> {producto.talla}
                </div>
              )}
              {producto.color && (
                <div>
                  <span className="font-medium">Color:</span> {producto.color}
                </div>
              )}
              {producto.material && (
                <div>
                  <span className="font-medium">Material:</span> {producto.material}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductoDetalleDialog;
