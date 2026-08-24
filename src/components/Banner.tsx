import React, { useState, useEffect, useCallback } from 'react';
// Import your images - KEEPING YOUR ORIGINAL METHOD
import banner1 from '../assets/banner 1.png';
import banner2 from '../assets/banner.png';

interface BannerImage {
  id: number;
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
}

const bannerImages: BannerImage[] = [
  {
    id: 1,
    src: banner1,
    alt: 'Banner 1',
    title: 'Welcome to Thanga Tamil',
    subtitle: 'Your trusted partner',
  },
  {
    id: 2,
    src: banner2,
    alt: 'Banner 2',
    title: 'Quality Services',
    subtitle: 'Committed to excellence',
  },
];

const Banner: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const totalSlides = bannerImages.length;

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    },
    [isTransitioning]
  );

  const goToNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % totalSlides;
    goToSlide(nextIndex);
  }, [currentIndex, goToSlide, totalSlides]);

  const goToPrev = useCallback(() => {
    const prevIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    goToSlide(prevIndex);
  }, [currentIndex, goToSlide, totalSlides]);

  useEffect(() => {
    const timer = setInterval(goToNext, 4000);
    return () => clearInterval(timer);
  }, [goToNext]);

  return (
    <div className="relative w-full h-[200px] xs:h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[600px] overflow-hidden bg-gray-900">
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {bannerImages.map((image) => (
          <div
            key={image.id}
            className="relative min-w-full h-full flex-shrink-0"
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/30" />
            
            {/* Text Content - Fixed alignment */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 sm:px-6 md:px-8 text-center">
              {image.title && (
                <h2 className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-0.5 xs:mb-1 sm:mb-2 drop-shadow-lg leading-tight max-w-[90%] xs:max-w-full">
                  {image.title}
                </h2>
              )}
              {image.subtitle && (
                <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl drop-shadow-lg max-w-[90%] xs:max-w-full">
                  {image.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Hidden on mobile */}
      <button
        onClick={goToPrev}
        className="hidden sm:flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-1.5 sm:p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 z-10 items-center justify-center"
        aria-label="Previous slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="hidden sm:flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-1.5 sm:p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 z-10 items-center justify-center"
        aria-label="Next slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 sm:space-x-2 z-10">
        {bannerImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 sm:h-2.5 md:h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
              index === currentIndex
                ? 'bg-white w-4 sm:w-7 md:w-10'
                : 'bg-white/50 hover:bg-white/80 w-1.5 sm:w-2.5 md:w-3'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Banner;