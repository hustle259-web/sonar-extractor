import Logo from '@/components/Logo';

export default function CTABlock() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden backdrop-blur-2xl bg-fixora-purple/90 border border-white/20 shadow-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_50%,rgba(255,255,255,0.15),transparent)]" />
          <div className="relative">
            <div className="mb-4">
              <Logo size="sm" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
              Prêt à extraire des leads ?
            </h2>
            <p className="text-white/90 max-w-xl">
              Tapez métier + ville, exportez en CSV ou PDF. Simple et rapide.
            </p>
          </div>
          <div className="relative flex flex-col items-center sm:items-end gap-2 shrink-0">
            <span className="text-4xl sm:text-5xl font-black text-white/90">60</span>
            <span className="text-white/70 text-sm">leads max / recherche</span>
          </div>
          <a
            href="#extract"
            className="relative shrink-0 inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold text-white bg-white/25 backdrop-blur-md border border-white/30 hover:bg-white/35 transition shadow-lg"
          >
            Extraire des leads
          </a>
        </div>
      </div>
    </section>
  );
}
