export function Testimonials() {
  const testimonials = [
    {
      name: "Rajesh Patel",
      role: "Carpenter",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=60&h=60&auto=format&fit=crop",
      testimonial: "KaamMitra has transformed my life. I no longer have to stand at crossroads hoping for work. Now I get regular job alerts on WhatsApp and have built a loyal customer base through good ratings.",
      rating: 5
    },
    {
      name: "Anjali Gupta",
      role: "Homeowner",
      image: "https://images.unsplash.com/photo-1565514020179-026b92b2d9b3?q=80&w=60&h=60&auto=format&fit=crop",
      testimonial: "Finding reliable help for household repairs was always a challenge until I discovered KaamMitra. I can now quickly find verified workers based on their ratings and previous work experience.",
      rating: 4.5
    }
  ];

  return (
    <section className="py-16 bg-neutral-100">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">What People Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-start mb-4">
                <img 
                  src={testimonial.image} 
                  alt={`${testimonial.name} testimonial`} 
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                  width="48"
                  height="48" 
                />
                <div>
                  <h3 className="font-semibold">{testimonial.name}</h3>
                  <p className="text-sm text-primary">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-neutral-700 mb-4">{testimonial.testimonial}</p>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-icons text-yellow-500">
                    {i < Math.floor(testimonial.rating) 
                      ? "star" 
                      : i === Math.floor(testimonial.rating) && testimonial.rating % 1 >= 0.5 
                        ? "star_half" 
                        : "star_border"}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
