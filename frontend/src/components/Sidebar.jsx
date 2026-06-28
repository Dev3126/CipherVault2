import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Lock, Unlock, FolderOpen, Clock, User, Settings, Info, Mail, Shield, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Home, testid: "nav-dashboard" },
  { to: "/encrypt", label: "Encrypt File", icon: Lock, testid: "nav-encrypt" },
  { to: "/decrypt", label: "Decrypt File", icon: Unlock, testid: "nav-decrypt" },
  { to: "/files", label: "My Files", icon: FolderOpen, testid: "nav-files" },
  { to: "/history", label: "History", icon: Clock, testid: "nav-history" },
  { to: "/profile", label: "Profile", icon: User, testid: "nav-profile" },
  { to: "/settings", label: "Settings", icon: Settings, testid: "nav-settings" },
  { to: "/about", label: "About Project", icon: Info, testid: "nav-about" },
  { to: "/contact", label: "Contact Us", icon: Mail, testid: "nav-contact" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-64 shrink-0 bg-[#0F1729] border-r border-white/5 flex flex-col min-h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate("/dashboard")} data-testid="sidebar-logo">
        <div className="w-11 h-11 rounded-xl bg-[#2563EB] flex items-center justify-center cv-glow">
          <Shield className="w-6 h-6 text-white" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight leading-tight">
            CIPHER <span className="text-[#60A5FA]">VAULT</span>
          </h1>
          <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Secure File Platform</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {NAV.map(({ to, label, icon: Icon, testid }) => (
          <NavLink
            key={to}
            to={to}
            data-testid={testid}
            className={({ isActive }) => `cv-sidebar-item ${isActive ? "active" : ""}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 m-4 rounded-xl border border-white/5 bg-gradient-to-br from-[#1E293B] to-[#0F1729]">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-[#60A5FA]" />
          <p className="text-sm font-semibold">Your Security is Our Priority</p>
        </div>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          We use AES-256-GCM, the same standard trusted by governments and banks.
        </p>
      </div>

      <div className="p-4 border-t border-white/5 flex items-center gap-3">
        <img
          src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=2563EB&color=fff`}
          alt=""
          className="w-9 h-9 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" data-testid="sidebar-username">{user?.name || "User"}</p>
          <p className="text-xs text-[#64748B] truncate">{user?.email}</p>
        </div>
        <button onClick={logout} data-testid="logout-button" className="text-[#94A3B8] hover:text-white p-1.5 rounded-md hover:bg-white/5">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
