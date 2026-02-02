import Logo from '@/components/Logo';

export default function Hero() {
  return (
    <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-fixora-hero overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,175,0.35),transparent)]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-fixora-green-accent/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
      <div className="relative max-w-5xl mx-auto text-center">
        <div className="flex justify-center -mb-2">
          <Logo size="xl" />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">
          Extraire des milliers de leads B2B
          <br />
          <span className="text-fixora-green-accent">avec SonarExtractor</span>
        </h1>
        <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-10">
          Restaurants, dentistes, avocats… Trouvez des entreprises sur Google Maps en quelques secondes. Export CSV et PDF.
        </p>
        <a
          href="#extract"
          className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold text-white bg-white/20 backdrop-blur-xl border border-white/30 hover:bg-white/30 transition shadow-xl"
        >
          Extraire des leads
        </a>
      </div>
      <div className="relative max-w-5xl mx-auto mt-12 px-4">
        <div className="rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/5 border border-white/15 shadow-2xl">
          <div className="p-4 border-b border-white/10 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400/90 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-amber-400/90 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/90 shadow-sm" />
            <span className="ml-2 text-white/60 text-sm">SonarExtractor · Extraction</span>
          </div>
          <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['Métier', 'Ville', 'Max 60', 'Export'].map((label, i) => (
              <div key={i} className="rounded-2xl p-4 backdrop-blur-md bg-white/10 border border-white/15">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">{label}</p>
                <p className="text-white font-medium">—</p>
              </div>
            ))}
          </div>
          <div className="h-24 flex items-center justify-center border-t border-white/10 bg-white/5">
            <span className="text-white/40 text-sm">Résultats : nom, adresse, téléphone, site web, note</span>
          </div>
        </div>
      </div>
    </section>
  );
}
