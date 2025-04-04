import { Link } from "wouter";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary to-purple-700 text-white py-12 md:py-24 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 rounded-full bg-white"></div>
        <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <div className="mb-2 inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium animate-pulse">
              <span className="mr-2">✨</span> WorkBuddy - Connecting Talent with Opportunity
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent drop-shadow-lg">Find Local Work. Hire Local Talent.</h1>
            <p className="text-lg mb-8 text-blue-100 animate-fadeIn">Connecting daily wage workers with employers in your neighborhood. No middlemen, just honest work.</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register?type=worker" className="bg-white text-primary font-medium py-3 px-6 rounded-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-purple-300/50 hover:-translate-y-1">
                <span className="material-icons mr-2">person</span>
                I'm a Worker
              </Link>
              <Link href="/register?type=employer" className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-600 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-purple-500/50 hover:-translate-y-1 border border-white/20">
                <span className="material-icons mr-2">business</span>
                I'm an Employer
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <div className="relative transform transition-transform hover:scale-[1.02] duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/40 to-pink-500/20 rounded-xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1565604021779-5d7a86b73c3c?q=80&w=600&h=400&auto=format&fit=crop" 
                alt="Workers at a construction site" 
                className="rounded-xl shadow-2xl border-2 border-white/30 object-cover w-full h-auto" 
                width="600" 
                height="400" 
                loading="eager"
              />
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 px-4 rounded-lg shadow-lg animate-pulse">
                <p className="font-bold">Trusted by thousands!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating stats card */}
      <div className="bg-white/95 backdrop-blur-sm text-neutral-900 rounded-xl shadow-2xl p-6 max-w-sm mx-auto md:mx-0 md:absolute md:bottom-0 md:right-24 md:translate-y-1/2 border-b-4 border-primary hover:shadow-purple-300/30 transition-shadow duration-300">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center group">
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">5000+</p>
            <p className="text-neutral-700 font-medium">Workers</p>
          </div>
          <div className="text-center group">
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">3200+</p>
            <p className="text-neutral-700 font-medium">Jobs Completed</p>
          </div>
          <div className="text-center group">
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">1800+</p>
            <p className="text-neutral-700 font-medium">Employers</p>
          </div>
          <div className="text-center group">
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">4.8/5</p>
            <p className="text-neutral-700 font-medium">User Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
}
