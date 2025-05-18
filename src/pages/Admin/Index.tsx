
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminProductos from "@/components/Admin/AdminProductos";
import AdminPedidos from "@/components/Admin/AdminPedidos";
import AdminProveedores from "@/components/Admin/AdminProveedores";
import AdminDashboard from "@/components/Admin/AdminDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AdminIndex = () => {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsLoading(false);
          return;
        }
        
        setUser(session.user);
        
        // Verificar si el usuario es admin
        const { data: perfilData, error: perfilError } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
          
        if (perfilError) throw perfilError;
        
        setPerfil(perfilData);
      } catch (error) {
        console.error("Error al verificar usuario:", error);
        toast({
          title: "Error",
          description: "Ocurrió un error al verificar tus permisos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  // Si no hay usuario o no es admin, redirigir a inicio de sesión
  if (!user || (perfil && perfil.rol !== "admin")) {
    toast({
      title: "Acceso denegado",
      description: "No tienes permisos para acceder al panel de administración",
      variant: "destructive",
    });
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Panel de Administración</h1>
          <p className="text-gray-600">Administra tu tienda Fútbol Fiesta Shop</p>
        </div>
        
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
            <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>
          
          <TabsContent value="productos">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Productos</CardTitle>
                <CardDescription>
                  Administra el catálogo de productos de tu tienda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminProductos />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pedidos">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Pedidos</CardTitle>
                <CardDescription>
                  Administra los pedidos y actualiza su estado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminPedidos />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="proveedores">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Proveedores</CardTitle>
                <CardDescription>
                  Administra tus proveedores y contactos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminProveedores />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminIndex;
