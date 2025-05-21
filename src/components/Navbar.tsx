
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingCart, User, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [session, setSession] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user?.id) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    // Verificar sesión actual al cargar
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user?.id) {
        fetchUserRole(session.user.id);
      }
    };

    fetchSession();

    // Limpiar suscripción
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", userId)
        .single();

      if (error) {
        // Verificar si es el error específico de recursión infinita
        if (error.code === '42P17' && error.message?.includes('infinite recursion')) {
          console.warn("Error de recursión en políticas de perfiles, usando rol predeterminado");
          // Establecer un rol predeterminado para permitir que la aplicación funcione
          setUserRole("cliente");
          return;
        }
        throw error;
      }

      setUserRole(data?.rol || "cliente");
    } catch (error) {
      console.error("Error al obtener rol de usuario:", error);
      // Establecer un rol predeterminado en caso de cualquier error
      setUserRole("cliente");
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/kb.jpg" alt="KB Sports Logo" className="h-10 w-10 rounded-full object-cover" />
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-blue-900 bg-clip-text text-transparent">
              KB-SPORT3
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/productos" className="text-gray-700 hover:text-orange-500">
              Productos
            </Link>
            
            {/* Mostrar botón del carrito siempre */}
            <Link to="/carrito">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
            
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/admin-panel">Panel de usuario</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" className="bg-orange-500 hover:bg-orange-600">
                <Link to="/auth">Iniciar sesión</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {/* Mostrar botón del carrito siempre */}
            <Link to="/carrito" className="mr-2">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" onClick={toggleMenu} size="icon">
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3">
            <Link to="/productos" className="block text-gray-700 hover:text-orange-500 py-2">
              Productos
            </Link>
            
            {session ? (
              <>
                <Link to="/admin-panel" className="block text-gray-700 hover:text-orange-500 py-2">
                  Panel de usuario
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="block w-full text-left text-red-600 hover:text-red-800 py-2"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" className="w-full bg-orange-500 hover:bg-orange-600">
                  Iniciar sesión
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
