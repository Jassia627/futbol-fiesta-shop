-- Script para asignar el rol de administrador a un usuario

-- Reemplaza 'TU_EMAIL_AQUI' con el email de tu cuenta
UPDATE perfiles 
SET rol = 'admin' 
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'TU_EMAIL_AQUI'
);

-- Alternativamente, puedes usar el ID directamente si lo conoces
-- UPDATE perfiles SET rol = 'admin' WHERE id = 'TU_ID_AQUI';

-- Verificar que el cambio se haya aplicado
SELECT u.email, p.rol 
FROM perfiles p
JOIN auth.users u ON p.id = u.id
WHERE p.rol = 'admin';
