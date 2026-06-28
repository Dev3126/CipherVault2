import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Lock, Unlock, Database, ShieldCheck, FileLock, FileCheck, Upload, ArrowRight, CheckCircle2, XCircle, TrendingUp } from "lucide-react";

function bytesHuman(n) {
  if (!n) return "0 B";
  const u = ["B","KB","MB","GB","TB"];
  let i = 0; let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 ? 2 : 1)} ${u[i]}`;
}

function timeAgo(iso) {
  const d = new Date(iso); const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)} hour${Math.floor(diff/3600)>1?"s":""} ago`;
  return `${Math.floor(diff/86400)} day${Math.floor(diff/86400)>1?"s":""} ago`;
}

function StatCard({ icon: Icon, color, label, value, delta }) {
  return (
    <div className="cv-stat-card p-5" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}1f` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <TrendingUp className="w-4 h-4 text-[#64748B]" />
      </div>
      <p className="text-sm text-[#94A3B8]">{label}</p>
      <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
      {delta && <p className="text-xs mt-2 text-[#34D399]">{delta}</p>}
    </div>
  );
}

function QuickAction({ kind, onFile }) {
  const isEnc = kind === "encrypt";
  const inputRef = React.useRef();
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    if (e.dataTransfer.files?.[0]) onFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="cv-card p-6">
      <div className="flex items-center gap-2 mb-4">
        {isEnc ? <Lock className="w-5 h-5 text-[#60A5FA]" /> : <Unlock className="w-5 h-5 text-[#34D399]" />}
        <h3 className={`text-lg font-semibold ${isEnc ? "text-[#60A5FA]" : "text-[#34D399]"}`}>
          {isEnc ? "Quick Encrypt" : "Quick Decrypt"}
        </h3>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cv-dropzone ${drag ? "dragover" : ""} cursor-pointer p-10 text-center`}
        data-testid={`${kind}-dropzone`}
      >
        <Upload className="w-10 h-10 mx-auto text-[#475569] mb-3" />
        <p className="text-sm text-[#94A3B8]">
          {isEnc ? "Drag & drop your file here" : "Drag & drop encrypted file here"}
        </p>
        <p className="text-xs text-[#64748B] mt-1">or click to browse</p>
        <p className="text-xs text-[#475569] mt-4">Maximum file size: 16MB</p>
      </div>
      <input ref={inputRef} type="file" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <button
        onClick={() => inputRef.current?.click()}
        className={`mt-4 w-full py-3 rounded-lg font-semibold text-white ${isEnc ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : "bg-[#10B981] hover:bg-[#059669]"} transition-colors`}
        data-testid={`${kind}-choose-button`}
      >
        Choose File
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const [s, h] = await Promise.all([api.get("/stats"), api.get("/history")]);
    setStats(s.data);
    setHistory(h.data.slice(0, 4));
  }, []);
  useEffect(() => { load(); }, [load]);

  const quickPick = (kind) => (file) => {
    // Take user to the page with file preloaded via state
    navigate(`/${kind}`, { state: { presetFile: file } });
  };

  return (
    <Layout title="Dashboard">
      {/* Welcome Banner */}
      <div className="cv-card p-8 mb-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to <span className="text-[#60A5FA]">CipherVault</span>
          </h1>
          <p className="mt-2 text-lg font-semibold text-[#94A3B8]">Encrypt. Decrypt. Protect.</p>
          <p className="mt-4 text-sm text-[#94A3B8] leading-relaxed">
            Your all-in-one solution for secure file encryption and decryption.
            Protect your sensitive data with military-grade encryption.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate("/encrypt")}
              data-testid="encrypt-cta"
              className="cv-btn-primary px-5 py-3 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" /> Encrypt a File
            </button>
            <button
              onClick={() => navigate("/decrypt")}
              data-testid="decrypt-cta"
              className="cv-btn-secondary px-5 py-3 flex items-center gap-2"
            >
              <Unlock className="w-4 h-4" /> Decrypt a File
            </button>
          </div>
        </div>
        {/* Decorative shield */}
        <div className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 opacity-90">
          <div className="relative">
            <div className="w-44 h-44 rounded-3xl bg-[#1E293B] border border-white/10 flex items-center justify-center cv-glow">
              <ShieldCheck className="w-24 h-24 text-[#60A5FA]" strokeWidth={1.4} />
            </div>
            <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard icon={FileLock} color="#2563EB" label="Files Encrypted" value={stats?.files_encrypted ?? 0} delta={`+${stats?.encrypted_this_month ?? 0} this month`} />
        <StatCard icon={FileCheck} color="#10B981" label="Files Decrypted" value={stats?.files_decrypted ?? 0} delta={`+${stats?.decrypted_this_month ?? 0} this month`} />
        <StatCard icon={Database} color="#F59E0B" label="Total Size Processed" value={bytesHuman(stats?.total_size_bytes ?? 0)} delta={`Across all operations`} />
        <StatCard icon={ShieldCheck} color="#10B981" label="Success Rate" value={`${stats?.success_rate ?? 100}%`} delta="All operations successful" />
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <QuickAction kind="encrypt" onFile={quickPick("encrypt")} />
        <QuickAction kind="decrypt" onFile={quickPick("decrypt")} />
        <div className="cv-card p-6" data-testid="recent-activity">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          {history.length === 0 && <p className="text-sm text-[#64748B]">No activity yet. Encrypt your first file!</p>}
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#0F1729]">
                  {h.operation === "encrypt"
                    ? <Lock className="w-4 h-4 text-[#60A5FA]" />
                    : <Unlock className="w-4 h-4 text-[#34D399]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{h.filename}</p>
                  <p className="text-xs text-[#64748B]">{h.operation === "encrypt" ? "Encrypted" : "Decrypted"} {h.status === "success" ? "successfully" : "failed"}</p>
                </div>
                <span className="text-xs text-[#64748B]">{timeAgo(h.created_at)}</span>
                {h.status === "success"
                  ? <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  : <XCircle className="w-4 h-4 text-[#EF4444]" />}
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/history")}
            className="mt-5 w-full text-sm text-[#94A3B8] hover:text-white border border-white/5 rounded-lg py-2.5 flex items-center justify-center gap-2"
            data-testid="view-all-history-button"
          >
            View All History <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <footer className="mt-10 pt-6 text-center text-xs text-[#64748B] border-t border-white/5">
        © 2026 CipherVault. All rights reserved.
      </footer>
    </Layout>
  );
}
