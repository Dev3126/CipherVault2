import React from "react";
import Layout from "@/components/Layout";
import { Shield, Key, Lock, Server, Cpu, Globe } from "lucide-react";

const Item = ({ icon: Icon, title, desc }) => (
  <div className="cv-card p-5">
    <div className="w-10 h-10 rounded-lg bg-[#2563EB]/15 flex items-center justify-center mb-3">
      <Icon className="w-5 h-5 text-[#60A5FA]" />
    </div>
    <h3 className="font-semibold mb-1">{title}</h3>
    <p className="text-sm text-[#94A3B8] leading-relaxed">{desc}</p>
  </div>
);

export default function About() {
  return (
    <Layout title="About Project">
      <div className="max-w-4xl mx-auto">
        <div className="cv-card p-8 mb-6">
          <h2 className="text-3xl font-bold tracking-tight mb-3">About <span className="text-[#60A5FA]">CipherVault</span></h2>
          <p className="text-[#94A3B8] leading-relaxed">
            CipherVault is a secure file encryption platform that brings military-grade cryptography to anyone. 
            Whether you're protecting tax documents, sensitive client files, or family memories, CipherVault makes
            strong encryption accessible without compromising on usability.
          </p>
        </div>

        <h3 className="text-xl font-bold mb-4">How it works</h3>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Item icon={Key} title="Password-derived keys" desc="Your password is stretched with PBKDF2-SHA256 (200K iterations) into a 256-bit key. We never store passwords or keys." />
          <Item icon={Lock} title="AES-256-GCM" desc="Files are encrypted with authenticated encryption, ensuring confidentiality and tamper detection." />
          <Item icon={Server} title="Encrypted at rest" desc="Stored files in your vault are already encrypted client-side. Even if storage is compromised, your data is unreadable." />
          <Item icon={Globe} title="Zero-knowledge" desc="Without your password, no one — including CipherVault — can decrypt your files." />
        </div>

        <div className="cv-card p-8">
          <h3 className="text-xl font-bold mb-3">Tech Stack</h3>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-[#0F1729] rounded-lg p-3"><span className="text-[#64748B]">Frontend:</span> React 19</div>
            <div className="bg-[#0F1729] rounded-lg p-3"><span className="text-[#64748B]">Backend:</span> FastAPI</div>
            <div className="bg-[#0F1729] rounded-lg p-3"><span className="text-[#64748B]">Database:</span> MongoDB</div>
            <div className="bg-[#0F1729] rounded-lg p-3"><span className="text-[#64748B]">Crypto:</span> cryptography (Python)</div>
            <div className="bg-[#0F1729] rounded-lg p-3"><span className="text-[#64748B]">Auth:</span> Google OAuth</div>
            <div className="bg-[#0F1729] rounded-lg p-3"><span className="text-[#64748B]">Cipher:</span> AES-256-GCM</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
