  import React, { useState, useEffect } from 'react';

  // Import background image
  import diwaliBg from '../assets/review banner.png';

  // Or if using public folder:
  // const diwaliBg = '/images/diwali-bg.jpg';

  interface Review {
    name: string;
    location: string;
    rating: number;
    text: string;
    tags: string[];
  }

  const ReviewSection: React.FC = () => {
    // Customer data
    const reviews: Review[] = [
      {
        name: 'Mohamed Riyaz',
        location: 'Chennai, Tamil Nadu',
        rating: 5,
        text: 'Excellent quality crackers and superfast delivery. Packaging was very safe and perfect. Will order again for sure!',
        tags: ['Excellent quality crackers', 'superfast delivery'],
      },
      {
        name: 'Priya Sharma',
        location: 'Coimbatore, Tamil Nadu',
        rating: 5,
        text: 'Best prices and amazing collections. Kids Special offers. Everything was well packed and reached perfectly. Great experience!',
        tags: ['Best prices', 'amazing collections'],
      },
      {
        name: 'Karthik M',
        location: 'Madurai, Tamil Nadu',
        rating: 5,
        text: 'Kids Special crackers were amazing! My kids loved every item. Thank you for making our Diwali special. Highly recommended for everyone.',
        tags: ['Kids Special crackers', 'highly recommended'],
      },
      {
        name: 'Arun Kumar',
        location: 'Trichy, Tamil Nadu',
        rating: 5,
        text: 'Wide variety and good offers. Very reliable and trusted brand. Timely delivery and great customer support. Will order again!',
        tags: ['Wide variety', 'trusted brand'],
      },
      {
        name: 'Nandhini R',
        location: 'Salem, Tamil Nadu',
        rating: 5,
        text: 'Excellent quality crackers and superfast delivery. Packaging was very safe and perfect. Will order again for sure!',
        tags: ['Excellent quality', 'safe packaging'],
      },
    ];

    // Duplicate reviews for seamless marquee effect (desktop)
    const marqueeReviews: Review[] = [...reviews, ...reviews, ...reviews];

    // Carousel state for mobile/tablet
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    // Auto-slide every 5 seconds
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
      }, 5000);

      return () => clearInterval(interval);
    }, [reviews.length]);

    // Navigate to specific slide
    const goToSlide = (index: number) => {
      setCurrentIndex(index);
    };

    return (
      <section className="relative py-16 px-4 md:px-8 lg:px-16 overflow-hidden">
        {/* Background image only - no gradient */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${diwaliBg})`,
          }}
        />

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Decorative Diya-like elements */}
        <div className="absolute top-10 left-10 w-12 h-12 rounded-full bg-yellow-500/20 blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-orange-500/20 blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-yellow-400/5 blur-3xl"></div>

        <div className="relative z-10 max-w-full mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-wide">
              What Our Customers Say
            </h2>
            <div className="flex items-center justify-center gap-2 sm:gap-3 mt-2">
              <span className="text-yellow-400 text-xl sm:text-2xl">✦</span>
              <p className="text-yellow-400 text-base sm:text-xl md:text-2xl font-semibold tracking-wider">
                HAPPY CUSTOMERS, HAPPY DIWALI!
              </p>
              <span className="text-yellow-400 text-xl sm:text-2xl">✦</span>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm md:text-base mt-3 max-w-2xl mx-auto px-4">
              Thousands of customers trust Thangatamil Crackers for quality, price &amp; perfect celebration.
            </p>
          </div>

          {/* Desktop: Marquee - Auto Scrolling Reviews */}
          <div className="hidden md:block w-full overflow-hidden">
            <div className="animate-marquee whitespace-nowrap flex gap-6 py-4">
              {marqueeReviews.map((review, index) => (
                <div 
                  key={index}
                  className="inline-block w-[300px] lg:w-[320px] flex-shrink-0 bg-black/60 backdrop-blur-sm p-5 lg:p-6 rounded-2xl border border-yellow-500/20 hover:border-yellow-400/50 transition-all duration-300 shadow-xl hover:shadow-yellow-500/10 whitespace-normal"
                >
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-base lg:text-lg">★</span>
                    ))}
                  </div>

                  {/* Review text */}
                  <p className="text-gray-200 text-xs sm:text-sm leading-relaxed mb-4 min-h-[80px]">
                    "{review.text}"
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                    {review.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className="text-[10px] sm:text-xs bg-yellow-400/10 text-yellow-300 px-2 sm:px-3 py-1 rounded-full border border-yellow-400/20 backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Name & Location */}
                  <div className="border-t border-yellow-500/20 pt-4 mt-2">
                    <p className="text-white font-semibold text-sm sm:text-base">{review.name}</p>
                    <p className="text-gray-400 text-xs sm:text-sm">{review.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile & Tablet: Carousel - Single Card View */}
          <div className="block md:hidden w-full max-w-sm mx-auto">
            <div className="bg-black/60 backdrop-blur-sm p-5 sm:p-6 rounded-2xl border border-yellow-500/20 shadow-xl transition-all duration-500 ease-in-out">
              {/* Stars */}
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-base sm:text-lg">★</span>
                ))}
              </div>

              {/* Review text */}
              <p className="text-gray-200 text-xs sm:text-sm leading-relaxed mb-4 min-h-[80px]">
                "{reviews[currentIndex].text}"
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                {reviews[currentIndex].tags.map((tag, i) => (
                  <span 
                    key={i} 
                    className="text-[10px] sm:text-xs bg-yellow-400/10 text-yellow-300 px-2 sm:px-3 py-1 rounded-full border border-yellow-400/20 backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Name & Location */}
              <div className="border-t border-yellow-500/20 pt-4 mt-2">
                <p className="text-white font-semibold text-sm sm:text-base">{reviews[currentIndex].name}</p>
                <p className="text-gray-400 text-xs sm:text-sm">{reviews[currentIndex].location}</p>
              </div>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-yellow-400 w-6' 
                      : 'bg-yellow-400/40 hover:bg-yellow-400/60'
                  }`}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Bottom decorative line */}
          <div className="flex justify-center items-center gap-2 mt-8">
            <div className="h-0.5 w-8 sm:w-12 bg-yellow-400/30"></div>
            <span className="text-yellow-400/50 text-sm sm:text-base">✦</span>
            <div className="h-0.5 w-8 sm:w-12 bg-yellow-400/30"></div>
          </div>
        </div>

        {/* Add custom CSS for marquee animation */}
        <style>{`
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-33.33%);
            }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
            width: max-content;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>
    );
  };

  export default ReviewSection;