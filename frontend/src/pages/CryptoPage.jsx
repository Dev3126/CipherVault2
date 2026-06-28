import React, { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { Upload, Lock, Unlock, Eye, EyeOff, Download, FileText, X, CheckCircle2 } from "lucide-react";

function bytesHuman(n) {
  if (!n && n !== 0) return "-";
  const u = ["B","KB","MB","GB"];
  let i = 0; let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 ? 2 : 1)} ${u[i]}`;
}

function b64ToBlob(b64, type = "application/octet-stream") {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type });
}

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CryptoPage({ mode }) {
  const isEnc = mode === "encrypt";
  const location = useLocation();
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saveToVault, setSaveToVault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (location.state?.presetFile) setFile(location.state.presetFile);
  }, [location.state]);

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const submit = async () => {
    if (!file) { setError("Please choose a file"); return; }
    if (!password) { setError("Please enter a password"); return; }
    if (isEnc && password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("password", password);
      if (isEnc) fd.append("save", String(saveToVault));
      const { data } = await api.post(`/${mode}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const name = isEnc ? result.encrypted_name : result.decrypted_name;
    triggerDownload(b64ToBlob(result.data_b64), name);
  };

  const reset = () => { setFile(null); setPassword(""); setResult(null); setError(""); };

  return (
    <Layout title={isEnc ? "Encrypt File" : "Decrypt File"}>
      <div className="max-w-3xl mx-auto">
        <div className="cv-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isEnc ? "bg-[#2563EB]/20" : "bg-[#10B981]/20"}`}>
              {isEnc ? <Lock className="w-6 h-6 text-[#60A5FA]" /> : <Unlock className="w-6 h-6 text-[#34D399]" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{isEnc ? "Encrypt a File" : "Decrypt a File"}</h2>
              <p className="text-sm text-[#94A3B8]">
                {isEnc ? "AES-256-GCM with PBKDF2 password derivation" : "Upload a .cvault file and enter the password used to encrypt it"}
              </p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => !file && inputRef.current?.click()}
            className={`cv-dropzone ${drag ? "dragover" : ""} p-12 text-center mb-5 ${!file ? "cursor-pointer" : ""}`}
            data-testid="file-dropzone"
          >
            {file ? (
              <div className="flex items-center gap-4 justify-center">
                <div className="w-14 h-14 rounded-xl bg-[#0F1729] flex items-center justify-center">
                  <FileText className="w-7 h-7 text-[#60A5FA]" />
                </div>
                <div className="text-left">
                  <p className="font-semibold" data-testid="selected-file-name">{file.name}</p>
                  <p className="text-sm text-[#94A3B8]">{bytesHuman(file.size)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-4 text-[#94A3B8] hover:text-white" data-testid="clear-file-button">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto text-[#475569] mb-3" />
                <p className="text-base font-semibold">Drag & drop your file here</p>
                <p className="text-sm text-[#94A3B8] mt-1">or click to browse</p>
                <p className="text-xs text-[#475569] mt-3">Maximum file size: 16MB</p>
              </>
            )}
          </div>
          <input ref={inputRef} type="file" hidden onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />

          {/* Password */}
          <label className="block text-sm font-medium text-[#94A3B8] mb-2">
            {isEnc ? "Encryption Password" : "Decryption Password"}
          </label>
          <div className="relative mb-2">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEnc ? "Strong password (min 6 chars)" : "Enter password"}
              className="cv-input pr-12"
              data-testid="password-input"
            />
            <button
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white"
              data-testid="toggle-password-visibility"
              type="button"
            >
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {isEnc && (
            <p className="text-xs text-[#64748B] mb-4">
              ⚠️ Remember this password. We cannot recover encrypted files without it.
            </p>
          )}

          {isEnc && (
            <label className="flex items-center gap-2 mb-4 text-sm text-[#94A3B8] cursor-pointer">
              <input type="checkbox" checked={saveToVault} onChange={(e) => setSaveToVault(e.target.checked)} data-testid="save-to-vault-toggle" className="accent-[#2563EB]" />
              Save encrypted copy to My Files vault
            </label>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-sm text-[#FCA5A5]" data-testid="error-message">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 ${isEnc ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : "bg-[#10B981] hover:bg-[#059669]"} disabled:opacity-60`}
            data-testid="submit-button"
          >
            {loading ? <div className="cv-spin" /> : (isEnc ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />)}
            {loading ? "Processing..." : (isEnc ? "Encrypt File" : "Decrypt File")}
          </button>
        </div>

        {result && (
          <div className="cv-card p-6 mt-6 border-[#10B981]/30 cv-fade" data-testid="result-card">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              <h3 className="text-lg font-semibold">
                {isEnc ? "File encrypted successfully" : "File decrypted successfully"}
              </h3>
            </div>
            <div className="text-sm text-[#94A3B8] mb-4">
              <p><span className="text-[#64748B]">File:</span> <span className="text-white font-medium">{isEnc ? result.encrypted_name : result.decrypted_name}</span></p>
              <p><span className="text-[#64748B]">Size:</span> {bytesHuman(isEnc ? result.size_encrypted : result.size)}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={downloadResult} className="cv-btn-primary px-5 py-2.5 flex items-center gap-2" data-testid="download-result-button">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={reset} className="cv-btn-secondary px-5 py-2.5" data-testid="reset-button">
                Process Another
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
