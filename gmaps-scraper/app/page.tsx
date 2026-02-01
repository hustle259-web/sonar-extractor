'use client';

import { useState } from 'react';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import TrustedBy from '@/components/landing/TrustedBy';
import LeadForm from '@/components/landing/LeadForm';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import CTABlock from '@/components/landing/CTABlock';
import Footer from '@/components/landing/Footer';

type Lead = {
  name: string;
  address: string;
  phone?: string;
  site?: string;
  rating?: string;
  reviewCount?: number | null;
  mapsUrl?: string;
};

type SiteFilter = 'all' | 'with_site' | 'without_site';

function hasSite(l: Lead): boolean {
  return !!(l.site && String(l.site).trim() !== '');
}

function filterBySite(leads: Lead[], filter: SiteFilter): Lead[] {
  if (filter === 'all') return leads;
  if (filter === 'with_site') return leads.filter(hasSite);
  return leads.filter((l) => !hasSite(l));
}

function escapeCsv(s: string): string {
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadLeadsCsv(leads: Lead[], query: string, location: string) {
  const headers = ['Nom', 'Adresse', 'Téléphone', 'Site web', 'A un site', 'Note', 'Nb avis', 'Lien Maps'];
  const rows = leads.map((l) => [
    escapeCsv(l.name),
    escapeCsv(l.address ?? ''),
    escapeCsv(l.phone ?? ''),
    escapeCsv(l.site ?? ''),
    (l.site && l.site.trim() !== '') ? 'Oui' : 'Non',
    escapeCsv(l.rating ?? ''),
    l.reviewCount != null ? String(l.reviewCount) : '',
    escapeCsv(l.mapsUrl ?? ''),
  ]);
  const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-${safeFilename(query, 'query')}-${safeFilename(location, 'ville')}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function safeFilename(str: string, fallback: string) {
  return str.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || fallback;
}

async function downloadLeadsPdf(leads: Lead[], query: string, location: string) {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const title = `${leads.length} leads — ${query} à ${location}`;
  doc.setFontSize(16);
  doc.text(title, 14, 12);
  doc.setFontSize(10);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 18);

  const head = [['Nom', 'Adresse', 'Téléphone', 'Site web', 'Note', 'Nb avis', 'Maps']];
  const body = leads.map((l) => [
    l.name,
    l.address ?? '',
    l.phone ?? '—',
    l.site && l.site.trim() !== '' ? 'Oui' : 'Non',
    l.rating ?? '—',
    l.reviewCount != null ? String(l.reviewCount) : '—',
    l.mapsUrl?.trim() ? 'Lien' : '—',
  ]);

  (doc as unknown as { autoTable: (opts: object) => void }).autoTable({
    head,
    body,
    startY: 22,
    theme: 'striped',
    headStyles: { fillColor: [94, 44, 143], textColor: 255 },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 7, cellPadding: 2 },
  });

  const fname = `leads-${safeFilename(query, 'query')}-${safeFilename(location, 'ville')}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
}

export default function Index() {
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState({ metier: '', ville: '' });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [siteFilter, setSiteFilter] = useState<SiteFilter>('all');
  const [error, setError] = useState<string | null>(null);

  const filteredLeads = filterBySite(leads, siteFilter);

  const handleExtract = async (data: { metier: string; ville: string; maxResults: number }) => {
    setIsLoading(true);
    setShowResults(false);
    setSearchQuery({ metier: data.metier, ville: data.ville });
    setSiteFilter('all');
    setError(null);
    setLeads([]);

    try {
      const formData = new FormData();
      formData.append('query', data.metier);
      formData.append('location', data.ville);
      formData.append('maxResults', data.maxResults.toString());

      const res = await fetch('/api/scrape', { method: 'POST', body: formData, credentials: 'same-origin' });
      const responseData = await res.json();

      if (!res.ok) {
        const errorMsg = responseData.error || 'Erreur lors du scraping';
        if (res.status === 401) {
          setError('Connectez-vous pour extraire des leads.');
          return;
        }
        if (res.status === 402) {
          setError(errorMsg);
          return;
        }
        if (res.status === 403 && responseData.blockingReason) {
          throw new Error(
            responseData.blockingReason === 'captcha'
              ? 'Google Maps a affiché un captcha. Réessayez plus tard.'
              : 'Google Maps a détecté une activité automatisée. Réessayez plus tard.'
          );
        }
        throw new Error(errorMsg);
      }

      if (Array.isArray(responseData)) {
        setLeads(responseData);
        setShowResults(true);
        if (responseData.length === 0) {
          setError('Aucun résultat trouvé. Vérifie la console du serveur pour plus de détails.');
        }
      } else if (responseData.leads && Array.isArray(responseData.leads)) {
        setLeads(responseData.leads);
        setShowResults(true);
        if (responseData.leads.length === 0) {
          setError('Aucun résultat trouvé. Vérifie la console du serveur pour plus de détails.');
        }
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLeads([]);
      console.error('Scrape error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <TrustedBy />
      <LeadForm onExtract={handleExtract} isLoading={isLoading} />

      {error && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-2xl p-6 text-center backdrop-blur-xl bg-red-50/80 border border-red-200/60 shadow-lg">
            <p className="text-red-600 font-semibold text-lg mb-2">Erreur</p>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {showResults && leads.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-black text-gray-900 text-center sm:text-left">
                {filteredLeads.length === leads.length
                  ? `${leads.length} entreprises pour « ${searchQuery.metier} » à ${searchQuery.ville}`
                  : `${filteredLeads.length} / ${leads.length} entreprises (filtrées)`}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <span className="hidden sm:inline">Filtrer :</span>
                  <select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value as SiteFilter)}
                    className="px-4 py-2.5 glass-input rounded-2xl focus:ring-2 focus:ring-fixora-purple/40 focus:border-fixora-purple text-gray-800"
                  >
                    <option value="all">Tous</option>
                    <option value="with_site">Avec site</option>
                    <option value="without_site">Sans site</option>
                  </select>
                </label>
                <button
                  type="button"
                  disabled={filteredLeads.length === 0}
                  onClick={() => downloadLeadsCsv(filteredLeads, searchQuery.metier, searchQuery.ville)}
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 bg-fixora-green-accent/90 backdrop-blur-md border border-white/40 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-2xl shadow-lg transition"
                >
                  CSV
                </button>
                <button
                  type="button"
                  disabled={filteredLeads.length === 0}
                  onClick={() => downloadLeadsPdf(filteredLeads, searchQuery.metier, searchQuery.ville)}
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 bg-fixora-btn hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg border border-white/20 transition"
                >
                  PDF
                </button>
              </div>
            </div>
            <div className="glass-card overflow-hidden rounded-3xl">
              {filteredLeads.length === 0 ? (
                <div className="p-12 text-center text-gray-500 bg-white/30">
                  <p className="font-medium">Aucun résultat pour ce filtre.</p>
                  <p className="mt-2 text-sm">Changez le filtre ou relancez une extraction.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white/40 border-b border-white/50">
                        <th className="p-4 text-left text-gray-700 font-semibold">Nom</th>
                        <th className="p-4 text-left text-gray-700 font-semibold">Adresse</th>
                        <th className="p-4 text-left text-gray-700 font-semibold">Téléphone</th>
                        <th className="p-4 text-left text-gray-700 font-semibold">Site web</th>
                        <th className="p-4 text-left text-gray-700 font-semibold">Note</th>
                        <th className="p-4 text-left text-gray-700 font-semibold">Nb avis</th>
                        <th className="p-4 text-left text-gray-700 font-semibold">Maps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead, i) => (
                        <tr key={i} className="border-b border-white/30 hover:bg-white/40 transition-colors">
                          <td className="p-4 font-medium text-gray-900">{lead.name}</td>
                          <td className="p-4 text-gray-600">{lead.address}</td>
                          <td className="p-4 text-gray-600">{lead.phone || '—'}</td>
                          <td className="p-4">
                            {lead.site && lead.site.trim() !== '' ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="text-fixora-green-accent font-medium">Oui</span>
                                <a
                                  href={lead.site.startsWith('http') ? lead.site : `https://${lead.site}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-fixora-purple hover:underline text-sm"
                                >
                                  Voir
                                </a>
                              </span>
                            ) : (
                              <span className="text-gray-400">Non</span>
                            )}
                          </td>
                          <td className="p-4 text-gray-600">{lead.rating ?? '—'}</td>
                          <td className="p-4 text-gray-600">{lead.reviewCount != null ? lead.reviewCount.toLocaleString('fr-FR') : '—'}</td>
                          <td className="p-4">
                            {lead.mapsUrl?.trim() ? (
                              <a
                                href={lead.mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-fixora-purple hover:underline text-sm font-medium"
                              >
                                Voir sur Maps
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <Features />
      <Pricing />
      <FAQ />
      <CTABlock />
      <Footer />
    </div>
  );
}
