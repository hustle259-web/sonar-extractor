'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function SignupForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'inscription');
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setLoading(false);
      setError('Erreur réseau. Réessayez.');
    }
  }

  return (
    <div className="min-h-screen bg-fixora-hero flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/15 border border-white/25 shadow-2xl p-8">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/25 backdrop-blur-md border border-white/30">
            <span className="text-xl font-black text-white">S</span>
          </div>
          <span className="text-xl font-bold text-white">SonarExtractor</span>
        </div>
        <h1 className="text-2xl font-black text-white text-center mb-2">Inscription</h1>
        <p className="text-white/80 text-center mb-8">Créez votre compte gratuit</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold text-white/90 mb-1">
              Nom
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:outline-none"
              placeholder="Jean Dupont"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:outline-none"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-white/90 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:outline-none"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-white/50">Minimum 6 caractères</p>
          </div>
          {error && <p className="text-sm text-red-200 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-fixora-purple bg-white hover:bg-white/95 disabled:opacity-50 transition"
          >
            {loading ? 'Inscription…' : 'S\'inscrire'}
          </button>
        </form>

        <p className="mt-6 text-center text-white/70 text-sm">
          Déjà inscrit ?{' '}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-white font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-fixora-hero flex items-center justify-center">
        <p className="text-white/80">Chargement…</p>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
