'use client';

import { useState, FormEvent } from 'react';
import Logo from '@/components/Logo';

type Props = {
  onAccessGranted: () => void;
};

export default function AccessGate({ onAccessGranted }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onAccessGranted();
        return;
      }
      setError(data.error || 'Code incorrect');
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fixora-hero flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-fixora-green-accent/10 blur-3xl" />
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/15 border border-white/25 shadow-2xl p-8 sm:p-10">
          <div className="flex justify-center mb-8">
            <Logo size="md" />
          </div>
        <h1 className="text-2xl font-black text-white text-center mb-2">
          Code d&apos;accès
        </h1>
        <p className="text-white/80 text-center mb-8">
          Entrez le code pour accéder à l&apos;outil.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="access-code" className="sr-only">
              Code d&apos;accès
            </label>
            <input
              id="access-code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code d'accès"
              autoComplete="current-password"
              disabled={loading}
              className="w-full p-4 rounded-2xl backdrop-blur-md bg-white/20 border border-white/30 text-white placeholder-white/50 focus:ring-2 focus:ring-white/40 focus:border-white/50 transition-all disabled:opacity-60"
            />
          </div>
          {error && (
            <p className="text-sm text-red-200 text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full rounded-2xl font-bold text-white p-4 backdrop-blur-md bg-white/25 border border-white/30 hover:bg-white/35 transition disabled:opacity-50 disabled:pointer-events-none shadow-lg"
          >
            {loading ? 'Vérification…' : 'Accéder'}
          </button>
        </form>
      </div>
    </div>
  );
}
