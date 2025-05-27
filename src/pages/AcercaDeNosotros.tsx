import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AcercaDeNosotros = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-orange-500 to-blue-900 bg-clip-text text-transparent">
            Acerca de Nosotros
          </h1>
          
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex justify-center mb-8">
              <img 
                src="/kb.jpg" 
                alt="KB Sports Logo" 
                className="h-32 w-32 rounded-full object-cover shadow-lg" 
              />
            </div>
            
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-4">
                KbSport3 nace en el año 2023 como el reflejo de la pasión, el esfuerzo y el espíritu emprendedor 
                de un joven soñador. Mi nombre es Daniel Florez, soy oriundo de Astrea, Cesar, y actualmente curso 
                la carrera de Ingeniería de Sistemas. Desde mi primer semestre universitario en Valledupar, inicié 
                este proyecto con el objetivo de solventar mis gastos de estudio y estadía, confiando plenamente en 
                Dios y en el poder del trabajo honesto.
              </p>
              
              <p className="mb-4">
                KbSport3 se ha consolidado como una marca comprometida con el diseño, confección y comercialización 
                de uniformes de fútbol personalizados, ofreciendo calidad, estilo e identidad a cada equipo. Más que 
                una empresa, somos un proyecto de vida que crece con dedicación, innovación y amor por el deporte.
              </p>
              
              <p className="mb-4">
                Gracias al respaldo de nuestros clientes y a la bendición de Dios, este emprendimiento no solo ha sido 
                un sustento, sino también una oportunidad para crecer profesional y personalmente. En KbSport3 seguimos 
                avanzando, con la mirada puesta en el futuro y los pies firmes en nuestros valores.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AcercaDeNosotros;
