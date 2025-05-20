-- Función para ejecutar SQL dinámicamente
-- Esta función permite ejecutar consultas SQL directamente desde la aplicación
-- ADVERTENCIA: Esta función debe usarse con precaución ya que puede representar un riesgo de seguridad

CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con los privilegios del creador de la función
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Ejecutar la consulta dinámica y capturar el resultado como JSON
  EXECUTE 'WITH result AS (' || query || ') SELECT to_jsonb(result) FROM result' INTO result;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- En caso de error, devolver información sobre el error
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE,
      'query', query
    );
END;
$$;

-- Comentarios:
-- 1. Esta función debe ser creada por un usuario con permisos de administrador
-- 2. La función permite ejecutar cualquier consulta SQL, lo que puede ser peligroso
-- 3. Se recomienda limitar el acceso a esta función solo a usuarios autenticados con roles específicos
-- 4. En un entorno de producción, es mejor crear funciones específicas para cada operación en lugar de usar una función genérica como esta
