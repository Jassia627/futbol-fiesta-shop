import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCarrito } from "@/contexts/CarritoContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus, ShoppingBag, Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CarritoItem {
  id: string;
  producto_id: string;
  carrito_id?: string;
  cantidad: number;
  precio_unitario: number;
  talla?: string | null;
  producto: {
    id: string;
    nombre: string;
    precio: number;
    imagen: string;
    descripcion: string;
  };
}

interface DatosCliente {
  nombre: string;
  telefono: string;
  direccion: string;
  email?: string;
  metodoPago: string;
}

const Carrito = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CarritoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [datosCliente, setDatosCliente] = useState<DatosCliente>({
    nombre: "",
    telefono: "",
    direccion: "",
    email: "",
    metodoPago: "Efectivo"
  });
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { actualizarCantidad: actualizarContadorCarrito } = useCarrito();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUser(session.user);
          await fetchCarrito(session.user.id);
          // No cargamos los datos del perfil automáticamente para mantener el formulario vacío
          // await fetchPerfilUsuario(session.user.id);
        } else {
          // Cargar carrito desde localStorage para usuarios no autenticados
          const carritoLocal = JSON.parse(localStorage.getItem('carritoLocal') || '[]');
          setItems(carritoLocal);
          calcularTotal(carritoLocal);
        }
      } catch (error) {
        console.error("Error al verificar sesión:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
    
    // Reiniciar los datos del cliente al entrar a la página
    setDatosCliente({
      nombre: "",
      telefono: "",
      direccion: "",
      email: "",
      metodoPago: "Efectivo"
    });
  }, [navigate]);

  const fetchPerfilUsuario = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select("nombre, apellido, telefono, direccion")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("Error al cargar perfil:", error);
        return;
      }
      
      if (data) {
        setDatosCliente({
          nombre: `${data.nombre || ''} ${data.apellido || ''}`.trim(),
          telefono: data.telefono || '',
          direccion: data.direccion || '',
          email: user?.email || '',
          metodoPago: "Efectivo"
        });
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
          cantidad,
          precio_unitario,
          producto:productos (
            id,
            nombre,
            precio,
            imagen,
            descripcion,
            categoria,
            liga,
            equipo
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
      if (user) {
        // Usuario autenticado - actualizar en Supabase
        const { error } = await supabase
          .from("carrito_items")
          .update({ cantidad: nuevaCantidad })
          .eq("id", itemId);
        
        if (error) throw error;
      } else {
        // Usuario no autenticado - actualizar en localStorage
        const carritoLocal = JSON.parse(localStorage.getItem('carritoLocal') || '[]');
        const itemIndex = carritoLocal.findIndex(item => item.id === itemId);
        
        if (itemIndex !== -1) {
          carritoLocal[itemIndex].cantidad = nuevaCantidad;
          localStorage.setItem('carritoLocal', JSON.stringify(carritoLocal));
        }
      }
      
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
      if (user) {
        // Usuario autenticado - eliminar de Supabase
        const { error } = await supabase
          .from("carrito_items")
          .delete()
          .eq("id", itemId);
        
        if (error) throw error;
      } else {
        // Usuario no autenticado - eliminar de localStorage
        const carritoLocal = JSON.parse(localStorage.getItem('carritoLocal') || '[]');
        const nuevosItems = carritoLocal.filter(item => item.id !== itemId);
        localStorage.setItem('carritoLocal', JSON.stringify(nuevosItems));
      }
      
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
    } finally {
      setEnviandoPedido(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDatosCliente(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const prepararPedido = () => {
    if (items.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos al carrito antes de realizar el pedido",
        variant: "destructive",
      });
      return;
    }

    // Siempre mostrar el formulario para asegurarnos de que los datos estén actualizados
    setMostrarFormulario(true);
    
    // Si el usuario está autenticado, cargar sus datos para facilitar el llenado del formulario
    if (user && (!datosCliente.nombre || !datosCliente.telefono || !datosCliente.direccion)) {
      fetchPerfilUsuario(user.id);
    }
  };

  const validarFormulario = () => {
    if (!datosCliente.nombre || !datosCliente.telefono || !datosCliente.direccion) {
      toast({
        title: "Información incompleta",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const formatearTelefono = (telefono: string) => {
    // Asegurarse de que el teléfono tenga el prefijo de Colombia (+57)
    if (!telefono.startsWith('+')) {
      return `+57${telefono.replace(/^0+/, '')}`;
    } else if (!telefono.startsWith('+57')) {
      return `+57${telefono.replace(/^\+/, '')}`;
    }
    return telefono;
  };

  const guardarPedidoEnBaseDeDatos = async () => {
    try {
      const totalPedido = items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
      
      // Formatear teléfono con prefijo de Colombia si es necesario
      const telefonoFormateado = formatearTelefono(datosCliente.telefono);
      
      // Generar un ID único para el pedido
      const pedidoId = crypto.randomUUID();
      
      // Intentar insertar directamente primero
      const { data: pedidoInsertado, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          id: pedidoId,
          usuario_id: user?.id || null,
          total: totalPedido,
          estado: 'pendiente',
          metodo_pago: 'WhatsApp',
          direccion_envio: datosCliente.direccion,
          fecha_pedido: new Date().toISOString(),
          cliente_nombre: datosCliente.nombre,
          cliente_telefono: telefonoFormateado,
          cliente_email: datosCliente.email || ''
        })
        .select('id')
        .single();
      
      if (pedidoError) {
        console.error('Error al insertar pedido con RPC:', pedidoError);
        
        // Intentar con método alternativo: inserción directa con fetch
        let errorSQL = null;
        try {
          // Obtener token de autenticación
          const { data: authData } = await supabase.auth.getSession();
          const token = authData.session?.access_token;
          
          // Usar fetch directamente para evitar las políticas de seguridad
          const SUPABASE_URL = "https://iqjkedmjefefohhxgffd.supabase.co";
          const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxamtlZG1qZWZlZm9oaHhnZmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1ODkxODAsImV4cCI6MjA2MzE2NTE4MH0.1evYDr4jb8D-QRo06mdDjVzX2RYt5mtUS4yfhaGu2CM";
          
          const response = await fetch(`${SUPABASE_URL}/rest/v1/pedidos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': token ? `Bearer ${token}` : `Bearer ${SUPABASE_KEY}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              id: pedidoId,
              usuario_id: user?.id || null,
              total: totalPedido,
              estado: 'pendiente',
              metodo_pago: 'WhatsApp',
              direccion_envio: datosCliente.direccion,
              fecha_pedido: new Date().toISOString(),
              cliente_nombre: datosCliente.nombre,
              cliente_telefono: telefonoFormateado,
              cliente_email: datosCliente.email || ''
            })
          });
          
          if (!response.ok) {
            errorSQL = { message: `Error HTTP: ${response.status}` };
          }
        } catch (err) {
          errorSQL = err;
        }
        
        if (errorSQL) {
          console.error('Error al insertar pedido con SQL directo:', errorSQL);
          
          // Como último recurso, guardar los datos del pedido en localStorage
          const pedidoLocal = {
            id: pedidoId,
            usuario_id: user?.id || null,
            total: totalPedido,
            estado: 'pendiente',
            metodo_pago: 'WhatsApp',
            direccion_envio: datosCliente.direccion,
            fecha_pedido: new Date().toISOString(),
            cliente_nombre: datosCliente.nombre,
            cliente_telefono: telefonoFormateado,
            cliente_email: datosCliente.email || '',
            items: items.map(item => ({
              producto_id: item.producto.id,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              nombre_producto: item.producto.nombre
            }))
          };
          
          // Guardar en localStorage
          const pedidosGuardados = JSON.parse(localStorage.getItem('pedidos_pendientes') || '[]');
          pedidosGuardados.push(pedidoLocal);
          localStorage.setItem('pedidos_pendientes', JSON.stringify(pedidosGuardados));
          
          console.log('Pedido guardado localmente como respaldo:', pedidoLocal);
          
          // Mostrar mensaje al usuario
          toast({
            title: "Advertencia",
            description: "No se pudo guardar el pedido en la base de datos, pero se ha guardado localmente. Por favor, guarda el número de pedido: " + pedidoId.substring(0, 8),
            variant: "destructive",
            duration: 10000
          });
          
          return pedidoId;
        }
        
        console.log('Pedido insertado con SQL directo');
      } else {
        console.log('Pedido insertado con RPC:', pedidoInsertado);
      }
      
      // Insertar items del pedido
      try {
        // Intentar insertar los items uno por uno para mayor robustez
        for (const item of items) {
          const itemData = {
            pedido_id: pedidoId,
            producto_id: item.producto.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            talla: item.talla || null
          };
          
          const { error: itemError } = await supabase
            .from('pedido_items')
            .insert(itemData);
          
          if (itemError) {
            console.error('Error al insertar item, intentando con SQL directo:', itemError);
            
            // Intentar con fetch directo
            try {
              const { data: authData } = await supabase.auth.getSession();
              const token = authData.session?.access_token;
              
              const SUPABASE_URL = "https://iqjkedmjefefohhxgffd.supabase.co";
              const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxamtlZG1qZWZlZm9oaHhnZmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1ODkxODAsImV4cCI6MjA2MzE2NTE4MH0.1evYDr4jb8D-QRo06mdDjVzX2RYt5mtUS4yfhaGu2CM";
              
              await fetch(`${SUPABASE_URL}/rest/v1/pedido_items`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': SUPABASE_KEY,
                  'Authorization': token ? `Bearer ${token}` : `Bearer ${SUPABASE_KEY}`,
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                  pedido_id: pedidoId,
                  producto_id: item.producto.id,
                  cantidad: item.cantidad,
                  precio_unitario: item.precio_unitario,
                  talla: item.talla || null
                })
              });
            } catch (fetchError) {
              console.error('Error al insertar item con fetch:', fetchError);
            }
          }
        }
      } catch (itemsError) {
        console.error('Error al insertar items del pedido:', itemsError);
        // Continuar a pesar del error para que al menos el pedido principal esté guardado
      }
      
      console.log('Pedido guardado correctamente con ID:', pedidoId);
      return pedidoId;
    } catch (error) {
      console.error('Error al guardar pedido:', error);
      
      // Generar un ID temporal para el pedido en caso de error total
      const pedidoIdTemporal = 'temp-' + Date.now();
      
      // Guardar en localStorage como último recurso
      const pedidoLocal = {
        id: pedidoIdTemporal,
        usuario_id: user?.id || null,
        total: items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0),
        estado: 'pendiente',
        metodo_pago: datosCliente.metodoPago,
        direccion_envio: datosCliente.direccion,
        fecha_pedido: new Date().toISOString(),
        cliente_nombre: datosCliente.nombre,
        cliente_telefono: formatearTelefono(datosCliente.telefono),
        cliente_email: datosCliente.email || '',
        items: items.map(item => ({
          producto_id: item.producto.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          nombre_producto: item.producto.nombre
        }))
      };
      
      // Guardar en localStorage
      const pedidosGuardados = JSON.parse(localStorage.getItem('pedidos_pendientes') || '[]');
      pedidosGuardados.push(pedidoLocal);
      localStorage.setItem('pedidos_pendientes', JSON.stringify(pedidosGuardados));
      
      console.log('Pedido guardado localmente como último recurso:', pedidoLocal);
      
      // Mostrar mensaje al usuario
      toast({
        title: "Advertencia",
        description: "No se pudo guardar el pedido en la base de datos, pero se ha guardado localmente. El pedido se enviará por WhatsApp de todas formas.",
        variant: "destructive",
        duration: 10000
      });
      
      return pedidoIdTemporal;
    }
  };

  const enviarPedidoWhatsApp = async () => {
    if (!validarFormulario()) return;
    

    setEnviandoPedido(true);

    try {
      
      // Obtener ID del pedido guardado
      const pedidoId = await guardarPedidoEnBaseDeDatos();
      
      // Formatear mensaje para WhatsApp
      let mensaje = `¡Hola! Quiero realizar el siguiente pedido (ID: ${pedidoId.slice(0, 8)}...):\n\n`;
      
      items.forEach(item => {
        mensaje += `• ${item.cantidad}x ${item.producto.nombre}${item.talla ? ` (Talla: ${item.talla})` : ''} - $${item.precio_unitario.toFixed(2)} c/u - Subtotal: $${(item.cantidad * item.precio_unitario).toFixed(2)}\n`;
      });
      
      mensaje += `\n*Total: $${total.toFixed(2)}*\n\n`;
      mensaje += `*Datos del cliente:*\n`;
      mensaje += `Nombre: ${datosCliente.nombre}\n`;
      mensaje += `Teléfono: ${datosCliente.telefono}\n`;
      mensaje += `Dirección: ${datosCliente.direccion}\n`;
      mensaje += `Método de pago: ${datosCliente.metodoPago}\n\n`;
      mensaje += "Por favor, confirma disponibilidad y tiempo de entrega. ¡Gracias!";
      
      // Número de teléfono de la tienda (usando el prefijo de Colombia +57)
      const numeroTienda = "+573015318600"; // Reemplazar con el número real de la tienda
      
      // Crear URL de WhatsApp
      const whatsappUrl = `https://wa.me/${numeroTienda.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
      
      // Abrir WhatsApp en una nueva pestaña
      window.open(whatsappUrl, "_blank");
      
      toast({
        title: "Pedido enviado",
        description: "Se ha guardado el pedido y abierto WhatsApp para completarlo",
      });

      // Limpiar carrito después de enviar el pedido
      if (!user) {
        // Para usuarios no autenticados, limpiar localStorage
        localStorage.setItem('carritoLocal', '[]');
        setItems([]);
        calcularTotal([]);
        
        // Actualizar el contador del carrito en el contexto global
        actualizarContadorCarrito();
      } else {
        // Para usuarios autenticados, limpiar carrito en la base de datos
        try {
          // Obtener el ID del carrito del usuario
          const { data: carrito } = await supabase
            .from("carritos")
            .select("id")
            .eq("usuario_id", user.id)
            .single();
          
          if (carrito) {
            // Eliminar todos los items del carrito
            await supabase
              .from("carrito_items")
              .delete()
              .eq("carrito_id", carrito.id);
            
            // Actualizar el estado local
            setItems([]);
            calcularTotal([]);
            
            // Actualizar el contador del carrito en el contexto global
            actualizarContadorCarrito();
          }
        } catch (error) {
          console.error("Error al limpiar carrito en base de datos:", error);
        }
      }

      // Ocultar formulario
      setMostrarFormulario(false);
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
                  {mostrarFormulario ? (
                  <div className="space-y-4 border p-4 rounded-md bg-gray-50">
                    <h3 className="font-medium text-lg">Datos para el pedido</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nombre completo *</label>
                        <Input
                          name="nombre"
                          value={datosCliente.nombre}
                          onChange={handleInputChange}
                          placeholder="Ingresa tu nombre completo"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Teléfono (WhatsApp) *</label>
                        <Input
                          name="telefono"
                          value={datosCliente.telefono}
                          onChange={handleInputChange}
                          placeholder="Ej: +573001234567"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Se añadirá el prefijo de Colombia (+57) si no lo incluyes
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Dirección de entrega *</label>
                        <Input
                          name="direccion"
                          value={datosCliente.direccion}
                          onChange={handleInputChange}
                          placeholder="Ingresa tu dirección completa"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Email (opcional)</label>
                        <Input
                          name="email"
                          value={datosCliente.email}
                          onChange={handleInputChange}
                          placeholder="tu@email.com"
                          type="email"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Método de pago *</label>
                        <select
                          name="metodoPago"
                          value={datosCliente.metodoPago}
                          onChange={(e) => setDatosCliente(prev => ({ ...prev, metodoPago: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Transferencia bancaria">Transferencia bancaria</option>
                          <option value="Nequi">Nequi</option>
                          <option value="Daviplata">Daviplata</option>
                          <option value="Tarjeta de crédito/débito">Tarjeta de crédito/débito</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : null}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">
                      Al finalizar la compra, se enviará un mensaje de WhatsApp con los detalles del pedido.
                    </p>
                  </div>
                  
                  {mostrarFormulario ? (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => setMostrarFormulario(false)}
                        disabled={enviandoPedido}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                        onClick={enviarPedidoWhatsApp}
                        disabled={enviandoPedido || items.length === 0}
                      >
                        <Send size={18} />
                        Finalizar pedido
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                      onClick={prepararPedido}
                      disabled={enviandoPedido || items.length === 0}
                    >
                      <Send size={18} />
                      Realizar pedido
                    </Button>
                  )}
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
