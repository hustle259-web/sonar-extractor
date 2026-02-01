'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { downloadCSV } from '@/lib/csv';
import type { LeadItem, LeadRow } from '@/types/leads';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [lead, setLead] = useState<LeadRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/leads/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Lead non trouvé');
        return r.json();
      })
      .then(setLead)
      .catch(() => setError('Lead non trouvé ou accès refusé'))
      .finally(() => setLoading(false));
  }, [id]);

  function handleExportCSV() {
    if (!lead?.data?.length) return;
    const safe = (lead.data as LeadItem[]).filter(
      (x) => x && typeof x === 'object'
    );
    const name = `leads-${lead.query}-${lead.location}-${id.slice(0, 8)}.csv`;
    downloadCSV(safe, name);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Chargement des résultats…</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <p className="text-destructive">{error ?? 'Lead non trouvé'}</p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 size-4" />
            Retour à l’accueil
          </Link>
        </Button>
      </div>
    );
  }

  const rows = (lead.data as LeadItem[])?.filter(
    (x): x is LeadItem => x != null && typeof x === 'object'
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Résultats</h1>
          <p className="text-muted-foreground text-sm">
            {lead.query} · {lead.location} · {rows.length} leads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 size-4" />
              Nouvelle recherche
            </Link>
          </Button>
          <Button onClick={handleExportCSV} disabled={rows.length === 0}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>
            Données extraites depuis Google Maps. Export CSV disponible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucun lead extrait.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.name || '—'}</TableCell>
                      <TableCell>{r.address || '—'}</TableCell>
                      <TableCell>{r.phone || '—'}</TableCell>
                      <TableCell>
                        {r.site ? (
                          <a
                            href={r.site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            Lien
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{r.category || '—'}</TableCell>
                      <TableCell>{r.rating || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
