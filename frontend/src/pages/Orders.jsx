import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Package, Clock, DollarSign, Calendar, RefreshCw, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/api/orders?userId=${user.uid}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order history");
      }
      const data = await response.json();
      
      // Sort orders in reverse chronological order (newest first)
      const sorted = (data.orders || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sorted);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Could not load your orders. Please check if the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // Get status color classes
  const getStatusStyle = (status) => {
    switch (status) {
      case "Delivered":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Out For Delivery":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "Packing":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "Preparing":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "Placing":
        return "text-indigo-405 bg-indigo-500/10 border-indigo-500/20";
      case "Cancelled":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="border-b border-brand-border pb-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Package className="h-7 w-7 text-indigo-400" />
              Order History
            </h2>
            <p className="text-sm text-gray-400 mt-1">Fetching your previous orders...</p>
          </div>
        </div>
        
        {/* Loading Skeletons */}
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel rounded-3xl p-6 h-48 animate-pulse flex flex-col justify-between border border-brand-border">
              <div className="flex justify-between items-center">
                <div className="h-6 w-32 bg-white/5 rounded-lg" />
                <div className="h-6 w-24 bg-white/5 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-48 bg-white/5 rounded-lg" />
                <div className="h-4 w-64 bg-white/5 rounded-lg" />
              </div>
              <div className="h-10 w-full bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header bar */}
      <div className="border-b border-brand-border pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Package className="h-7 w-7 text-indigo-400" />
            Order History
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Track and view your previous Smart Pantry express orders.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-brand-border hover:bg-white/10 hover:text-white transition text-gray-300 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh List
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto space-y-5 border border-dashed border-gray-800"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/3 border border-brand-border text-gray-500">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No previous orders found</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              Place an order using the product catalog or let Amazon Now AI generate one for you.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/products"
              className="glow-btn inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition"
            >
              Browse Products
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {orders.map((order) => {
              const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-panel rounded-3xl p-6 border border-brand-border hover:border-white/10 transition flex flex-col md:flex-row gap-6 justify-between"
                >
                  {/* Left Column: Order Meta */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-mono font-bold text-indigo-400 bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10">
                        Order #{order.id.substring(0, 8).toUpperCase()}
                      </span>
                     
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Date</span>
                        <span className="text-sm font-semibold text-gray-200">{formatDate(order.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Items</span>
                        <span className="text-sm font-semibold text-gray-200">{totalItems} products</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Total</span>
                        <span className="text-sm font-extrabold text-amber-500">${Number(order.totalPrice).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Products List */}
                  <div className="md:w-72 bg-white/2 border border-brand-border rounded-2xl p-4 shrink-0">
                    <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Products
                    </span>
                    <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center text-xs text-gray-300">
                          <span className="truncate pr-2">{item.name}</span>
                          <span className="font-semibold text-indigo-400 shrink-0">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
