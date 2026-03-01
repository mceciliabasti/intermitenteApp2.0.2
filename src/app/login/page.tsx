'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

/*  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError('Credenciales inválidas');
    } else {
      router.push('/dashboard');
    }
  }; */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpiamos errores anteriores

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Credenciales inválidas');
    } else {
      // 1. Refrescamos la ruta actual para que el layout reconozca la sesión
      router.refresh(); 
      
      // 2. Pequeña espera para asegurar que la cookie se guardó (opcional pero seguro)
      setTimeout(() => {
   //     router.push('/dashboard');
     window.location.href = '/dashboard';
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">Club de Arte</h1>
          <p className="text-gray-600">Iniciar Sesión</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 transition duration-200"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 transition duration-200"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-600 font-semibold bg-red-50 p-3 rounded-lg">{error}</p>}
          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition duration-200 transform hover:scale-105">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}