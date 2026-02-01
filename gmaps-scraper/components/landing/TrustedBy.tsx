export default function TrustedBy() {
  const logos = ['Google Maps', 'API Places', 'Supabase', 'Vercel', 'Next.js'];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto text-center">
        <div className="glass-card py-8 px-6">
          <p className="text-gray-500 font-medium mb-6">
            Propulsé par des technologies fiables
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-70">
            {logos.map((name, i) => (
              <span
                key={i}
                className="text-gray-400 font-semibold text-sm sm:text-base"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
