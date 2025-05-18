
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Ligas = () => {
  const [ligas, setLigas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchLigas();
  }, []);

  const fetchLigas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ligas")
        .select("*")
        .order("nombre");

      if (error) throw error;
      setLigas(data || []);
    } catch (error) {
      console.error("Error al cargar ligas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las ligas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLigas = ligas.filter(liga => 
    liga.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (liga.pais && liga.pais.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Ligas de Fútbol</h1>
            <p className="text-gray-600">Explora productos por ligas y campeonatos</p>
          </div>
          
          <div className="relative max-w-sm mt-4 md:mt-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar liga..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLigas.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No se encontraron ligas que coincidan con tu búsqueda.</p>
              </div>
            ) : (
              filteredLigas.map((liga) => (
                <Link to={`/liga/${liga.id}`} key={liga.id}>
                  <Card className="h-full transition-all hover:shadow-md">
                    <CardContent className="p-6 flex flex-col items-center">
                      {liga.logo ? (
                        <img 
                          src={liga.logo} 
                          alt={liga.nombre} 
                          className="h-24 w-24 object-contain mb-4"
                        />
                      ) : (
                        <div className="h-24 w-24 flex items-center justify-center bg-gray-100 rounded-full mb-4">
                          <span className="text-3xl font-bold text-gray-400">
                            {liga.nombre.charAt(0)}
                          </span>
                        </div>
                      )}
                      <h2 className="text-xl font-semibold text-center">{liga.nombre}</h2>
                      {liga.pais && (
                        <p className="text-gray-500 text-sm mt-1">{liga.pais}</p>
                      )}
                      
                      <Button 
                        variant="outline"
                        className="mt-4 w-full border-orange-500 text-orange-500 hover:bg-orange-50"
                      >
                        Ver productos
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Ligas;
