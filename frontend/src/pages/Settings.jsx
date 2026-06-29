import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { CheckCircle2 } from "lucide-react";

export default function Settings() {
  const [s, setS] = useState({ notifications: true, auto_delete_days: 0 });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/settings").then(({ data }) => setS({ notifications: !!data.notifications, auto_delete_days: data.auto_delete_days || 0 }));
  }, []);

  const save = async () => {
    await api.put("/settings", s);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <Layout title="Settings">
      <div className="max-w-2xl mx-auto">
        <div className="cv-card p-8">
          <h2 className="text-xl font-bold mb-1">Preferences</h2>
          <p className="text-sm text-[#94A3B8] mb-8">Customize how CipherVault behaves for your account.</p>

          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-[#0F1729] rounded-lg">
              <div>
                <p className="font-semibold">Email notifications</p>
                <p className="text-sm text-[#94A3B8]">Get notified about important security events</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer" data-testid="notifications-toggle">
                <input type="checkbox" checked={s.notifications} onChange={(e) => setS({ ...s, notifications: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-[#334155] rounded-full peer peer-checked:bg-[#2563EB] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            <div className="p-4 bg-[#0F1729] rounded-lg">
              <p className="font-semibold mb-1">Auto-delete encrypted files</p>
              <p className="text-sm text-[#94A3B8] mb-3">Automatically remove files from vault after N days (0 = never)</p>
              <input
                type="number"
                min={0}
                max={365}
                value={s.auto_delete_days}
                onChange={(e) => setS({ ...s, auto_delete_days: parseInt(e.target.value || "0", 10) })}
                className="cv-input w-32"
                data-testid="auto-delete-days-input"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button onClick={save} className="cv-btn-primary px-6 py-3" data-testid="save-settings-button">Save Settings</button>
            {saved && <span className="flex items-center gap-2 text-sm text-[#34D399]"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
          </div>

          <div className="mt-10 pt-6 border-t border-white/5">
            <h3 className="text-lg font-bold mb-2">Security</h3>
            <p className="text-sm text-[#94A3B8] mb-4">
              CipherVault uses AES-256-GCM with PBKDF2-SHA256 (200,000 iterations) for password derivation.
              Passwords are never stored — your data is unreadable to anyone, including us.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[#0F1729] rounded-lg p-3"><span className="text-[#64748B]">Algorithm:</span> AES-256-GCM</div>
              <div className="bg-[#0F1729] rounded-lg p-3"><span className="text-[#64748B]">KDF:</span> PBKDF2-SHA256</div>
              <div className="bg-[#0F1729] rounded-lg p-3"><span className="text-[#64748B]">Iterations:</span> 200,000</div>
              <div className="bg-[#0F1729] rounded-lg p-3"><span className="text-[#64748B]">Max file size:</span> 16 MB</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
