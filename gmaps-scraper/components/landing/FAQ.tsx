'use client';

import { useState } from 'react';

const items = [
  {
    q: 'Comment extraire des leads ?',
    a: 'Saisissez un métier (ex. restaurant, avocat) et une ville. Cliquez sur « Extraire des leads ». Vous obtiendrez jusqu\'à 60 résultats avec nom, adresse, téléphone, site web et note.',
  },
  {
    q: 'Quelle est la limite de résultats ?',
    a: 'Google Places API permet jusqu\'à 60 résultats par recherche. Vous pouvez filtrer « avec site » ou « sans site » puis exporter en CSV ou PDF.',
  },
  {
    q: 'Les données sont-elles à jour ?',
    a: 'Oui. Nous utilisons l\'API officielle Google Places, qui fournit des données actuelles.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
          Questions fréquentes
        </h2>
        <p className="text-gray-500 mb-10">
          Réponses aux questions les plus courantes sur SonarExtractor.
        </p>
        <div className="glass-card overflow-hidden">
          {items.map((item, i) => (
            <div
              key={i}
              className="border-b border-white/40 last:border-b-0"
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/30 transition rounded-none"
              >
                <span className="font-semibold text-gray-900">{item.q}</span>
                <span className="text-fixora-purple text-xl font-bold">
                  {open === i ? '−' : '+'}
                </span>
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-gray-500 text-sm leading-relaxed bg-white/20">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
