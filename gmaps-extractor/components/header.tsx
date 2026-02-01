'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setEmail(null);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          GMaps Extractor
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {email ? (
            <>
              <span className="text-sm text-muted-foreground max-w-[180px] truncate">
                {email}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Connexion</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Inscription</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
