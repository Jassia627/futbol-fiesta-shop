
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Download,
  Box,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalVentas: 0,
    totalPedidos: 0,
    totalProductos: 0,
    totalUsuarios: 0,
  });
  
  const [productosPopulares, setProductosPopulares] = useState([]);
  const [ventasPorMes, setVentasPorMes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Total productos
        const { data: productos, error: productosError } = await supabase
          .from("productos")
          .select("count");
          
        if (productosError) throw productosError;
        
        // Total pedidos
        const { data: pedidos, error: pedidosError } = await supabase
          .from("pedidos")
          .select("count");
          
        if (pedidosError) throw pedidosError;
        
        // Total ventas
        const { data: ventasData, error: ventasError } = await supabase
          .from("pedidos")
          .select("total");
          
        if (ventasError) throw ventasError;
        
        const totalVentas = ventasData?.reduce((acc, pedido) => acc + pedido.total, 0) || 0;
        
        // Total usuarios
        const { data: usuarios, error: usuariosError } = await supabase
          .from("perfiles")
          .select("count");
          
        if (usuariosError) throw usuariosError;
        
        setStats({
          totalVentas,
          totalPedidos: pedidos?.[0]?.count || 0,
          totalProductos: productos?.[0]?.count || 0,
          totalUsuarios: usuarios?.[0]?.count || 0,
        });
        
        // Productos más vendidos
        const { data: prodPopulares, error: prodPopularesError } = await supabase
          .from("pedido_items")
          .select(`
            producto_id,
            cantidad,
            productos:producto_id (nombre)
          `)
          .order("cantidad", { ascending: false })
          .limit(5);
          
        if (prodPopularesError) throw prodPopularesError;
        
        // Agrupar y sumar cantidades por producto
        const popularesAgrupados = prodPopulares.reduce((acc, item) => {
          const productoId = item.producto_id;
          
          if (!acc[productoId]) {
            acc[productoId] = {
              id: productoId,
              nombre: item.productos?.nombre || 'Producto desconocido',
              cantidad: 0
            };
          }
          
          acc[productoId].cantidad += item.cantidad;
          return acc;
        }, {});
        
        setProductosPopulares(Object.values(popularesAgrupados));
        
        // Datos para gráficos (datos de ejemplo por ahora)
        // En una aplicación real, esto vendría de agregaciones en la base de datos
        const ventasMensuales = [
          { mes: "Ene", ventas: 4500 },
          { mes: "Feb", ventas: 3800 },
          { mes: "Mar", ventas: 5200 },
          { mes: "Abr", ventas: 4800 },
          { mes: "May", ventas: 6000 },
          { mes: "Jun", ventas: 5300 }
        ];
        
        setVentasPorMes(ventasMensuales);
        
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const exportarDatos = () => {
    // Función para exportar datos a CSV (ejemplo simple)
    const csvData = [
      ["ID", "Nombre", "Precio", "Stock", "Categoría"],
      // Aquí irían los datos de productos
    ];
    
    const csvContent = csvData.map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "productos.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{stats.totalVentas.toFixed(2)}</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  +10.5% desde el mes anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPedidos}</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  +5.2% desde el mes anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Productos</CardTitle>
                <Box className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProductos}</div>
                <p className="text-xs text-red-500 flex items-center mt-1">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  -2.5% desde el mes anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                <Users className="h-4 w-4 text-blue-900" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  +8.1% desde el mes anterior
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Ventas Mensuales</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ventasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ventas" 
                      stroke="#f97316" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productosPopulares}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cantidad" fill="#1e3a8a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Exportar datos */}
          <div className="flex justify-end">
            <Button 
              onClick={exportarDatos}
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Exportar datos
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
