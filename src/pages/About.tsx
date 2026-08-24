import { FaStore, FaTruck, FaUsers, FaAward, FaFire, FaBox, FaRupeeSign, FaShieldAlt, FaRocket, FaClock, FaGift, FaStar, FaHeart, FaHandshake, FaTrophy, FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaBars, FaTimes } from 'react-icons/fa';
import { MdVerified, MdStars, MdLocalShipping, MdSecurity, MdEmojiEvents } from 'react-icons/md';
import { GiFireworkRocket, GiSparkles } from 'react-icons/gi';

const About = () => {
  // Journey milestones data with more details
  const journeyMilestones = [
    {
      year: "2015",
      title: "The Humble Beginning",
      description: "Started as a small cracker shop in Sivakasi with a dream to bring joy to every celebration.",
      icon: <FaStore className="text-3xl md:text-4xl text-[#FFD700]" />,
      details: "Initial investment: ₹50,000 | Shop size: 100 sq ft"
    },
    {
      year: "2017",
      title: "Building Trust",
      description: "Gained our first 100 loyal customers who believed in our quality and commitment.",
      icon: <FaUsers className="text-3xl md:text-4xl text-[#FFD700]" />,
      details: "100+ happy customers | 4.8/5 rating"
    },
    {
      year: "2019",
      title: "Expansion Phase",
      description: "Expanded our shop and product range to serve more customers during festive seasons.",
      icon: <MdStars className="text-3xl md:text-4xl text-[#FFD700]" />,
      details: "Shop size: 500 sq ft | 50+ products"
    },
    {
      year: "2021",
      title: "Digital Presence",
      description: "Embraced technology to reach customers beyond Sivakasi with online ordering.",
      icon: <FaTruck className="text-3xl md:text-4xl text-[#FFD700]" />,
      details: "Pan India delivery | Online orders"
    },
    {
      year: "2023",
      title: "Premium Quality Focus",
      description: "Introduced special carton packaging and premium product lines.",
      icon: <FaBox className="text-3xl md:text-4xl text-[#FFD700]" />,
      details: "Premium packaging | Quality certified"
    },
    {
      year: "2026",
      title: "11 Years of Excellence",
      description: "Celebrating 11 years of spreading happiness with top-quality fireworks.",
      icon: <FaAward className="text-3xl md:text-4xl text-[#FFD700]" />,
      details: "500+ customers | 100+ varieties"
    }
  ];

  // Key statistics with more details
  const stats = [
    { number: "11+", label: "Years of Excellence", icon: <FaAward />, description: "11 years of trust" },
    { number: "500+", label: "Happy Customers", icon: <FaUsers />, description: "Across India" },
    { number: "100+", label: "Product Varieties", icon: <FaRocket />, description: "Wide range" },
    { number: "100%", label: "Quality Guarantee", icon: <FaShieldAlt />, description: "Premium quality" }
  ];

  // Core values
  const coreValues = [
    {
      title: "Premium Quality",
      description: "We never compromise on quality. Every product is carefully selected and tested.",
      icon: <FaStar className="text-2xl md:text-3xl" />
    },
    {
      title: "Customer Trust",
      description: "Our 11-year journey is built on the trust of thousands of customers.",
      icon: <FaHeart className="text-2xl md:text-3xl" />
    },
    {
      title: "Safety First",
      description: "All our products meet the highest safety standards.",
      icon: <FaShieldAlt className="text-2xl md:text-3xl" />
    },
    {
      title: "Festival Spirit",
      description: "We believe in spreading joy and happiness.",
      icon: <GiSparkles className="text-2xl md:text-3xl" />
    }
  ];

  // Why choose us
  const whyChooseUs = [
    {
      title: "11 Years of Legacy",
      description: "Over a decade of experience",
      icon: <FaClock />
    },
    {
      title: "Quality Certified",
      description: "Strict quality checks",
      icon: <MdVerified />
    },
    {
      title: "Premium Packaging",
      description: "Safe and secure delivery",
      icon: <FaBox />
    },
    {
      title: "Pan India Delivery",
      description: "Deliver across India",
      icon: <MdLocalShipping />
    },
    {
      title: "Trusted by 500+",
      description: "500+ regular customers",
      icon: <FaUsers />
    },
    {
      title: "Competitive Pricing",
      description: "Best quality at best prices",
      icon: <FaRupeeSign />
    }
  ];

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-black via-[#1a0a0a] to-black text-white py-12 md:py-20 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-32 h-32 md:w-64 md:h-64 bg-[#FFD700] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 md:w-96 md:h-96 bg-[#FF6B00] rounded-full blur-3xl"></div>
        </div>
        
        {/* Decorative gold lines */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="p-3 md:p-4 bg-gradient-to-br from-[#FFD700] to-[#FF6B00] rounded-full shadow-2xl">
                <FaFire className="text-4xl md:text-6xl text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-1 md:mb-2 tracking-wider">
              About <span className="text-[#FFD700]">THANGATAMIL</span>
            </h1>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-[#FFD700] mb-1 md:mb-2 tracking-wider">
              CRACKERS
            </h2>
            <div className="w-20 md:w-32 h-0.5 bg-gradient-to-r from-[#FFD700] via-[#FF6B00] to-[#FFD700] mx-auto mb-4 md:mb-6"></div>
            <p className="text-base md:text-xl lg:text-2xl text-gray-300 mb-4 md:mb-6 tracking-wide px-2">
              Spreading Joy Through Quality Fireworks Since 2015
            </p>
            <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto mb-6 md:mb-8 px-4">
              India's trusted destination for premium quality fireworks and crackers, 
              bringing light, joy, and happiness to celebrations across the nation.
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 px-2">
              <span className="px-4 md:px-8 py-2 md:py-3 bg-gradient-to-r from-[#FFD700] to-[#FF6B00] rounded-full text-black font-bold text-sm md:text-lg shadow-2xl transform hover:scale-105 transition-transform">
                🎆 11 Years
              </span>
              <span className="px-4 md:px-8 py-2 md:py-3 border-2 border-[#FFD700] text-[#FFD700] rounded-full font-bold text-sm md:text-lg shadow-2xl transform hover:scale-105 transition-transform hover:bg-[#FFD700]/10">
                ⭐ 500+ Customers
              </span>
              <span className="px-4 md:px-8 py-2 md:py-3 border-2 border-[#FF6B00] text-[#FF6B00] rounded-full font-bold text-sm md:text-lg shadow-2xl transform hover:scale-105 transition-transform hover:bg-[#FF6B00]/10">
                🏆 Premium Quality
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 md:px-6 -mt-8 md:-mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gradient-to-br from-black to-[#1a0a0a] rounded-xl shadow-2xl p-3 md:p-6 text-center transform hover:scale-105 transition-all duration-300 border-b-4 border-[#FFD700] hover:border-[#FF6B00]">
              <div className="text-xl md:text-3xl text-[#FFD700] mb-1 md:mb-2 flex justify-center">
                {stat.icon}
              </div>
              <div className="text-xl md:text-3xl font-bold text-white">{stat.number}</div>
              <div className="text-xs md:text-sm text-[#FFD700] font-semibold mt-0.5 md:mt-1">{stat.label}</div>
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* About Content */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
          <div className="order-2 md:order-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-wider">
              Our <span className="text-[#FFD700]">Story</span>
            </h2>
            <div className="w-16 md:w-20 h-0.5 bg-gradient-to-r from-[#FFD700] to-[#FF6B00] mb-4 md:mb-6"></div>
            <div className="space-y-3 md:space-y-4 text-gray-300">
              <p className="text-sm md:text-lg leading-relaxed">
                <span className="font-semibold text-[#FFD700]">Sugandha 2015 - 2026</span> - For <strong className="text-white">11 remarkable years</strong>, Thangatamil Crackers has been illuminating celebrations with the finest quality fireworks.
              </p>
              <p className="text-sm md:text-lg leading-relaxed">
                What began as a <strong className="text-white">small shop in Sivakasi</strong>, the fireworks capital of India, has grown into a <strong className="text-white">premier destination</strong> for premium crackers.
              </p>
              <div className="bg-gradient-to-r from-[#1a0a0a] to-black border-l-4 border-[#FFD700] p-4 md:p-6 rounded-r-lg">
                <p className="text-base md:text-xl font-semibold text-[#FFD700]">
                  "Our aim is delivering good Quality products only"
                </p>
                <p className="text-xs md:text-sm text-gray-400 mt-2">
                  This simple yet powerful vision drives everything we do.
                </p>
              </div>
              <p className="text-sm md:text-lg leading-relaxed">
                With a <strong className="text-white">legacy of trust</strong>, we've built lasting relationships with <strong className="text-white">500+ regular customers</strong>.
              </p>
              <div className="flex flex-wrap gap-2 md:gap-3 mt-2 md:mt-4">
                <span className="px-3 md:px-4 py-1 md:py-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full text-[#FFD700] text-[10px] md:text-sm">🏪 Sivakasi's Premier</span>
                <span className="px-3 md:px-4 py-1 md:py-2 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-full text-[#FF6B00] text-[10px] md:text-sm">📦 Premium Packaging</span>
                <span className="px-3 md:px-4 py-1 md:py-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full text-[#FFD700] text-[10px] md:text-sm">🚚 Pan India</span>
              </div>
            </div>
          </div>
          <div className="relative order-1 md:order-2">
            <div className="bg-gradient-to-br from-[#1a0a0a] to-black rounded-2xl p-4 md:p-8 shadow-2xl border border-[#FFD700]/30">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-gradient-to-br from-[#FFD700] to-[#FF6B00] rounded-xl p-4 md:p-6 text-black text-center transform rotate-3 hover:rotate-0 transition-transform shadow-xl">
                  <FaFire className="text-3xl md:text-5xl mx-auto mb-1 md:mb-2" />
                  <p className="text-xs md:text-base font-bold">Premium Quality</p>
                </div>
                <div className="bg-white rounded-xl p-4 md:p-6 text-black text-center transform -rotate-3 hover:rotate-0 transition-transform shadow-xl border-2 border-[#FFD700]">
                  <MdVerified className="text-3xl md:text-5xl mx-auto mb-1 md:mb-2 text-[#FFD700]" />
                  <p className="text-xs md:text-base font-bold">100% Safe</p>
                </div>
                <div className="bg-gradient-to-br from-[#FFD700] to-[#FF6B00] rounded-xl p-4 md:p-6 text-black text-center transform rotate-2 hover:rotate-0 transition-transform shadow-xl">
                  <FaBox className="text-3xl md:text-5xl mx-auto mb-1 md:mb-2" />
                  <p className="text-xs md:text-base font-bold">Special Packaging</p>
                </div>
                <div className="bg-white rounded-xl p-4 md:p-6 text-black text-center transform -rotate-2 hover:rotate-0 transition-transform shadow-xl border-2 border-[#FFD700]">
                  <FaTruck className="text-3xl md:text-5xl mx-auto mb-1 md:mb-2 text-[#FFD700]" />
                  <p className="text-xs md:text-base font-bold">Pan India Delivery</p>
                </div>
              </div>
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-r from-[#FFD700]/10 to-[#FF6B00]/10 rounded-xl border border-[#FFD700]/20">
                <p className="text-center text-gray-300 text-[10px] md:text-sm">
                  <FaMapMarkerAlt className="inline mr-1 md:mr-2 text-[#FFD700]" />
                  Located in Sivakasi, the fireworks capital of India
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Values Section */}
        <div className="max-w-6xl mx-auto mt-12 md:mt-20">
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-2 tracking-wider">
            Our <span className="text-[#FFD700]">Core Values</span>
          </h3>
          <div className="w-16 md:w-20 h-0.5 bg-gradient-to-r from-[#FFD700] to-[#FF6B00] mx-auto mb-8 md:mb-12"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {coreValues.map((value, index) => (
              <div key={index} className="bg-gradient-to-br from-[#1a0a0a] to-black rounded-xl p-4 md:p-6 text-center border border-[#FFD700]/30 hover:border-[#FFD700] transition-all hover:shadow-2xl hover:scale-105">
                <div className="text-[#FFD700] mb-2 md:mb-4 flex justify-center">{value.icon}</div>
                <h4 className="text-white font-bold text-base md:text-lg mb-1 md:mb-2">{value.title}</h4>
                <p className="text-gray-400 text-xs md:text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="max-w-6xl mx-auto mt-12 md:mt-20">
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-2 tracking-wider">
            Why <span className="text-[#FFD700]">Choose Us</span>
          </h3>
          <div className="w-16 md:w-20 h-0.5 bg-gradient-to-r from-[#FFD700] to-[#FF6B00] mx-auto mb-8 md:mb-12"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-[#1a0a0a] to-black rounded-xl p-4 md:p-6 border-l-4 border-[#FFD700] hover:border-[#FF6B00] transition-all hover:shadow-2xl hover:translate-x-2">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="text-[#FFD700] text-lg md:text-2xl mt-1">{item.icon}</div>
                  <div>
                    <h4 className="text-white font-bold text-sm md:text-base mb-0.5 md:mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-xs md:text-sm">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terms & Conditions Section */}
        <div className="max-w-4xl mx-auto mt-12 md:mt-20">
          <div className="bg-gradient-to-br from-[#1a0a0a] to-black rounded-2xl shadow-2xl overflow-hidden border border-[#FFD700]/30">
            <div className="bg-gradient-to-r from-[#FFD700] to-[#FF6B00] px-4 md:px-8 py-4 md:py-6">
              <h3 className="text-lg md:text-2xl font-bold text-black flex items-center">
                <FaShieldAlt className="mr-2 md:mr-3" />
                Terms & Conditions
              </h3>
              <p className="text-black/70 text-xs md:text-sm mt-0.5 md:mt-1">Our commitment to quality and service</p>
            </div>
            <div className="p-4 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-black rounded-xl p-4 md:p-6 text-center hover:shadow-xl transition-shadow border border-[#FFD700]/30 hover:border-[#FFD700]">
                  <div className="bg-gradient-to-br from-[#FFD700] to-[#FF6B00] w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                    <FaRupeeSign className="text-lg md:text-2xl text-black" />
                  </div>
                  <h4 className="font-bold text-[#FFD700] text-sm md:text-base mb-1 md:mb-2">Minimum Order</h4>
                  <p className="text-2xl md:text-3xl font-bold text-white">₹3,000</p>
                  <p className="text-gray-400 text-[10px] md:text-sm mt-1 md:mt-2">Minimum order required</p>
                </div>
                <div className="bg-black rounded-xl p-4 md:p-6 text-center hover:shadow-xl transition-shadow border border-[#FFD700]/30 hover:border-[#FFD700]">
                  <div className="bg-gradient-to-br from-[#FFD700] to-[#FF6B00] w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                    <FaBox className="text-lg md:text-2xl text-black" />
                  </div>
                  <h4 className="font-bold text-[#FFD700] text-sm md:text-base mb-1 md:mb-2">Premium Packaging</h4>
                  <p className="text-gray-300 text-xs md:text-sm">Special cartons with cover pack</p>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">Safe & secure delivery</p>
                </div>
                <div className="bg-black rounded-xl p-4 md:p-6 text-center hover:shadow-xl transition-shadow border border-[#FFD700]/30 hover:border-[#FFD700]">
                  <div className="bg-gradient-to-br from-[#FFD700] to-[#FF6B00] w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                    <FaTruck className="text-lg md:text-2xl text-black" />
                  </div>
                  <h4 className="font-bold text-[#FFD700] text-sm md:text-base mb-1 md:mb-2">Payment Policy</h4>
                  <p className="text-gray-300 text-xs md:text-sm">Full payment required</p>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">Parcel after payment</p>
                </div>
              </div>
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-r from-[#FFD700]/5 to-[#FF6B00]/5 rounded-xl border border-[#FFD700]/10">
                <p className="text-center text-gray-400 text-[10px] md:text-sm">
                  <FaClock className="inline mr-1 md:mr-2 text-[#FFD700]" />
                  Orders processed within 24-48 hours | Delivery within 3-7 business days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Journey Timeline */}
        <div className="max-w-6xl mx-auto mt-12 md:mt-20">
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-2 tracking-wider">
            Our <span className="text-[#FFD700]">Journey</span>
          </h3>
          <div className="w-16 md:w-20 h-0.5 bg-gradient-to-r from-[#FFD700] to-[#FF6B00] mx-auto mb-2 md:mb-4"></div>
          <p className="text-gray-400 text-center mb-8 md:mb-12 max-w-2xl mx-auto text-xs md:text-sm px-4">
            From a small dream to a big reality - here's how we grew over the years
          </p>
          
          {/* Mobile Timeline View */}
          <div className="md:hidden">
            <div className="space-y-6">
              {journeyMilestones.map((milestone, index) => (
                <div key={index} className="bg-gradient-to-br from-[#1a0a0a] to-black rounded-xl shadow-2xl p-4 border border-[#FFD700]/30 hover:border-[#FFD700] transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-black rounded-full shadow-xl flex items-center justify-center border-2 border-[#FFD700]">
                      {milestone.icon}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#FFD700]">{milestone.year}</span>
                      <span className="text-[10px] text-gray-500 ml-2">{milestone.details}</span>
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">{milestone.title}</h4>
                  <p className="text-gray-400 text-xs mt-1">{milestone.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Timeline View */}
          <div className="hidden md:block relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-gradient-to-b from-[#FFD700] via-[#FF6B00] to-[#FFD700] h-full"></div>
            
            <div className="space-y-12">
              {journeyMilestones.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12'}`}>
                    <div className="bg-gradient-to-br from-[#1a0a0a] to-black rounded-xl shadow-2xl p-6 hover:shadow-3xl transition-shadow border border-[#FFD700]/30 hover:border-[#FFD700]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#FFD700]">{milestone.year}</span>
                        <span className="text-xs text-gray-500">{milestone.details}</span>
                      </div>
                      <h4 className="text-xl font-bold text-white mt-2">{milestone.title}</h4>
                      <p className="text-gray-400 mt-2">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="w-1/2 flex justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 bg-black rounded-full shadow-2xl flex items-center justify-center border-4 border-[#FFD700] hover:border-[#FF6B00] transition-colors">
                        {milestone.icon}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;