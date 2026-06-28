import React, { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { api, API } from "@/lib/api";
import { FileLock, Download, Trash2, Search } from "lucide-react";

function bytesHuman(n) {
  if (!n && n !== 0) return "-";
  const u = ["B","KB","MB","GB"];
  let i = 0; let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 ? 2 : 1)} ${u[i]}`;
}

export default function MyFiles() {
  const [files, setFiles] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get("/files");
    setFiles(data); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm("Delete this encrypted file from your vault?")) return;
    await api.delete(`/files/${id}`);
    load();
  };

  const download = async (id) => {
    // Authenticated download via fetch + blob
    const res = await fetch(`${API}/files/${id}/download`, { credentials: "include" });
    if (!res.ok) return;
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const m = cd.match(/filename="([^"]+)"/);
    const name = m?.[1] || "file.cvault";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const filtered = files.filter(f => f.original_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Layout title="My Files">
      <div className="cv-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold">Encrypted Vault</h2>
            <p className="text-sm text-[#94A3B8]">All your encrypted files, securely stored.</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search files..."
              className="cv-input pl-9 w-full sm:w-72"
              data-testid="files-search-input"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="cv-table w-full" data-testid="files-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Encrypted Name</th>
                <th>Original Size</th>
                <th>Date</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="text-center text-[#64748B] py-8">Loading...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center text-[#64748B] py-8">No encrypted files yet. <a href="/encrypt" className="text-[#60A5FA] hover:underline">Encrypt your first file</a></td></tr>
              )}
              {filtered.map(f => (
                <tr key={f.id} data-testid={`file-row-${f.id}`}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#0F1729] flex items-center justify-center">
                        <FileLock className="w-4 h-4 text-[#60A5FA]" />
                      </div>
                      <span className="font-medium">{f.original_name}</span>
                    </div>
                  </td>
                  <td className="text-[#94A3B8] text-sm">{f.encrypted_name}</td>
                  <td className="text-sm">{bytesHuman(f.size_original)}</td>
                  <td className="text-sm text-[#94A3B8]">{new Date(f.created_at).toLocaleString()}</td>
                  <td className="text-right pr-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => download(f.id)} className="p-2 rounded-md hover:bg-[#0F1729] text-[#60A5FA]" data-testid={`download-${f.id}`}>
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(f.id)} className="p-2 rounded-md hover:bg-[#0F1729] text-[#F87171]" data-testid={`delete-${f.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
