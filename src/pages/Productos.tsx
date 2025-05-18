
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductoCard from "@/components/ProductoCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ligas, setLigas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtros, setFiltros] = useState({
    liga: "",
    categoria: "",
    precioMin: "",
    precioMax: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setIsLoading(true);
        
        let query = supabase.from("productos").select("*");
        
        // Aplicar filtros
        if (searchTerm) {
          query = query.ilike("nombre", `%${searchTerm}%`);
        }
        
        if (filtros.liga) {
          query = query.eq("liga", filtros.liga);
        }
        
        if (filtros.categoria) {
          query = query.eq("categoria", filtros.categoria);
        }
        
        if (filtros.precioMin) {
          query = query.gte("precio", parseFloat(filtros.precioMin));
        }
        
        if (filtros.precioMax) {
          query = query.lte("precio", parseFloat(filtros.precioMax));
        }
        
        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setProductos(data || []);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchFiltros = async () => {
      try {
        // Obtener productos primero para extraer categorías
        const { data: productosData, error: productosError } = await supabase
          .from("productos")
          .select("categoria, liga");
          
        if (productosError) throw productosError;
        
        // Extraer categorías únicas de los productos
        const categoriasUnicas = [...new Set(productosData
          .map(producto => producto.categoria)
          .filter(categoria => categoria)
        )];
        
        setCategorias(categoriasUnicas);
        
        // Extraer ligas únicas de los productos
        const ligasUnicas = [...new Set(productosData
          .map(producto => producto.liga)
          .filter(liga => liga)
        )];
        
        setLigas(ligasUnicas);
      } catch (error) {
        console.error("Error al cargar filtros:", error);
        toast({
          title: "Advertencia",
          description: "No se pudieron cargar algunos filtros.",
          variant: "default",
        });
      }
    };

    fetchProductos();
    fetchFiltros();
  }, [toast, searchTerm, filtros]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };
  
  const limpiarFiltros = () => {
    setFiltros({
      liga: "",
      categoria: "",
      precioMin: "",
      precioMax: "",
    });
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-8 text-blue-900">Catálogo de Productos</h1>
        
        {/* Buscador y filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Buscar productos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={limpiarFiltros}
              >
                <Filter size={16} />
                Limpiar filtros
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Liga</label>
              <Select
                value={filtros.liga}
                onValueChange={(value) => handleFiltroChange("liga", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las ligas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas-ligas">Todas las ligas</SelectItem>
                  {ligas.map((liga) => (
                    <SelectItem key={liga} value={liga}>
                      {liga}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Categoría</label>
              <Select
                value={filtros.categoria}
                onValueChange={(value) => handleFiltroChange("categoria", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas-categorias">Todas las categorías</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Precio mínimo (€)</label>
              <Input
                type="number"
                placeholder="Mínimo"
                value={filtros.precioMin}
                onChange={(e) => handleFiltroChange("precioMin", e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Precio máximo (€)</label>
              <Input
                type="number"
                placeholder="Máximo"
                value={filtros.precioMax}
                onChange={(e) => handleFiltroChange("precioMax", e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Productos */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg p-4 h-64 animate-pulse"></div>
            ))}
          </div>
        ) : productos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productos.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No se encontraron productos con los filtros seleccionados.
            </p>
            <Button 
              onClick={limpiarFiltros}
              className="mt-4 bg-orange-500 hover:bg-orange-600"
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Productos;
