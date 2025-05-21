import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Save, User, Package, ShoppingBag, Settings, BarChart3, Truck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminPedidos from "@/components/Admin/AdminPedidos";
import AdminDashboard from "@/components/Admin/AdminDashboard";
import AdminProveedores from "@/components/Admin/AdminProveedores";
import AgregarProducto from "@/components/Perfil/AgregarProducto";
import MisProductos from "@/components/Perfil/MisProductos";

const AdminPanel = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  type RolType = "admin" | "cliente" | "vendedor";
  
  const [perfil, setPerfil] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    direccion: "",
    rol: "cliente" as RolType,
  });
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  
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
        await fetchPerfil(session.user.id);
      } catch (error) {
        console.error("Error al verificar sesión:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const fetchPerfil = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // Verificar si es el error específico de recursión infinita
        if (error.code === '42P17' && error.message?.includes('infinite recursion')) {
          console.warn("Error de recursión en políticas al cargar perfil, usando datos predeterminados");
          // Proporcionar datos predeterminados para el perfil
          setPerfil({
            nombre: user?.email?.split('@')[0] || "Usuario",
            apellido: "",
            telefono: "",
            direccion: "",
            rol: "cliente",
          });
          return;
        }
        throw error;
      }
      
      setPerfil({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        telefono: data.telefono || "",
        direccion: data.direccion || "",
        rol: data.rol || "cliente",
      });
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del perfil",
        variant: "destructive",
      });
      
      // En caso de cualquier error, proporcionar datos predeterminados
      setPerfil({
        nombre: user?.email?.split('@')[0] || "Usuario",
        apellido: "",
        telefono: "",
        direccion: "",
        rol: "cliente",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPerfil(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setEditing(false); // Deshabilitar edición inmediatamente para mejorar UX
      
      // Mostrar indicador de carga
      toast({
        title: "Guardando",
        description: "Guardando tus datos...",
      });
      
      // Usar método upsert para simplificar
      const { error } = await supabase
        .from("perfiles")
        .upsert({
          id: user.id,
          nombre: perfil.nombre,
          apellido: perfil.apellido,
          telefono: perfil.telefono,
          direccion: perfil.direccion,
          rol: perfil.rol as RolType,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        throw error;
      }
      
      // Actualizar el estado local con los nuevos datos
      setPerfil({
        ...perfil,
        nombre: perfil.nombre,
        apellido: perfil.apellido,
        telefono: perfil.telefono,
        direccion: perfil.direccion,
      });
      
      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente",
      });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Verificar si el usuario tiene rol de administrador
  const isAdmin = perfil.rol === "admin";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-blue-900 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
                <p className="text-orange-100 mt-1">Gestiona tu perfil, pedidos y productos</p>
              </div>
              {isAdmin && (
                <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                  Administrador
                </span>
              )}
            </div>
          </div>
          
          {/* Navegación superior */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button 
              variant={activeTab === "dashboard" ? "default" : "outline"} 
              className={`${activeTab === "dashboard" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button 
              variant={activeTab === "pedidos" ? "default" : "outline"} 
              className={`${activeTab === "pedidos" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
              onClick={() => setActiveTab("pedidos")}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Pedidos
            </Button>
            <Button 
              variant={activeTab === "proveedores" ? "default" : "outline"} 
              className={`${activeTab === "proveedores" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
              onClick={() => setActiveTab("proveedores")}
            >
              <Truck className="mr-2 h-4 w-4" />
              Proveedores
            </Button>
            <Button 
              variant={activeTab === "mis_productos" ? "default" : "outline"} 
              className={`${activeTab === "mis_productos" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
              onClick={() => setActiveTab("mis_productos")}
            >
              <Package className="mr-2 h-4 w-4" />
              Mis Productos
            </Button>
            <Button 
              variant={activeTab === "agregar_producto" ? "default" : "outline"} 
              className={`${activeTab === "agregar_producto" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
              onClick={() => setActiveTab("agregar_producto")}
            >
              <Package className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[300px_1fr] grid-cols-1">
          {/* Sidebar con información del usuario y navegación */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="" alt={perfil.nombre} />
                    <AvatarFallback className="bg-orange-500 text-white text-lg">
                      {perfil.nombre && perfil.nombre[0]}
                      {perfil.apellido && perfil.apellido[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h2 className="text-xl font-semibold">
                      {perfil.nombre} {perfil.apellido}
                    </h2>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Datos personales</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setEditing(!editing)}
                  >
                    {editing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                  </Button>
                </div>
                <CardDescription>
                  Tu información de contacto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        value={perfil.nombre}
                        onChange={handleInputChange}
                        disabled={!editing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido">Apellido</Label>
                      <Input
                        id="apellido"
                        name="apellido"
                        value={perfil.apellido}
                        onChange={handleInputChange}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="telefono">Teléfono (WhatsApp)</Label>
                      {!editing && perfil.telefono && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Configurado
                        </span>
                      )}
                      {!editing && !perfil.telefono && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Requerido
                        </span>
                      )}
                    </div>
                    <Input
                      id="telefono"
                      name="telefono"
                      value={perfil.telefono}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="Ej: +573001234567"
                      className={!editing && !perfil.telefono ? "border-red-300" : ""}
                    />
                    <p className="text-xs text-gray-500">
                      {editing ? "Incluye el prefijo +57 o se añadirá automáticamente al enviar por WhatsApp" : 
                      !perfil.telefono ? "Necesario para enviar pedidos por WhatsApp" : ""}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      name="direccion"
                      value={perfil.direccion}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </div>
                  {editing && (
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={handleSaveProfile}
                    >
                      Guardar cambios
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información del usuario */}
            <Card>
              <CardHeader>
                <CardTitle>Información del usuario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{perfil.nombre} {perfil.apellido}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  {perfil.telefono && (
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <p className="text-sm">{perfil.telefono}</p>
                    </div>
                  )}
                  {perfil.direccion && (
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm">{perfil.direccion}</p>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setEditing(true)}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenido principal */}
          <div>
            {activeTab === "dashboard" && (
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard</CardTitle>
                  <CardDescription>Resumen general de la tienda</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <AdminDashboard />
                </CardContent>
              </Card>
            )}
            
            {activeTab === "pedidos" && (
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Pedidos</CardTitle>
                  <CardDescription>Administra todos los pedidos de la tienda</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <AdminPedidos />
                </CardContent>
              </Card>
            )}
            
            {activeTab === "proveedores" && (
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Proveedores</CardTitle>
                  <CardDescription>Administra los proveedores de la tienda</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <AdminProveedores />
                </CardContent>
              </Card>
            )}
            
            {activeTab === "mis_productos" && (
              <Card>
                <CardHeader>
                  <CardTitle>Mis Productos</CardTitle>
                  <CardDescription>Administra los productos que has publicado</CardDescription>
                </CardHeader>
                <CardContent>
                  <MisProductos userId={user?.id} />
                </CardContent>
              </Card>
            )}
            
            {activeTab === "agregar_producto" && (
              <Card>
                <CardHeader>
                  <CardTitle>Agregar Producto</CardTitle>
                  <CardDescription>Publica un nuevo producto en la tienda</CardDescription>
                </CardHeader>
                <CardContent>
                  <AgregarProducto userId={user?.id} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {editing && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-2 shadow-lg md:hidden z-10">
          <Button 
            variant="outline" 
            onClick={() => setEditing(false)}
          >
            Cancelar
          </Button>
          <Button 
            className="bg-orange-500 hover:bg-orange-600"
            onClick={handleSaveProfile}
          >
            Guardar cambios
          </Button>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default AdminPanel;
