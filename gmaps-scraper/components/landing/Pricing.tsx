'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PLANS, CREDIT_PACKS, type PlanId, type CreditPackId } from '@/lib/plans';

type CheckoutMode = 'subscription_pro' | 'subscription_startup' | 'credits_small' | 'credits_medium' | 'credits_large' | 'credits_xl';

export default function Pricing() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/me', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d?.user))
      .catch(() => setLoggedIn(false));
  }, []);

  async function handleCheckout(mode: CheckoutMode) {
    if (!loggedIn) {
      window.location.href = `/login?next=${encodeURIComponent('/#pricing')}`;
      return;
    }
    setLoading((s) => ({ ...s, [mode]: true }));
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          mode,
          successUrl: `${location.origin}/?checkout=success`,
          cancelUrl: `${location.origin}/#pricing`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur checkout');
    } finally {
      setLoading((s) => ({ ...s, [mode]: false }));
    }
  }

  const planOrder: PlanId[] = ['free', 'pro', 'startup'];
  const plans = planOrder.map((id) => ({ id, ...PLANS[id] }));

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black text-center text-gray-900 mb-4">
          Tarifs
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
          Free, Pro, Startup ou crédits à l&apos;unité. Les crédits sont valables à vie et utilisés après les quotas mensuels.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 sm:p-8 glass-card ${
                plan.id === 'pro' ? 'ring-2 ring-fixora-purple/50 shadow-xl' : ''
              }`}
            >
              {plan.id === 'pro' && (
                <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-fixora-btn text-white mb-4 backdrop-blur-md border border-white/20">
                  Populaire
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-3xl font-black text-gray-900">
                  {plan.priceUsd === 0 ? 'Gratuit' : `$${plan.priceUsd}`}
                </span>
                {plan.priceUsd > 0 && (
                  <span className="text-gray-500 ml-1">/ mois</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {plan.scrapsPerMonth} scrap{plan.scrapsPerMonth > 1 ? 's' : ''} / mois = {plan.extractions.toLocaleString('fr-FR')} extractions
              </p>
              <ul className="space-y-3 mb-8">
                {plan.id === 'free' && (
                  <>
                    <li className="flex items-center gap-2 text-gray-600"><span className="text-fixora-green-accent">✓</span> Filtres basiques</li>
                    <li className="flex items-center gap-2 text-gray-600"><span className="text-fixora-green-accent">✓</span> Export CSV</li>
                    <li className="flex items-center gap-2 text-gray-600"><span className="text-fixora-green-accent">✓</span> Branding visible</li>
                  </>
                )}
                {plan.id === 'pro' && (
                  <>
                    <li className="flex items-center gap-2 text-gray-600"><span className="text-fixora-green-accent">✓</span> Filtres avancés</li>
                    <li className="flex items-center gap-2 text-gray-600"><span className="text-fixora-green-accent">✓</span> Déduplication</li>
                    <li className="flex items-center gap-2 text-gray-600"><span className="text-fixora-green-accent">✓</span> Export CSV + Google Sheets</li>
                    <li className="flex items-center gap-2 text-gray-600"><span className="text-fixora-green-accent">✓</span> Historique 30 jours</li>
                    <li className="flex items-center gap-2 text-gray-600"><span className="text-fixora-green-accent">✓</span> Support standard</li>
                  </>
                )}
                {plan.id === 'startup' && (
                  <>
                    <li className="flex items-center gap-2 text-gray-600"><span className="text-fixora-green-accent">✓</span> Tout Pro inclus</li>
                    <li className="flex items-center gap-2 text-gray-600"><span className="text-fixora-green-accent">✓</span> Lead scoring</li>
                    <li className="flex items-center gap-2 text-gray-600"><span className="text-fixora-green-accent">✓</span> Détection opportunités (no website, low rating)</li>
                    <li className="flex items-center gap-2 text-gray-600"><span className="text-fixora-green-accent">✓</span> Historique 6 mois</li>
                    <li className="flex items-center gap-2 text-gray-600"><span className="text-fixora-green-accent">✓</span> Support prioritaire</li>
                  </>
                )}
              </ul>
              {plan.id === 'free' ? (
                <Link
                  href="/signup"
                  className="block w-full py-3 rounded-2xl font-semibold text-center glass-input hover:bg-white/70 text-gray-900"
                >
                  S&apos;inscrire
                </Link>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.id === 'pro' ? 'subscription_pro' : 'subscription_startup')}
                  disabled={loading['subscription_pro'] || loading['subscription_startup']}
                  className={`block w-full py-3 rounded-2xl font-semibold transition ${
                    plan.id === 'pro'
                      ? 'bg-fixora-btn text-white hover:opacity-95 border border-white/20'
                      : 'glass-input hover:bg-white/70 text-gray-900'
                  } disabled:opacity-50`}
                >
                  {loading[plan.id === 'pro' ? 'subscription_pro' : 'subscription_startup'] ? 'Redirection…' : 'Choisir'}
                </button>
              )}
            </div>
          ))}
        </div>

        <h3 className="text-xl font-bold text-center text-gray-900 mb-6">
          Crédits à l&apos;unité (valables à vie, utilisés après les quotas mensuels)
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['small', 'medium', 'large', 'xl'] as CreditPackId[]).map((pack) => {
            const p = CREDIT_PACKS[pack];
            const mode = `credits_${pack}` as CheckoutMode;
            return (
              <div key={pack} className="rounded-2xl p-6 glass-card">
                <h4 className="font-bold text-gray-900 capitalize mb-1">{pack}</h4>
                <p className="text-2xl font-black text-gray-900 mb-1">${p.priceUsd}</p>
                <p className="text-sm text-gray-600 mb-4">
                  {p.scraps} scraps = {p.extractions.toLocaleString('fr-FR')} extractions
                </p>
                <button
                  onClick={() => handleCheckout(mode)}
                  disabled={!!loading[mode]}
                  className="w-full py-2.5 rounded-xl font-semibold glass-input hover:bg-white/70 text-gray-900 disabled:opacity-50"
                >
                  {loading[mode] ? 'Redirection…' : 'Acheter'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
