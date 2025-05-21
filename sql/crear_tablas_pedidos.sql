-- Script para crear las tablas de pedidos si no existen

-- Crear tabla pedidos si no existe
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  metodo_pago TEXT NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  direccion_envio TEXT,
  fecha_pedido TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cliente_nombre TEXT,
  cliente_telefono TEXT,
  cliente_email TEXT
);

-- Crear trigger para actualizar el campo updated_at
DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Crear tabla pedido_items si no existe
CREATE TABLE IF NOT EXISTS pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(12, 2) NOT NULL
);

-- Habilitar RLS (Row Level Security) en ambas tablas
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para pedidos
-- Permitir inserciones anónimas
DROP POLICY IF EXISTS "Permitir inserciones anónimas" ON pedidos;
CREATE POLICY "Permitir inserciones anónimas" ON pedidos
FOR INSERT WITH CHECK (true);

-- Política para que los administradores puedan ver todos los pedidos
DROP POLICY IF EXISTS "Los administradores pueden ver todos los pedidos" ON pedidos;
CREATE POLICY "Los administradores pueden ver todos los pedidos" ON pedidos
FOR SELECT USING (
  auth.uid() IN (
    SELECT auth.uid() FROM perfiles WHERE rol = 'admin'
  )
);

-- Política para que los usuarios normales solo vean sus propios pedidos
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios pedidos" ON pedidos;
CREATE POLICY "Los usuarios pueden ver sus propios pedidos" ON pedidos
FOR SELECT USING (
  auth.uid() = usuario_id
);

-- Políticas de seguridad para pedido_items
-- Permitir inserciones anónimas
DROP POLICY IF EXISTS "Permitir inserciones anónimas" ON pedido_items;
CREATE POLICY "Permitir inserciones anónimas" ON pedido_items
FOR INSERT WITH CHECK (true);

-- Política para que los administradores puedan ver todos los items de pedidos
DROP POLICY IF EXISTS "Los administradores pueden ver todos los items" ON pedido_items;
CREATE POLICY "Los administradores pueden ver todos los items" ON pedido_items
FOR SELECT USING (
  auth.uid() IN (
    SELECT auth.uid() FROM perfiles WHERE rol = 'admin'
  )
);

-- Política para que los usuarios normales solo vean los items de sus propios pedidos
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios items" ON pedido_items;
CREATE POLICY "Los usuarios pueden ver sus propios items" ON pedido_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pedidos
    WHERE pedidos.id = pedido_items.pedido_id
    AND pedidos.usuario_id = auth.uid()
  )
);

-- Permitir actualizaciones para administradores
DROP POLICY IF EXISTS "Los administradores pueden actualizar pedidos" ON pedidos;
CREATE POLICY "Los administradores pueden actualizar pedidos" ON pedidos
FOR UPDATE USING (
  auth.uid() IN (
    SELECT auth.uid() FROM perfiles WHERE rol = 'admin'
  )
);

-- Permitir que los usuarios actualicen sus propios pedidos
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios pedidos" ON pedidos;
CREATE POLICY "Los usuarios pueden actualizar sus propios pedidos" ON pedidos
FOR UPDATE USING (
  auth.uid() = usuario_id
);
