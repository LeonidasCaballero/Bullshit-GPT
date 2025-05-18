import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8 text-center">Bullshit-GPT</h1>
        <div className="flex flex-col space-y-4">
          <Link href="/auth/signup" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded text-center">
            Registro
          </Link>
          <Link href="/auth/login" className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded text-center">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
} 