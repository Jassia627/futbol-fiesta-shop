
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ProductoDestacado = ({ producto }) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="aspect-square overflow-hidden">
        <img 
          src={producto.imagen || "/placeholder.svg"} 
          alt={producto.nombre} 
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-2">{producto.nombre}</h3>
        </div>
        <p className="text-blue-900 font-bold text-xl">${producto.precio.toFixed(2)}</p>
        <p className="text-gray-500 text-sm">{producto.equipo || producto.categoria}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button variant="outline" asChild>
          <Link to={`/productos/${producto.id}`}>Ver detalles</Link>
        </Button>
        <Button className="bg-orange-500 hover:bg-orange-600">
          Añadir al carrito
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductoDestacado;
