import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Search, Sparkles, ShoppingCart, Check, Plus } from "lucide-react";

const CATEGORIES = [
  "All",
  "Dairy",
  "Snacks",
  "Beverages",
  "Bakery",
  "Personal Care",
  "Wellness",
  "Pantry"
];

const MOCK_PRODUCTS = [
  // Dairy
  {
    id: "p1",
    name: "Whole Milk (1 Gallon)",
    category: "Dairy",
    price: 3.49,
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p2",
    name: "Cheddar Cheese Block",
    category: "Dairy",
    price: 4.99,
    image: "https://images.unsplash.com/photo-1486887396153-fa416525c108?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p3",
    name: "Greek Yogurt (Honey)",
    category: "Dairy",
    price: 1.89,
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p4",
    name: "Salted Butter (4 Sticks)",
    category: "Dairy",
    price: 3.99,
    image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=300&q=80"
  },
  // Snacks
  {
    id: "p5",
    name: "Classic Potato Chips",
    category: "Snacks",
    price: 2.49,
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d20?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p6",
    name: "Chocolate Chip Cookies",
    category: "Snacks",
    price: 3.29,
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p7",
    name: "Salted Roasted Peanuts",
    category: "Snacks",
    price: 1.99,
    image: "https://images.unsplash.com/photo-1517244683807-7ae58e2b254a?auto=format&fit=crop&w=300&q=80"
  },
  // Beverages
  {
    id: "p8",
    name: "Cola Soda (6-Pack)",
    category: "Beverages",
    price: 4.99,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p9",
    name: "100% Orange Juice",
    category: "Beverages",
    price: 3.79,
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p10",
    name: "Organic Ground Coffee",
    category: "Beverages",
    price: 7.99,
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p11",
    name: "Sparkling Water (Lime)",
    category: "Beverages",
    price: 1.29,
    image: "https://images.unsplash.com/photo-1608885898957-a599fb1698d6?auto=format&fit=crop&w=300&q=80"
  },
  // Bakery
  {
    id: "p12",
    name: "Fresh Sourdough Bread",
    category: "Bakery",
    price: 3.99,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p13",
    name: "Chocolate Croissants (2ct)",
    category: "Bakery",
    price: 4.49,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p14",
    name: "Fresh Blueberry Muffins (4ct)",
    category: "Bakery",
    price: 3.49,
    image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=300&q=80"
  },
  // Personal Care
  {
    id: "p15",
    name: "Fluoride Toothpaste (Mint)",
    category: "Personal Care",
    price: 2.99,
    image: "https://images.unsplash.com/photo-1559592443-7f87a8402561?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p16",
    name: "Foaming Hand Soap",
    category: "Personal Care",
    price: 1.99,
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p17",
    name: "Hydrating Body Wash",
    category: "Personal Care",
    price: 4.99,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80"
  },
  // Wellness
  {
    id: "p18",
    name: "Pain Relief Tablets (50ct)",
    category: "Wellness",
    price: 5.99,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p19",
    name: "Vitamin C Gummies (90ct)",
    category: "Wellness",
    price: 8.99,
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p20",
    name: "Herbal Cough Syrup",
    category: "Wellness",
    price: 6.49,
    image: "https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=300&q=80"
  },
  // Pantry
  {
    id: "p21",
    name: "Spaghetti Pasta (1lb)",
    category: "Pantry",
    price: 1.49,
    image: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p22",
    name: "Marinara Pasta Sauce",
    category: "Pantry",
    price: 2.79,
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "p23",
    name: "Extra Virgin Olive Oil",
    category: "Pantry",
    price: 9.99,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80"
  }
];

export default function Products() {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [addedItems, setAddedItems] = useState({}); // Track items added for visual feedback

  const handleAddToCart = (product) => {
    addToCart({
      name: product.name,
      quantity: 1,
      price: product.price,
      image: product.image
    });

    // Visual feedback
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header bar */}
      <div className="border-b border-brand-border pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="h-7 w-7 text-indigo-400" />
            Product Catalog
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Browse and add products to your global shopping cart.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-brand-border focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Category Chips Filter */}
      <div className="flex flex-wrap gap-2 pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-4 py-2.5 rounded-xl border font-bold transition duration-200 cursor-pointer ${
              selectedCategory === cat
                ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/10"
                : "bg-white/4 text-gray-400 border-brand-border hover:bg-white/10 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Products */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        <AnimatePresence>
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass-panel rounded-3xl p-4 flex flex-col justify-between border border-brand-border hover:border-indigo-500/30 transition group duration-300 hover:shadow-xl hover:shadow-indigo-500/5 relative overflow-hidden"
            >
              {/* Image Container */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/3 border border-brand-border mb-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-dark/80 text-indigo-400 border border-brand-border backdrop-blur-sm">
                  {product.category}
                </span>
              </div>

              {/* Title & Price */}
              <div className="space-y-1 mb-4">
                <h4 className="font-extrabold text-white text-sm leading-snug group-hover:text-indigo-400 transition truncate" title={product.name}>
                  {product.name}
                </h4>
                <p className="text-lg font-black text-amber-500">
                  ${product.price.toFixed(2)}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleAddToCart(product)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  addedItems[product.id]
                    ? "bg-emerald-500 text-brand-dark hover:bg-emerald-600 font-extrabold"
                    : "bg-white/5 hover:bg-indigo-500 text-gray-300 hover:text-white border border-brand-border hover:border-indigo-500"
                }`}
              >
                {addedItems[product.id] ? (
                  <>
                    <Check className="h-4 w-4 stroke-[3]" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 text-sm text-gray-500 glass-panel rounded-3xl border border-dashed border-gray-800">
          No products matches your criteria.
        </div>
      )}
    </div>
  );
}
