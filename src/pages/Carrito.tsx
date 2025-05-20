import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus, ShoppingBag, Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CarritoItem {
  id: string;
  producto_id: string;
  carrito_id: string;
  cantidad: number;
  precio_unitario: number;
  producto: {
    id: string;
    nombre: string;
    precio: number;
    imagen: string;
    descripcion: string;
  };
}

const Carrito = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CarritoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [telefono, setTelefono] = useState("");
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  
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
        await fetchCarrito(session.user.id);
        await fetchPerfilUsuario(session.user.id);
      } catch (error) {
        console.error("Error al verificar sesión:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const fetchPerfilUsuario = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select("telefono")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("Error al cargar perfil:", error);
        toast({
          title: "Aviso",
          description: "No se pudo cargar tu número de teléfono. Verifica tu perfil.",
        });
        return;
      }
      
      if (data && data.telefono) {
        setTelefono(data.telefono);
      } else {
        toast({
          title: "Información requerida",
          description: "No tienes un número de teléfono guardado. Por favor actualiza tu perfil.",
          variant: "destructive",
        });
        // Redirigir al usuario a la página de perfil después de un breve retraso
        setTimeout(() => {
          navigate("/perfil");
        }, 3000);
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    }
  };

  const fetchCarrito = async (userId: string) => {
    try {
      // Buscar o crear el carrito del usuario
      let carritoId;
      
      const { data: carrito, error: carritoError } = await supabase
        .from("carritos")
        .select("id")
        .eq("usuario_id", userId)
        .single();
      
      if (carritoError) {
        // Si no existe, crear un nuevo carrito
        const { data: nuevoCarrito, error: nuevoError } = await supabase
          .from("carritos")
          .insert({ usuario_id: userId })
          .select("id")
          .single();
        
        if (nuevoError) throw nuevoError;
        carritoId = nuevoCarrito.id;
      } else {
        carritoId = carrito.id;
      }
      
      // Obtener los items del carrito con información del producto
      const { data: carritoItems, error: itemsError } = await supabase
        .from("carrito_items")
        .select(`
          id,
          producto_id,
          carrito_id,
          cantidad,
          precio_unitario,
          producto:productos (
            id,
            nombre,
            precio,
            imagen,
            descripcion
          )
        `)
        .eq("carrito_id", carritoId);
      
      if (itemsError) throw itemsError;
      
      setItems(carritoItems || []);
      calcularTotal(carritoItems || []);
    } catch (error) {
      console.error("Error al cargar carrito:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el carrito de compras",
        variant: "destructive",
      });
    }
  };

  const calcularTotal = (items: CarritoItem[]) => {
    const suma = items.reduce((acc, item) => {
      return acc + (item.cantidad * item.precio_unitario);
    }, 0);
    setTotal(suma);
  };

  const actualizarCantidad = async (itemId: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    
    try {
      const { error } = await supabase
        .from("carrito_items")
        .update({ cantidad: nuevaCantidad })
        .eq("id", itemId);
      
      if (error) throw error;
      
      // Actualizar estado local
      const nuevosItems = items.map(item => {
        if (item.id === itemId) {
          return { ...item, cantidad: nuevaCantidad };
        }
        return item;
      });
      
      setItems(nuevosItems);
      calcularTotal(nuevosItems);
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cantidad",
        variant: "destructive",
      });
    }
  };

  const eliminarItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("carrito_items")
        .delete()
        .eq("id", itemId);
      
      if (error) throw error;
      
      // Actualizar estado local
      const nuevosItems = items.filter(item => item.id !== itemId);
      setItems(nuevosItems);
      calcularTotal(nuevosItems);
      
      toast({
        title: "Producto eliminado",
        description: "Se ha eliminado el producto del carrito",
      });
    } catch (error) {
      console.error("Error al eliminar item:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto del carrito",
        variant: "destructive",
      });
    }
  };

  const enviarPedidoWhatsApp = () => {
    if (items.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos al carrito antes de realizar el pedido",
        variant: "destructive",
      });
      return;
    }

    if (!telefono) {
      toast({
        title: "Información faltante",
        description: "No se ha encontrado un número de teléfono en tu perfil. Por favor actualiza tu perfil.",
        variant: "destructive",
      });
      navigate("/perfil");
      return;
    }

    setEnviandoPedido(true);

    try {
      // Formatear mensaje para WhatsApp
      let mensaje = "¡Hola! Quiero realizar el siguiente pedido:\n\n";
      
      items.forEach(item => {
        mensaje += `• ${item.cantidad}x ${item.producto.nombre} - $${item.precio_unitario.toFixed(2)} c/u - Subtotal: $${(item.cantidad * item.precio_unitario).toFixed(2)}\n`;
      });
      
      mensaje += `\n*Total: $${total.toFixed(2)}*\n\n`;
      mensaje += "Por favor, confirma disponibilidad y tiempo de entrega. ¡Gracias!";
      
      // Número de teléfono con prefijo de Colombia (+57)
      const numeroWhatsApp = telefono.startsWith("+57") ? telefono : `+57${telefono.replace(/^0+/, '')}`;
      
      // Crear URL de WhatsApp
      const whatsappUrl = `https://wa.me/${numeroWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
      
      // Abrir WhatsApp en una nueva pestaña
      window.open(whatsappUrl, "_blank");
      
      toast({
        title: "Pedido enviado",
        description: "Se ha abierto WhatsApp para enviar tu pedido",
      });
    } catch (error) {
      console.error("Error al enviar pedido:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el pedido por WhatsApp",
        variant: "destructive",
      });
    } finally {
      setEnviandoPedido(false);
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Carrito de Compras</h1>
        
        {items.length === 0 ? (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <ShoppingBag className="mx-auto mb-4 text-gray-400" size={64} />
              <h2 className="text-2xl font-semibold mb-2">Tu carrito está vacío</h2>
              <p className="text-gray-500 mb-4">Añade productos para comenzar tu compra</p>
              <Button 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => navigate("/productos")}
              >
                Ver productos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Productos en tu carrito</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="flex flex-col md:flex-row items-center gap-4 py-4 border-b border-gray-100 last:border-b-0">
                      <div className="w-full md:w-20 h-20 overflow-hidden rounded-md mb-2 md:mb-0">
                        <img 
                          src={item.producto.imagen || "/placeholder.svg"} 
                          alt={item.producto.nombre} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-grow w-full md:w-auto text-center md:text-left">
                        <h3 className="font-semibold">{item.producto.nombre}</h3>
                        <p className="text-gray-500 text-sm">{item.producto.descripcion?.substring(0, 60)}...</p>
                        <p className="font-medium">${item.precio_unitario.toFixed(2)}</p>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 my-2 md:my-0">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                          disabled={item.cantidad <= 1}
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="w-8 text-center">{item.cantidad}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      
                      <div className="text-center md:text-right min-w-[80px] my-2 md:my-0">
                        <p className="font-bold">${(item.cantidad * item.precio_unitario).toFixed(2)}</p>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => eliminarItem(item.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Finalizar pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-col space-y-2 mb-4">
                      <label className="block text-sm font-medium">
                        Número de teléfono para WhatsApp
                      </label>
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                        <p className="font-medium">{telefono ? (telefono.startsWith("+57") ? telefono : `+57${telefono.replace(/^0+/, '')}`): "No disponible"}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        Este número se obtuvo de tu perfil. Para cambiarlo, actualiza tu perfil.
                      </p>
                      {!telefono && (
                        <Button 
                          variant="outline" 
                          className="mt-2" 
                          onClick={() => navigate("/perfil")}
                        >
                          Actualizar perfil
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                    onClick={enviarPedidoWhatsApp}
                    disabled={enviandoPedido || !telefono || items.length === 0}
                  >
                    <Send size={18} />
                    Enviar pedido por WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Carrito;
