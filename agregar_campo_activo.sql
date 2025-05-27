-- Agregar campo activo a la tabla productos
ALTER TABLE public.productos
ADD COLUMN activo boolean DEFAULT true;

-- Actualizar todos los productos existentes para que estén activos por defecto
UPDATE public.productos
SET activo = true
WHERE activo IS NULL;

-- Comentario: Ejecuta este script en la consola SQL de Supabase
-- para agregar el campo activo a la tabla de productos.
