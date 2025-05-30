-- Agregar campo talla a la tabla pedido_items
ALTER TABLE public.pedido_items
ADD COLUMN IF NOT EXISTS talla TEXT;

-- Comentario explicativo
COMMENT ON COLUMN public.pedido_items.talla IS 'Talla del producto seleccionada en el pedido. Puede ser null para productos sin tallas.';

-- Mostrar la estructura actualizada de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pedido_items' AND table_schema = 'public'
ORDER BY ordinal_position; 