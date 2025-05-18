
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductoDestacado from "@/components/ProductoDestacado";
import LigasList from "@/components/LigasList";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProductosDestacados = async () => {
      try {
        const { data, error } = await supabase
          .from("productos")
          .select("*")
          .eq("destacado", true)
          .limit(4);

        if (error) {
          throw error;
        }

        setProductosDestacados(data || []);
      } catch (error) {
        console.error("Error al cargar productos destacados:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos destacados.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductosDestacados();
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-blue-900 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Fútbol Fiesta Shop</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl">
            La mejor tienda para aficionados del fútbol. Encuentra camisetas, 
            balones y accesorios de tus equipos favoritos.
          </p>
          <a 
            href="/productos"
            className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-3 rounded-full font-medium text-lg transition-colors"
          >
            Ver Catálogo
          </a>
        </div>
      </div>
      
      {/* Productos Destacados */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-blue-900">Productos Destacados</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg p-4 h-64 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {productosDestacados.map((producto) => (
              <ProductoDestacado key={producto.id} producto={producto} />
            ))}
          </div>
        )}
      </section>
      
      <Separator className="my-8" />
      
      {/* Ligas */}
      <section className="container mx-auto px-4 py-12 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-8 text-blue-900">Explora por Ligas</h2>
        <LigasList />
      </section>
      
      {/* CTA */}
      <section className="bg-orange-500 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para vestir como un campeón?</h2>
          <p className="mb-8 text-xl">Regístrate ahora y obtén un 10% de descuento en tu primera compra.</p>
          <a 
            href="/auth"
            className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded-full font-medium text-lg inline-block transition-colors"
          >
            Crear Cuenta
          </a>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
