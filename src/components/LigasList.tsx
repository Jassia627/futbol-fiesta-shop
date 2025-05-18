
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";

const LigasList = () => {
  const [ligas, setLigas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLigas = async () => {
      try {
        const { data, error } = await supabase
          .from("ligas")
          .select("*");

        if (error) {
          throw error;
        }

        setLigas(data || []);
      } catch (error) {
        console.error("Error al cargar ligas:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las ligas.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLigas();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg p-4 h-32 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {ligas.map((liga) => (
        <Link to={`/ligas/${liga.id}`} key={liga.id}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center justify-center p-4 h-32">
              <div className="w-16 h-16 mb-2">
                <img 
                  src={liga.logo || "/placeholder.svg"} 
                  alt={liga.nombre} 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="font-medium text-center">{liga.nombre}</h3>
              <p className="text-xs text-gray-500">{liga.pais}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default LigasList;
