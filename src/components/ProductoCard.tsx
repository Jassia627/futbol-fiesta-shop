import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  const [tieneTallas, setTieneTallas] = useState(false);
  const { toast } = useToast();
  const { actualizarCantidad } = useCarrito();
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Verificar si el producto tiene tallas
  useEffect(() => {
    const verificarTallas = async () => {
      if (producto?.id) {
        try {
          // @ts-ignore - Ignorar error de TypeScript por tabla 'tallas' no definida en los tipos
          const { data, error } = await supabase
            .from("tallas")
            .select("*")
            .eq("producto_id", producto.id);
          
          if (!error && data && data.length > 0) {
            setTieneTallas(true);
          } else {
            setTieneTallas(false);
          }
        } catch (error) {
          console.error("Error al verificar tallas:", error);
          setTieneTallas(false);
        }
      }
    };
    
    verificarTallas();
  }, [producto]);

  const agregarAlCarrito = async () => {
    if (!producto) return;

    // Verificación estricta de stock al inicio
    if (!producto.stock || producto.stock <= 0) {
      toast({
        title: "Sin stock",
        description: "Este producto no está disponible",
        variant: "destructive",
      });
      return;
    }

    // Si el producto tiene tallas, abrir el diálogo para seleccionar talla
    if (tieneTallas) {
      setIsDialogOpen(true);
      return;
    }
    
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
        
        // Calcular cantidad actual en carrito
        const cantidadEnCarrito = productoExistente ? productoExistente.cantidad : 0;
        
        // Verificación final: si ya hay productos en carrito que igualan o superan el stock
        if (cantidadEnCarrito >= producto.stock) {
          toast({
            title: "Stock agotado",
            description: `Ya tienes todas las unidades disponibles (${producto.stock}) en el carrito.`,
            variant: "destructive",
          });
          return;
        }
        
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
          title: "¡Producto agregado!",
          description: `${producto.nombre} ha sido agregado al carrito`,
        });
      } else {
        // Usuario autenticado - usar base de datos
        const { data: carrito } = await supabase
          .from("carritos")
          .select("id")
          .eq("usuario_id", session.user.id)
          .single();

        let carritoId = carrito?.id;

        if (!carritoId) {
          const { data: nuevoCarrito, error } = await supabase
            .from("carritos")
            .insert({ usuario_id: session.user.id })
            .select("id")
            .single();

          if (error) throw error;
          carritoId = nuevoCarrito.id;
        }

        const { data: itemExistente } = await supabase
          .from("carrito_items")
          .select("id, cantidad")
          .eq("carrito_id", carritoId)
          .eq("producto_id", producto.id)
          .single();

        // Calcular cantidad actual en carrito
        const cantidadEnCarrito = itemExistente ? itemExistente.cantidad : 0;
        
        // Verificación final: si ya hay productos en carrito que igualan o superan el stock
        if (cantidadEnCarrito >= producto.stock) {
          toast({
            title: "Stock agotado",
            description: `Ya tienes todas las unidades disponibles (${producto.stock}) en el carrito.`,
            variant: "destructive",
          });
          return;
        }

        if (itemExistente) {
          const { error } = await supabase
            .from("carrito_items")
            .update({ cantidad: itemExistente.cantidad + 1 })
            .eq("id", itemExistente.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("carrito_items")
            .insert({
              carrito_id: carritoId,
              producto_id: producto.id,
              cantidad: 1,
              precio_unitario: producto.precio
            });

          if (error) throw error;
        }

        actualizarCantidad();
        
        toast({
          title: "¡Producto agregado!",
          description: `${producto.nombre} ha sido agregado al carrito`,
        });
      }

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

  if (!producto) {
    return null;
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-lg group">
      <div className="relative aspect-square overflow-hidden">
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          {producto.imagen ? (
            <img 
              src={producto.imagen} 
              alt={producto.nombre} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="text-gray-400">Sin imagen</div>
          )}
        </div>
        {producto.destacado && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
            Destacado
          </div>
        )}
        {tieneTallas && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
            Tallas disponibles
          </div>
        )}
      </div>
      
      <CardContent className="flex-grow p-4">
        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{producto.nombre}</h3>
        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{producto.descripcion}</p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-orange-600">${producto.precio.toFixed(2)}</span>
          {producto.stock > 0 ? (
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
              En stock
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
              Sin stock
            </span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to={`/productos/${producto.id}`} className="flex items-center justify-center gap-1">
            <Eye className="h-4 w-4" />
            {isMobile ? "" : "Ver detalles"}
          </Link>
        </Button>
        
        <Button
          variant="default"
          size="sm"
          className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          onClick={agregarAlCarrito}
          disabled={isLoading || producto.stock <= 0}
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <React.Fragment>
              <ShoppingCart className="h-4 w-4" />
              {isMobile ? "" : producto.stock <= 0 ? "Sin stock" : (tieneTallas ? "Seleccionar" : "Agregar")}
            </React.Fragment>
          )}
        </Button>
      </CardFooter>

      <ProductoDetalleDialog 
        producto={producto} 
        isOpen={isDialogOpen} 
        onClose={() => {
          setIsDialogOpen(false);
          actualizarCantidad();
        }} 
      />
    </Card>
  );
};

export default ProductoCard;
