-- Añadir campos adicionales a la tabla partidas

-- Añadir columna para el orden de moderadores (array de UUIDs)
ALTER TABLE public.partidas ADD COLUMN IF NOT EXISTS orden_moderadores UUID[] DEFAULT '{}';

-- Añadir columna para las categorías seleccionadas (array de textos)
ALTER TABLE public.partidas ADD COLUMN IF NOT EXISTS categorias TEXT[] DEFAULT '{}';

-- Añadir columna para las preguntas (formato JSONB para flexibilidad)
ALTER TABLE public.partidas ADD COLUMN IF NOT EXISTS preguntas JSONB DEFAULT '[]';

-- Añadir columna para la ronda actual
ALTER TABLE public.partidas ADD COLUMN IF NOT EXISTS ronda_actual INTEGER DEFAULT 0;

-- Crear índice para mejorar consultas por ID
CREATE INDEX IF NOT EXISTS idx_partidas_id ON public.partidas (id);

-- Crear índice para mejorar consultas por user_id
CREATE INDEX IF NOT EXISTS idx_partidas_user_id ON public.partidas (user_id);

-- Actualizar permisos RLS para la tabla partidas
CREATE OR REPLACE POLICY "Cualquiera puede ver partidas en estado jugando" 
ON public.partidas FOR SELECT 
TO authenticated 
USING (estado = 'jugando' OR auth.uid() = user_id);

-- Habilitar búsqueda en tiempo real (webhook necesario para suscripciones)
ALTER PUBLICATION supabase_realtime ADD TABLE public.partidas; 