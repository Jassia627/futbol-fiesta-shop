
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Shield } from "lucide-react";
import ProductoCard from "@/components/ProductoCard";

const LigaDetalle = () => {
  const { id } = useParams();
  const [liga, setLiga] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchLigaData();
    }
  }, [id]);

  const fetchLigaData = async () => {
    try {
      setLoading(true);
      
      // Fetch liga details
      const { data: ligaData, error: ligaError } = await supabase
        .from("ligas")
        .select("*")
        .eq("id", id)
        .single();
        
      if (ligaError) throw ligaError;
      setLiga(ligaData);
      
      // Fetch teams for this liga
      const { data: equiposData, error: equiposError } = await supabase
        .from("equipos")
        .select("*")
        .eq("liga_id", id)
        .order("nombre");
        
      if (equiposError) throw equiposError;
      setEquipos(equiposData || []);
      
      // Fetch products for this liga
      const { data: productosData, error: productosError } = await supabase
        .from("productos")
        .select("*")
        .eq("liga", ligaData.nombre)
        .order("created_at", { ascending: false })
        .limit(8);
        
      if (productosError) throw productosError;
      setProductos(productosData || []);
    } catch (error) {
      console.error("Error al cargar datos de la liga:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la liga",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!liga) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 flex-1">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Liga no encontrada</h1>
            <p className="text-gray-600 mb-6">La liga que estás buscando no existe o no está disponible.</p>
            <Button 
              asChild
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Link to="/ligas">Volver a ligas</Link>
            </Button>
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
        <div className="mb-4">
          <Button 
            asChild
            variant="ghost"
            className="mb-4"
          >
            <Link to="/ligas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a ligas
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
            {liga.logo ? (
              <img 
                src={liga.logo} 
                alt={liga.nombre} 
                className="w-24 h-24 object-contain"
              />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-full">
                <span className="text-4xl font-bold text-gray-400">
                  {liga.nombre.charAt(0)}
                </span>
              </div>
            )}
            
            <div>
              <h1 className="text-3xl font-bold text-blue-900">{liga.nombre}</h1>
              {liga.pais && (
                <p className="text-gray-600">{liga.pais}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Equipos de la liga */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Equipos
            </h2>
            <Button 
              asChild
              variant="ghost"
              className="text-orange-500 hover:text-orange-600"
            >
              <Link to="/equipos">
                Ver todos los equipos
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {equipos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay equipos registrados en esta liga.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {equipos.map((equipo) => (
                <Link to={`/equipo/${equipo.id}`} key={equipo.id}>
                  <Card className="h-full transition-all hover:shadow-md hover:scale-105">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      {equipo.logo ? (
                        <img 
                          src={equipo.logo} 
                          alt={equipo.nombre} 
                          className="h-16 w-16 object-contain mb-2"
                        />
                      ) : (
                        <div className="h-16 w-16 flex items-center justify-center bg-gray-100 rounded-full mb-2">
                          <span className="text-xl font-bold text-gray-400">
                            {equipo.nombre.charAt(0)}
                          </span>
                        </div>
                      )}
                      <h3 className="text-sm font-medium text-center line-clamp-2">
                        {equipo.nombre}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Productos de la liga */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Productos de {liga.nombre}</h2>
            <Button 
              asChild
              variant="ghost"
              className="text-orange-500 hover:text-orange-600"
            >
              <Link to={`/productos?liga=${encodeURIComponent(liga.nombre)}`}>
                Ver todos
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {productos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No hay productos disponibles para esta liga.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productos.map((producto) => (
                <ProductoCard key={producto.id} producto={producto} />
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default LigaDetalle;
