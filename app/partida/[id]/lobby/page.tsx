'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/supabase';

// Categorías de ejemplo para el juego
const CATEGORIAS = [
  'Historia', 'Geografía', 'Deportes', 'Ciencia', 'Arte', 
  'Entretenimiento', 'Tecnología', 'Comida', 'Música', 'Cine',
  'Literatura', 'Naturaleza', 'Medicina', 'Política', 'Economía'
];

// Función para barajar un array (algoritmo de Fisher-Yates)
const shuffle = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function PartidaLobby() {
  const router = useRouter();
  const params = useParams();
  const partidaId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [partidaData, setPartidaData] = useState<any>(null);
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [jugadorId, setJugadorId] = useState<string | null>(null);
  const [iniciandoPartida, setIniciandoPartida] = useState(false);

  // Función para cargar la lista de jugadores
  const cargarJugadores = async () => {
    try {
      const { data: jugadoresData, error: jugadoresError } = await supabase
        .from('jugadores')
        .select('*')
        .eq('partida_id', partidaId);

      if (jugadoresError) {
        throw new Error('Error al obtener los jugadores');
      }

      setJugadores(jugadoresData || []);
      console.log(`[lobby] total jugadores: ${jugadoresData?.length || 0}`);
    } catch (error: any) {
      console.error('[lobby] error al cargar jugadores:', error.message);
    }
  };

  useEffect(() => {
    // Verificar si el usuario tiene un jugador en esta partida
    const inicializar = async () => {
      try {
        // Intentar obtener el ID del jugador del localStorage
        const storedJugadorId = typeof window !== 'undefined' 
          ? localStorage.getItem(`partida_${partidaId}_jugador_id`) 
          : null;
          
        if (storedJugadorId) {
          setJugadorId(storedJugadorId);
        } else {
          // Si no hay ID del jugador, pueden ser jugadores autenticados de antes
          // o simplemente alguien que accedió directamente a esta URL
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            setUserId(sessionData.session.user.id);
          } else {
            // Sin jugador ID ni sesión, redirigir a elegir nombre
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

        // Si la partida ya está en estado "jugando", redirigir a la intro
        if (partidaData.estado === 'jugando') {
          router.push(`/partida/${partidaId}/intro`);
          return;
        }

        setPartidaData(partidaData);

        // Cargar jugadores iniciales
        await cargarJugadores();

        // Configurar las suscripciones a cambios en tiempo real
        setupRealTimeSubscriptions();
      } catch (error: any) {
        console.error('[lobby] error:', error.message);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    inicializar();

    // Cleanup al desmontar el componente
    return () => {
      const channels = supabase.getChannels();
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [partidaId, router]);

  // Configurar suscripciones en tiempo real
  const setupRealTimeSubscriptions = () => {
    // Crear un canal único para esta sesión
    const channel = supabase.channel(`lobby-${partidaId}-${Date.now()}`);

    // Suscribirse a cambios en la tabla jugadores (INSERT)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'jugadores',
        filter: `partida_id=eq.${partidaId}`
      },
      (payload) => {
        const nuevoJugador = payload.new;
        console.log(`[lobby] jugador conectado: ${nuevoJugador.nombre}`);
        
        // Actualizar la lista de jugadores
        setJugadores(prevJugadores => {
          // Verificar si ya existe este jugador para evitar duplicados
          const existe = prevJugadores.some(j => j.id === nuevoJugador.id);
          if (existe) return prevJugadores;
          
          const jugadoresActualizados = [...prevJugadores, nuevoJugador];
          console.log(`[lobby] total jugadores: ${jugadoresActualizados.length}`);
          return jugadoresActualizados;
        });
      }
    )
    
    // Suscribirse a cambios en la tabla jugadores (UPDATE)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'jugadores',
        filter: `partida_id=eq.${partidaId}`
      },
      (payload) => {
        const jugadorActualizado = payload.new;
        console.log(`[lobby] jugador actualizado: ${jugadorActualizado.nombre}`);
        
        // Actualizar el jugador en la lista
        setJugadores(prevJugadores => prevJugadores.map(j => 
          j.id === jugadorActualizado.id ? jugadorActualizado : j
        ));
      }
    )
    
    // Suscribirse a cambios en la tabla jugadores (DELETE)
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'jugadores',
        filter: `partida_id=eq.${partidaId}`
      },
      (payload) => {
        const jugadorEliminado = payload.old;
        console.log(`[lobby] jugador eliminado: ${jugadorEliminado.id}`);
        
        // Eliminar el jugador de la lista
        setJugadores(prevJugadores => prevJugadores.filter(j => j.id !== jugadorEliminado.id));
      }
    )
    
    // Suscribirse a cambios en la tabla partidas
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'partidas',
        filter: `id=eq.${partidaId}`
      },
      (payload) => {
        const partidaActualizada = payload.new;
        console.log('[lobby] partida actualizada:', partidaActualizada.estado);
        
        if (partidaActualizada.estado === 'jugando') {
          console.log('[lobby] partida iniciada, redirigiendo a intro');
          router.push(`/partida/${partidaId}/intro`);
        }
      }
    )
    
    .subscribe((status) => {
      console.log(`[lobby] estado de suscripción: ${status}`);
      
      if (status !== 'SUBSCRIBED') {
        console.error('[lobby] error en la suscripción, reintentando...');
        setTimeout(() => cargarJugadores(), 2000); // Recargar jugadores si falla la suscripción
      }
    });
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/partida/${partidaId}/elegir-nombre`;
    navigator.clipboard.writeText(inviteLink);
    console.log('[lobby] link copiado');
    alert('Enlace copiado al portapapeles');
  };

  const iniciarPartida = async () => {
    if (jugadores.length < 2) {
      setError('Se necesitan al menos 2 jugadores para iniciar la partida');
      return;
    }

    try {
      setIniciandoPartida(true);
      console.log('[lobby] el creador inició la partida');

      // 1. Calcular orden de moderadores (rotando entre jugadores)
      const jugadoresBarajados = shuffle(jugadores);
      const ordenModeradores = jugadoresBarajados.map(j => j.id);
      
      // 2. Elegir 8 categorías aleatorias
      const categoriasBarajadas = shuffle(CATEGORIAS);
      const categoriasSeleccionadas = categoriasBarajadas.slice(0, 8);
      
      // 3. Generar un array de 8 posibles preguntas por ronda (placeholders)
      const preguntas = Array(8).fill(null).map((_, i) => ({
        ronda: i + 1,
        categoria: categoriasSeleccionadas[i],
        pregunta: `Pregunta de ejemplo para la categoría ${categoriasSeleccionadas[i]}`
      }));

      // 4. Actualizar la partida en Supabase
      const { error } = await supabase
        .from('partidas')
        .update({
          estado: 'jugando',
          orden_moderadores: ordenModeradores,
          categorias: categoriasSeleccionadas,
          preguntas: preguntas,
          ronda_actual: 1
        })
        .eq('id', partidaId);

      if (error) {
        throw error;
      }

      // La redirección la realizará el listener de cambios en real-time
    } catch (error: any) {
      console.log(`[lobby] error: ${error.message}`);
      setError(error.message || 'Error al iniciar la partida');
      setIniciandoPartida(false);
    }
  };

  // Mejorar la detección del creador
  const esCreador = 
    // Si el usuario está autenticado y coincide con el creador de la partida
    (userId && partidaData?.user_id === userId) || 
    // O si se ha marcado como creador en el localStorage
    (typeof window !== 'undefined' && localStorage.getItem(`partida_${partidaId}_creador`) === 'true');

  console.log(`[lobby] esCreador: ${esCreador}, userId: ${userId}, jugadorId: ${jugadorId}, creador: ${partidaData?.user_id}`);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg">Cargando sala de espera...</p>
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
    <div className="flex min-h-screen flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Partida: {partidaData?.nombre}</h1>
          <div className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm">
            Estado: {partidaData?.estado}
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sala de espera</h2>
          
          <div className="mb-6">
            <p className="mb-2">Invita a más jugadores compartiendo este enlace:</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/partida/${partidaId}/elegir-nombre`}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-gray-50"
              />
              <button 
                onClick={copyInviteLink}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Copiar
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Jugadores ({jugadores.length}):</h3>
              <button 
                onClick={cargarJugadores}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Actualizar
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              {jugadores.length === 0 ? (
                <p className="text-gray-500 italic">Aún no hay jugadores en la sala</p>
              ) : (
                <ul className="list-disc list-inside">
                  {jugadores.map((jugador) => (
                    <li key={jugador.id} className="py-1">
                      <span className="font-medium">{jugador.nombre}</span>
                      {jugador.id === jugadorId && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Tú
                        </span>
                      )}
                      {jugador.user_id === partidaData?.user_id && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Creador
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {esCreador && (
            <div className="flex justify-end">
              <button 
                className={`bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded ${
                  iniciandoPartida || jugadores.length < 2 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={iniciandoPartida || jugadores.length < 2}
                title={jugadores.length < 2 ? "Se necesitan al menos 2 jugadores para iniciar" : ""}
                onClick={iniciarPartida}
              >
                {iniciandoPartida ? 'Iniciando...' : 'Iniciar Partida'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 