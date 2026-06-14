import React, { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Clock, 
  Truck, 
  DollarSign, 
  ShoppingBag,
  ArrowRight,
  Package,
  MapPin,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Order simulation state
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderStep, setOrderStep] = useState(0); // 0: Placing, 1: Preparing, 2: Packing, 3: Out For Delivery, 4: Delivered
  const [orderEta, setOrderEta] = useState(15);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const timerRef = useRef(null);

  // Totals
  const totalItems = cart.length;
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedTotalCost = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);

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
        notes: ""
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
      
      // Choose delivery speed
      const finalEta = 10 + Math.floor(Math.random() * 8);
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

  const handleCompleteOrder = () => {
    clearCart();
    setOrderPlaced(false);
    setOrderStep(0);
    navigate("/products");
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header bar */}
      <div className="border-b border-brand-border pb-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <ShoppingCart className="h-7 w-7 text-indigo-400" />
          Your Shopping Cart
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Review, modify, and checkout items added from AI mode, product catalog, or custom additions.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {orderPlaced ? (
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
                Your quick-commerce delivery runner has been dispatched.
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
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Grand Total</span>
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
                      : "bg-brand-dark border-gray-800 text-gray-500"
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
                      : "bg-brand-dark border-gray-800 text-gray-500"
                }`}>
                  {orderStep >= 2 ? "✓" : "2"}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${orderStep >= 1 ? "text-white" : "text-gray-500"}`}>
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
                      : "bg-brand-dark border-gray-800 text-gray-500"
                }`}>
                  {orderStep >= 3 ? "✓" : "3"}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${orderStep >= 2 ? "text-white" : "text-gray-500"}`}>
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
                      : "bg-brand-dark border-gray-800 text-gray-500"
                }`}>
                  {orderStep >= 4 ? "✓" : "4"}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${orderStep >= 3 ? "text-white" : "text-gray-500"} ${orderStep === 4 ? "text-emerald-400 font-extrabold" : ""}`}>
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
                  onClick={handleCompleteOrder}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-650 text-white rounded-xl text-sm font-bold transition hover:opacity-90 cursor-pointer"
                >
                  Return to Store
                </button>
              )}
            </div>
          </motion.div>
        ) : cart.length === 0 ? (
          // EMPTY CART VIEW
          <motion.div 
            key="empty-cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel rounded-3xl p-12 text-center max-w-xl mx-auto space-y-5 border border-dashed border-gray-800"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/3 border border-brand-border text-gray-500">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Your Cart is Empty</h3>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                Add items using Amazon Now AI scenarios, or browse the product catalog!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => navigate("/amazon-now")}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-brand-dark font-extrabold rounded-xl text-xs transition cursor-pointer"
              >
                Go to Amazon Now AI
              </button>
              <button
                onClick={() => navigate("/products")}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-brand-border transition cursor-pointer"
              >
                Browse Products
              </button>
            </div>
          </motion.div>
        ) : (
          // FULL CART DISPLAY
          <motion.div 
            key="full-cart"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* List of Cart Items */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-400 px-2 font-bold uppercase tracking-wider">
                <span>Product Details</span>
                <span className="hidden sm:inline">Price Details</span>
              </div>
              
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.name}
                    className="glass-panel rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-brand-border hover:border-white/10 transition"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Product Image */}
                      <div className="h-16 w-16 bg-white/3 border border-brand-border rounded-2xl overflow-hidden shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-600">
                            <ShoppingBag className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-white text-sm sm:text-base leading-snug truncate" title={item.name}>
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-0.5">
                          <DollarSign className="h-3 w-3" />
                          {item.price.toFixed(2)} unit
                        </p>
                      </div>
                    </div>

                    {/* Controls & subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 shrink-0 pt-2 sm:pt-0 border-t border-brand-border/40 sm:border-t-0">
                      {/* Adjusters */}
                      <div className="flex items-center gap-1.5 bg-white/5 border border-gray-800 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.name, item.quantity - 1)}
                          className="p-1 hover:bg-white/5 hover:text-white rounded-lg text-gray-400 transition cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.name, item.quantity + 1)}
                          className="p-1 hover:bg-white/5 hover:text-white rounded-lg text-gray-400 transition cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <span className="text-sm font-extrabold text-white w-16 text-right">
                        ${(item.quantity * item.price).toFixed(2)}
                      </span>

                      {/* Trash */}
                      <button
                        onClick={() => removeFromCart(item.name)}
                        className="p-2 text-gray-550 hover:text-rose-400 rounded-xl hover:bg-rose-500/5 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Summary & Order Action */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-panel rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-gray-900/60 to-indigo-500/5 border border-indigo-500/10 space-y-4">
                <h4 className="font-extrabold text-white text-base">Cart Summary</h4>
                
                <div className="space-y-2 border-b border-brand-border pb-4 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Unique Items</span>
                    <span className="text-white font-bold">{totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity</span>
                    <span className="text-white font-bold">{totalQuantity}</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Estimated Total</span>
                  <span className="text-2xl font-black text-amber-500">${estimatedTotalCost.toFixed(2)}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-brand-dark hover:text-black font-black text-sm rounded-2xl transition shadow-lg shadow-amber-500/10 hover:shadow-orange-500/20 flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-brand-dark border-t-transparent animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4.5 w-4.5 fill-current" />
                      Place Order
                    </>
                  )}
                </button>
                {orderError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-xs text-rose-300">
                    {orderError}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 bg-white/2 border border-brand-border rounded-3xl p-4 text-xs text-gray-400">
                <Clock className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="font-bold text-white">Instant Fulfillment:</span> Orders placed via Amazon Now AI Mode are prioritized and delivered within minutes.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
