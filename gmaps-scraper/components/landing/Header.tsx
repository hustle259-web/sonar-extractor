'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Header() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => setUser(d?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    setUser(null);
    window.location.href = '/';
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-fixora-purple/80 border-b border-white/10 shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
            <Logo size="sm" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/85 hover:text-white font-medium transition">
              Fonctionnalités
            </a>
            <a href="#pricing" className="text-white/85 hover:text-white font-medium transition">
              Tarifs
            </a>
            <a href="#faq" className="text-white/85 hover:text-white font-medium transition">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#extract"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-medium text-white/90 hover:bg-white/10 transition"
            >
              Extraire
            </a>
            {!loading && (
              user ? (
                <>
                  <Link
                    href="/admin"
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white/90 hover:bg-white/10 transition"
                  >
                    Admin
                  </Link>
                  <span className="text-white/80 text-sm truncate max-w-[120px] hidden md:inline">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white/90 hover:bg-white/10 transition"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white/90 hover:bg-white/10 transition"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2.5 rounded-xl font-semibold bg-white/20 backdrop-blur-md text-white border border-white/25 hover:bg-white/30 transition shadow-lg"
                  >
                    S&apos;inscrire
                  </Link>
                </>
              )
            )}
            {loading && <span className="text-white/60 text-sm">…</span>}
          </div>
        </div>
      </nav>
    </header>
  );
}
