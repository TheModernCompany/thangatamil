// trested.tsx
import React from "react";
import {
  FaMedal,
  FaShieldAlt,
  FaMoneyBillWave,
  FaTruck,
  FaBoxes,
  FaStar,
} from "react-icons/fa";

const Trested = () => {
  const features = [
    {
      icon: FaMedal,
      title: "PREMIUM QUALITY",
      subtitle: "Best Quality Products",
    },
    {
      icon: FaShieldAlt,
      title: "SAFE & TESTED",
      subtitle: "Certified Fireworks",
    },
    {
      icon: FaMoneyBillWave,
      title: "AFFORDABLE PRICE",
      subtitle: "Best Price Guaranteed",
    },
    {
      icon: FaTruck,
      title: "FAST DELIVERY",
      subtitle: "On Time Delivery",
    },
    {
      icon: FaBoxes,
      title: "BULK ORDERS",
      subtitle: "Wholesale Available",
    },
    {
      icon: FaStar,
      title: "TRUSTED BRAND",
      subtitle: "Loved by Thousands",
    },
  ];

  return (
    <div className="w-full bg-black py-4">
      <div className="px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Mobile/Tablet: Grid 3 columns, Desktop: Horizontal row */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:flex lg:flex-nowrap lg:justify-between lg:items-center lg:gap-4">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center gap-1 lg:flex-row lg:items-center lg:gap-2 lg:text-left group cursor-pointer"
              >
                {/* Gold Icon */}
                <IconComponent className="text-xl sm:text-2xl lg:text-3xl text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.3)] flex-shrink-0" />

                {/* Text content */}
                <div className="flex flex-col">
                  <span className="text-white text-[10px] sm:text-xs lg:text-sm xl:text-base font-bold tracking-wider whitespace-nowrap">
                    {feature.title}
                  </span>
                  <span className="text-gray-400 text-[8px] sm:text-[10px] lg:text-xs xl:text-sm tracking-wide whitespace-nowrap">
                    {feature.subtitle}
                  </span>
                </div>

                {/* Separator line (except after last item) - hidden on mobile/tablet */}
                {index < features.length - 1 && (
                  <div className="hidden lg:block h-6 lg:h-8 w-px bg-gray-700 ml-1 lg:ml-2 flex-shrink-0"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Trested;