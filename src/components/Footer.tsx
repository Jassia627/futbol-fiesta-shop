
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">KB-SPORT3</h3>
            <p className="mb-4">
              
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/share/1DGXQiZyUw/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="h-5 w-5 hover:text-orange-500" />
              </a>
              
              <a href="https://instagram.com/kb_sport3?igshid=OGQ5ZDc2ODk2ZA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
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
                  
                </Link>
              </li>
              <li>
                <Link to="/equipos" className="hover:text-orange-500 transition-colors">
                  
                </Link>
              </li>
            </ul>
          </div>
          
        
          <div>
            <h3 className="text-xl font-bold mb-4">Contacto</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                3015318600
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                dflorezpimienta@gmial.com
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-blue-800 mt-8 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} KB-SPORT3. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
