-- Script para crear las tablas necesarias para el carrito de compras
-- Ejecutar este script en la consola SQL de Supabase

-- Tabla de carritos
CREATE TABLE IF NOT EXISTS public.carritos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de items del carrito
CREATE TABLE IF NOT EXISTS public.carrito_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrito_id UUID NOT NULL REFERENCES public.carritos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(carrito_id, producto_id)
);

-- Trigger para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a la tabla carritos
DROP TRIGGER IF EXISTS update_carritos_updated_at ON public.carritos;
CREATE TRIGGER update_carritos_updated_at
BEFORE UPDATE ON public.carritos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger a la tabla carrito_items
DROP TRIGGER IF EXISTS update_carrito_items_updated_at ON public.carrito_items;
CREATE TRIGGER update_carrito_items_updated_at
BEFORE UPDATE ON public.carrito_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad para carritos
ALTER TABLE public.carritos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus propios carritos" ON public.carritos;
CREATE POLICY "Usuarios pueden ver sus propios carritos"
ON public.carritos FOR SELECT
USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios carritos" ON public.carritos;
CREATE POLICY "Usuarios pueden insertar sus propios carritos"
ON public.carritos FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios carritos" ON public.carritos;
CREATE POLICY "Usuarios pueden actualizar sus propios carritos"
ON public.carritos FOR UPDATE
USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios carritos" ON public.carritos;
CREATE POLICY "Usuarios pueden eliminar sus propios carritos"
ON public.carritos FOR DELETE
USING (auth.uid() = usuario_id);

-- Políticas de seguridad para carrito_items
ALTER TABLE public.carrito_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus propios items del carrito" ON public.carrito_items;
CREATE POLICY "Usuarios pueden ver sus propios items del carrito"
ON public.carrito_items FOR SELECT
USING (
  carrito_id IN (
    SELECT id FROM public.carritos WHERE usuario_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios items del carrito" ON public.carrito_items;
CREATE POLICY "Usuarios pueden insertar sus propios items del carrito"
ON public.carrito_items FOR INSERT
WITH CHECK (
  carrito_id IN (
    SELECT id FROM public.carritos WHERE usuario_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios items del carrito" ON public.carrito_items;
CREATE POLICY "Usuarios pueden actualizar sus propios items del carrito"
ON public.carrito_items FOR UPDATE
USING (
  carrito_id IN (
    SELECT id FROM public.carritos WHERE usuario_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios items del carrito" ON public.carrito_items;
CREATE POLICY "Usuarios pueden eliminar sus propios items del carrito"
ON public.carrito_items FOR DELETE
USING (
  carrito_id IN (
    SELECT id FROM public.carritos WHERE usuario_id = auth.uid()
  )
);
