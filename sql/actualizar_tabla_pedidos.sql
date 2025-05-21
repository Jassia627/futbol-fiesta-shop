-- Actualizar la tabla pedidos para soportar pedidos de usuarios no autenticados
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS cliente_nombre TEXT,
ADD COLUMN IF NOT EXISTS cliente_telefono TEXT,
ADD COLUMN IF NOT EXISTS cliente_email TEXT;

-- Comentarios para explicar el propósito de los nuevos campos
COMMENT ON COLUMN pedidos.cliente_nombre IS 'Nombre del cliente para pedidos sin autenticación';
COMMENT ON COLUMN pedidos.cliente_telefono IS 'Teléfono del cliente para pedidos sin autenticación';
COMMENT ON COLUMN pedidos.cliente_email IS 'Email del cliente para pedidos sin autenticación';

-- Actualizar políticas de seguridad para permitir inserciones sin usuario autenticado
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

-- Actualizar políticas para pedido_items
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
