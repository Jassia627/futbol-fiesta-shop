import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const MisionVision = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-orange-500 to-blue-900 bg-clip-text text-transparent">
            Misión y Visión
          </h1>
          
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Visión</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Ser la empresa líder en diseño y distribución de uniformes de fútbol personalizados en Colombia, 
              reconocida por su innovación, calidad y compromiso con el desarrollo del deporte a nivel amateur y profesional.
            </p>
            
            <div className="border-t border-gray-200 my-8"></div>
            
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Misión</h2>
            <p className="text-gray-700 leading-relaxed">
              En KbSport3 nos dedicamos a vender uniformes de fútbol únicos y de alta calidad que reflejan 
              la identidad de cada equipo. Nos enfocamos en brindar un servicio ágil, personalizado y accesible, 
              apoyándonos en herramientas tecnológicas para ofrecer una experiencia de compra moderna y dinámica.
            </p>
          </div>
          
          <div className="flex justify-center">
            <img 
              src="/kb.jpg" 
              alt="KB Sports Logo" 
              className="h-32 w-32 rounded-full object-cover shadow-lg" 
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MisionVision;
