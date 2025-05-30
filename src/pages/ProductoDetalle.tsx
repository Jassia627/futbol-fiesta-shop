import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCarrito } from "@/contexts/CarritoContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ShoppingCart, 
  ArrowLeft, 
  Star, 
  Truck, 
  Shield, 
  RotateCcw,
  Plus,
  Minus,
  Check,
  Package
} from "lucide-react";

interface Talla {
  id?: string;
  producto_id?: string;
  talla: string;
  cantidad: string;
  created_at?: string;
  updated_at?: string;
}

const ProductoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { actualizarCantidad } = useCarrito();
  
  const [producto, setProducto] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [tallas, setTallas] = useState<Talla[]>([]);
  const [selectedTalla, setSelectedTalla] = useState<string>("");
  const [tieneTallas, setTieneTallas] = useState(false);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from("productos")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        
        if (!data) {
          navigate("/404");
          return;
        }

        setProducto(data);
        
        // Cargar tallas del producto
        await cargarTallas(data.id);
        
      } catch (error) {
        console.error("Error al cargar producto:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar el producto",
          variant: "destructive",
        });
        navigate("/productos");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProducto();
    }
  }, [id, navigate, toast]);

  const cargarTallas = async (productoId: string) => {
    try {
      // @ts-ignore - Ignorar error de TypeScript por tabla 'tallas' no definida en los tipos
      const { data, error } = await supabase
        .from("tallas")
        .select("*")
        .eq("producto_id", productoId);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // @ts-ignore - Ignorar error de TypeScript
        setTallas(data);
        setTieneTallas(true);
        // Seleccionar la primera talla por defecto
        // @ts-ignore - Ignorar error de TypeScript
        setSelectedTalla(data[0].talla);
      } else {
        setTallas([]);
        setTieneTallas(false);
        setSelectedTalla("");
      }
    } catch (error) {
      console.error("Error al cargar tallas:", error);
      setTallas([]);
      setTieneTallas(false);
    }
  };

  const agregarAlCarrito = async () => {
    if (!producto) return;

    // Validar que se haya seleccionado una talla si el producto tiene tallas
    if (tieneTallas && !selectedTalla) {
      toast({
        title: "Selecciona una talla",
        description: "Por favor selecciona una talla antes de añadir al carrito",
        variant: "destructive",
      });
      return;
    }

    // Verificación estricta de stock disponible
    if (!producto.stock || producto.stock <= 0) {
      toast({
        title: "Sin stock",
        description: "Este producto no está disponible",
        variant: "destructive",
      });
      return;
    }

    // Verificar que la cantidad no exceda el stock
    if (cantidad > producto.stock) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${producto.stock} unidades disponibles`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsAddingToCart(true);

      // Verificar si el usuario está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Usuario no autenticado - usar localStorage
        let carritoLocal = JSON.parse(localStorage.getItem('carritoLocal') || '[]');
        
        const productoExistente = carritoLocal.find(item => 
          item.producto_id === producto.id && 
          (tieneTallas ? item.talla === selectedTalla : true)
        );
        
        // Calcular cantidad actual en carrito
        const cantidadEnCarrito = productoExistente ? productoExistente.cantidad : 0;
        
        // Verificación final: si la nueva cantidad excedería el stock
        if (cantidadEnCarrito + cantidad > producto.stock) {
          const disponible = producto.stock - cantidadEnCarrito;
          if (disponible <= 0) {
            toast({
              title: "Stock agotado",
              description: `Ya tienes todas las unidades disponibles (${producto.stock}) en el carrito.`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Stock insuficiente",
              description: `Solo puedes agregar ${disponible} unidades más. Ya tienes ${cantidadEnCarrito} en el carrito.`,
              variant: "destructive",
            });
          }
          return;
        }
        
        if (productoExistente) {
          productoExistente.cantidad += cantidad;
        } else {
          carritoLocal.push({
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            producto_id: producto.id,
            cantidad: cantidad,
            precio_unitario: producto.precio,
            producto: producto,
            talla: tieneTallas ? selectedTalla : null
          });
        }
        
        localStorage.setItem('carritoLocal', JSON.stringify(carritoLocal));
        actualizarCantidad();
        
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
        
        toast({
          title: "¡Producto agregado!",
          description: `${cantidad} x ${producto.nombre}${tieneTallas ? ` (Talla: ${selectedTalla})` : ''} agregado al carrito`,
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
        
        // Verificación final: si la nueva cantidad excedería el stock
        if (cantidadEnCarrito + cantidad > producto.stock) {
          const disponible = producto.stock - cantidadEnCarrito;
          if (disponible <= 0) {
            toast({
              title: "Stock agotado",
              description: `Ya tienes todas las unidades disponibles (${producto.stock}) en el carrito.`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Stock insuficiente",
              description: `Solo puedes agregar ${disponible} unidades más. Ya tienes ${cantidadEnCarrito} en el carrito.`,
              variant: "destructive",
            });
          }
          return;
        }

        if (itemExistente) {
          const { error } = await supabase
            .from("carrito_items")
            .update({ cantidad: itemExistente.cantidad + cantidad })
            .eq("id", itemExistente.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("carrito_items")
            .insert({
              carrito_id: carritoId,
              producto_id: producto.id,
              cantidad: cantidad,
              precio_unitario: producto.precio
            });

          if (error) throw error;
        }

        actualizarCantidad();
        
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
        
        toast({
          title: "¡Producto agregado!",
          description: `${cantidad} x ${producto.nombre}${tieneTallas ? ` (Talla: ${selectedTalla})` : ''} agregado al carrito`,
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
      setIsAddingToCart(false);
    }
  };

  const incrementarCantidad = () => {
    if (cantidad < (producto?.stock || 1)) {
      setCantidad(cantidad + 1);
    }
  };

  const decrementarCantidad = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
            <p className="text-gray-500 mb-4">El producto que buscas no existe</p>
            <Button onClick={() => navigate("/productos")}>Volver a productos</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/productos")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a productos
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Imagen del producto */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="aspect-square">
                <img 
                  src={producto.imagen || "/placeholder.svg"} 
                  alt={producto.nombre}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          </div>

          {/* Información del producto */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900">{producto.nombre}</h1>
                  <div className="flex items-center gap-2">
                    {producto.categoria && (
                      <Badge variant="secondary">{producto.categoria}</Badge>
                    )}
                    {producto.liga && (
                      <Badge variant="outline">{producto.liga}</Badge>
                    )}
                    {tieneTallas && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Tallas disponibles
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-4xl font-bold text-orange-600">
                  ${producto.precio.toFixed(2)}
                </p>
                {producto.equipo && (
                  <p className="text-lg text-gray-600">{producto.equipo}</p>
                )}
              </div>
            </div>

            {/* Descripción */}
            {producto.descripcion && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                <p className="text-gray-600 leading-relaxed">{producto.descripcion}</p>
              </div>
            )}

            <Separator />

            {/* Selección de talla */}
            {tieneTallas && tallas.length > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Talla *
                  </label>
                  <Select value={selectedTalla} onValueChange={setSelectedTalla}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una talla" />
                    </SelectTrigger>
                    <SelectContent>
                      {tallas.map((talla) => (
                        <SelectItem key={talla.talla} value={talla.talla}>
                          {talla.talla} - Stock: {talla.cantidad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
              </div>
            )}

            {/* Stock y cantidad */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Stock disponible: 
                  <span className={`ml-1 font-semibold ${producto.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {producto.stock} unidades
                  </span>
                </span>
              </div>

              {producto.stock > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={decrementarCantidad}
                        disabled={cantidad <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold text-lg">
                        {cantidad}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={incrementarCantidad}
                        disabled={cantidad >= producto.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={agregarAlCarrito}
                    disabled={isAddingToCart || isAdded || producto.stock === 0 || (tieneTallas && !selectedTalla)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 text-lg"
                    size="lg"
                  >
                    {isAdded ? (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        ¡Agregado al carrito!
                      </>
                    ) : isAddingToCart ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current mr-2"></div>
                        Agregando...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Agregar al carrito - ${(producto.precio * cantidad).toFixed(2)}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {producto.stock === 0 && (
                <div className="text-center py-4">
                  <p className="text-red-600 font-semibold">Sin stock</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Este producto no está disponible actualmente
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Información adicional */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Información de compra</h3>
              <div className="grid grid-cols-1 gap-3">
                
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Garantía de calidad</span>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductoDetalle; 