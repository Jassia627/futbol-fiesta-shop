
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCarrito } from "@/contexts/CarritoContext";

const ProductoDestacado = ({ producto }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { toast } = useToast();
  const { actualizarCantidad } = useCarrito();

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
        
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
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
        
        // Actualizar el contador del carrito
        actualizarCantidad();
        
        toast({
          title: "Producto agregado",
          description: "Se ha añadido el producto al carrito",
        });
        
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
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

      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);

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
    <Card className="overflow-hidden transition-all hover:shadow-lg flex flex-col h-full">
      <div className="aspect-square overflow-hidden relative">
        <img 
          src={producto.imagen || "/placeholder.svg"} 
          alt={producto.nombre} 
          className="w-full h-full object-cover transition-transform hover:scale-105"
          loading="lazy"
        />
        {producto.categoria && (
          <Badge className="absolute top-2 right-2 bg-blue-900">
            {producto.categoria}
          </Badge>
        )}
      </div>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-2">{producto.nombre}</h3>
        </div>
        <p className="text-blue-900 font-bold text-xl">${producto.precio.toFixed(2)}</p>
        {producto.equipo && (
          <p className="text-gray-500 text-sm">{producto.equipo}</p>
        )}
        {producto.liga && (
          <p className="text-gray-500 text-sm">{producto.liga}</p>
        )}
        {producto.descripcion && (
          <CardDescription className="mt-2 line-clamp-2">
            {producto.descripcion}
          </CardDescription>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between gap-2">
        <Button variant="outline" asChild className="flex-1">
          <Link to={`/productos/${producto.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalles
          </Link>
        </Button>
        <Button 
          className="flex-1 bg-orange-500 hover:bg-orange-600"
          onClick={agregarAlCarrito}
          disabled={isLoading || isAdded}
        >
          {isAdded ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Agregado
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Añadir
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductoDestacado;
