
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-9xl font-bold text-orange-500">404</h1>
          <h2 className="text-3xl font-bold text-blue-900 mt-4">Página no encontrada</h2>
          <p className="text-gray-600 mt-2">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
          <div className="mt-8">
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link to="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotFound;
