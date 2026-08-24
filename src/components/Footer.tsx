import React from 'react';
import logo from '../assets/Logo.png';

const Footer: React.FC = () => {
  const phoneNumber = "9092920277";
  const whatsappLink = `https://wa.me/${phoneNumber}`;
  const location = "Elayirampannai Rd, Kovilpatti, Chittrampatti, Tamil Nadu 628502";
  const mapsLink = "https://maps.app.goo.gl/fFwpoRZtvDwfy6hP6";

  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand / About with Logo */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={logo} 
                alt="Thangatamil Crackers - Premium Fireworks" 
                className="w-12 h-12 object-contain"
              />
              <h2 className="text-2xl font-bold text-yellow-500">THANGATAMIL CRACKERS</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Premium quality crackers and fireworks for all celebrations. 
              Safety first, fun always. Since 1995.
            </p>
          </div>

          {/* Location / Map */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-yellow-500">Visit Our Store</h3>
            <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-800 relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3938.5856664590633!2d77.8537807!3d9.1917948!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b06b3369cb63cd3%3A0x7fa831bd1d225f2d!2sThangatamil%20crackers!5e0!3m2!1sen!2sin!4v1785566735928!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Thangatamil Crackers Location"
                className="rounded-lg"
              />
            </div>
            <a 
              href={mapsLink}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-yellow-500 hover:text-yellow-400 text-sm mt-2 inline-flex items-center gap-1 transition"
            >
              <span>📍</span> Get Directions on Google Maps
            </a>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-yellow-500">Contact Us</h3>
            
            {/* Phone / WhatsApp */}
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-1"> Phone / WhatsApp</p>
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-yellow-500 transition flex items-center gap-2 text-lg font-medium"
              >
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                +91 90929 20277
              </a>
            </div>

            {/* Location Details */}
            <div>
              <p className="text-gray-400 text-sm mb-1">📍 Store Address</p>
              <a 
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-yellow-500 transition text-sm block"
              >
                {location}
              </a>
            </div>

            
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Thangatamil Crackers. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <span className="flex items-center gap-1">
              <span className="text-yellow-500">✦</span> Made with Safety
            </span>
            <span className="flex items-center gap-1">
              <span className="text-yellow-500">✦</span> ISO Certified
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;