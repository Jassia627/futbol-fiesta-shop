
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import ProductoCard from "@/components/ProductoCard";

const EquipoDetalle = () => {
  const { id } = useParams();
  const [equipo, setEquipo] = useState(null);
  const [liga, setLiga] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchEquipoData();
    }
  }, [id]);

  const fetchEquipoData = async () => {
    try {
      setLoading(true);
      
      // Fetch equipo details with liga info
      const { data: equipoData, error: equipoError } = await supabase
        .from("equipos")
        .select(`
          *,
          liga:liga_id (
            id,
            nombre,
            pais
          )
        `)
        .eq("id", id)
        .single();
        
      if (equipoError) throw equipoError;
      setEquipo(equipoData);
      setLiga(equipoData.liga);
      
      // Fetch products for this equipo
      const { data: productosData, error: productosError } = await supabase
        .from("productos")
        .select("*")
        .eq("equipo", equipoData.nombre)
        .order("created_at", { ascending: false });
        
      if (productosError) throw productosError;
      setProductos(productosData || []);
    } catch (error) {
      console.error("Error al cargar datos del equipo:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del equipo",
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

  if (!equipo) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 flex-1">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Equipo no encontrado</h1>
            <p className="text-gray-600 mb-6">El equipo que estás buscando no existe o no está disponible.</p>
            <Button 
              asChild
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Link to="/equipos">Volver a equipos</Link>
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
        <div className="mb-8">
          <Button 
            asChild
            variant="ghost"
            className="mb-4"
          >
            <Link to="/equipos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a equipos
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {equipo.logo ? (
              <img 
                src={equipo.logo} 
                alt={equipo.nombre} 
                className="w-28 h-28 object-contain"
              />
            ) : (
              <div className="w-28 h-28 flex items-center justify-center bg-gray-100 rounded-full">
                <span className="text-5xl font-bold text-gray-400">
                  {equipo.nombre.charAt(0)}
                </span>
              </div>
            )}
            
            <div>
              <h1 className="text-3xl font-bold text-blue-900">{equipo.nombre}</h1>
              {liga && (
                <div className="flex items-center mt-2">
                  <Link 
                    to={`/liga/${liga.id}`}
                    className="text-orange-500 hover:underline"
                  >
                    {liga.nombre}
                  </Link>
                  {liga.pais && (
                    <span className="text-gray-600 ml-2">
                      • {liga.pais}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Productos del equipo */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Productos de {equipo.nombre}</h2>
            <Button 
              asChild
              variant="ghost"
              className="text-orange-500 hover:text-orange-600"
            >
              <Link to={`/productos?equipo=${encodeURIComponent(equipo.nombre)}`}>
                Ver todos
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {productos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">
                No hay productos disponibles para este equipo.
              </p>
              <Button 
                asChild
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Link to="/productos">Ver todos los productos</Link>
              </Button>
            </div>
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

export default EquipoDetalle;
