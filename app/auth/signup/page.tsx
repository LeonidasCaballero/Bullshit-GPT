'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/supabase';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validación del email usando una expresión regular simple
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validación de la contraseña (mínimo 6 caracteres)
  const isValidPassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar email y contraseña
    if (!isValidEmail(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    if (!isValidPassword(password)) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      console.log(`[signup] intentó registrar: ${email}`);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.log(`[signup] error: ${error.message}`);
        throw error;
      }

      console.log('[signup] éxito');
      router.push('/crear-partida');
    } catch (error: any) {
      setError(error.message || 'Ocurrió un error durante el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Crear cuenta</h1>
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <p className="text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-blue-500 hover:text-blue-800">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 