'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeadFormProps {
  onExtract: (data: { metier: string; ville: string; maxResults: number }) => void;
  isLoading: boolean;
}

const PRO_BADGES = [
  '60 leads max',
  'Nb avis',
  'Export CSV & PDF',
  'Filtre site web',
  'Google Places API',
];

type UsageState = {
  scrapsLeft: number | 'unlimited';
  monthlyLeft?: number;
  creditsTotal?: number;
  unlimitedPromo?: boolean;
} | null | undefined;

export default function LeadForm({ onExtract, isLoading }: LeadFormProps) {
  const [usage, setUsage] = useState<UsageState>(undefined);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  function fetchUsage() {
    fetch('/api/me', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) {
          setUsage({
            scrapsLeft: d.scrapsLeft ?? 0,
            monthlyLeft: d.usage?.monthlyLeft,
            creditsTotal: d.usage?.creditsTotal,
            unlimitedPromo: !!d.unlimitedPromo,
          });
        } else setUsage(null);
      })
      .catch(() => setUsage(null));
  }

  useEffect(() => {
    fetchUsage();
  }, [isLoading]);

  async function handleRedeemPromo(e: React.FormEvent) {
    e.preventDefault();
    setPromoError(null);
    setPromoSuccess(null);
    setPromoLoading(true);
    try {
      const res = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || 'Code invalide');
        return;
      }
      setPromoSuccess(data.message || 'Code accepté !');
      setPromoCode('');
      setPromoOpen(false);
      fetchUsage();
    } catch {
      setPromoError('Erreur réseau');
    } finally {
      setPromoLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const metier = formData.get('metier') as string;
    const ville = formData.get('ville') as string;
    const maxResults = Math.min(Math.max(parseInt(formData.get('maxResults') as string) || 60, 1), 60);

    onExtract({ metier, ville, maxResults });
  };

  return (
    <section id="extract" className="py-16 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-[#1a0828] via-[#2e0c5a] to-[#1a0828]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-fixora-purple/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-fixora-purple/15 blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto relative">
        <div className="glass-form-dark p-8 sm:p-10 md:p-12">
          {/* Header – chaque bloc sur sa propre ligne */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
              <span className="glass-badge-dark">Extraction rapide</span>
              <span className="text-white/50 text-sm font-medium">jusqu&apos;à 60 / recherche</span>
              {usage != null && typeof usage === 'object' && (
                <span className="glass-badge-dark text-white/90">
                  {usage.scrapsLeft === 'unlimited' || usage.unlimitedPromo
                    ? 'Illimité'
                    : `${usage.scrapsLeft} scrap${usage.scrapsLeft !== 1 ? 's' : ''} restant${usage.scrapsLeft !== 1 ? 's' : ''}`}
                </span>
              )}
            </div>
            {usage === null && (
              <p className="text-sm text-amber-200/90 mb-2">
                <Link href="/login" className="underline font-medium">Connectez-vous</Link>
                {' '}pour extraire des leads.
              </p>
            )}
            {usage != null && usage !== undefined && typeof usage === 'object' && usage.scrapsLeft !== 'unlimited' && !usage.unlimitedPromo && (
              <p className="text-sm text-white/60 mb-2">
                Vous avez un code promo ?{' '}
                <button
                  type="button"
                  onClick={() => { setPromoOpen((o) => !o); setPromoError(null); setPromoSuccess(null); }}
                  className="text-amber-200 hover:underline font-medium"
                >
                  {promoOpen ? 'Masquer' : 'Saisir'}
                </button>
              </p>
            )}
            {promoOpen && usage != null && typeof usage === 'object' && usage.scrapsLeft !== 'unlimited' && !usage.unlimitedPromo && (
              <form onSubmit={handleRedeemPromo} className="flex flex-wrap items-center gap-2 mb-3">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Code promo"
                  className="p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                />
                <button
                  type="submit"
                  disabled={promoLoading}
                  className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-200 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50"
                >
                  {promoLoading ? '…' : 'Valider'}
                </button>
                {promoError && <span className="text-red-300 text-sm">{promoError}</span>}
                {promoSuccess && <span className="text-emerald-300 text-sm">{promoSuccess}</span>}
              </form>
            )}
            {usage != null && typeof usage === 'object' && (usage.scrapsLeft === 'unlimited' || usage.unlimitedPromo) && (
              <p className="text-sm text-emerald-300/90 mb-2">Accès illimité activé (code promo)</p>
            )}
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Configurez votre recherche
            </h2>
            <p className="text-white/70 text-sm sm:text-base max-w-xl leading-relaxed">
              Métier + ville → nom, adresse, téléphone, site, note et nombre d&apos;avis. Export CSV ou PDF.
            </p>
          </div>

          {/* Badges – wrap propre, pas d’empilement */}
          <div className="flex flex-wrap gap-2 mb-8">
            {PRO_BADGES.map((label) => (
              <span key={label} className="glass-badge-dark">
                {label}
              </span>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="min-w-0">
                <label className="block text-sm font-semibold mb-2 text-white/90">
                  Métier recherché
                </label>
                <input
                  name="metier"
                  type="text"
                  placeholder="ex. restaurant, avocat, garage"
                  required
                  className="w-full p-4 glass-input-dark focus:outline-none"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-semibold mb-2 text-white/90">
                  Ville / Pays
                </label>
                <input
                  name="ville"
                  type="text"
                  placeholder="ex. Genève, Paris, Suisse"
                  required
                  className="w-full p-4 glass-input-dark focus:outline-none"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-semibold mb-2 text-white/90">
                  Max résultats
                </label>
                <input
                  name="maxResults"
                  type="number"
                  placeholder="60"
                  defaultValue={60}
                  min={1}
                  max={60}
                  className="w-full p-4 glass-input-dark focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="mt-1.5 text-xs text-white/45">Max 60 (limite Google Places)</p>
              </div>
            </div>

            {/* CTA + disclaimer – empilés verticalement, aucun chevauchement */}
            <div className="flex flex-col gap-4 pt-2">
              <p className="text-xs text-white/50 max-w-xl leading-relaxed">
                Données issues de Google Places. Filtrez par présence de site puis exportez en CSV ou PDF.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="glass-cta w-full sm:w-auto sm:min-w-[220px] text-white p-4 px-8 text-base disabled:opacity-50 disabled:pointer-events-none disabled:transform-none shrink-0"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Extraction en cours…
                    </span>
                  ) : (
                    'Extraire des leads'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
