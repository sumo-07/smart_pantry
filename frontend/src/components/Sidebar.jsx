import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Camera, ShoppingBag, Brain, Settings, Users, HelpCircle } from "lucide-react";

export default function Sidebar({ familySize }) {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Scan Pantry", path: "/scan", icon: Camera },
    { name: "Shopping List", path: "/shopping-list", icon: ShoppingBag },
    { name: "AI Insights", path: "/insights", icon: Brain }
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                active
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${active ? "text-indigo-400" : "text-gray-400 group-hover:text-white"}`} />
              {item.name}
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
