
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const MisProductos = ({ userId }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    imagen: "",
    categoria: "",
    liga: "",
    equipo: "",
    destacado: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProductos();
  }, [userId]);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const openEditDialog = (producto) => {
    setEditingProducto(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      precio: producto.precio.toString(),
      stock: producto.stock.toString(),
      imagen: producto.imagen || "",
      categoria: producto.categoria || "",
      liga: producto.liga || "",
      equipo: producto.equipo || "",
      destacado: producto.destacado || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        imagen: formData.imagen,
        categoria: formData.categoria,
        liga: formData.liga,
        equipo: formData.equipo,
        destacado: formData.destacado,
      };

      const { error } = await supabase
        .from("productos")
        .update(productoData)
        .eq("id", editingProducto.id);

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente",
      });
      
      setIsDialogOpen(false);
      fetchProductos();
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      try {
        const { error } = await supabase
          .from("productos")
          .delete()
          .eq("id", id);

        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Producto eliminado correctamente",
        });
        
        fetchProductos();
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto",
          variant: "destructive",
        });
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {productos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No tienes productos en tu catálogo.</p>
            <p className="text-sm text-gray-400 mt-2">
              Utiliza la pestaña "Agregar Producto" para añadir tu primer producto.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                    <TableCell>${producto.precio.toFixed(2)}</TableCell>
                    <TableCell>{producto.stock}</TableCell>
                    <TableCell>{producto.categoria || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(producto)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[550px]">
                            <DialogHeader>
                              <DialogTitle>Editar producto</DialogTitle>
                              <DialogDescription>
                                Modifica la información de tu producto
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="nombre">Nombre</Label>
                                  <Input
                                    id="nombre"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="precio">Precio</Label>
                                  <Input
                                    id="precio"
                                    name="precio"
                                    type="number"
                                    step="0.01"
                                    value={formData.precio}
                                    onChange={handleChange}
                                    required
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="descripcion">Descripción</Label>
                                <Textarea
                                  id="descripcion"
                                  name="descripcion"
                                  value={formData.descripcion}
                                  onChange={handleChange}
                                  rows={3}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="stock">Stock</Label>
                                  <Input
                                    id="stock"
                                    name="stock"
                                    type="number"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="categoria">Categoría</Label>
                                  <Select
                                    value={formData.categoria}
                                    onValueChange={(value) => handleSelectChange("categoria", value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="camisetas">Camisetas</SelectItem>
                                      <SelectItem value="shorts">Shorts</SelectItem>
                                      <SelectItem value="balones">Balones</SelectItem>
                                      <SelectItem value="accesorios">Accesorios</SelectItem>
                                      <SelectItem value="otros">Otros</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="liga">Liga</Label>
                                  <Input
                                    id="liga"
                                    name="liga"
                                    value={formData.liga}
                                    onChange={handleChange}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="equipo">Equipo</Label>
                                  <Input
                                    id="equipo"
                                    name="equipo"
                                    value={formData.equipo}
                                    onChange={handleChange}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="imagen">URL de imagen</Label>
                                <Input
                                  id="imagen"
                                  name="imagen"
                                  value={formData.imagen}
                                  onChange={handleChange}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="destacado"
                                  checked={formData.destacado}
                                  onCheckedChange={(checked) => 
                                    setFormData({...formData, destacado: checked})
                                  }
                                />
                                <Label htmlFor="destacado" className="cursor-pointer">
                                  Producto destacado
                                </Label>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button type="button" variant="outline">Cancelar</Button>
                                </DialogClose>
                                <Button 
                                  type="submit"
                                  className="bg-orange-500 hover:bg-orange-600"
                                >
                                  Actualizar
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => handleDelete(producto.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MisProductos;
