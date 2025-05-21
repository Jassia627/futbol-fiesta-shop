# Actualización de la Base de Datos para Compras Sin Autenticación

Este directorio contiene scripts SQL para actualizar la estructura de la base de datos en Supabase y permitir compras sin autenticación.

## Archivo: actualizar_tabla_pedidos.sql

Este script realiza las siguientes modificaciones:

1. **Añade nuevos campos a la tabla `pedidos`**:
   - `cliente_nombre`: Nombre del cliente para pedidos sin autenticación
   - `cliente_telefono`: Teléfono del cliente para pedidos sin autenticación
   - `cliente_email`: Email del cliente para pedidos sin autenticación

2. **Actualiza las políticas de seguridad**:
   - Permite inserciones anónimas en las tablas `pedidos` y `pedido_items`
   - Configura políticas para que los administradores puedan ver todos los pedidos
   - Configura políticas para que los usuarios normales solo vean sus propios pedidos

## Cómo Implementar

1. Accede al panel de administración de Supabase
2. Ve a la sección "SQL Editor"
3. Crea un nuevo script
4. Copia y pega el contenido del archivo `actualizar_tabla_pedidos.sql`
5. Ejecuta el script

## Estructura de Datos

### Tabla `pedidos`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Identificador único del pedido |
| usuario_id | uuid | ID del usuario (null para usuarios no autenticados) |
| total | numeric | Total del pedido |
| estado | text | Estado del pedido (pendiente, procesando, enviado, entregado, cancelado) |
| metodo_pago | text | Método de pago utilizado |
| direccion_envio | text | Dirección de envío |
| fecha_pedido | timestamp | Fecha y hora del pedido |
| cliente_nombre | text | Nombre del cliente (para usuarios no autenticados) |
| cliente_telefono | text | Teléfono del cliente (para usuarios no autenticados) |
| cliente_email | text | Email del cliente (para usuarios no autenticados) |

### Tabla `pedido_items`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Identificador único del item |
| pedido_id | uuid | ID del pedido al que pertenece |
| producto_id | uuid | ID del producto |
| cantidad | integer | Cantidad del producto |
| precio_unitario | numeric | Precio unitario del producto |
