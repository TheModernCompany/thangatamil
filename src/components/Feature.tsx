// feature.tsx
import React from "react";

// If you don't have actual images yet, use placeholder images or create a fallback
// Option 1: Use placeholder images from a CDN (temporary)
const categories = [
  { name: "Sparklers", image: "https://images.unsplash.com/photo-1509910110001-4e756f86fbd3?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3Bhcmt8ZW58MHx8MHx8fDA%3D" },
  { name: "Rockets", image: "https://via.placeholder.com/120/16213e/f5c842?text=Rockets" },
  { name: "Flower Pots", image: "https://via.placeholder.com/120/16213e/f5c842?text=Flower+Pots" },
  { name: "Ground Chalkbars", image: "https://via.placeholder.com/120/16213e/f5c842?text=Ground+Chalkbars" },
  { name: "Fancy Items", image: "https://via.placeholder.com/120/16213e/f5c842?text=Fancy+Items" },
  { name: "Gift Boxes", image: "https://via.placeholder.com/120/16213e/f5c842?text=Gift+Boxes" },
  { name: "Sky Shots", image: "https://via.placeholder.com/120/16213e/f5c842?text=Sky+Shots" },
  { name: "Combo Packs", image: "https://via.placeholder.com/120/16213e/f5c842?text=Combo+Packs" },
];

// Option 2: If you have actual images in your project, uncomment and use this:
/*
import sparklersImg from "../assets/images/sparklers.jpg";
import rocketsImg from "../assets/images/rockets.jpg";
import flowerPotsImg from "../assets/images/flower-pots.jpg";
import groundChalkbarsImg from "../assets/images/ground-chalkbars.jpg";
import fancyItemsImg from "../assets/images/fancy-items.jpg";
import giftBoxesImg from "../assets/images/gift-boxes.jpg";
import skyShotsImg from "../assets/images/sky-shots.jpg";
import comboPacksImg from "../assets/images/combo-packs.jpg";

const categories = [
  { name: "Sparklers", image: sparklersImg },
  { name: "Rockets", image: rocketsImg },
  { name: "Flower Pots", image: flowerPotsImg },
  { name: "Ground Chalkbars", image: groundChalkbarsImg },
  { name: "Fancy Items", image: fancyItemsImg },
  { name: "Gift Boxes", image: giftBoxesImg },
  { name: "Sky Shots", image: skyShotsImg },
  { name: "Combo Packs", image: comboPacksImg },
];
*/

const Feature = () => {
  return (
    <section className="feature-section">
      <h2 className="feature-heading">FEATURED CATEGORIES</h2>
      <div className="category-grid">
        {categories.map((category, index) => (
          <div key={index} className="category-card">
            <img
              src={category.image}
              alt={category.name}
              className="category-image"
            />
            <p className="category-name">{category.name}</p>
          </div>
        ))}
      </div>

      <style>{`
        .feature-section {
          background-color: #1a1a2e;
          padding: 3rem 2rem;
          text-align: center;
          font-family: 'Arial', sans-serif;
        }

        .feature-heading {
          color: #f5c842;
          font-size: 2.5rem;
          letter-spacing: 2px;
          margin-bottom: 2.5rem;
          font-weight: 700;
          text-shadow: 0 0 10px rgba(245, 200, 66, 0.3);
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .category-card {
          background: #16213e;
          padding: 1.5rem 1rem;
          border-radius: 16px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          border: 1px solid #f5c84230;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .category-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 28px rgba(245, 200, 66, 0.25);
          border-color: #f5c842;
        }

        .category-image {
          width: 100%;
          max-width: 120px;
          height: auto;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          border-radius: 12px;
          background: #0f3460;
          margin-bottom: 1rem;
          border: 2px solid #f5c84255;
          transition: border 0.2s;
        }

        .category-card:hover .category-image {
          border-color: #f5c842;
        }

        .category-name {
          color: #e0e0e0;
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin: 0;
          background: linear-gradient(135deg, #f5c842, #f5a623);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 8px rgba(245, 200, 66, 0.2);
        }

        @media (max-width: 600px) {
          .feature-heading {
            font-size: 2rem;
          }
          .category-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.2rem;
          }
          .category-image {
            max-width: 90px;
          }
        }
      `}</style>
    </section>
  );
};

export default Feature;