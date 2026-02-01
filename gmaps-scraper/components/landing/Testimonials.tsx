export default function Testimonials() {
  const testimonials = [
    {
      name: 'Marie Dubois',
      role: 'CEO, StartupTech',
      content: 'SonarExtractor m\'a fait gagner des heures de recherche manuelle. Incroyable !',
      avatar: '👩‍💼',
    },
    {
      name: 'Jean Martin',
      role: 'Commercial, SalesPro',
      content: 'J\'ai trouvé 500+ leads en 5 minutes. Un outil indispensable pour mon équipe.',
      avatar: '👨‍💻',
    },
    {
      name: 'Sophie Laurent',
      role: 'Marketing Manager',
      content: 'Simple, rapide, efficace. Exactement ce dont j\'avais besoin pour ma prospection.',
      avatar: '👩‍🎨',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-black text-center mb-16 text-gray-900">
          Témoignages
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center text-2xl mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
              <p className="text-gray-700 italic">"{testimonial.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
