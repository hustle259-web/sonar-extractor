export default function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
          Extraction et export en quelques clics
        </h2>
        <p className="text-gray-500 mb-12 max-w-2xl">
          Recherchez par métier et ville, récupérez jusqu&apos;à 60 leads, filtrez par présence de site web, exportez en CSV ou PDF.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex rounded-3xl overflow-hidden glass-card border border-white/60">
            <div className="w-2/5 min-h-[180px] flex items-center justify-center p-6 rounded-r-2xl backdrop-blur-md bg-fixora-green-bg/80 border-r border-white/50">
              <div className="w-full aspect-video rounded-2xl glass flex items-center justify-center border border-white/50">
                <span className="text-sm font-bold uppercase tracking-wider text-fixora-purple/60">Places</span>
              </div>
            </div>
            <div className="w-3/5 p-6 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Google Places API</h3>
              <p className="text-gray-500 text-sm">
                Données à jour, fiables. Nom, adresse, téléphone, site web, note pour chaque entreprise.
              </p>
            </div>
          </div>
          <div className="flex rounded-3xl overflow-hidden glass-card border border-white/60">
            <div className="w-3/5 p-6 flex flex-col justify-center order-2 md:order-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Export CSV & PDF</h3>
              <p className="text-gray-500 text-sm">
                Téléchargez vos leads ou filtrez « avec site » / « sans site » avant d&apos;exporter.
              </p>
            </div>
            <div className="w-2/5 min-h-[180px] flex items-center justify-center p-6 order-1 md:order-2 rounded-l-2xl backdrop-blur-md bg-fixora-green-bg/80 border-l border-white/50">
              <div className="w-full aspect-video rounded-2xl glass flex items-center justify-center border border-white/50">
                <span className="text-sm font-bold uppercase tracking-wider text-fixora-purple/60">Export</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
