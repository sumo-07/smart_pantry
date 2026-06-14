import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Camera, ShoppingBag, Zap, Home, ShoppingCart, Users, LayoutDashboard, Brain, Package } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Sidebar({ familySize }) {
  const location = useLocation();
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const menuItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Pantry Scanner", path: "/scan", icon: Camera },
    { name: "Shopping List", path: "/shopping-list", icon: ShoppingBag },
    { name: "AI Insights", path: "/insights", icon: Brain },
    { name: "Amazon Now AI", path: "/amazon-now", icon: Zap },
    { name: "Products", path: "/products", icon: Package },
    { name: "Cart", path: "/cart", icon: ShoppingCart }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-brand-dark/40 border-r border-brand-border h-[calc(100vh-4rem)] sticky top-16 p-4">
      {/* Menu links */}
      <div className="flex-1 space-y-1.5">
        <span className="px-3 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
          Navigation
        </span>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                active
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 ${active ? "text-indigo-400" : "text-gray-400 group-hover:text-white"}`} />
                {item.name}
              </div>
              {item.path === "/cart" && cartCount > 0 && (
                <span className="bg-amber-500 text-brand-dark text-[10px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center shrink-0">
                  {cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Household Profile Box */}
      <div className="border-t border-brand-border pt-4">
        <div className="glass-panel rounded-2xl p-3.5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs text-gray-400 font-medium">Family Size</span>
            <span className="text-sm font-semibold text-white truncate">
              {familySize ? `${familySize} Members` : "Not Configured"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
