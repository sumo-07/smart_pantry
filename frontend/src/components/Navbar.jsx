import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bot, LogOut, User, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ familySize }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-dark/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white hover:opacity-95 transition">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20">
                <Bot className="h-5 w-5" />
              </div>
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                Smart Pantry <span className="text-indigo-400 font-medium">AI</span>
              </span>
            </Link>
          </div>

          {/* Center Links (Desktop) */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  isActive("/dashboard")
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/scan"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  isActive("/scan")
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Scan Pantry
              </Link>
              <Link
                to="/shopping-list"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  isActive("/shopping-list")
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Shopping List
              </Link>
              <Link
                to="/insights"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  isActive("/insights")
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Insights
              </Link>
            </div>
          )}

          {/* User Profile / Info (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-brand-border">
                <div className="flex flex-col text-right">
                  <span className="text-xs text-gray-500 font-medium">Account</span>
                  <span className="text-sm text-gray-200 font-semibold truncate max-w-[140px]">
                    {user.displayName || user.email?.split("@")[0] || "User"}
                  </span>
                </div>
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="User profile" 
                    className="h-9 w-9 rounded-xl border border-gray-750 object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-800 border border-gray-700 text-gray-300">
                    <User className="h-4.5 w-4.5" />
                  </div>
                )}
                
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-gray-450 hover:text-rose-400 rounded-xl hover:bg-rose-500/5 transition cursor-pointer"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="glow-btn inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-brand-border bg-brand-dark px-2 pt-2 pb-3 space-y-1">
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-base font-medium ${
                  isActive("/dashboard") ? "bg-indigo-500/10 text-indigo-400" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/scan"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-base font-medium ${
                  isActive("/scan") ? "bg-indigo-500/10 text-indigo-400" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                Scan Pantry
              </Link>
              <Link
                to="/shopping-list"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-base font-medium ${
                  isActive("/shopping-list") ? "bg-indigo-500/10 text-indigo-400" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                Shopping List
              </Link>
              <Link
                to="/insights"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-base font-medium ${
                  isActive("/insights") ? "bg-indigo-500/10 text-indigo-400" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                Insights
              </Link>
              
              <div className="border-t border-brand-border my-2 pt-2 px-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Logged in as</span>
                  <span className="text-sm font-semibold text-gray-250">{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-rose-500/10 text-rose-450 border border-rose-500/20"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center mx-2 px-4 py-2.5 rounded-xl text-base font-semibold bg-indigo-500 text-white"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
