-- Añadir columna talla a la tabla carrito_items
ALTER TABLE carrito_items
ADD COLUMN talla TEXT;

-- Comentario explicativo
COMMENT ON COLUMN carrito_items.talla IS 'Talla del producto seleccionada por el usuario. Puede ser null para productos sin tallas.';
