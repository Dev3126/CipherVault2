import React, { useState } from "react";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, CheckCircle2, Send } from "lucide-react";

export default function Contact() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { setError("All fields are required"); return; }
    setError(""); setLoading(true);
    try { await api.post("/contact", form); setSent(true); }
    catch (err) { setError("Failed to send. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <Layout title="Contact Us">
      <div className="max-w-2xl mx-auto">
        <div className="cv-card p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-[#2563EB]/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#60A5FA]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Get in touch</h2>
              <p className="text-sm text-[#94A3B8]">We typically respond within 24 hours.</p>
            </div>
          </div>

          {sent ? (
            <div className="mt-8 text-center py-12" data-testid="contact-success">
              <CheckCircle2 className="w-14 h-14 text-[#10B981] mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-1">Message sent</h3>
              <p className="text-[#94A3B8]">Thanks for reaching out. We'll get back to you soon.</p>
              <button onClick={() => { setSent(false); setForm({ ...form, message: "" }); }} className="mt-6 cv-btn-secondary px-4 py-2">Send another</button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4" data-testid="contact-form">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="cv-input" data-testid="contact-name" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="cv-input" data-testid="contact-email" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Message</label>
                <textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="cv-input resize-none" data-testid="contact-message" />
              </div>
              {error && <div className="px-4 py-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-sm text-[#FCA5A5]">{error}</div>}
              <button type="submit" disabled={loading} className="cv-btn-primary px-5 py-3 flex items-center gap-2" data-testid="contact-submit">
                {loading ? <div className="cv-spin" /> : <Send className="w-4 h-4" />}
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
