-- Script para cambiar el rol de un usuario a "admin" en la tabla perfiles
-- Reemplaza 'EMAIL_DEL_USUARIO' con el correo electrónico del usuario que deseas convertir en administrador

-- Primero, encontrar el ID del usuario basado en su correo electrónico
DO $$
DECLARE
    usuario_id UUID;
    usuario_email TEXT := 'EMAIL_DEL_USUARIO'; -- Reemplaza esto con el correo del usuario
BEGIN
    -- Obtener el ID del usuario desde auth.users
    SELECT id INTO usuario_id
    FROM auth.users
    WHERE email = usuario_email;
    
    IF usuario_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ningún usuario con el correo: %', usuario_email;
    END IF;
    
    -- Verificar si el usuario ya tiene un perfil
    IF EXISTS (SELECT 1 FROM public.perfiles WHERE id = usuario_id) THEN
        -- Actualizar el rol a 'admin' si el perfil ya existe
        UPDATE public.perfiles
        SET rol = 'admin'
        WHERE id = usuario_id;
        
        RAISE NOTICE 'Se ha actualizado el rol del usuario % a administrador', usuario_email;
    ELSE
        -- Crear un nuevo perfil con rol 'admin' si no existe
        INSERT INTO public.perfiles (id, rol, created_at, updated_at)
        VALUES (usuario_id, 'admin', now(), now());
        
        RAISE NOTICE 'Se ha creado un perfil de administrador para el usuario %', usuario_email;
    END IF;
END $$;

-- Para verificar que el cambio se realizó correctamente, puedes ejecutar:
-- SELECT u.email, p.rol FROM auth.users u JOIN public.perfiles p ON u.id = p.id WHERE u.email = 'EMAIL_DEL_USUARIO';
