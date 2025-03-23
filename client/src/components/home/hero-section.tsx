import { Link } from "wouter";

export function HeroSection() {
  return (
    <section className="relative bg-primary text-white py-12 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Local Work. Hire Local Talent.</h1>
            <p className="text-lg mb-6">Connecting daily wage workers with employers in your neighborhood. No middlemen, just honest work.</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth?tab=register&type=worker" className="bg-white text-primary font-medium py-3 px-6 rounded flex items-center justify-center">
                <span className="material-icons mr-2">person</span>
                I'm a Worker
              </Link>
              <Link href="/auth?tab=register&type=employer" className="bg-[#FFA500] text-white font-medium py-3 px-6 rounded flex items-center justify-center">
                <span className="material-icons mr-2">business</span>
                I'm an Employer
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <img src="https://images.unsplash.com/photo-1565604021779-5d7a86b73c3c?q=80&w=600&h=400&auto=format&fit=crop" 
                 alt="Workers at a construction site" 
                 className="rounded-lg shadow-lg" 
                 width="600" 
                 height="400" />
          </div>
        </div>
      </div>
      
      {/* Floating stats card */}
      <div className="bg-white text-neutral-900 rounded-lg shadow-xl p-6 max-w-sm mx-auto md:mx-0 md:absolute md:bottom-0 md:right-24 md:translate-y-1/2">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">5000+</p>
            <p className="text-neutral-700">Workers</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">3200+</p>
            <p className="text-neutral-700">Jobs Completed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">1800+</p>
            <p className="text-neutral-700">Employers</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">4.8/5</p>
            <p className="text-neutral-700">User Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
}
