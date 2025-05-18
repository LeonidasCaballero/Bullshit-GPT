'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/supabase';

export default function PartidaIntro() {
  const router = useRouter();
  const params = useParams();
  const partidaId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [partidaData, setPartidaData] = useState<any>(null);
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [moderadorActual, setModeradorActual] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const inicializar = async () => {
      try {
        // Verificar si el usuario tiene un jugador en esta partida
        const storedJugadorId = typeof window !== 'undefined' 
          ? localStorage.getItem(`partida_${partidaId}_jugador_id`) 
          : null;
          
        if (!storedJugadorId) {
          // Verificar si hay una sesión de usuario
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session) {
            // Sin ID de jugador ni sesión, redirigir a elegir nombre
            router.push(`/partida/${partidaId}/elegir-nombre`);
            return;
          }
        }

        // Obtener datos de la partida
        const { data: partidaData, error: partidaError } = await supabase
          .from('partidas')
          .select('*')
          .eq('id', partidaId)
          .single();

        if (partidaError) {
          throw new Error('No se pudo encontrar la partida');
        }

        if (partidaData.estado !== 'jugando') {
          router.push(`/partida/${partidaId}/lobby`);
          return;
        }

        setPartidaData(partidaData);
        console.log('[intro] datos de partida cargados');

        // Obtener lista de jugadores
        const { data: jugadoresData, error: jugadoresError } = await supabase
          .from('jugadores')
          .select('*')
          .eq('partida_id', partidaId);

        if (jugadoresError) {
          throw new Error('Error al obtener los jugadores');
        }

        setJugadores(jugadoresData || []);

        // Obtener el moderador actual usando el orden de moderadores
        if (partidaData.orden_moderadores && partidaData.orden_moderadores.length > 0) {
          const moderadorId = partidaData.orden_moderadores[0]; // El primero de la lista
          const moderador = jugadoresData?.find(j => j.id === moderadorId);
          setModeradorActual(moderador);
        }

        // Configurar redirección automática al juego después de 10 segundos
        const timer = setTimeout(() => {
          router.push(`/partida/${partidaId}/juego`);
        }, 10000);

        return () => clearTimeout(timer);
      } catch (error: any) {
        console.error('[intro] error:', error.message);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    inicializar();
  }, [partidaId, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg">Preparando partida...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-500 to-purple-600 text-white">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-5xl font-bold mb-8 animate-pulse">¡La partida comienza!</h1>
        
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-semibold mb-6">{partidaData?.nombre}</h2>
          
          <div className="mb-8">
            <p className="text-xl mb-2">Jugadores:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {jugadores.map((jugador) => (
                <div 
                  key={jugador.id} 
                  className={`py-2 px-4 rounded-full ${
                    moderadorActual?.id === jugador.id 
                      ? 'bg-yellow-400 text-yellow-900' 
                      : 'bg-white/30'
                  }`}
                >
                  {jugador.nombre}
                  {moderadorActual?.id === jugador.id && <span className="ml-2">👑</span>}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-8">
            <p className="text-xl mb-2">Categorías de esta partida:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {partidaData?.categorias?.map((categoria: string, index: number) => (
                <span 
                  key={index} 
                  className="bg-white/20 py-1 px-3 rounded-full text-sm"
                >
                  {categoria}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mb-8">
            <p className="text-xl">Primer moderador:</p>
            <p className="text-3xl font-bold mt-2">{moderadorActual?.nombre || 'Cargando...'}</p>
          </div>
        </div>
        
        <p className="text-lg animate-bounce">
          Comenzando en unos segundos...
        </p>
      </div>
    </div>
  );
} 