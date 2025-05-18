
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

const ProductoCard = ({ producto }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const agregarAlCarrito = async () => {
    try {
      setIsLoading(true);

      // Verificar si el usuario está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Inicia sesión",
          description: "Debes iniciar sesión para agregar productos al carrito",
          variant: "destructive",
        });
        return;
      }

      // Buscar el carrito del usuario
      const { data: carritos, error: carritosError } = await supabase
        .from("carritos")
        .select("id")
        .eq("usuario_id", session.user.id)
        .single();

      if (carritosError) throw carritosError;

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
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <Link to={`/productos/${producto.id}`}>
        <div className="aspect-square overflow-hidden">
          <img 
            src={producto.imagen || "/placeholder.svg"} 
            alt={producto.nombre} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      </Link>
      <CardContent className="p-4">
        <Link to={`/productos/${producto.id}`}>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-2">{producto.nombre}</h3>
          </div>
          <p className="text-blue-900 font-bold text-xl">€{producto.precio.toFixed(2)}</p>
          {producto.equipo && (
            <p className="text-gray-500 text-sm">{producto.equipo}</p>
          )}
          {producto.liga && (
            <p className="text-gray-500 text-sm">{producto.liga}</p>
          )}
        </Link>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-2"
          onClick={agregarAlCarrito}
          disabled={isLoading}
        >
          <ShoppingCart size={18} />
          Añadir al carrito
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductoCard;
