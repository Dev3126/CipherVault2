import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import AuthCallback from "@/pages/AuthCallback";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import CryptoPage from "@/pages/CryptoPage";
import MyFiles from "@/pages/MyFiles";
import History from "@/pages/History";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import About from "@/pages/About";
import Contact from "@/pages/Contact";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const passedUser = location.state?.user;
  const [state, setState] = useState(passedUser ? true : null); // null=checking, true=auth, false=no

  useEffect(() => {
    if (passedUser) return;
    let active = true;
    (async () => {
      try {
        await api.get("/auth/me");
        if (active) setState(true);
      } catch {
        if (active) setState(false);
      }
    })();
    return () => { active = false; };
  }, [passedUser]);

  if (state === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A]">
        <div className="cv-spin" />
      </div>
    );
  }
  if (state === false) return <Navigate to="/login" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  // CRITICAL: process session_id synchronously to prevent race conditions
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/encrypt" element={<ProtectedRoute><CryptoPage mode="encrypt" /></ProtectedRoute>} />
      <Route path="/decrypt" element={<ProtectedRoute><CryptoPage mode="decrypt" /></ProtectedRoute>} />
      <Route path="/files" element={<ProtectedRoute><MyFiles /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
      <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
