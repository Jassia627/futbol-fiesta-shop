
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo",
      });
      
      navigate("/");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función de registro eliminada ya que solo queremos mostrar el login

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="flex-1 container mx-auto flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <img src="/kb.jpg" alt="KB Sports Logo" className="h-20 w-20 rounded-full object-cover mb-3" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-blue-900 bg-clip-text text-transparent">
              KB-SPORT3
            </h1>
          </div>
          <div className="w-full">
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <img src="/kb.jpg" alt="KB Sports Logo" className="h-12 w-12 rounded-full object-cover" />
                  </div>
                  <CardTitle>Iniciar sesión</CardTitle>
                  <CardDescription>
                    Ingresa tus datos para acceder a tu cuenta
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Contraseña</Label>
                        <a href="/reset-password" className="text-sm text-blue-900 hover:underline">
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cargando
                        </>
                      ) : (
                        "Iniciar sesión"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Auth;
