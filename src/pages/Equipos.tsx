
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Equipos = () => {
  const [equipos, setEquipos] = useState([]);
  const [ligas, setLigas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ligaFilter, setLigaFilter] = useState("todas");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch equipos with liga info
      const { data: equiposData, error: equiposError } = await supabase
        .from("equipos")
        .select(`
          *,
          liga:liga_id (
            id,
            nombre
          )
        `)
        .order("nombre");
        
      if (equiposError) throw equiposError;
      setEquipos(equiposData || []);
      
      // Fetch ligas for filter
      const { data: ligasData, error: ligasError } = await supabase
        .from("ligas")
        .select("id, nombre")
        .order("nombre");
        
      if (ligasError) throw ligasError;
      setLigas(ligasData || []);
    } catch (error) {
      console.error("Error al cargar equipos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los equipos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipos = equipos.filter(equipo => {
    const matchesSearch = equipo.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLiga = ligaFilter === "todas" || equipo.liga_id === ligaFilter;
    
    return matchesSearch && matchesLiga;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Equipos de Fútbol</h1>
            <p className="text-gray-600">Encuentra productos de tu equipo favorito</p>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar equipo..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="md:w-64">
            <Select 
              value={ligaFilter}
              onValueChange={setLigaFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por liga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las ligas</SelectItem>
                {ligas.map((liga) => (
                  <SelectItem key={liga.id} value={liga.id}>
                    {liga.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredEquipos.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No se encontraron equipos que coincidan con tu búsqueda.</p>
              </div>
            ) : (
              filteredEquipos.map((equipo) => (
                <Link to={`/equipo/${equipo.id}`} key={equipo.id}>
                  <Card className="h-full transition-all hover:shadow-md">
                    <CardContent className="p-4 flex flex-col items-center">
                      {equipo.logo ? (
                        <img 
                          src={equipo.logo} 
                          alt={equipo.nombre} 
                          className="h-20 w-20 object-contain mb-3"
                        />
                      ) : (
                        <div className="h-20 w-20 flex items-center justify-center bg-gray-100 rounded-full mb-3">
                          <span className="text-2xl font-bold text-gray-400">
                            {equipo.nombre.charAt(0)}
                          </span>
                        </div>
                      )}
                      <h2 className="text-sm font-semibold text-center">{equipo.nombre}</h2>
                      {equipo.liga && (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          {equipo.liga.nombre}
                        </p>
                      )}
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

export default Equipos;
