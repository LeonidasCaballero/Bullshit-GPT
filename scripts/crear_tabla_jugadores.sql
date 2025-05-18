-- Crear la tabla jugadores
CREATE TABLE public.jugadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    partida_id TEXT NOT NULL REFERENCES public.partidas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.jugadores ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad para la tabla
-- Política para insertar: cualquier usuario autenticado puede crear jugadores
CREATE POLICY "Usuarios autenticados pueden crear jugadores" 
ON public.jugadores FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para seleccionar: cualquier usuario puede ver jugadores
CREATE POLICY "Cualquiera puede ver jugadores" 
ON public.jugadores FOR SELECT 
TO authenticated 
USING (true);

-- Política para actualizar: sólo el propietario puede actualizar sus datos
CREATE POLICY "Solo el propietario puede actualizar su jugador" 
ON public.jugadores FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Política para eliminar: sólo el propietario puede eliminar sus datos
CREATE POLICY "Solo el propietario puede eliminar su jugador" 
ON public.jugadores FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id); 