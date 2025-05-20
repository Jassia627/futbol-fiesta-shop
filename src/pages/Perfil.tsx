
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
import { Edit2, Save, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AgregarProducto from "@/components/Perfil/AgregarProducto";
import MisProductos from "@/components/Perfil/MisProductos";

const Perfil = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    direccion: "",
  });
  const [editing, setEditing] = useState(false);
  
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
      
      // Primero verificar si el perfil ya existe
      const { data: perfilExistente, error: errorBusqueda } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      
      console.log("Verificando perfil existente:", perfilExistente, errorBusqueda);
      
      let resultado;
      
      if (perfilExistente) {
        // Si el perfil existe, actualizar
        console.log("Actualizando perfil existente");
        resultado = await supabase
          .from("perfiles")
          .update({
            nombre: perfil.nombre,
            apellido: perfil.apellido,
            telefono: perfil.telefono,
            direccion: perfil.direccion,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id);
      } else {
        // Si no existe, crear nuevo perfil
        console.log("Creando nuevo perfil");
        resultado = await supabase
          .from("perfiles")
          .insert([
            {
              id: user.id,
              nombre: perfil.nombre,
              apellido: perfil.apellido,
              telefono: perfil.telefono,
              direccion: perfil.direccion,
              rol: "cliente",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
      }
      
      // Verificar si hubo error
      if (resultado.error) {
        console.error("Error al guardar perfil con método estándar:", resultado.error);
        
        // Intentar con método alternativo: upsert
        console.log("Intentando con método upsert");
        const upsertResult = await supabase
          .from("perfiles")
          .upsert({
            id: user.id,
            nombre: perfil.nombre,
            apellido: perfil.apellido,
            telefono: perfil.telefono,
            direccion: perfil.direccion,
            rol: "cliente",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (upsertResult.error) {
          console.error("Error con método upsert:", upsertResult.error);
          
          // Intentar con método de API REST directa
          const { data: authData } = await supabase.auth.getSession();
          const token = authData.session?.access_token;
          
          if (!token) {
            throw new Error("No se pudo obtener el token de autenticación");
          }
          
          const SUPABASE_URL = "https://iqjkedmjefefohhxgffd.supabase.co";
          const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxamtlZG1qZWZlZm9oaHhnZmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1ODkxODAsImV4cCI6MjA2MzE2NTE4MH0.1evYDr4jb8D-QRo06mdDjVzX2RYt5mtUS4yfhaGu2CM";
          
          // Intentar con PATCH si el perfil existe
          if (perfilExistente) {
            const patchResponse = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?id=eq.${user.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${token}`,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                nombre: perfil.nombre,
                apellido: perfil.apellido,
                telefono: perfil.telefono,
                direccion: perfil.direccion,
                updated_at: new Date().toISOString()
              })
            });
            
            if (!patchResponse.ok) {
              throw new Error(`Error al actualizar perfil con PATCH: ${patchResponse.status}`);
            }
          } else {
            // Intentar con POST si el perfil no existe
            const postResponse = await fetch(`${SUPABASE_URL}/rest/v1/perfiles`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${token}`,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                id: user.id,
                nombre: perfil.nombre,
                apellido: perfil.apellido,
                telefono: perfil.telefono,
                direccion: perfil.direccion,
                rol: "cliente",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            });
            
            if (!postResponse.ok) {
              throw new Error(`Error al crear perfil con POST: ${postResponse.status}`);
            }
          }
        }
      }
      
      // Actualizar el estado local con los nuevos datos
      setPerfil({
        nombre: perfil.nombre,
        apellido: perfil.apellido,
        telefono: perfil.telefono,
        direccion: perfil.direccion,
      });
      
      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente en la base de datos",
      });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil en la base de datos. Por favor, intenta de nuevo.",
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Mi Perfil</h1>
          <p className="text-gray-600">Administra tu información personal y tus productos</p>
        </div>

        {!perfil.telefono && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-3">
              <div className="text-amber-500 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-amber-800">Información importante</h3>
                <p className="text-amber-700 text-sm mt-1">Para poder realizar pedidos por WhatsApp, necesitas configurar tu número de teléfono. Edita tu perfil haciendo clic en el ícono de edición.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[300px_1fr] grid-cols-1">
          {/* Sidebar con información del usuario */}
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
          </div>

          {/* Contenido principal */}
          <div>
            <Tabs defaultValue="mis_productos" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="mis_productos">Mis Productos</TabsTrigger>
                <TabsTrigger value="agregar_producto">Agregar Producto</TabsTrigger>
              </TabsList>
              
              <TabsContent value="mis_productos">
                <MisProductos userId={user?.id} />
              </TabsContent>
              
              <TabsContent value="agregar_producto">
                <AgregarProducto userId={user?.id} />
              </TabsContent>
            </Tabs>
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

export default Perfil;
