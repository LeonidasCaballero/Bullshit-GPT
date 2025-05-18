'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/supabase';

export default function Partida() {
  const router = useRouter();
  const params = useParams();
  const partidaId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [partidaData, setPartidaData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si el usuario está autenticado y obtener datos de la partida
    const inicializar = async () => {
      try {
        // Verificar autenticación
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          console.log('[partida] sin sesión, redirigiendo a /login');
          router.push('/auth/login');
          return;
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

        setPartidaData(partidaData);
      } catch (error: any) {
        console.error('[partida] error:', error.message);
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
            onClick={() => router.push('/crear-partida')} 
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Volver a crear partida
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
          <p className="mb-4">
            La partida está en modo lobby. Comparte el siguiente enlace para que otros jugadores se unan:
          </p>
          <div className="bg-gray-100 p-3 rounded mb-4 break-all">
            {typeof window !== 'undefined' && `${window.location.origin}/partida/${partidaId}/elegir-nombre`}
          </div>
          
          <div className="flex justify-end">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
              Iniciar Partida
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 