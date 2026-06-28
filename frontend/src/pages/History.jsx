import React, { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { Lock, Unlock, CheckCircle2, XCircle, Trash2 } from "lucide-react";

function bytesHuman(n) {
  if (!n && n !== 0) return "-";
  const u = ["B","KB","MB","GB"];
  let i = 0; let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 ? 2 : 1)} ${u[i]}`;
}

export default function History() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get("/history");
    setItems(data); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const clear = async () => {
    if (!window.confirm("Clear all history?")) return;
    await api.delete("/history");
    load();
  };

  const filtered = items.filter(i => filter === "all" || i.operation === filter);

  return (
    <Layout title="History">
      <div className="cv-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold">Operation History</h2>
            <p className="text-sm text-[#94A3B8]">All encryption and decryption operations on your account.</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex bg-[#0F1729] rounded-lg p-1">
              {["all", "encrypt", "decrypt"].map(k => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  data-testid={`filter-${k}`}
                  className={`px-3 py-1.5 text-sm rounded-md ${filter === k ? "bg-[#2563EB] text-white" : "text-[#94A3B8] hover:text-white"}`}
                >
                  {k[0].toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={clear} className="cv-btn-secondary px-4 py-2 flex items-center gap-2 text-sm" data-testid="clear-history-button">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="cv-table w-full" data-testid="history-table">
            <thead>
              <tr>
                <th>Operation</th>
                <th>Filename</th>
                <th>Size</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (<tr><td colSpan={5} className="text-center text-[#64748B] py-8">Loading...</td></tr>)}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center text-[#64748B] py-8">No history yet.</td></tr>
              )}
              {filtered.map(h => (
                <tr key={h.id} data-testid={`history-row-${h.id}`}>
                  <td>
                    <span className={`cv-badge ${h.operation === "encrypt" ? "cv-badge-info" : "cv-badge-success"}`}>
                      {h.operation === "encrypt" ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      {h.operation === "encrypt" ? "Encrypted" : "Decrypted"}
                    </span>
                  </td>
                  <td className="font-medium">{h.filename}</td>
                  <td className="text-sm text-[#94A3B8]">{bytesHuman(h.size)}</td>
                  <td className="text-sm text-[#94A3B8]">{new Date(h.created_at).toLocaleString()}</td>
                  <td>
                    <span className={`cv-badge ${h.status === "success" ? "cv-badge-success" : "cv-badge-danger"}`}>
                      {h.status === "success" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {h.status === "success" ? "Success" : "Failed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
