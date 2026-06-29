import React from "react";
import Sidebar from "./Sidebar";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Layout({ children, title }) {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen bg-[#0A0E1A]">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <header className="h-[72px] flex items-center justify-between px-8 border-b border-white/5 sticky top-0 z-10 bg-[#0A0E1A]/80 backdrop-blur">
          <h2 className="text-xl font-bold tracking-tight" data-testid="page-title">{title}</h2>
          <div className="flex items-center gap-5">
            <button className="relative text-[#94A3B8] hover:text-white" data-testid="notifications-button">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-[#2563EB] text-white rounded-full flex items-center justify-center">3</span>
            </button>
            <div className="flex items-center gap-3">
              <img
                src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=2563EB&color=fff`}
                alt=""
                className="w-9 h-9 rounded-full"
              />
              <div className="hidden md:block">
                <p className="text-sm font-semibold leading-tight" data-testid="header-username">{user?.name}</p>
                <p className="text-[11px] text-[#64748B]">Premium User</p>
              </div>
            </div>
          </div>
        </header>
        <div className="p-8 cv-fade">{children}</div>
      </main>
    </div>
  );
}
