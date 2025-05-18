'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabase';

export default function CrearPartida() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkSession = async () => {
      console.log('[auth] verificación de sesión iniciada');
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          console.log('[auth] usuario autenticado');
          setIsAuthenticated(true);
          setUserId(data.session.user.id);
        } else {
          console.log('[auth] sin sesión, redirigiendo a /login');
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('[auth] error al verificar sesión:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router]);

  // Generar ID único
  const generarId = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar que el nombre no esté vacío
    if (!nombre.trim()) {
      setError('El nombre de la partida no puede estar vacío');
      return;
    }

    try {
      setCreando(true);
      console.log(`[crear-partida] intento con nombre: ${nombre}`);

      // Generar ID único para la partida
      const id = generarId();
      
      // Crear la partida en Supabase
      const { data, error } = await supabase
        .from('partidas')
        .insert([
          { 
            id, 
            nombre, 
            user_id: userId, 
            estado: 'lobby',
            created_at: new Date().toISOString() 
          }
        ])
        .select();

      if (error) {
        console.log(`[crear-partida] error al crear: ${error.message}`);
        throw error;
      }

      console.log(`[crear-partida] partida creada con ID: ${id}`);
      
      // Guardar en localStorage que este usuario es el creador de esta partida
      localStorage.setItem(`partida_${id}_creador`, 'true');
      
      // Redirigir a la pantalla de elegir nombre para confirmar el nombre del jugador
      router.push(`/partida/${id}/elegir-nombre?creador=true`);
    } catch (error: any) {
      setError(error.message || 'Error al crear la partida');
    } finally {
      setCreando(false);
    }
  };

  // Mostrar un estado de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Solo muestra la interfaz si está autenticado
  if (!isAuthenticated) {
    return null; // No mostrar nada mientras se redirige
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Crear Partida</h1>
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">
                Nombre de la partida
              </label>
              <input
                id="nombre"
                type="text"
                placeholder="Ingresa un nombre para la partida"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
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
                disabled={creando}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${
                  creando ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {creando ? 'Creando partida...' : 'Crear Nueva Partida'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 