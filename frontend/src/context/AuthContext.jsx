import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth, googleProvider, useFirebase } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useFirebase && auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Mock Auth local storage session
      const storedUser = localStorage.getItem("pantry_mock_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Create default mock user for quick hackathon review
        const defaultMock = {
          uid: "demo_guest_user",
          email: "demo@smartpantry.ai",
          displayName: "Demo Household",
          photoURL: null
        };
        setUser(defaultMock);
        localStorage.setItem("pantry_mock_user", JSON.stringify(defaultMock));
      }
      setLoading(false);
    }
  }, []);

  // Email/Password Signup
  const signup = (email, password) => {
    if (useFirebase && auth) {
      return createUserWithEmailAndPassword(auth, email, password);
    } else {
      // Simulated signup
      const newUser = {
        uid: "user_" + Math.random().toString(36).substring(2, 11),
        email,
        displayName: email.split("@")[0],
        photoURL: null
      };
      setUser(newUser);
      localStorage.setItem("pantry_mock_user", JSON.stringify(newUser));
      return Promise.resolve(newUser);
    }
  };

  // Email/Password Login
  const login = (email, password) => {
    if (useFirebase && auth) {
      return signInWithEmailAndPassword(auth, email, password);
    } else {
      // Simulated login
      const mockUser = {
        uid: "demo_guest_user",
        email,
        displayName: email.split("@")[0],
        photoURL: null
      };
      setUser(mockUser);
      localStorage.setItem("pantry_mock_user", JSON.stringify(mockUser));
      return Promise.resolve(mockUser);
    }
  };

  // Google authentication login
  const loginWithGoogle = () => {
    if (useFirebase && auth && googleProvider) {
      return signInWithPopup(auth, googleProvider);
    } else {
      // Simulated Google sign in
      const googleMock = {
        uid: "google_mock_" + Math.random().toString(36).substring(2, 11),
        email: "google_demo@gmail.com",
        displayName: "Google Demo User",
        photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"
      };
      setUser(googleMock);
      localStorage.setItem("pantry_mock_user", JSON.stringify(googleMock));
      return Promise.resolve(googleMock);
    }
  };

  // Sign out
  const logout = () => {
    if (useFirebase && auth) {
      return signOut(auth);
    } else {
      setUser(null);
      localStorage.removeItem("pantry_mock_user");
      return Promise.resolve();
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
