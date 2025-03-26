import { Link } from "wouter";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary to-blue-700 text-white py-12 md:py-24 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 rounded-full bg-white"></div>
        <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <div className="mb-2 inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
              <span className="mr-2">🌟</span> KaamMitra - Connecting Talent with Opportunity
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Find Local Work. Hire Local Talent.</h1>
            <p className="text-lg mb-8 text-blue-100">Connecting daily wage workers with employers in your neighborhood. No middlemen, just honest work.</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth?tab=register&type=worker" className="bg-white text-primary font-medium py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors duration-300 flex items-center justify-center shadow-lg">
                <span className="material-icons mr-2">person</span>
                I'm a Worker
              </Link>
              <Link href="/auth?tab=register&type=employer" className="bg-[#0066cc] text-white font-medium py-3 px-6 rounded-lg hover:bg-[#0052a3] transition-colors duration-300 flex items-center justify-center shadow-lg border border-white/20">
                <span className="material-icons mr-2">business</span>
                I'm an Employer
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-transparent rounded-lg"></div>
              <img 
                src="https://images.unsplash.com/photo-1565604021779-5d7a86b73c3c?q=80&w=600&h=400&auto=format&fit=crop" 
                alt="Workers at a construction site" 
                className="rounded-lg shadow-2xl border-2 border-white/20" 
                width="600" 
                height="400" 
              />
              <div className="absolute -bottom-4 -right-4 bg-blue-600 text-white py-2 px-4 rounded-lg shadow-lg">
                <p className="font-bold">Trusted by thousands!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating stats card */}
      <div className="bg-white text-neutral-900 rounded-lg shadow-2xl p-6 max-w-sm mx-auto md:mx-0 md:absolute md:bottom-0 md:right-24 md:translate-y-1/2 border-b-4 border-primary">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">5000+</p>
            <p className="text-neutral-700 font-medium">Workers</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">3200+</p>
            <p className="text-neutral-700 font-medium">Jobs Completed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">1800+</p>
            <p className="text-neutral-700 font-medium">Employers</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">4.8/5</p>
            <p className="text-neutral-700 font-medium">User Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
}
