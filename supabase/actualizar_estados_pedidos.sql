-- Script para actualizar y estandarizar los estados de pedidos
-- Solo permitir 3 estados: pendiente, enviado, cancelado

-- Actualizar estados existentes que no sean válidos
UPDATE public.pedidos 
SET estado = 'pendiente' 
WHERE estado NOT IN ('pendiente', 'enviado', 'cancelado');

-- Agregar constraint para asegurar que solo se usen los 3 estados válidos
ALTER TABLE public.pedidos 
DROP CONSTRAINT IF EXISTS pedidos_estado_check;

ALTER TABLE public.pedidos 
ADD CONSTRAINT pedidos_estado_check 
CHECK (estado IN ('pendiente', 'enviado', 'cancelado'));

-- Comentario explicativo
COMMENT ON COLUMN public.pedidos.estado IS 'Estado del pedido: pendiente (recién creado), enviado (stock descontado), cancelado (stock devuelto si fue enviado)';

-- Mostrar resumen de estados después de la actualización
SELECT 
    estado,
    COUNT(*) as cantidad,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as porcentaje
FROM public.pedidos 
GROUP BY estado
ORDER BY cantidad DESC; 