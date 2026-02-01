'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const schema = z.object({
  query: z.string().min(1, 'Requis'),
  location: z.string().min(1, 'Requis'),
  maxResults: z.coerce.number().min(1).max(500).default(100),
});

type FormData = z.infer<typeof schema>;

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { query: 'dentiste', location: 'Paris', maxResults: 100 },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError(null);
    setProgress(10);

    try {
      const timer = setInterval(() => {
        setProgress((p) => Math.min(p + 8, 90));
      }, 800);

      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      clearInterval(timer);
      setProgress(100);

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.error ?? 'Erreur lors du scrape');
        return;
      }

      router.push(`/results/${json.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Google Maps Business Extractor
        </h1>
        <p className="text-muted-foreground">
          Extrayez des leads B2B (nom, adresse, tél, site, note) depuis Google
          Maps.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle recherche</CardTitle>
          <CardDescription>
            Saisissez une requête (ex. dentiste, plombier) et un lieu (ex. Paris).
            Limite gratuite : 10 scrapes / jour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="query">Query</Label>
              <Input
                id="query"
                placeholder="ex. dentiste"
                {...register('query')}
              />
              {errors.query && (
                <p className="text-sm text-destructive">{errors.query.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                placeholder="ex. Paris"
                {...register('location')}
              />
              {errors.location && (
                <p className="text-sm text-destructive">
                  {errors.location.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxResults">Nombre max de résultats</Label>
              <Input
                id="maxResults"
                type="number"
                min={1}
                max={500}
                {...register('maxResults')}
              />
              {errors.maxResults && (
                <p className="text-sm text-destructive">
                  {errors.maxResults.message}
                </p>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {loading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground">
                  Scrape en cours… (30 s max)
                </p>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Scraper
                </>
              ) : (
                'Lancer le scrape'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
