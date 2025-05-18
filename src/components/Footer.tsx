
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Fútbol Fiesta Shop</h3>
            <p className="mb-4">
              Tu tienda especializada en productos de fútbol. Equipaciones oficiales, 
              balones y accesorios de tus equipos favoritos.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="h-5 w-5 hover:text-orange-500" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter className="h-5 w-5 hover:text-orange-500" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="h-5 w-5 hover:text-orange-500" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Enlaces</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-orange-500 transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/productos" className="hover:text-orange-500 transition-colors">
                  Productos
                </Link>
              </li>
              <li>
                <Link to="/ligas" className="hover:text-orange-500 transition-colors">
                  Ligas
                </Link>
              </li>
              <li>
                <Link to="/equipos" className="hover:text-orange-500 transition-colors">
                  Equipos
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Ayuda</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/envios" className="hover:text-orange-500 transition-colors">
                  Envíos
                </Link>
              </li>
              <li>
                <Link to="/devoluciones" className="hover:text-orange-500 transition-colors">
                  Devoluciones
                </Link>
              </li>
              <li>
                <Link to="/preguntas-frecuentes" className="hover:text-orange-500 transition-colors">
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-orange-500 transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Contacto</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                +34 91 234 56 78
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                info@futbolfiestashop.com
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-blue-800 mt-8 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} Fútbol Fiesta Shop. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
