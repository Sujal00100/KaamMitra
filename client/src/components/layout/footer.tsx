import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <span className="material-icons text-3xl mr-2">handyman</span>
              <h2 className="text-xl font-bold">WorkBuddy</h2>
            </div>
            <p className="text-neutral-300 mb-4">Connecting daily wage workers with local job opportunities.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-primary transition">
                <span className="material-icons">facebook</span>
              </a>
              <a href="#" className="text-white hover:text-primary transition">
                <span className="material-icons">insert_link</span>
              </a>
              <a href="#" className="text-white hover:text-primary transition">
                <span className="material-icons">whatsapp</span>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-neutral-300">
              <li><Link href="/" className="hover:text-white transition">Home</Link></li>
              <li><a href="/#how-it-works" className="hover:text-white transition">How It Works</a></li>
              <li><a href="/#for-workers" className="hover:text-white transition">For Workers</a></li>
              <li><a href="/#for-employers" className="hover:text-white transition">For Employers</a></li>
              <li><a href="#" className="hover:text-white transition">About Us</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-neutral-300">
              <li><a href="#" className="hover:text-white transition">Construction</a></li>
              <li><a href="#" className="hover:text-white transition">Plumbing</a></li>
              <li><a href="#" className="hover:text-white transition">Electrical</a></li>
              <li><a href="#" className="hover:text-white transition">Housekeeping</a></li>
              <li><a href="#" className="hover:text-white transition">Carpentry</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-neutral-300">
              <li className="flex items-start">
                <span className="material-icons mr-2 text-neutral-400">email</span>
                <span>support@kaammitra.in</span>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 text-neutral-400">phone</span>
                <span>+91 9876543210</span>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 text-neutral-400">location_on</span>
                <span>123 Tech Park, Bangalore, India</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 mt-8 pt-8 text-center text-neutral-400">
          <p>&copy; {new Date().getFullYear()} WorkBuddy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
