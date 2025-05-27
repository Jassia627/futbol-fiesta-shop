
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye } from "lucide-react";
import ProductoDetalleDialog from "./ProductoDetalleDialog";
import { useCarrito } from "@/contexts/CarritoContext";

const ProductoCard = ({ producto }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { actualizarCantidad } = useCarrito();
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const abrirDetalles = (e) => {
    e.preventDefault();
    setIsDialogOpen(true);
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
          productoExistente.cantidad += 1;
        } else {
          // Agregar nuevo item al carrito
          carritoLocal.push({
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            producto_id: producto.id,
            cantidad: 1,
            precio_unitario: producto.precio,
            producto: producto
          });
        }
        
        // Guardar carrito actualizado
        localStorage.setItem('carritoLocal', JSON.stringify(carritoLocal));
        
        // Actualizar el contador del carrito
        actualizarCantidad();
        
        toast({
          title: "Producto agregado",
          description: "Se ha añadido el producto al carrito",
        });
        
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
            cantidad: 1,
            precio_unitario: producto.precio
          });

        if (insertError) throw insertError;
        
        toast({
          title: "Producto agregado",
          description: "Se ha añadido el producto al carrito",
        });
        
        return;
      }

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
            cantidad: itemsExistentes[0].cantidad + 1,
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
            cantidad: 1,
            precio_unitario: producto.precio
          });

        if (insertError) throw insertError;
      }

      // Actualizar el contador del carrito
      actualizarCantidad();
      
      toast({
        title: "Producto agregado",
        description: "Se ha añadido el producto al carrito",
      });

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

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
        <div className="flex-shrink-0 cursor-pointer" onClick={abrirDetalles}>
          <div className="aspect-square overflow-hidden">
            <img 
              src={producto.imagen || "/placeholder.svg"} 
              alt={producto.nombre} 
              className="w-full h-full object-cover transition-transform hover:scale-105"
              loading="lazy"
            />
          </div>
        </div>
        <CardContent className="p-3 md:p-4 flex-grow">
          <div className="cursor-pointer" onClick={abrirDetalles}>
            <div className="flex justify-between items-start mb-1 md:mb-2">
              <h3 className="font-semibold text-sm md:text-lg line-clamp-2">{producto.nombre}</h3>
            </div>
            <p className="text-blue-900 font-bold text-base md:text-xl">${producto.precio.toFixed(2)}</p>
            {producto.equipo && (
              <p className="text-gray-500 text-xs md:text-sm truncate">{producto.equipo}</p>
            )}
            {producto.liga && (
              <p className="text-gray-500 text-xs md:text-sm truncate">{producto.liga}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-3 md:p-4 pt-0 flex-shrink-0 gap-2">
          <Button 
            className="flex-1 bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-1 md:py-2"
            onClick={agregarAlCarrito}
            disabled={isLoading}
          >
            <ShoppingCart size={16} />
            {isMobile ? "Añadir" : "Añadir al carrito"}
          </Button>
          <Button
            variant="outline"
            className="flex-shrink-0 flex items-center justify-center"
            onClick={abrirDetalles}
          >
            <Eye size={16} />
          </Button>
        </CardFooter>
      </Card>
      
      <ProductoDetalleDialog 
        producto={producto} 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </>
  );
};

export default ProductoCard;
