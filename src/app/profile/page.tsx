'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErrorMsg(error.message);
    router.push('/client'); // redirige vers l’espace client (ajuste si besoin)
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-semibold text-center">Connexion</h1>
        <input
          className="w-full border rounded-xl p-3"
          type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border rounded-xl p-3"
          type="password" placeholder="Mot de passe"
          value={password} onChange={(e) => setPassword(e.target.value)}
          required
        />
        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
        <button
          className="w-full rounded-xl p-3 font-medium shadow disabled:opacity-50 border"
          disabled={loading}
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
        <p className="text-center text-sm">
          Pas de compte ? <a className="underline" href="/signup">Créer un compte</a>
        </p>
      </form>
    </main>
  );
}