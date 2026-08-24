import { useState } from 'react';
import { Link } from 'react-router-dom'; // Add this import for navigation
import logo from '../assets/Logo.png'; // Replace with your actual logo path

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'HOME', href: '/' },
    { name: 'OUR PRODUCTS', href: '/products' },
    { name: 'ABOUT US', href: '/about' },
    { name: 'CONTACT US', href: '/contact' },
  ];

  return (
    <header className="bg-black shadow-lg sticky top-0 z-50 border-b border-gold-500/30">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section - Clickable to navigate home */}
          <Link to="/" className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity duration-300">
            <img 
              src={logo} 
              alt="Thangatamil Crackers Logo" 
              className="h-14 w-auto object-contain"
            />
            <div className="block">
              <h1 className="text-amber-400 font-bold text-lg sm:text-xl tracking-wider">
                THANGATAMIL 
              </h1>
              <p className="text-amber-400 text-[10px] sm:text-xs font-semibold tracking-widest">
                CRACKERS
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group">
                <Link
                  to={link.href}
                  className="text-gray-300 hover:text-amber-400 px-3 py-2 text-sm font-semibold transition duration-300 ease-in-out flex items-center"
                >
                  {link.name}
                </Link>
              </div>
            ))}
          </div>

          {/* Register Button - Updated to navigate to UserRegister */}
          <div className="hidden md:block">
            <Link to="/register">
              <button className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-bold py-2 px-6 rounded-full transition duration-300 transform hover:scale-105 shadow-lg shadow-amber-500/25 text-sm">
                REGISTER
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-amber-400 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-gray-300 hover:text-amber-400 px-3 py-2 text-sm font-semibold transition duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {/* Updated Register button in mobile menu */}
              <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                <button className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-bold py-2 px-6 rounded-full transition duration-300 w-full">
                  REGISTER
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;