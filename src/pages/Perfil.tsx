
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

      if (error) throw error;
      
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
      const { error } = await supabase
        .from("perfiles")
        .update({
          nombre: perfil.nombre,
          apellido: perfil.apellido,
          telefono: perfil.telefono,
          direccion: perfil.direccion,
          updated_at: new Date(),
        })
        .eq("id", user.id);

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente",
      });
      
      setEditing(false);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
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

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
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
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      value={perfil.telefono}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
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
      
      <Footer />
    </div>
  );
};

export default Perfil;
