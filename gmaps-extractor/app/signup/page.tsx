'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
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

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/` },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Inscription</h1>
        <p className="text-muted-foreground text-sm mt-1">
          GMaps Extractor · 10 scrapes/jour gratuits
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>
            Utilisez email / mot de passe pour vous inscrire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Inscription…' : 'S\'inscrire'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Déjà un compte ?{' '}
            <Link href="/login" className="underline">
              Connexion
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
