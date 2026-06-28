import React from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Mail, Calendar, LogOut } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <Layout title="Profile">
      <div className="max-w-2xl mx-auto">
        <div className="cv-card p-8">
          <div className="flex items-center gap-6">
            <img
              src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563EB&color=fff&size=128`}
              alt=""
              className="w-24 h-24 rounded-2xl border-2 border-[#2563EB]"
              data-testid="profile-avatar"
            />
            <div>
              <h2 className="text-2xl font-bold" data-testid="profile-name">{user.name}</h2>
              <p className="text-[#94A3B8]" data-testid="profile-email">{user.email}</p>
              <span className="cv-badge cv-badge-info mt-2">
                <Shield className="w-3 h-3" /> Premium User
              </span>
            </div>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="bg-[#0F1729] rounded-lg p-4">
              <div className="flex items-center gap-2 text-[#94A3B8] text-xs uppercase tracking-wider mb-2">
                <Mail className="w-3.5 h-3.5" /> Email
              </div>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="bg-[#0F1729] rounded-lg p-4">
              <div className="flex items-center gap-2 text-[#94A3B8] text-xs uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5" /> Account Created
              </div>
              <p className="font-medium">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</p>
            </div>
            <div className="bg-[#0F1729] rounded-lg p-4">
              <div className="flex items-center gap-2 text-[#94A3B8] text-xs uppercase tracking-wider mb-2">
                <Shield className="w-3.5 h-3.5" /> User ID
              </div>
              <p className="font-mono text-sm">{user.user_id}</p>
            </div>
            <div className="bg-[#0F1729] rounded-lg p-4">
              <div className="flex items-center gap-2 text-[#94A3B8] text-xs uppercase tracking-wider mb-2">
                <Shield className="w-3.5 h-3.5" /> Encryption
              </div>
              <p className="font-medium">AES-256-GCM</p>
            </div>
          </div>

          <button onClick={logout} className="mt-8 cv-btn-secondary px-5 py-3 flex items-center gap-2" data-testid="profile-logout-button">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </Layout>
  );
}
