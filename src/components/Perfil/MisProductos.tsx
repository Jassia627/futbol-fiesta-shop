
import { useState, useEffect, useRef } from "react";
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
import { Edit2, Trash2, Upload, Image as ImageIcon, Loader2, Plus } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const MisProductos = ({ userId }) => {
  // Definimos una interfaz para el producto que incluye el campo activo
  interface Producto {
    id: string;
    nombre: string;
    descripcion?: string;
    precio: number;
    stock: number;
    imagen?: string;
    categoria?: string;
    liga?: string;
    equipo?: string;
    destacado?: boolean;
    activo?: boolean;
    created_at?: string;
    updated_at?: string;
  }
  
  // Interfaz para las tallas
  interface Talla {
    id?: string;
    producto_id?: string;
    talla: string;
    cantidad: string;
    created_at?: string;
    updated_at?: string;
  }

  const fileInputRef = useRef(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    imagen: "",
    categoria: "",
    liga: "",
    equipo: "",
    destacado: false,
    activo: true,
    tieneTallas: false,
  });
  
  // Estado para manejar las tallas y sus cantidades
  const [tallas, setTallas] = useState<Talla[]>([
    { talla: "", cantidad: "" }
  ]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
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
  
  // Tallas comunes para productos de fútbol
  const tallasComunes = [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "XXXL",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "Único"
  ];
  
  // Manejar cambios en las tallas
  const handleTallaChange = (index, field, value) => {
    const newTallas = [...tallas];
    newTallas[index][field] = value;
    setTallas(newTallas);
  };
  
  // Añadir una nueva talla
  const addTalla = () => {
    setTallas([...tallas, { talla: "", cantidad: "" }]);
  };
  
  // Eliminar una talla
  const removeTalla = (index) => {
    if (tallas.length > 1) {
      const newTallas = tallas.filter((_, i) => i !== index);
      setTallas(newTallas);
    } else {
      // Si es la última talla, solo limpiarla
      setTallas([{ talla: "", cantidad: "" }]);
    }
  };

  const openEditDialog = async (producto: Producto) => {
    setEditingProducto(producto);
    setFormData({
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      precio: producto.precio.toString(),
      stock: producto.stock.toString(),
      imagen: producto.imagen || "",
      categoria: producto.categoria || "",
      liga: producto.liga || "",
      equipo: producto.equipo || "",
      destacado: producto.destacado || false,
      activo: producto.activo !== false, // Si no existe el campo, asumimos que está activo
      tieneTallas: false, // Se actualizará después de verificar si tiene tallas
    });
    
    // Si el producto tiene una imagen, establecerla como vista previa
    if (producto.imagen) {
      setImagePreview(producto.imagen);
    } else {
      setImagePreview("");
    }
    
    // Cargar las tallas del producto
    try {
      const { data: tallasData, error } = await supabase
        .from("tallas")
        .select("*")
        .eq("producto_id", producto.id);
        
      if (error) throw error;
      
      if (tallasData && tallasData.length > 0) {
        // Formatear las tallas para el estado
        const formattedTallas = tallasData.map(t => ({
          id: t.id,
          producto_id: t.producto_id,
          talla: t.talla,
          cantidad: t.cantidad.toString()
        }));
        
        setTallas(formattedTallas);
        setFormData(prev => ({ ...prev, tieneTallas: true }));
      } else {
        // Si no tiene tallas, inicializar con una vacía
        setTallas([{ talla: "", cantidad: "" }]);
        setFormData(prev => ({ ...prev, tieneTallas: false }));
      }
    } catch (error) {
      console.error("Error al cargar tallas:", error);
      // Si hay error, inicializar con una talla vacía
      setTallas([{ talla: "", cantidad: "" }]);
    }
    
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido",
        variant: "destructive",
      });
      return;
    }
    
    // Limitar tamaño a 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar los 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setImageFile(file);
    
    // Crear una vista previa de la imagen
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setImagePreview(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!imageFile) return null;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Crear un nombre único para el archivo
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      // Intentar con diferentes buckets que podrían existir en Supabase
      const bucketOptions = ['imagenes', 'images', 'storage', 'public', 'bucket'];
      let uploadedUrl = null;
      
      // Intentar con cada bucket hasta que uno funcione
      for (const bucket of bucketOptions) {
        try {
          const filePath = `productos/${fileName}`;
          
          // Subir la imagen a Supabase Storage
          const { error: uploadError, data } = await supabase.storage
            .from(bucket)
            .upload(filePath, imageFile, {
              cacheControl: '3600',
              upsert: false
            });
          
          // Si no hay error, obtener la URL pública
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);
            
            uploadedUrl = publicUrl;
            console.log(`Imagen subida exitosamente al bucket: ${bucket}`);
            break; // Salir del bucle si la carga fue exitosa
          }
        } catch (bucketError) {
          console.log(`Intento fallido con bucket: ${bucket}`, bucketError);
          // Continuar con el siguiente bucket
        }
      }
      
      // Actualizar progreso
      setUploadProgress(100);
      
      // Si no se pudo subir a ningún bucket, intentar con una alternativa
      if (!uploadedUrl) {
        // Convertir la imagen a base64 para almacenarla directamente
        return await convertImageToBase64(imageFile);
      }
      
      return uploadedUrl;
    } catch (error) {
      console.error("Error al subir imagen:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Función auxiliar para convertir imagen a base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('No se pudo convertir la imagen a base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Mostrar mensaje de carga
      toast({
        title: "Actualizando producto",
        description: "Por favor espera mientras se actualiza el producto...",
      });
      
      // Primero subir la imagen si existe
      let imageUrl = formData.imagen; // Mantener la URL actual si no hay nueva imagen
      
      if (imageFile) {
        // Subir la imagen y obtener la URL
        imageUrl = await handleImageUpload();
        
        // Si no se pudo subir la imagen pero tenemos una vista previa, usar la vista previa
        if (!imageUrl && imagePreview) {
          console.log("Usando vista previa como alternativa");
          imageUrl = imagePreview;
        }
      }
      
      const productoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        // Si tiene tallas, el stock total será la suma de las cantidades de cada talla
        stock: formData.tieneTallas 
          ? tallas.reduce((total, t) => total + (parseInt(t.cantidad) || 0), 0)
          : parseInt(formData.stock),
        imagen: imageUrl, // Usar la URL de la imagen subida
        categoria: formData.categoria,
        liga: formData.liga,
        equipo: formData.equipo,
        destacado: formData.destacado,
        activo: formData.activo,
      };

      const { error } = await supabase
        .from("productos")
        .update(productoData)
        .eq("id", formData.id);

      if (error) throw error;
      
      // Si el producto tiene tallas, actualizar las tallas
      if (formData.tieneTallas) {
        // Filtrar tallas vacías
        const tallasValidas = tallas.filter(t => t.talla && t.cantidad);
        
        if (tallasValidas.length > 0) {
          // Primero eliminar todas las tallas existentes del producto
          const { error: deleteError } = await supabase
            .from("tallas")
            .delete()
            .eq("producto_id", formData.id);
          
          if (deleteError) {
            console.error("Error al eliminar tallas existentes:", deleteError);
            throw deleteError;
          }
          
          // Preparar los datos de tallas para insertar
          const tallasData = tallasValidas.map(t => ({
            producto_id: formData.id,
            talla: t.talla,
            cantidad: parseInt(t.cantidad) || 0
          }));
          
          // Insertar las nuevas tallas
          const { error: tallasError } = await supabase
            .from("tallas")
            .insert(tallasData);
          
          if (tallasError) {
            console.error("Error al guardar tallas:", tallasError);
            toast({
              title: "Advertencia",
              description: "El producto se actualizó, pero hubo un problema al guardar las tallas",
              variant: "warning",
            });
          }
        }
      } else {
        // Si el producto no tiene tallas, eliminar todas las tallas existentes
        const { error: deleteError } = await supabase
          .from("tallas")
          .delete()
          .eq("producto_id", formData.id);
        
        if (deleteError) {
          console.error("Error al eliminar tallas existentes:", deleteError);
        }
      }
      
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

  // La interfaz Producto ya está definida al inicio del componente

  const toggleProductoActivo = async (producto: Producto) => {
    try {
      const nuevoEstado = !producto.activo;
      
      const { error } = await supabase
        .from("productos")
        .update({ activo: nuevoEstado })
        .eq("id", producto.id);

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: nuevoEstado 
          ? "Producto activado correctamente" 
          : "Producto desactivado correctamente",
      });
      
      fetchProductos();
    } catch (error) {
      console.error("Error al cambiar estado del producto:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del producto",
        variant: "destructive",
      });
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
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.map((producto) => (
                  <TableRow key={producto.id} className={producto.activo === false ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                    <TableCell>${producto.precio.toFixed(2)}</TableCell>
                    <TableCell>{producto.stock}</TableCell>
                    <TableCell>{producto.categoria || "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${producto.activo !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {producto.activo !== false ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
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
                          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                              <DialogTitle>Editar producto</DialogTitle>
                              <DialogDescription>
                                Modifica la información de tu producto
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-4 flex-1 overflow-y-auto pr-1">
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
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Checkbox 
                                      id="tieneTallas"
                                      name="tieneTallas"
                                      checked={formData.tieneTallas}
                                      onCheckedChange={(checked) => 
                                        setFormData({...formData, tieneTallas: !!checked})
                                      }
                                    />
                                    <Label htmlFor="tieneTallas" className="cursor-pointer">
                                      Este producto tiene tallas
                                    </Label>
                                  </div>
                                  
                                  {!formData.tieneTallas ? (
                                    <>
                                      <Label htmlFor="stock">Stock</Label>
                                      <Input
                                        id="stock"
                                        name="stock"
                                        type="number"
                                        value={formData.stock}
                                        onChange={handleChange}
                                        required={!formData.tieneTallas}
                                      />
                                    </>
                                  ) : null}
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
                              <div className="space-y-4">
                                <Label>Imagen del producto</Label>
                                
                                {/* Vista previa de la imagen */}
                                {imagePreview ? (
                                  <div className="relative w-full h-48 border rounded-md overflow-hidden mb-2">
                                    <img 
                                      src={imagePreview} 
                                      alt="Vista previa" 
                                      className="w-full h-full object-contain"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute top-2 right-2"
                                      onClick={() => {
                                        setImagePreview("");
                                        setImageFile(null);
                                        setFormData({...formData, imagen: ""});
                                      }}
                                    >
                                      Eliminar
                                    </Button>
                                  </div>
                                ) : (
                                  <div 
                                    className="w-full h-48 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Haz clic para seleccionar una imagen</p>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG o WEBP (máx. 5MB)</p>
                                  </div>
                                )}
                                
                                {/* Input oculto para seleccionar archivo */}
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                />
                                
                                {/* Barra de progreso para la carga */}
                                {isUploading && (
                                  <div className="space-y-2">
                                    <Progress value={uploadProgress} className="h-2" />
                                    <p className="text-xs text-center text-gray-500">{uploadProgress}% completado</p>
                                  </div>
                                )}
                              </div>
                              {formData.tieneTallas && (
                                <div className="space-y-4 border rounded-md p-4">
                                  <div className="flex justify-between items-center">
                                    <h3 className="font-medium">Tallas y cantidades</h3>
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm"
                                      onClick={addTalla}
                                    >
                                      <Plus className="h-4 w-4 mr-1" /> Añadir talla
                                    </Button>
                                  </div>
                                  
                                  <Separator />
                                  
                                  {tallas.map((tallaItem, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                      <div className="col-span-5">
                                        <Select
                                          value={tallaItem.talla}
                                          onValueChange={(value) => handleTallaChange(index, "talla", value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar talla" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {tallasComunes.map((t) => (
                                              <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="col-span-5">
                                        <Input
                                          type="number"
                                          placeholder="Cantidad"
                                          value={tallaItem.cantidad}
                                          onChange={(e) => handleTallaChange(index, "cantidad", e.target.value)}
                                          min="0"
                                        />
                                      </div>
                                      <div className="col-span-2 flex justify-end">
                                        <Button 
                                          type="button" 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => removeTalla(index)}
                                        >
                                          <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {tallas.length > 0 && tallas.some(t => t.talla && t.cantidad) && (
                                    <div className="mt-2">
                                      <p className="text-sm">Stock total: <Badge variant="outline">
                                        {tallas.reduce((total, t) => total + (parseInt(t.cantidad) || 0), 0)}
                                      </Badge></p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex flex-col space-y-4">
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
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="activo"
                                    checked={formData.activo}
                                    onCheckedChange={(checked: boolean) => 
                                      setFormData({...formData, activo: checked})
                                    }
                                  />
                                  <Label htmlFor="activo" className="cursor-pointer">
                                    Producto activo (visible en catálogo)
                                  </Label>
                                </div>
                              </div>
                              <div className="sticky bottom-0 pt-4 pb-2 bg-white border-t mt-4">
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
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="icon"
                          className={producto.activo !== false ? "text-red-500 border-red-200 hover:bg-red-50" : "text-green-500 border-green-200 hover:bg-green-50"}
                          onClick={() => toggleProductoActivo(producto)}
                          title={producto.activo !== false ? "Desactivar producto" : "Activar producto"}
                        >
                          {producto.activo !== false ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M18.6 18.6L12 12m0 0L5.4 5.4M12 12L5.4 18.6m6.6-6.6l6.6-6.6" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M5 12l5 5l10 -10" />
                            </svg>
                          )}
                        </Button>
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
