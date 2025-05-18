'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/supabase';

export default function ElegirNombre() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const partidaId = params.id as string;
  const esCreador = searchParams.get('creador') === 'true';
  const [isLoading, setIsLoading] = useState(true);
  const [partidaData, setPartidaData] = useState<any>(null);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Obtener datos de la partida sin verificar autenticación
    const inicializar = async () => {
      try {
        // Obtener datos de la partida
        const { data: partidaData, error: partidaError } = await supabase
          .from('partidas')
          .select('*')
          .eq('id', partidaId)
          .single();

        if (partidaError) {
          throw new Error('No se pudo encontrar la partida');
        }

        // Si la partida ya está en estado "jugando", redirigir a la intro
        if (partidaData.estado === 'jugando') {
          router.push(`/partida/${partidaId}/intro`);
          return;
        }

        setPartidaData(partidaData);
      } catch (error: any) {
        console.error('[elegir-nombre] error:', error.message);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    inicializar();
  }, [partidaId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      setError('Por favor ingresa un nombre para jugar');
      return;
    }

    try {
      setSubmitting(true);
      console.log(`[elegir-nombre] intento de unión: ${nombre} a partida ${partidaId}`);

      // Intentar obtener la sesión por si es un usuario autenticado
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;

      // Guardar el jugador en la tabla jugadores
      // Si es el creador y está autenticado, guardamos el user_id
      const { data, error } = await supabase
        .from('jugadores')
        .insert([
          { 
            nombre,
            partida_id: partidaId,
            user_id: esCreador ? userId : null,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        console.log(`[elegir-nombre] error: ${error.message}`);
        throw error;
      }

      console.log('[elegir-nombre] jugador registrado');
      
      // Almacenar el ID del jugador en localStorage para identificarlo más tarde
      if (data && data[0]) {
        localStorage.setItem(`partida_${partidaId}_jugador_id`, data[0].id);
        
        // Si es creador, guardar también esa información
        if (esCreador) {
          localStorage.setItem(`partida_${partidaId}_creador`, 'true');
        }
      }
      
      // Redirigir a la sala de la partida
      router.push(`/partida/${partidaId}/lobby`);
    } catch (error: any) {
      setError(error.message || 'Error al registrar jugador');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg">Cargando partida...</p>
        </div>
      </div>
    );
  }

  if (error && !partidaData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <p className="text-lg">{error}</p>
          <button 
            onClick={() => router.push('/')} 
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center">Elegir nombre</h1>
        <p className="text-gray-600 mb-6 text-center">Partida: {partidaData?.nombre}</p>
        
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">
                Tu nombre en el juego
              </label>
              <input
                id="nombre"
                type="text"
                placeholder="¿Cómo te quieres llamar?"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                maxLength={20}
              />
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Uniéndose...' : 'Unirse a la partida'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 