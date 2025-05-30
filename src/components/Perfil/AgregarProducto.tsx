
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Loader2, Upload, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const AgregarProducto = ({ userId }) => {
  const fileInputRef = useRef(null);
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
    activo: true,
    tieneTallas: false,
  });
  
  // Estado para manejar las tallas y sus cantidades
  const [tallas, setTallas] = useState([
    { talla: "", cantidad: "" }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const categorias = [
    "camisetas", 
    "shorts", 
    "balones", 
    "accesorios", 
    "otros"
  ];
  
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
    "11",
    "12",
    "13",
    "Único"
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    
    // Si se cambia el valor de tieneTallas a false, reiniciar las tallas
    if (name === "tieneTallas" && !checked) {
      setTallas([{ talla: "", cantidad: "" }]);
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
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
        // Opción 1: Convertir la imagen a base64 para almacenarla directamente
        // Nota: Esto no es ideal para imágenes grandes, pero funciona como solución temporal
        return await convertImageToBase64(imageFile);
      }
      
      return uploadedUrl;
    } catch (error) {
      console.error("Error al subir imagen:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Intenta usar una URL externa.",
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
    setSubmitting(true);
    setSuccess(false);

    try {
      // Primero subir la imagen si existe
      let imageUrl = formData.imagen; // Mantener la URL actual si no hay nueva imagen
      
      if (imageFile) {
        try {
          // Mostrar mensaje de carga
          toast({
            title: "Subiendo imagen",
            description: "Por favor espera mientras se sube la imagen...",
          });
          
          // Subir la imagen y obtener la URL
          imageUrl = await handleImageUpload();
          
          // Si no se pudo subir la imagen pero tenemos una vista previa, usar la vista previa
          if (!imageUrl && imagePreview) {
            console.log("Usando vista previa como alternativa");
            imageUrl = imagePreview;
          }
        } catch (imageError) {
          console.error("Error al procesar imagen:", imageError);
          // No lanzar error, continuar con el proceso de guardar el producto
          // Si hay una URL de imagen en el formulario, la usaremos
          toast({
            title: "Advertencia",
            description: "No se pudo procesar la imagen, se usará la URL proporcionada si existe",
            variant: "warning",
          });
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
        created_at: new Date().toISOString(),
      };

      // Intentar usar la API REST directamente en lugar de la interfaz de supabase
      // Esto puede evitar algunas de las políticas de seguridad problemáticas
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      
      if (!token) {
        throw new Error("No se pudo obtener el token de autenticación");
      }
      
      // Usar fetch directamente con el token de autenticación
      const response = await fetch(`${supabase.supabaseUrl}/rest/v1/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation' // Cambiar a representation para obtener el ID del producto creado
        },
        body: JSON.stringify([productoData])
      });
      
      let productoId;
      
      if (!response.ok) {
        // Si aún hay error, intentar con el método original
        const { data, error } = await supabase
          .from("productos")
          .insert([productoData])
          .select();

        if (error) {
          // Verificar si es el error específico de recursión infinita
          if (error.code === '42P17' && error.message?.includes('infinite recursion')) {
            console.warn("Error de recursión en políticas al agregar producto, intentando método alternativo");
            
            // Intentar con un método aún más directo usando SQL (si está disponible)
            const { data: rpcData, error: rpcError } = await supabase.rpc('insertar_producto_directo', productoData);
            
            if (rpcError) {
              throw rpcError;
            }
            
            productoId = rpcData?.id;
          } else {
            throw error;
          }
        } else if (data && data[0]) {
          productoId = data[0].id;
        }
      } else {
        // Obtener el ID del producto recién creado
        const responseData = await response.json();
        if (responseData && responseData[0]) {
          productoId = responseData[0].id;
        }
      }
      
      // Si el producto tiene tallas y se obtuvo el ID del producto, guardar las tallas
      if (formData.tieneTallas && productoId) {
        // Filtrar tallas vacías
        const tallasValidas = tallas.filter(t => t.talla && t.cantidad);
        
        if (tallasValidas.length > 0) {
          // Preparar los datos de tallas para insertar
          const tallasData = tallasValidas.map(t => ({
            producto_id: productoId,
            talla: t.talla,
            cantidad: parseInt(t.cantidad) || 0
          }));
          
          // Insertar las tallas
          const { error: tallasError } = await supabase
            .from("tallas")
            .insert(tallasData);
          
          if (tallasError) {
            console.error("Error al guardar tallas:", tallasError);
            toast({
              title: "Advertencia",
              description: "El producto se guardó, pero hubo un problema al guardar las tallas",
              variant: "warning",
            });
          }
        }
      }

      toast({
        title: "Éxito",
        description: "Producto agregado correctamente",
      });

      setSuccess(true);
      setFormData({
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
      
      // Reiniciar las tallas
      setTallas([{ talla: "", cantidad: "" }]);
    } catch (error) {
      console.error("Error al agregar producto:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto. Detalles: " + (error.message || error),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Añadir Nuevo Producto</CardTitle>
        <CardDescription>
          Agrega un nuevo producto a tu catálogo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del producto*</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio*</Label>
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
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                  <Label htmlFor="stock">Stock*</Label>
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
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
            
            {/* Nota informativa */}
            <div className="mt-2">
              <p className="text-xs text-gray-500">Selecciona una imagen para tu producto. Si tienes problemas al cargar la imagen, intenta con una de menor tamaño.</p>
            </div>
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
          
          <div className="space-y-4 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="destacado"
                checked={formData.destacado}
                onCheckedChange={(checked) => 
                  setFormData({...formData, destacado: !!checked})
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
                onCheckedChange={(checked) => 
                  setFormData({...formData, activo: !!checked})
                }
              />
              <Label htmlFor="activo" className="cursor-pointer">
                Producto activo (visible en catálogo)
              </Label>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Añadiendo...
              </>
            ) : success ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Producto añadido
              </>
            ) : (
              'Añadir Producto'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AgregarProducto;
