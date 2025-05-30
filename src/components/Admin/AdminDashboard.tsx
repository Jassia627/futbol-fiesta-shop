import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Download,
  Box,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalVentas: 0,
    totalPedidos: 0,
    totalProductos: 0,
    totalUsuarios: 0,
    pedidosPendientes: 0,
    pedidosEnviados: 0,
    pedidosCancelados: 0,
    productosConBajoStock: 0,
    ventasHoy: 0,
    ventasEsteMes: 0
  });
  
  const [productosPopulares, setProductosPopulares] = useState([]);
  const [ventasPorMes, setVentasPorMes] = useState([]);
  const [estadoPedidos, setEstadoPedidos] = useState([]);
  const [productosStock, setProductosStock] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener estadísticas principales
        const [
          productosResult,
          pedidosResult,
          ventasResult,
          usuariosResult,
          pedidosEstadoResult,
          ventasHoyResult,
          ventasMesResult
        ] = await Promise.all([
          // Total productos
          supabase.from("productos").select("*", { count: 'exact' }),
          
          // Total pedidos
          supabase.from("pedidos").select("*", { count: 'exact' }),
          
          // Total ventas
          supabase.from("pedidos").select("total"),
          
          // Total usuarios
          supabase.from("perfiles").select("*", { count: 'exact' }),
          
          // Pedidos por estado
          supabase.from("pedidos").select("estado"),
          
          // Ventas de hoy
          supabase
            .from("pedidos")
            .select("total")
            .gte("fecha_pedido", new Date().toISOString().split('T')[0]),
          
          // Ventas del mes
          supabase
            .from("pedidos")
            .select("total")
            .gte("fecha_pedido", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        ]);

        const totalVentas = ventasResult.data?.reduce((acc, pedido) => acc + pedido.total, 0) || 0;
        const ventasHoy = ventasHoyResult.data?.reduce((acc, pedido) => acc + pedido.total, 0) || 0;
        const ventasEsteMes = ventasMesResult.data?.reduce((acc, pedido) => acc + pedido.total, 0) || 0;
        
        // Contar productos con bajo stock (menos de 10)
        const productosConBajoStock = productosResult.data?.filter(p => p.stock < 10).length || 0;
        
        // Contar pedidos por estado
        const estadosCount: Record<string, number> = pedidosEstadoResult.data?.reduce((acc: Record<string, number>, pedido: any) => {
          acc[pedido.estado] = (acc[pedido.estado] || 0) + 1;
          return acc;
        }, {}) || {};

        setStats({
          totalVentas,
          totalPedidos: pedidosResult.count || 0,
          totalProductos: productosResult.count || 0,
          totalUsuarios: usuariosResult.count || 0,
          pedidosPendientes: estadosCount['pendiente'] || 0,
          pedidosEnviados: estadosCount['enviado'] || 0,
          pedidosCancelados: estadosCount['cancelado'] || 0,
          productosConBajoStock,
          ventasHoy,
          ventasEsteMes
        });

        // Datos para gráfico de estados de pedidos
        const estadosData = [
          { name: "Pendientes", value: estadosCount['pendiente'] || 0, color: "#fbbf24" },
          { name: "Enviados", value: estadosCount['enviado'] || 0, color: "#10b981" },
          { name: "Cancelados", value: estadosCount['cancelado'] || 0, color: "#ef4444" }
        ];
        setEstadoPedidos(estadosData);

        // Productos más vendidos
        const { data: itemsPedidos } = await supabase
          .from("pedido_items")
          .select(`
            producto_id,
            cantidad,
            productos:producto_id (nombre, precio, imagen)
          `);

        if (itemsPedidos) {
          const popularesAgrupados = itemsPedidos.reduce((acc: any, item: any) => {
            const productoId = item.producto_id;
            
            if (!acc[productoId]) {
              acc[productoId] = {
                id: productoId,
                nombre: item.productos?.nombre || 'Producto desconocido',
                precio: item.productos?.precio || 0,
                cantidad: 0,
                ingresos: 0
              };
            }
            
            acc[productoId].cantidad += item.cantidad || 0;
            acc[productoId].ingresos += (item.cantidad || 0) * (item.productos?.precio || 0);
            return acc;
          }, {});

          const sortedPopulares = Object.values(popularesAgrupados)
            .sort((a: any, b: any) => b.cantidad - a.cantidad)
            .slice(0, 6);

          setProductosPopulares(sortedPopulares);
        }

        // Productos con stock bajo para mostrar en el dashboard
        const stockBajo = productosResult.data
          ?.filter(p => p.stock < 10)
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 5) || [];
        
        setProductosStock(stockBajo);

        // Ventas por mes (últimos 6 meses)
        const ventasMensuales = [];
        for (let i = 5; i >= 0; i--) {
          const fecha = new Date();
          fecha.setMonth(fecha.getMonth() - i);
          const mesInicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
          const mesFin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
          
          const { data: ventasMes } = await supabase
            .from("pedidos")
            .select("total")
            .gte("fecha_pedido", mesInicio.toISOString())
            .lte("fecha_pedido", mesFin.toISOString());
          
          const totalMes = ventasMes?.reduce((acc, pedido) => acc + pedido.total, 0) || 0;
          
          ventasMensuales.push({
            mes: format(fecha, "MMM", { locale: es }),
            ventas: totalMes,
            pedidos: ventasMes?.length || 0
          });
        }
        
        setVentasPorMes(ventasMensuales);
        
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar algunos datos del dashboard",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);
  
  const exportarDatos = async () => {
    try {
      setIsExporting(true);
      
      // Obtener todos los datos necesarios
      const [productosData, pedidosData, usuariosData] = await Promise.all([
        supabase.from("productos").select("*"),
        supabase.from("pedidos").select(`
          *,
          pedido_items (
            cantidad,
            precio_unitario,
            productos (nombre)
          )
        `),
        supabase.from("perfiles").select("*")
      ]);

      // Crear datos para CSV de productos
      const productosCSV = [
        ["ID", "Nombre", "Precio", "Stock", "Categoría", "Liga", "Equipo", "Activo", "Destacado"]
      ];
      
      productosData.data?.forEach(producto => {
        productosCSV.push([
          producto.id,
          producto.nombre || "",
          (producto.precio || 0).toString(),
          (producto.stock || 0).toString(),
          producto.categoria || "",
          producto.liga || "",
          producto.equipo || "",
          "Sí", // Asumir que todos están activos por defecto
          producto.destacado ? "Sí" : "No"
        ]);
      });

      // Crear datos para CSV de pedidos
      const pedidosCSV = [
        ["ID", "Fecha", "Cliente", "Email", "Teléfono", "Estado", "Total", "Método Pago", "Dirección"]
      ];
      
      pedidosData.data?.forEach(pedido => {
        pedidosCSV.push([
          pedido.id,
          format(new Date(pedido.fecha_pedido), "dd/MM/yyyy HH:mm"),
          "Cliente", // Campo temporal hasta que esté disponible
          "", // Campo temporal hasta que esté disponible
          "", // Campo temporal hasta que esté disponible
          pedido.estado,
          pedido.total.toString(),
          pedido.metodo_pago || "",
          pedido.direccion_envio || ""
        ]);
      });

      // Crear datos para CSV de resumen
      const resumenCSV = [
        ["Métrica", "Valor"],
        ["Total de Ventas", `$${stats.totalVentas.toFixed(2)}`],
        ["Total de Pedidos", stats.totalPedidos],
        ["Total de Productos", stats.totalProductos],
        ["Total de Usuarios", stats.totalUsuarios],
        ["Pedidos Pendientes", stats.pedidosPendientes],
        ["Pedidos Enviados", stats.pedidosEnviados],
        ["Pedidos Cancelados", stats.pedidosCancelados],
        ["Productos con Bajo Stock", stats.productosConBajoStock],
        ["Ventas de Hoy", `$${stats.ventasHoy.toFixed(2)}`],
        ["Ventas Este Mes", `$${stats.ventasEsteMes.toFixed(2)}`]
      ];

      // Función para crear y descargar CSV
      const descargarCSV = (data, filename) => {
        const csvContent = data.map(row => 
          row.map(cell => `"${cell}"`).join(",")
        ).join("\n");
        
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      // Descargar los tres archivos
      descargarCSV(productosCSV, `productos_${format(new Date(), "yyyy-MM-dd")}.csv`);
      descargarCSV(pedidosCSV, `pedidos_${format(new Date(), "yyyy-MM-dd")}.csv`);
      descargarCSV(resumenCSV, `resumen_dashboard_${format(new Date(), "yyyy-MM-dd")}.csv`);

      toast({
        title: "Exportación exitosa",
        description: "Se han descargado 3 archivos: productos, pedidos y resumen",
      });

    } catch (error) {
      console.error("Error al exportar datos:", error);
      toast({
        title: "Error al exportar",
        description: "No se pudieron exportar todos los datos",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        <p className="text-gray-500">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h2>
          <p className="text-gray-500">Resumen general de la tienda KB-SPORT3</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={exportarDatos}
            disabled={isExporting}
            variant="outline" 
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                Exportando...
              </>
            ) : (
              <>
                <FileSpreadsheet size={16} />
                Exportar Datos
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">${stats.totalVentas.toFixed(2)}</div>
            <div className="text-xs text-green-600 mt-1">
              Hoy: ${stats.ventasHoy.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalPedidos}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {stats.pedidosPendientes} pendientes
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Productos</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.totalProductos}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {stats.productosConBajoStock} bajo stock
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.totalUsuarios}</div>
            <div className="text-xs text-purple-600 mt-1">
              Clientes registrados
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas de pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Pedidos Enviados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.pedidosEnviados}</div>
            <Progress value={(stats.pedidosEnviados / stats.totalPedidos) * 100} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              {((stats.pedidosEnviados / stats.totalPedidos) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pedidos Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pedidosPendientes}</div>
            <Progress value={(stats.pedidosPendientes / stats.totalPedidos) * 100} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              {((stats.pedidosPendientes / stats.totalPedidos) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Pedidos Cancelados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.pedidosCancelados}</div>
            <Progress value={(stats.pedidosCancelados / stats.totalPedidos) * 100} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              {((stats.pedidosCancelados / stats.totalPedidos) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ventas de los Últimos 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventasPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'ventas' ? `$${Number(value).toFixed(2)}` : value,
                    name === 'ventas' ? 'Ventas' : 'Pedidos'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  activeDot={{ r: 6, fill: "#f97316" }} 
                  name="Ventas ($)"
                />
                <Line 
                  type="monotone" 
                  dataKey="pedidos" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  activeDot={{ r: 4, fill: "#3b82f6" }} 
                  name="Pedidos"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Estado de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={estadoPedidos} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => [value, 'Cantidad']}
                  labelFormatter={(label) => `Estado: ${label}`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                >
                  {estadoPedidos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Productos populares y stock bajo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productosPopulares.map((producto, index) => (
                <div key={producto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{producto.nombre}</p>
                      <p className="text-xs text-gray-500">${producto.precio}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">{producto.cantidad}</p>
                    <p className="text-xs text-gray-500">vendidos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Productos con Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productosStock.length > 0 ? productosStock.map((producto) => (
                <div key={producto.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-sm">{producto.nombre}</p>
                    <p className="text-xs text-gray-500">{producto.categoria}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="text-xs">
                      {producto.stock} unidades
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500">Todos los productos tienen stock suficiente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
