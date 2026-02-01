'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type PromoCode = { id: string; code: string; active: boolean; created_at: string };

export default function AdminPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  function fetchCodes() {
    fetch('/api/admin/promo-codes', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        if (d.error && d.error.includes('refusé')) {
          setError('Accès refusé. Configurez ADMIN_EMAIL dans .env.local avec votre email.');
          setCodes([]);
        } else if (d.codes) {
          setCodes(d.codes);
          setError(null);
        } else {
          setError(d.error || 'Erreur');
        }
      })
      .catch(() => setError('Erreur réseau'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchCodes();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ code: newCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Erreur');
        return;
      }
      setNewCode('');
      fetchCodes();
    } catch {
      setAddError('Erreur réseau');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleToggle(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ active }),
      });
      if (res.ok) fetchCodes();
    } catch {
      // ignore
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce code ?')) return;
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (res.ok) fetchCodes();
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-fixora-hero flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/15 border border-white/25 shadow-2xl p-8">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/25 backdrop-blur-md border border-white/30">
            <span className="text-xl font-black text-white">S</span>
          </div>
          <span className="text-xl font-bold text-white">SonarExtractor</span>
        </div>
        <h1 className="text-2xl font-black text-white text-center mb-2">Admin – Codes promo</h1>
        <p className="text-white/70 text-center mb-8">Gérez les codes promo depuis la plateforme</p>

        {loading ? (
          <p className="text-white/80 text-center">Chargement…</p>
        ) : error ? (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200">
            <p className="font-semibold mb-1">Accès refusé</p>
            <p className="text-sm">{error}</p>
            <p className="text-sm mt-2">
              Ajoutez <code className="bg-white/10 px-1 rounded">ADMIN_EMAIL=ton@email.com</code> dans{' '}
              <code className="bg-white/10 px-1 rounded">gmaps-scraper/.env.local</code>, puis reconnecte-toi.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2 mb-8">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Nouveau code promo"
                className="flex-1 min-w-[180px] p-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:outline-none"
              />
              <button
                type="submit"
                disabled={addLoading}
                className="px-6 py-4 rounded-2xl font-bold text-fixora-purple bg-white hover:bg-white/95 disabled:opacity-50 transition"
              >
                {addLoading ? '…' : 'Ajouter'}
              </button>
            </form>
            {addError && <p className="text-red-200 text-sm mb-4">{addError}</p>}

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white/90">Codes existants</h2>
              {codes.length === 0 ? (
                <p className="text-white/60 text-sm">Aucun code. Ajoutez-en un ci-dessus.</p>
              ) : (
                codes.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/10 border border-white/20"
                  >
                    <code className="text-white font-mono">{c.code}</code>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(c.id, !c.active)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          c.active ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {c.active ? 'Actif' : 'Inactif'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-200 hover:bg-red-500/30"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <p className="mt-8 text-center">
          <Link href="/" className="text-white/80 hover:text-white font-medium">
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
