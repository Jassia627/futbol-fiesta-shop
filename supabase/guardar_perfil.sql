-- Función para guardar o actualizar un perfil de usuario
CREATE OR REPLACE FUNCTION public.guardar_perfil(
  p_id UUID,
  p_nombre TEXT,
  p_apellido TEXT,
  p_telefono TEXT,
  p_direccion TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_existe BOOLEAN;
BEGIN
  -- Verificar si el perfil ya existe
  SELECT EXISTS(SELECT 1 FROM public.perfiles WHERE id = p_id) INTO v_existe;
  
  IF v_existe THEN
    -- Actualizar perfil existente
    UPDATE public.perfiles
    SET 
      nombre = p_nombre,
      apellido = p_apellido,
      telefono = p_telefono,
      direccion = p_direccion,
      updated_at = NOW()
    WHERE id = p_id;
  ELSE
    -- Crear nuevo perfil
    INSERT INTO public.perfiles (
      id, 
      nombre, 
      apellido, 
      telefono, 
      direccion, 
      rol, 
      created_at, 
      updated_at
    ) VALUES (
      p_id, 
      p_nombre, 
      p_apellido, 
      p_telefono, 
      p_direccion, 
      'cliente', 
      NOW(), 
      NOW()
    );
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al guardar perfil: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios sobre la función:
-- 1. SECURITY DEFINER hace que la función se ejecute con los privilegios del creador
-- 2. Esta función maneja tanto la creación como la actualización de perfiles
-- 3. Devuelve TRUE si la operación fue exitosa, FALSE en caso de error
