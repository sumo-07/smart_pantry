import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { 
  Zap, 
  Sparkles, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Package, 
  Truck, 
  MapPin, 
  DollarSign,
  HelpCircle,
  RotateCcw
} from "lucide-react";

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const QUICK_TEMPLATES = [
  "Guests arriving in 30 minutes",
  "Sick day essentials",
  "Movie night snacks",
  "Study session fuel",
  "Breakfast for 4 people"
];

export default function AmazonNow() {
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Shared global cart
  const { cart, addToCart, addMultipleToCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [reasoning, setReasoning] = useState([]);
  const [urgencyScore, setUrgencyScore] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Custom item form state
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState(1);
  const [customPrice, setCustomPrice] = useState(1.99);
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Order status simulation state
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderStep, setOrderStep] = useState(0); // 0: Placing, 1: Preparing, 2: Packing, 3: Out For Delivery, 4: Delivered
  const [orderEta, setOrderEta] = useState(15);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const timerRef = useRef(null);

  // Calculate totals
  const totalItems = cart.length;
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedTotalCost = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  // Trigger AI generation
  const handleGenerateCart = async (selectedScenario) => {
    const activeScenario = selectedScenario || scenario;
    if (!activeScenario.trim()) return;

    setLoading(true);
    setError(null);
    setHasGenerated(false);
    
    try {
      const response = await fetch(`${API_URL}/amazon-now/generate-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: activeScenario })
      });

      if (!response.ok) {
        throw new Error("Failed to generate cart. Please try again.");
      }

      const data = await response.json();
      
      // Merge AI-generated items into existing cart
      addMultipleToCart(data.cart || []);
      
      setReasoning(data.recommendation_reason || []);
      setUrgencyScore(data.urgency_score || 50);
      setHasGenerated(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Modify cart quantity
  const handleUpdateQty = (index, delta) => {
    const item = cart[index];
    if (!item) return;
    updateQuantity(item.name, item.quantity + delta);
  };

  // Remove item from cart
  const handleRemoveItem = (index) => {
    const item = cart[index];
    if (!item) return;
    removeFromCart(item.name);
  };

  // Add custom item
  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    addToCart({
      name: customName.trim(),
      quantity: Number(customQty),
      price: Number(customPrice)
    });
    
    setCustomName("");
    setCustomQty(1);
    setCustomPrice(1.99);
    setShowAddCustom(false);
  };

  // Checkout simulation
  const handlePlaceOrder = async () => {
    try {
      setIsPlacingOrder(true);
      setOrderError(null);

      // Prepare order data
      const orderData = {
        userId: user?.uid || "demo_user",
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image || null
        })),
        totalPrice: estimatedTotalCost,
        deliveryAddress: "Your location",
        notes: `Amazon Now scenario: Generated for urgent delivery`
      };

      // Save order to Firebase via backend
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(orderData)
        }
      );

      if (!response.ok) {
        throw new Error("Failed to place order");
      }

      const result = await response.json();
      setOrderId(result.orderId);
      
      setOrderPlaced(true);
      setOrderStep(0);
      
      // Calculate random ETA based on urgency score (higher urgency = faster delivery)
      const baseEta = urgencyScore > 80 ? 10 : urgencyScore > 65 ? 15 : 25;
      const finalEta = baseEta + Math.floor(Math.random() * 5);
      setOrderEta(finalEta);

      if (timerRef.current) clearTimeout(timerRef.current);

      const steps = [
        { step: 1, duration: 1500 }, // to Preparing
        { step: 2, duration: 2500 }, // to Packing
        { step: 3, duration: 3000 }, // to Out For Delivery
        { step: 4, duration: 4000 }  // to Delivered
      ];

      let currentStepIndex = 0;
      
      const runNextStep = () => {
        if (currentStepIndex >= steps.length) return;
        const next = steps[currentStepIndex];
        
        timerRef.current = setTimeout(() => {
          setOrderStep(next.step);
          currentStepIndex++;
          runNextStep();
        }, next.duration);
      };

      runNextStep();
    } catch (error) {
      console.error("Error placing order:", error);
      setOrderError(error.message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleResetOrder = () => {
    setOrderPlaced(false);
    setOrderStep(0);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Get color for urgency score badge
  const getUrgencyColor = (score) => {
    if (score >= 85) return "text-red-400 bg-red-500/10 border-red-500/25";
    if (score >= 65) return "text-amber-400 bg-amber-500/10 border-amber-500/25";
    return "text-indigo-400 bg-indigo-500/10 border-indigo-500/25";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header bar */}
      <div className="border-b border-brand-border pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Zap className="h-7 w-7 text-amber-500 animate-pulse" />
            Amazon Now <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg text-xs tracking-widest border border-amber-500/20">AI MODE</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            State your scenario in natural language. Gemini will build and optimize an urgent shopping cart in seconds.
          </p>
        </div>

        {hasGenerated && !orderPlaced && (
          <button 
            onClick={() => {
              setHasGenerated(false);
              clearCart();
              setReasoning([]);
              setUrgencyScore(0);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-brand-border hover:bg-white/10 hover:text-white transition text-gray-300 cursor-pointer self-start"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Start New Scenario
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!orderPlaced ? (
          // MAIN WORKFLOW: GENERATE & EDIT
          <motion.div 
            key="workflow"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            
            {/* LEFT COLUMN: Input or AI Explanation */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Scenario Generator Form */}
              <div className="glass-panel rounded-3xl p-4 sm:p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />
                
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  What's the situation?
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="scenario-input" className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      Describe your scenario
                    </label>
                    <textarea
                      id="scenario-input"
                      rows={4}
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      placeholder="E.g., Guests are arriving in 30 minutes and I have no snacks... OR I have a sudden headache and sore throat..."
                      className="w-full bg-white/5 border border-gray-800 focus:border-amber-500 rounded-2xl p-4 text-sm text-white focus:outline-none transition resize-none placeholder:text-gray-650"
                      disabled={loading}
                    />
                  </div>

                  <button
                    onClick={() => handleGenerateCart(null)}
                    disabled={loading || !scenario.trim()}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-brand-dark bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 transition shadow-lg shadow-amber-500/10 hover:shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-brand-dark" />
                        Analyzing scenario...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 fill-brand-dark" />
                        Generate AI Cart
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Templates */}
                <div className="mt-6 pt-5 border-t border-brand-border">
                  <span className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider">
                    Quick Templates
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl}
                        onClick={() => {
                          setScenario(tpl);
                          handleGenerateCart(tpl);
                        }}
                        disabled={loading}
                        className="text-xs px-3 py-2 bg-white/4 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-brand-border transition cursor-pointer"
                      >
                        {tpl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Explainable AI Panel */}
              {hasGenerated && reasoning.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-panel rounded-3xl p-4 sm:p-6 border-l-4 border-l-indigo-500"
                >
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-indigo-400" />
                    Why These Items?
                  </h3>
                  <ul className="space-y-3">
                    {reasoning.map((reason, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-gray-300">
                        <span className="text-indigo-400 font-bold mt-0.5 shrink-0">✓</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>

            {/* RIGHT COLUMN: Generated Cart & Actions */}
            <div className="lg:col-span-7 space-y-6">
              {loading ? (
                // LOADING PLACEHOLDER
                <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[350px]">
                  <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
                  <h4 className="text-lg font-bold text-white">Consulting Amazon Now AI</h4>
                  <p className="text-sm text-gray-400 mt-1 max-w-sm">
                    Gemini is processing your scenario, evaluating quick-delivery inventory, and selecting essential items.
                  </p>
                </div>
              ) : !hasGenerated ? (
                // EMPTY STATE
                <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[350px] border border-dashed border-gray-800">
                  <div className="h-16 w-16 bg-white/5 border border-brand-border text-gray-500 rounded-2xl flex items-center justify-center mb-4">
                    <ShoppingCart className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Your Cart is Empty</h4>
                  <p className="text-sm text-gray-400 mt-1 max-w-xs">
                    Provide a quick delivery emergency scenario on the left to generate a personalized cart instantly.
                  </p>
                </div>
              ) : (
                // AI CART DISPLAY
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  
                  {/* Cart Title & Urgency Score */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-amber-500" />
                      Urgent Delivery Cart
                    </h3>
                    <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${getUrgencyColor(urgencyScore)}`}>
                      <Zap className="h-3 w-3 fill-current" />
                      Urgency Score: {urgencyScore}/100
                    </div>
                  </div>

                  {/* Cart Items Cards */}
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {cart.map((item, index) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-brand-border hover:border-white/10 transition"
                        >
                          {/* Name & unit price */}
                          <div className="overflow-hidden min-w-0 flex-1">
                            <h4 className="font-bold text-white truncate">{item.name}</h4>
                            <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
                              <DollarSign className="h-3 w-3" />
                              {item.price.toFixed(2)} unit price
                            </p>
                          </div>

                          {/* Controls & subtotal */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 shrink-0 pt-2 sm:pt-0 border-t border-brand-border/40 sm:border-t-0">
                            {/* Quantity Adjusters */}
                            <div className="flex items-center gap-2 bg-white/5 border border-gray-800 rounded-xl p-1">
                              <button
                                onClick={() => handleUpdateQty(index, -1)}
                                className="p-1 hover:bg-white/5 hover:text-white rounded-lg text-gray-400 transition cursor-pointer"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQty(index, 1)}
                                className="p-1 hover:bg-white/5 hover:text-white rounded-lg text-gray-400 transition cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Item Subtotal Price */}
                            <span className="text-sm font-extrabold text-white w-16 text-right">
                              ${(item.quantity * item.price).toFixed(2)}
                            </span>

                            {/* Remove button */}
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="p-2 text-gray-550 hover:text-rose-400 rounded-xl hover:bg-rose-500/5 transition cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {cart.length === 0 && (
                      <div className="text-center py-8 text-sm text-gray-500">
                        All items removed. You can add items manually below.
                      </div>
                    )}
                  </div>

                  {/* Add Custom Item Button / Form */}
                  <div className="glass-panel rounded-2xl p-4 border border-dashed border-gray-850">
                    <button
                      onClick={() => navigate("/products")}
                      className="w-full py-2 hover:bg-white/5 text-xs font-bold text-indigo-400 hover:text-indigo-300 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-4.5 w-4.5" /> Add custom item manually
                    </button>
                  </div>

                  {/* Summary & Checkout Panel */}
                  {cart.length > 0 && (
                    <motion.div 
                      layout
                      className="glass-panel rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-gray-900/60 to-amber-500/5 border border-amber-500/10 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-brand-border pb-4">
                        <div>
                          <h4 className="font-extrabold text-white text-base">Order Summary</h4>
                          <div className="flex gap-4 text-xs text-gray-400 mt-1">
                            <span>Total Items: {totalItems}</span>
                            <span>Total Quantity: {totalQuantity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Estimated Total</span>
                          <span className="text-2xl font-black text-amber-500">${estimatedTotalCost.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-xs text-amber-500">
                        <Clock className="h-5 w-5 shrink-0" />
                        <div>
                          <span className="font-bold">Amazon Now Quick Delivery: </span>
                          Our delivery partners are stationed near you. ETA for this order is approximately 10-15 minutes once placed.
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={() => navigate("/products")}
                          className="w-full py-4 bg-white/5 border border-brand-border hover:bg-white/10 text-white font-bold text-base rounded-2xl transition flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer animate-pulse"
                        >
                          <Plus className="h-5 w-5" />
                          Add More Items
                        </button>
                        <button
                          type="button"
                          onClick={handlePlaceOrder}
                          disabled={isPlacingOrder}
                          className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-brand-dark hover:text-black font-black text-base rounded-2xl transition shadow-lg shadow-amber-500/10 hover:shadow-orange-500/20 flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isPlacingOrder ? (
                            <>
                              <div className="h-5 w-5 rounded-full border-2 border-brand-dark border-t-transparent animate-spin" />
                              Placing Order...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-5 w-5 fill-current" />
                              Order Now
                            </>
                          )}
                        </button>
                        {orderError && (
                          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-xs text-rose-300">
                            {orderError}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                </motion.div>
              )}
            </div>

          </motion.div>
        ) : (
          // ORDER PROGRESS SIMULATOR SCREEN
          <motion.div 
            key="order-progress"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto glass-panel rounded-3xl p-8 border border-amber-500/10 space-y-8 relative overflow-hidden"
          >
            {/* Background Accent glow */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

            {/* Stepper Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-2">
                <Truck className="h-7 w-7 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-white">Order Confirmed!</h3>
              <p className="text-sm text-gray-400">
                Your quick-commerce shipment has been processed. Live delivery progress below.
              </p>
              {orderId && (
                <p className="text-xs text-gray-500 mt-2">
                  Order ID: <span className="text-amber-400 font-mono font-bold">{orderId}</span>
                </p>
              )}
            </div>

            {/* Delivery Details */}
            <div className="grid grid-cols-2 gap-4 bg-white/2 border border-brand-border rounded-2xl p-4 text-center">
              <div>
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Estimated Delivery</span>
                <span className="text-xl font-bold text-white">{orderEta} Minutes</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Checkout Total</span>
                <span className="text-xl font-bold text-amber-500">${estimatedTotalCost.toFixed(2)}</span>
              </div>
            </div>

            {/* Stepper progress indicator */}
            <div className="space-y-8 py-4 relative pl-8">
              
              {/* Stepper Line */}
              <div className="absolute left-3.5 top-5 bottom-5 w-0.5 bg-gray-800" />
              
              {/* Stepper Active Path Line */}
              <motion.div 
                className="absolute left-3.5 top-5 w-0.5 bg-amber-500 origin-top"
                initial={{ height: "0%" }}
                animate={{ 
                  height: 
                    orderStep === 1 ? "25%" : 
                    orderStep === 2 ? "50%" : 
                    orderStep === 3 ? "75%" : 
                    orderStep === 4 ? "100%" : "0%"
                }}
                transition={{ duration: 0.5 }}
              />

              {/* Step 1: Preparing */}
              <div className="relative flex gap-4 items-start">
                <div className={`absolute -left-8 flex h-7.5 w-7.5 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
                  orderStep >= 1 
                    ? "bg-amber-500 border-amber-500 text-brand-dark" 
                    : orderStep === 0 
                      ? "bg-brand-dark border-amber-500 text-amber-500 ring-4 ring-amber-500/10" 
                      : "bg-brand-dark border-gray-800 text-gray-505"
                }`}>
                  {orderStep >= 1 ? "✓" : "1"}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${orderStep >= 0 ? "text-white" : "text-gray-500"}`}>
                    Preparing Order
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {orderStep > 0 ? "Order acknowledged and verified." : "Verifying item quantities and stock..."}
                  </p>
                </div>
              </div>

              {/* Step 2: Packing */}
              <div className="relative flex gap-4 items-start">
                <div className={`absolute -left-8 flex h-7.5 w-7.5 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
                  orderStep >= 2 
                    ? "bg-amber-500 border-amber-500 text-brand-dark" 
                    : orderStep === 1 
                      ? "bg-brand-dark border-amber-500 text-amber-500 ring-4 ring-amber-500/10" 
                      : "bg-brand-dark border-gray-800 text-gray-510"
                }`}>
                  {orderStep >= 2 ? "✓" : "2"}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${orderStep >= 1 ? "text-white" : "text-gray-550"}`}>
                    Packing
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {orderStep > 1 
                      ? "Items sealed in secure quick-commerce bag." 
                      : orderStep === 1 
                        ? "Selecting items from quick-fulfillment shelves..." 
                        : "Waiting for packer assignment."}
                  </p>
                </div>
              </div>

              {/* Step 3: Out For Delivery */}
              <div className="relative flex gap-4 items-start">
                <div className={`absolute -left-8 flex h-7.5 w-7.5 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
                  orderStep >= 3 
                    ? "bg-amber-500 border-amber-500 text-brand-dark" 
                    : orderStep === 2 
                      ? "bg-brand-dark border-amber-500 text-amber-500 ring-4 ring-amber-500/10" 
                      : "bg-brand-dark border-gray-800 text-gray-515"
                }`}>
                  {orderStep >= 3 ? "✓" : "3"}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${orderStep >= 2 ? "text-white" : "text-gray-600"}`}>
                    Out For Delivery
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {orderStep > 2 
                      ? "Rider is heading to your drop location." 
                      : orderStep === 2 
                        ? "Handing over parcel to express runner..." 
                        : "Waiting for dispatch."}
                  </p>
                </div>
              </div>

              {/* Step 4: Delivered */}
              <div className="relative flex gap-4 items-start">
                <div className={`absolute -left-8 flex h-7.5 w-7.5 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
                  orderStep >= 4 
                    ? "bg-emerald-500 border-emerald-500 text-brand-dark shadow-lg shadow-emerald-500/25" 
                    : orderStep === 3 
                      ? "bg-brand-dark border-amber-500 text-amber-500 ring-4 ring-amber-500/10 animate-pulse" 
                      : "bg-brand-dark border-gray-800 text-gray-520"
                }`}>
                  {orderStep >= 4 ? "✓" : "4"}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${orderStep >= 3 ? "text-white" : "text-gray-650"} ${orderStep === 4 ? "text-emerald-400 font-extrabold" : ""}`}>
                    {orderStep === 4 ? "Delivered!" : "Delivered"}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {orderStep === 4 
                      ? "Order arrived at your doorstep. Enjoy!" 
                      : "Rider is approaching coordinates..."}
                  </p>
                </div>
              </div>

            </div>

            {/* Stepper Actions */}
            <div className="pt-4 flex gap-3">
              <button
                onClick={handleResetOrder}
                className="w-full py-3 bg-white/5 border border-brand-border hover:bg-white/10 text-white rounded-xl text-sm font-bold transition cursor-pointer"
              >
                Go Back to Cart
              </button>
              {orderStep === 4 && (
                <button
                  onClick={() => {
                    handleResetOrder();
                    setHasGenerated(false);
                    clearCart();
                    setReasoning([]);
                    setUrgencyScore(0);
                    setScenario("");
                  }}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-650 text-white rounded-xl text-sm font-bold transition hover:opacity-90 cursor-pointer"
                >
                  Create New Order
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
