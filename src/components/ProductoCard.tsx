
import React, { useState, useEffect } from "react";
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
          // Verificar si el usuario está autenticado
          const { data: { session } } = await supabase.auth.getSession();
          
          // Primero intentamos obtener las tallas desde la base de datos
          // @ts-ignore - Ignorar error de TypeScript por tabla 'tallas' no definida en los tipos
          const { data, error } = await supabase
            .from("tallas")
            .select("*")
            .eq("producto_id", producto.id);
          
          if (!error && data && data.length > 0) {
            // Si hay tallas en la base de datos, establecer tieneTallas a true
            console.log(`Producto ${producto.nombre} tiene tallas (BD): ${true}`, data);
            setTieneTallas(true);
          } else {
            // Si no hay tallas en la base de datos o hubo un error,
            // verificar si el producto debería tener tallas basado en su nombre
            // Solo para usuarios no autenticados o si hubo un error
            if (!session || error) {
              // Verificar si el producto debería tener tallas basado en su nombre
              const nombreLowerCase = producto.nombre.toLowerCase();
              const productosConTallas = [
                'camiseta pro',
                'camiseta barcelona local',
                'barcelona retro 100 años',
                'barcelona visitante'
              ];
              
              // Verificar si el nombre del producto coincide exactamente con alguno de los productos con tallas
              const tieneTallasPorNombre = productosConTallas.some(nombre => 
                producto.nombre.toLowerCase().includes(nombre.toLowerCase()));
              
              console.log(`Producto ${producto.nombre} tiene tallas (por nombre): ${tieneTallasPorNombre}`);
              setTieneTallas(tieneTallasPorNombre);
            } else {
              // Para usuarios autenticados, si no hay tallas en la base de datos, establecer tieneTallas a false
              console.log(`Producto ${producto.nombre} tiene tallas (BD): ${false}`);
              setTieneTallas(false);
            }
          }
        } catch (error) {
          console.error("Error al verificar tallas:", error);
          // Como último recurso, verificamos por el nombre exacto del producto
          const productosConTallas = [
            'camiseta pro',
            'camiseta barcelona local',
            'barcelona retro 100 años',
            'barcelona visitante'
          ];
          
          // Verificar si el nombre del producto coincide exactamente con alguno de los productos con tallas
          const tieneTallasPorNombre = productosConTallas.some(nombre => 
            producto.nombre.toLowerCase().includes(nombre.toLowerCase()));
          
          console.log(`Producto ${producto.nombre} tiene tallas (fallback): ${tieneTallasPorNombre}`);
          setTieneTallas(tieneTallasPorNombre);
        }
      }
    };
    
    verificarTallas();
  }, [producto]);
  
  const abrirDetalles = (e) => {
    e.preventDefault();
    setIsDialogOpen(true);
  };

  const agregarAlCarrito = async () => {
    console.log("Verificando si el producto tiene tallas:", tieneTallas);
    
    // Si el producto tiene tallas, abrir el diálogo para seleccionar talla
    if (tieneTallas) {
      console.log("Producto con tallas, abriendo diálogo de selección");
      setIsDialogOpen(true);
      return;
    }
    console.log("Producto sin tallas, agregando directamente al carrito");
    
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
            producto: producto,
            talla: null // No hay talla seleccionada para productos sin tallas
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
            // Comentado temporalmente hasta que se añada la columna talla
            // talla: null // No hay talla seleccionada para productos sin tallas
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
            // Comentado temporalmente hasta que se añada la columna talla
            // talla: null // No hay talla seleccionada para productos sin tallas
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
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md bg-white flex flex-col h-full">
      <div className="relative">
        <div className="aspect-square overflow-hidden">
          <img
            src={producto.imagen || "/placeholder.png"}
            alt={producto.nombre}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
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
              Agotado
            </span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 flex items-center justify-center gap-1"
          onClick={abrirDetalles}
        >
          <Eye className="h-4 w-4" />
          {isMobile ? "" : "Ver detalles"}
        </Button>
        
        <Button
          variant="default"
          size="sm"
          className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          onClick={() => {
            console.log("Botón de agregar al carrito clickeado, tieneTallas:", tieneTallas);
            if (tieneTallas) {
              setIsDialogOpen(true);
            } else {
              agregarAlCarrito();
            }
          }}
          disabled={isLoading || producto.stock <= 0}
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <React.Fragment>
              <ShoppingCart className="h-4 w-4" />
              {isMobile ? "" : tieneTallas ? "Seleccionar talla" : "Agregar"}
            </React.Fragment>
          )}
        </Button>
      </CardFooter>
      
      <ProductoDetalleDialog 
        producto={producto} 
        isOpen={isDialogOpen} 
        onClose={() => {
          setIsDialogOpen(false);
          // Actualizar el contador del carrito después de cerrar el diálogo
          // por si se agregó algo al carrito desde el diálogo
          actualizarCantidad();
        }} 
      />
    </Card>
  );
};

export default ProductoCard;
