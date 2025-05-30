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
import { Search, Filter, X, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ligas, setLigas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtros, setFiltros] = useState({
    liga: "",
    categoria: "",
    equipo: "",
    precioMin: "",
    precioMax: "",
    enStock: false,
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtrosDisponibles, setFiltrosDisponibles] = useState({
    totalProductos: 0,
    rangoPrecio: { min: 0, max: 0 }
  });
  
  const { toast } = useToast();

  // Función para construir la consulta con filtros
  const construirConsulta = () => {
    let query = supabase
      .from("productos")
      .select("*")
      .order("nombre", { ascending: true });

    // Filtro de búsqueda
    if (searchTerm.trim()) {
      query = query.or(`nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`);
    }

    // Filtros por categorías
    if (filtros.liga && filtros.liga !== "todas") {
      query = query.eq("liga", filtros.liga);
    }

    if (filtros.categoria && filtros.categoria !== "todas") {
      query = query.eq("categoria", filtros.categoria);
    }

    if (filtros.equipo && filtros.equipo !== "todos") {
      query = query.eq("equipo", filtros.equipo);
    }

    // Filtros de precio
    if (filtros.precioMin && !isNaN(parseFloat(filtros.precioMin))) {
      query = query.gte("precio", parseFloat(filtros.precioMin));
    }

    if (filtros.precioMax && !isNaN(parseFloat(filtros.precioMax))) {
      query = query.lte("precio", parseFloat(filtros.precioMax));
    }

    // Filtro de stock
    if (filtros.enStock) {
      query = query.gt("stock", 0);
    }

    return query;
  };

  // Cargar productos con filtros
  const fetchProductos = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await construirConsulta();
      
      if (error) throw error;
      
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

  // Cargar datos para filtros
  const fetchFiltrosDisponibles = async () => {
    try {
      const { data: productosData, error: productosError } = await supabase
        .from("productos")
        .select("categoria, liga, equipo, precio");
        
      if (productosError) throw productosError;

      // Extraer valores únicos para filtros
      const categoriasUnicas = [...new Set(productosData
        .map(producto => producto.categoria)
        .filter(categoria => categoria && categoria.trim() !== "")
      )].sort();
      
      const ligasUnicas = [...new Set(productosData
        .map(producto => producto.liga)
        .filter(liga => liga && liga.trim() !== "")
      )].sort();

      const equiposUnicos = [...new Set(productosData
        .map(producto => producto.equipo)
        .filter(equipo => equipo && equipo.trim() !== "")
      )].sort();

      // Calcular rango de precios
      const precios = productosData.map(p => p.precio).filter(p => p > 0);
      const precioMin = precios.length > 0 ? Math.min(...precios) : 0;
      const precioMax = precios.length > 0 ? Math.max(...precios) : 0;

      setCategorias(categoriasUnicas);
      setLigas(ligasUnicas);
      setEquipos(equiposUnicos);
      setFiltrosDisponibles({
        totalProductos: productosData.length,
        rangoPrecio: { min: precioMin, max: precioMax }
      });

    } catch (error) {
      console.error("Error al cargar filtros:", error);
      toast({
        title: "Advertencia",
        description: "No se pudieron cargar algunos filtros.",
        variant: "default",
      });
    }
  };

  // Efectos
  useEffect(() => {
    fetchFiltrosDisponibles();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProductos();
    }, 300); // Debounce para la búsqueda

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filtros]);

  // Handlers
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor === "todas" || valor === "todos" ? "" : valor
    }));
  };
  
  const limpiarFiltros = () => {
    setFiltros({
      liga: "",
      categoria: "",
      equipo: "",
      precioMin: "",
      precioMax: "",
      enStock: false,
    });
    setSearchTerm("");
  };

  const contarFiltrosActivos = () => {
    return Object.values(filtros).filter(valor => 
      valor !== "" && valor !== false
    ).length + (searchTerm ? 1 : 0);
  };

  const eliminarFiltro = (campo) => {
    if (campo === "search") {
      setSearchTerm("");
    } else {
      handleFiltroChange(campo, "");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Catálogo de Productos</h1>
            <p className="text-gray-600 mt-1">
              {isLoading ? "Cargando..." : `${productos.length} productos encontrados`}
            </p>
          </div>
          
          <Button 
            onClick={fetchProductos}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
        
        {/* Buscador y filtros */}
        <Card className="mb-8">
          <CardContent className="p-6">
            {/* Barra de búsqueda principal */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Buscar productos por nombre o descripción..."
                  className="pl-10 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant={mostrarFiltros ? "default" : "outline"}
                  className="flex items-center gap-2"
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                >
                  <Filter size={16} />
                  Filtros
                  {contarFiltrosActivos() > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {contarFiltrosActivos()}
                    </Badge>
                  )}
                </Button>
                
                {contarFiltrosActivos() > 0 && (
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-600"
                    onClick={limpiarFiltros}
                  >
                    <X size={16} />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
            
            {/* Panel de filtros */}
            {mostrarFiltros && (
              <div className="border-t pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {/* Filtro Liga */}
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-700">Liga</label>
                    <Select
                      value={filtros.liga || "todas"}
                      onValueChange={(value) => handleFiltroChange("liga", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las ligas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas las ligas</SelectItem>
                        {ligas.map((liga) => (
                          <SelectItem key={liga} value={liga}>
                            {liga}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Filtro Categoría */}
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-700">Categoría</label>
                    <Select
                      value={filtros.categoria || "todas"}
                      onValueChange={(value) => handleFiltroChange("categoria", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas las categorías</SelectItem>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro Equipo */}
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-700">Equipo</label>
                    <Select
                      value={filtros.equipo || "todos"}
                      onValueChange={(value) => handleFiltroChange("equipo", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los equipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los equipos</SelectItem>
                        {equipos.map((equipo) => (
                          <SelectItem key={equipo} value={equipo}>
                            {equipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Filtro Precio Mínimo */}
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-700">
                      Precio mínimo ($)
                    </label>
                    <Input
                      type="number"
                      placeholder={`Desde $${filtrosDisponibles.rangoPrecio.min}`}
                      value={filtros.precioMin}
                      onChange={(e) => handleFiltroChange("precioMin", e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  {/* Filtro Precio Máximo */}
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-700">
                      Precio máximo ($)
                    </label>
                    <Input
                      type="number"
                      placeholder={`Hasta $${filtrosDisponibles.rangoPrecio.max}`}
                      value={filtros.precioMax}
                      onChange={(e) => handleFiltroChange("precioMax", e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Filtro Stock */}
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filtros.enStock}
                        onChange={(e) => handleFiltroChange("enStock", e.target.checked)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Solo en stock</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Resumen de filtros activos */}
        {contarFiltrosActivos() > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-sm text-gray-500 font-medium">Filtros activos:</span>
            
            {searchTerm && (
              <Badge variant="outline" className="flex items-center gap-1">
                Búsqueda: "{searchTerm}"
                <button 
                  onClick={() => eliminarFiltro("search")} 
                  className="hover:text-red-500 ml-1"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}
            
            {filtros.liga && (
              <Badge variant="outline" className="flex items-center gap-1">
                Liga: {filtros.liga}
                <button 
                  onClick={() => eliminarFiltro("liga")} 
                  className="hover:text-red-500 ml-1"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}
            
            {filtros.categoria && (
              <Badge variant="outline" className="flex items-center gap-1">
                Categoría: {filtros.categoria}
                <button 
                  onClick={() => eliminarFiltro("categoria")} 
                  className="hover:text-red-500 ml-1"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}

            {filtros.equipo && (
              <Badge variant="outline" className="flex items-center gap-1">
                Equipo: {filtros.equipo}
                <button 
                  onClick={() => eliminarFiltro("equipo")} 
                  className="hover:text-red-500 ml-1"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}
            
            {filtros.precioMin && (
              <Badge variant="outline" className="flex items-center gap-1">
                Desde: ${filtros.precioMin}
                <button 
                  onClick={() => eliminarFiltro("precioMin")} 
                  className="hover:text-red-500 ml-1"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}
            
            {filtros.precioMax && (
              <Badge variant="outline" className="flex items-center gap-1">
                Hasta: ${filtros.precioMax}
                <button 
                  onClick={() => eliminarFiltro("precioMax")} 
                  className="hover:text-red-500 ml-1"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}

            {filtros.enStock && (
              <Badge variant="outline" className="flex items-center gap-1">
                Solo en stock
                <button 
                  onClick={() => eliminarFiltro("enStock")} 
                  className="hover:text-red-500 ml-1"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}
          </div>
        )}
        
        {/* Productos */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="bg-gray-200 h-48 animate-pulse"></div>
                <CardContent className="p-4">
                  <div className="bg-gray-200 h-4 rounded animate-pulse mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded animate-pulse w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : productos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {productos.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="max-w-md mx-auto">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-500 mb-4">
                  No hay productos que coincidan con los filtros seleccionados.
                </p>
                <Button 
                  onClick={limpiarFiltros}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Limpiar todos los filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Productos;
