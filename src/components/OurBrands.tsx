// OurBrands.tsx - Clean version with no mock data
import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

// Import background image - adjust the path based on your project structure
import backgroundImage from '../assets/our_brand.png';

interface Brand {
  id: string;
  name: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

interface OurBrandsProps {
  apiBaseUrl?: string;
  onError?: (error: Error) => void;
}

const OurBrands: React.FC<OurBrandsProps> = ({ 
  apiBaseUrl = 'http://localhost:8000',
  onError
}) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const animationRef = useRef<number>();

  const scrollSpeed = 1.5;

  // Fetch brands from API - NO MOCK DATA
  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${apiBaseUrl}/api/brands/active`);
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setBrands(response.data);
          console.log('✅ Loaded brands from API:', response.data.length);
        } else {
          // No brands found - show empty state, NOT mock data
          console.warn('⚠️ No brands found in API');
          setError('No brands available');
          setBrands([]);
          if (onError) onError(new Error('No brands found'));
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load brands';
        console.error('Error fetching brands:', err);
        setError(errorMsg);
        setBrands([]); // Empty array, no fallback
        if (onError) onError(err instanceof Error ? err : new Error(errorMsg));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, [apiBaseUrl, onError]);

  // Get full image URL
  const getFullImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/uploads')) {
      return `${apiBaseUrl}${url}`;
    }
    return `${apiBaseUrl}/uploads/products/${url}`;
  };

  // Handle image error
  const handleImageError = (url: string) => {
    setImageErrors(prev => new Set(prev).add(url));
  };

  // Duplicate brands for seamless scrolling (only if we have brands)
  const duplicatedBrands = brands.length > 0 
    ? [...brands, ...brands, ...brands] 
    : [];

  // Auto-scroll animation
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || duplicatedBrands.length === 0) return;

    const scroll = () => {
      if (!isPaused) {
        setScrollPosition((prev) => {
          const newPosition = prev + scrollSpeed;
          if (newPosition >= container.scrollWidth / 3) {
            return 0;
          }
          return newPosition;
        });
      }
      animationRef.current = requestAnimationFrame(scroll);
    };

    animationRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, duplicatedBrands.length]);

  // Update scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollLeft = scrollPosition;
    }
  }, [scrollPosition]);

  // Touch/mouse drag functionality
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startScrollLeft, setStartScrollLeft] = useState(0);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPaused(true);
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    setStartScrollLeft(scrollPosition);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = startX - clientX;
    setScrollPosition(Math.max(0, startScrollLeft + diff));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsPaused(false);
  };

  // Pause on hover
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Loading state
  if (isLoading) {
    return (
      <div 
        className="w-full bg-cover bg-center bg-no-repeat py-8 md:py-12 px-4 md:px-8"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundColor: '#0a0a1a',
        }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-white/10 rounded-lg mx-auto mb-4"></div>
            <div className="h-4 w-64 bg-white/10 rounded-lg mx-auto"></div>
            <div className="mt-8 flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-32 h-20 bg-white/10 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - shown when API fails or no brands
  if (error || brands.length === 0) {
    return (
      <div 
        className="w-full bg-cover bg-center bg-no-repeat py-8 md:py-12 px-4 md:px-8"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundColor: '#0a0a1a',
        }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white uppercase tracking-wide mb-4">
            OUR BRANDS
          </h2>
          <p className="text-white/60 text-sm">
            {error || 'No brands available at this time.'}
          </p>
          <p className="text-white/30 text-xs mt-2">
            Please check back later
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full bg-cover bg-center bg-no-repeat py-8 md:py-12 px-4 md:px-8"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundColor: '#0a0a1a',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-4xl font-bold text-white uppercase tracking-wide">
            OUR BRANDS
          </h2>
          <p className="text-white/80 text-xs md:text-base mt-2 max-w-2xl mx-auto">
            We partner with India's most trusted and quality brands
            <br className="hidden sm:block" />
            to bring you the best celebration experience.
          </p>
          {brands.length > 0 && (
            <p className="text-white/30 text-xs mt-2">
              {brands.length} brands displayed
            </p>
          )}
        </div>

        {/* Scrolling Brand Carousel */}
        <div 
          className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={scrollContainerRef}
            className="flex gap-3 md:gap-6 py-4 md:py-6 px-3 md:px-6 overflow-x-hidden cursor-grab active:cursor-grabbing"
            style={{ scrollBehavior: 'auto' }}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {duplicatedBrands.map((brand, index) => {
              const imageUrl = getFullImageUrl(brand.imageUrl);
              const hasError = imageErrors.has(imageUrl);
              
              return (
                <div
                  key={`brand-${brand.id}-${index}`}
                  className="flex-shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 md:px-6 md:py-4 text-center min-w-[120px] md:min-w-[180px] transition hover:bg-white/20 hover:scale-105 flex flex-col items-center"
                >
                  {/* Brand Image */}
                  <div className="w-full h-10 md:h-16 mb-1 md:mb-2 flex items-center justify-center">
                    {hasError ? (
                      <div className="w-full h-full flex items-center justify-center bg-white/5 rounded">
                        <span className="text-white/30 text-xs">{brand.name.substring(0, 3)}</span>
                      </div>
                    ) : (
                      <img
                        src={imageUrl}
                        alt={brand.name}
                        className="max-w-full max-h-full object-contain"
                        loading="lazy"
                        onError={() => handleImageError(imageUrl)}
                      />
                    )}
                  </div>
                  {/* Brand Name */}
                  <span className="text-white font-bold text-[10px] md:text-sm tracking-wider uppercase">
                    {brand.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Gradient overlays for smooth edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-[#0a0a1a] to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-l from-[#0a0a1a] to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default OurBrands;