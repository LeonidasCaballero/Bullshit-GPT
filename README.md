# Bullshit-GPT

Aplicación con sistema de autenticación usando Supabase.

## Configuración

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Crea un archivo `.env.local` con las siguientes variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-de-supabase
   ```

   Puedes obtener estas claves al crear un proyecto en [Supabase](https://supabase.io/).

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Funcionalidades

- Registro de usuarios (signup) con email y contraseña
- Validación de formularios
- Redirección tras registro exitoso
- Manejo de errores

## Tecnologías utilizadas

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase (Autenticación) 