-- Crear tabla para las tallas de productos
CREATE TABLE public.tallas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  talla text NOT NULL,
  cantidad integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT tallas_pkey PRIMARY KEY (id),
  CONSTRAINT tallas_producto_id_fkey FOREIGN KEY (producto_id)
    REFERENCES public.productos (id) ON DELETE CASCADE
);

-- Crear índice para búsquedas rápidas por producto_id
CREATE INDEX idx_tallas_producto_id ON public.tallas (producto_id);

-- Crear trigger para actualizar el campo updated_at
CREATE TRIGGER update_tallas_updated_at BEFORE UPDATE
ON tallas FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Crear políticas de seguridad para la tabla tallas
-- Política para permitir SELECT a todos los usuarios autenticados
CREATE POLICY "Permitir SELECT a usuarios autenticados" ON "public"."tallas"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- Política para permitir INSERT a usuarios autenticados
CREATE POLICY "Permitir INSERT a usuarios autenticados" ON "public"."tallas"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para permitir UPDATE a usuarios autenticados que crearon el producto asociado
CREATE POLICY "Permitir UPDATE a creadores del producto" ON "public"."tallas"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM productos p
    WHERE p.id = tallas.producto_id
  )
);

-- Política para permitir DELETE a usuarios autenticados que crearon el producto asociado
CREATE POLICY "Permitir DELETE a creadores del producto" ON "public"."tallas"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM productos p
    WHERE p.id = tallas.producto_id
  )
);

-- Habilitar RLS en la tabla tallas
ALTER TABLE public.tallas ENABLE ROW LEVEL SECURITY;
