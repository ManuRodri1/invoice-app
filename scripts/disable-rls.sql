-- Deshabilitar RLS en la tabla users para desarrollo
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verificar que se puede acceder a los usuarios
SELECT COUNT(*) as total_users FROM public.users;

-- Mostrar usuarios disponibles (sin contraseñas)
SELECT id, username, full_name, email, role, created_at 
FROM public.users 
ORDER BY created_at DESC;
