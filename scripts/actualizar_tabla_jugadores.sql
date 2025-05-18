-- Modificar la tabla jugadores para permitir que user_id sea nullable

-- Primero eliminar la restricción NOT NULL del campo user_id
ALTER TABLE public.jugadores ALTER COLUMN user_id DROP NOT NULL;

-- Modificar la restricción de clave foránea para mantener la integridad referencial
-- pero permitiendo valores NULL
ALTER TABLE public.jugadores DROP CONSTRAINT IF EXISTS jugadores_user_id_fkey;
ALTER TABLE public.jugadores ADD CONSTRAINT jugadores_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- Ajustar las políticas de seguridad para permitir acceso anónimo
-- Eliminar políticas existentes primero
DROP POLICY IF EXISTS "ver_jugadores" ON public.jugadores;
DROP POLICY IF EXISTS "crear_jugadores" ON public.jugadores;

-- Crear nuevas políticas
CREATE POLICY "ver_jugadores" 
ON public.jugadores FOR SELECT 
USING (true);

CREATE POLICY "crear_jugadores" 
ON public.jugadores FOR INSERT 
WITH CHECK (true);

-- Nota: No es necesario añadir la tabla a la publicación de tiempo real,
-- ya está incluida en supabase_realtime 