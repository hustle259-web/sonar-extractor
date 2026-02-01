import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/40">
      <div className="max-w-5xl mx-auto">
        <div className="glass-card p-8 sm:p-10 rounded-3xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-fixora-purple/90 rounded-lg px-3 py-1.5 flex items-center border border-white/20">
                  <Logo size="sm" />
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Extrayez des leads B2B depuis Google Maps.
              </p>
              <div className="flex gap-3">
                {['Twitter', 'LinkedIn', 'GitHub'].map((name, i) => (
                  <a
                    key={i}
                    href="#"
                    className="text-gray-400 hover:text-fixora-purple transition text-sm"
                  >
                    {name}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-gray-900">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-gray-900">Tarifs</a></li>
                <li><a href="#faq" className="hover:text-gray-900">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-gray-900">Mentions légales</a></li>
                <li><a href="#" className="hover:text-gray-900">Confidentialité</a></li>
                <li><a href="#" className="hover:text-gray-900">CGU</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Newsletter</h4>
              <p className="text-gray-500 text-sm mb-3">
                Restez informé des mises à jour.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email"
                  className="flex-1 px-4 py-2 rounded-xl glass-input text-sm"
                />
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl font-semibold text-white bg-fixora-btn text-sm hover:opacity-95 transition border border-white/20"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-white/40 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} SonarExtractor. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  );
}
