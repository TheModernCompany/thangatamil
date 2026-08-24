import React from 'react';
import { useNavigate } from 'react-router-dom';
// Import background image
import backgroundImage from '../assets/Background_1.png';

// Import product images - adjust paths according to your folder structure
import flowerpotsImg from '../assets/fire.png';
import rocketsImg from '../assets/rockets.png';
import sparklersImg from '../assets/sparklers.jpg';
import groundImg from '../assets/Premium fireworks display celebration essentials.png';
import atomBombsImg from '../assets/atom-bombs.png';
import kidsSpecialImg from '../assets/kids-special.png';
import chakkarsImg from '../assets/Premium fireworks display celebration essentials.png';

const ProductSection: React.FC = () => {
  // Product data with local images
  const navigate = useNavigate();
  const products = [
    {
      id: 1,
      name: 'FLOWERPOTS',
      tagline: 'Bright Sparks, Light up the Night',
      cta: 'EXPLORE →',
      image: flowerpotsImg,
      category: 'Premium',
    },
    {
      id: 2,
      name: 'ROCKETS',
      tagline: 'Reach the Sky, Endless Joy',
      cta: 'EXPLORE →',
      image: rocketsImg,
      category: 'Premium',
    },
    {
      id: 3,
      name: 'SPARKLERS',
      tagline: 'Little Sparks, Big Celebrations',
      cta: 'EXPLORE →',
      image: sparklersImg,
      category: 'Premium',
    },
    {
      id: 4,
      name: 'GROUND',
      tagline: 'Big Bang. Bigger Excitement',
      cta: 'EXPLORE →',
      image: groundImg,
      category: 'Ground',
    },
    {
      id: 5,
      name: 'ATOM BOMBS',
      tagline: 'Safe & Joyful Celebrations',
      cta: 'EXPLORE →',
      image: atomBombsImg,
      category: 'Ground',
    },
    {
      id: 6,
      name: "KID'S SPECIAL",
      tagline: 'Spin into Happiness',
      cta: 'EXPLORE →',
      image: kidsSpecialImg,
      category: 'Kids',
    },
    {
      id: 7,
      name: 'CHAKKARS',
      tagline: 'Spin into Happiness',
      cta: 'EXPLORE →',
      image: chakkarsImg,
      category: 'Kids',
    },
  ];

  return (
    <section className="relative w-full min-h-screen py-12 px-4 md:px-8 bg-gray-900">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-wider drop-shadow-lg">
            OUR <span className="text-yellow-400">CATEGORIES</span>
          </h2>
          <div className="mt-2 inline-block border-b-4 border-yellow-400 w-24" />
        </div>

        {/* Premium badge */}
        <div className="mb-8">
          <span className="inline-block bg-yellow-400 text-black font-bold px-6 py-2 text-sm tracking-widest rounded-sm shadow-lg">
            PREMIUM
          </span>
        </div>

        {/* Premium row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {products.slice(0, 3).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Second row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.slice(3).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    tagline: string;
    cta: string;
    image: string;
    category?: string;
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate(); // Fixed: navigate is now defined here

  return (
    <div className="group relative bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:scale-105">
      {/* Product image */}
      <div className="relative h-56 w-full overflow-hidden bg-gray-800">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {/* subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5 text-white">
        <h3 className="text-xl font-bold tracking-wider mb-1 text-yellow-300 drop-shadow">
          {product.name}
        </h3>
        <p className="text-sm text-gray-200 mb-4 leading-relaxed drop-shadow">
          {product.tagline}
        </p>
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center text-yellow-400 font-semibold text-sm tracking-wide hover:text-yellow-300 transition-colors group-hover:gap-2 gap-1"
        >
          {product.cta}
        </button>
      </div>
    </div>
  );
};

export default ProductSection;