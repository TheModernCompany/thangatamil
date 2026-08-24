import { useMediaQuery } from 'react-responsive';
import BackgroundImage from '../assets/Background_Image.png';
import MobileBackgroundImage from '../assets/Mobile_Background_Image.png.png';
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  
  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${isMobile ? MobileBackgroundImage : BackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-opacity-10" />
      
      {/* Content */}
      <div className="relative container mx-auto px-4 py-20 min-h-screen flex items-center">
        <div className={`max-w-3xl w-full ${isMobile ? 'flex flex-col justify-between h-full' : ''}`}>
          {/* Heading and description - hidden on mobile */}
          <div className="hidden md:block">
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold mb-4 leading-tight">
              <span 
                className="text-white" 
                style={{ textShadow: '4px 4px 8px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.6)' }}
              >
                PREMIUM QUALITY{' '}
              </span>
              <span 
                className="text-[#FFD700]" 
                style={{ textShadow: '4px 4px 8px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.6)' }}
              >
                FIREWORKS
              </span>
            </h1>
            <p className="text-base md:text-lg text-gray-200 mb-8 max-w-2xl">
              Bringing Joy, Lights & Happiness to Your Celebrations
            </p>
          </div>
          
          {/* Spacer to push buttons down on mobile */}
          {isMobile && <div className="flex-1" />}
          
          {/* Buttons - at bottom on mobile, normal position on desktop */}
          <div className={`flex flex-wrap gap-4 ${isMobile ? 'justify-center pb-4' : ''}`}>
            <button
  onClick={() => navigate("/products")}
  className="bg-[#FF6B00] hover:bg-[#E85E00] text-white font-semibold px-6 md:px-8 py-2 md:py-3 rounded-lg transition duration-300 shadow-lg hover:shadow-xl text-sm md:text-base min-w-[140px]"
>
  EXPLORE PRODUCTS
</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;