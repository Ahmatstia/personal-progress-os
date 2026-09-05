"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ARCHITECTURE_LAYERS,
  ARCHITECTURE_NODES,
  TUTORIAL_CHAPTERS,
  FEATURE_RELATIONS,
  REAL_LIFE_STORYBOARD,
} from "./tutorial-data";

type TabMode = "constellation" | "chapters" | "relations" | "storyboard";

export function InteractiveTutorialExperience() {
  const [activeTab, setActiveTab] = useState<TabMode>("constellation");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("auth");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Relational Matrix state
  const [relFromId, setRelFromId] = useState<string>("areas");
  const [relToId, setRelToId] = useState<string>("goals");

  // Storyboard state
  const [currentStoryStep, setCurrentStoryStep] = useState<number>(1);

  // Selected Node Details
  const selectedNode = useMemo(
    () => ARCHITECTURE_NODES.find((n) => n.id === selectedNodeId) || ARCHITECTURE_NODES[0],
    [selectedNodeId]
  );

  // Connected nodes to the selected node
  const connectedNodes = useMemo(() => {
    return ARCHITECTURE_NODES.filter(
      (n) => selectedNode.connectedTo.includes(n.id) || n.connectedTo.includes(selectedNode.id)
    );
  }, [selectedNode]);

  // Selected Relation Details
  const activeRelation = useMemo(() => {
    const direct = FEATURE_RELATIONS.find(
      (r) =>
        (r.fromId === relFromId && r.toId === relToId) ||
        (r.fromId === relToId && r.toId === relFromId)
    );
    return direct;
  }, [relFromId, relToId]);

  // Filtered chapters for Search
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return TUTORIAL_CHAPTERS;
    const q = searchQuery.toLowerCase();
    return TUTORIAL_CHAPTERS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.purpose.toLowerCase().includes(q) ||
        c.whyItMatters.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-sky-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================================================================== */}
        {/* HEADER & HERO                                                        */}
        {/* ==================================================================== */}
        <div className="mb-8 border-b border-white/10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="animate-pulse">✨</span> Architecture Nexus & Interactive Guide
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                <span>Peta Semesta & Panduan Sistem</span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-medium">
                  v2.0 Sovereign OS
                </span>
              </h1>
              <p className="mt-1.5 text-sm text-slate-400 max-w-2xl leading-relaxed">
                Panduan komprehensif memahami seluruh cara kerja, hierarki filosofis, serta keterhubungan antar-fitur (Fitur A ↔ Fitur B) dari pintu masuk hingga eksekusi harian.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              <Link
                href="/today"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all active:scale-95"
              >
                Kembali ke Aplikasi →
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/5 pt-4">
            {[
              { id: "constellation", label: "🌌 Peta Konstelasi Arsitektur", desc: "Diagram Visual Interaktif" },
              { id: "chapters", label: "📖 Panduan 10 Bab Lengkap", desc: "Dari Login hingga Review" },
              { id: "relations", label: "🔗 Matriks Relasi (Fitur A ↔ B)", desc: "Bagaimana Fitur Saling Terhubung" },
              { id: "storyboard", label: "🎬 Simulasi 7 Hari Nyata", desc: "Skenario Alur Kehidupan Asli" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabMode)}
                className={`flex flex-col items-start px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-all border ${
                  activeTab === tab.id
                    ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10"
                    : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-normal text-slate-400">{tab.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: CONSTELLATION GRAPH (PETA KONSTELASI INTERAKTIF)             */}
        {/* ==================================================================== */}
        {activeTab === "constellation" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Galaxy Canvas */}
            <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>🌌 Kanvas Keterhubungan Entitas</span>
                    <span className="text-[11px] text-indigo-400 font-normal lowercase">(klik node mana saja)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Node yang Anda pilih akan memancarkan pendaran ke semua fitur yang terhubung langsung dengannya.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {ARCHITECTURE_NODES.length} Entitas Terdaftar
                </span>
              </div>

              {/* Layers Stack */}
              <div className="space-y-6">
                {ARCHITECTURE_LAYERS.map((layer) => {
                  const layerNodes = ARCHITECTURE_NODES.filter((n) => n.layer === layer.id);
                  return (
                    <div key={layer.id} className="p-3.5 rounded-xl bg-white/[0.015] border border-white/5">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                          {layer.name}
                        </span>
                        <span className="text-[10px] text-slate-400">{layer.subtitle}</span>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {layerNodes.map((node) => {
                          const isSelected = selectedNodeId === node.id;
                          const isConnected =
                            selectedNode.connectedTo.includes(node.id) ||
                            node.connectedTo.includes(selectedNode.id);

                          return (
                            <button
                              key={node.id}
                              type="button"
                              onClick={() => setSelectedNodeId(node.id)}
                              style={{
                                boxShadow: isSelected
                                  ? `0 0 25px ${node.color.glow}`
                                  : isConnected
                                  ? `0 0 12px ${node.color.glow}`
                                  : "none",
                              }}
                              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left ${
                                isSelected
                                  ? `${node.color.bg} ${node.color.border} text-white scale-105 ring-2 ring-indigo-400/50`
                                  : isConnected
                                  ? `${node.color.bg} ${node.color.border} ${node.color.text} border-dashed`
                                  : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.07] hover:text-slate-200"
                              }`}
                            >
                              <span className="text-base">{node.icon}</span>
                              <div>
                                <div className="font-bold flex items-center gap-1">
                                  <span>{node.name}</span>
                                  {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[140px]">
                                  {node.shortDescription}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Node Inspector Drawer */}
            <div className="lg:col-span-4 p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-white/10 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/10">
                      {selectedNode.icon}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white">{selectedNode.name}</h3>
                      <span className="text-[10px] font-mono text-indigo-400 uppercase">
                        Layer: {selectedNode.layer}
                      </span>
                    </div>
                  </div>
                  {selectedNode.route && (
                    <Link
                      href={selectedNode.route}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
                    >
                      Buka Fitur ↗
                    </Link>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Peran & Fungsi
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      {selectedNode.shortDescription}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Terhubung Langsung Dengan ({connectedNodes.length})
                    </h4>
                    <div className="space-y-2">
                      {connectedNodes.map((cn) => (
                        <button
                          key={cn.id}
                          type="button"
                          onClick={() => setSelectedNodeId(cn.id)}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-left text-xs transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <span>{cn.icon}</span>
                            <span className="font-semibold text-slate-300 group-hover:text-white">
                              {cn.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                            Inspeksi →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Jump Action */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setRelFromId(selectedNode.id);
                    setActiveTab("relations");
                  }}
                  className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 text-indigo-300 border border-indigo-500/30 transition-all active:scale-95"
                >
                  Lihat Hubungan Relasi Fitur Ini di Matriks ↔
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: STEP-BY-STEP CHAPTERS (PANDUAN 10 BAB LENGKAP)                */}
        {/* ==================================================================== */}
        {activeTab === "chapters" && (
          <div>
            {/* Search Input */}
            <div className="mb-6 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari topik atau fitur (misal: login, pomodoro, telegram)..."
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-6">
              {filteredChapters.map((chapter, idx) => (
                <div
                  key={chapter.id}
                  className="p-6 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-xl relative overflow-hidden"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {chapter.badge}
                        </span>
                        <span className="text-xs font-mono text-slate-400">Bagian {idx + 1} dari 10</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{chapter.title}</h3>
                      <p className="text-xs text-indigo-200/80 font-medium mt-0.5">{chapter.purpose}</p>
                    </div>

                    {chapter.route && (
                      <Link
                        href={chapter.route}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm active:scale-95"
                      >
                        Buka Halaman {chapter.route} ↗
                      </Link>
                    )}
                  </div>

                  {/* Why it matters */}
                  <div className="mb-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      💡 Mengapa Fitur Ini Diciptakan?
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {chapter.whyItMatters}
                    </p>
                  </div>

                  {/* Step by step */}
                  <div className="mb-4">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      🛠️ Panduan Langkah demi Langkah:
                    </h4>
                    <div className="space-y-1.5">
                      {chapter.stepByStepGuide.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attributes & Pro Tips */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/5">
                    <div className="p-3 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20">
                      <h5 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
                        ✨ Tips Mahir (Pro-Tips)
                      </h5>
                      <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                        {chapter.proTips.map((tip, tIdx) => (
                          <li key={tIdx}>{tip}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-500/[0.03] border border-rose-500/20">
                      <h5 className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1.5">
                        ⚠️ Kesalahan Umum yang Harus Dihindari
                      </h5>
                      <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                        {chapter.commonMistakes.map((mis, mIdx) => (
                          <li key={mIdx}>{mis}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: RELATIONS MATRIX (FITUR A ↔ FITUR B)                          */}
        {/* ==================================================================== */}
        {activeTab === "relations" && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
            <div className="max-w-2xl mb-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>🔗 Matriks Relasi Antar-Fitur</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono">
                  Sistemik & Non-Terpisah
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Di Personal Progress OS, tidak ada fitur yang berdiri sendiri. Pilih dua fitur di bawah untuk melihat bagaimana keduanya saling berhubungan, mengalirkan data, dan cara menggunakannya bersama.
              </p>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div>
                <label className="block text-xs font-bold text-indigo-300 mb-1.5">
                  1. Pilih Fitur Pertama (Fitur A):
                </label>
                <select
                  value={relFromId}
                  onChange={(e) => setRelFromId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                >
                  {ARCHITECTURE_NODES.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.icon} {n.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-300 mb-1.5">
                  2. Pilih Fitur Kedua (Fitur B):
                </label>
                <select
                  value={relToId}
                  onChange={(e) => setRelToId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                >
                  {ARCHITECTURE_NODES.filter((n) => n.id !== relFromId).map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.icon} {n.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Relation Result Display */}
            {activeRelation ? (
              <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{activeRelation.fromName}</span>
                    <span className="text-indigo-400 font-bold">⇄</span>
                    <span className="text-sm font-bold text-white">{activeRelation.toName}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                    Tipe: {activeRelation.relationshipType}
                  </span>
                </div>

                <p className="text-xs font-semibold text-indigo-200 mb-4">
                  {activeRelation.summary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      💡 Cara Menggunakannya Bersama:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {activeRelation.howToUseTogether.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        📊 Aliran Data Teknis:
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono text-[11px]">
                        {activeRelation.dataFlowDescription}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20">
                      <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                        🌟 Contoh Nyata:
                      </h4>
                      <p className="text-xs text-emerald-200/90 leading-relaxed">
                        {activeRelation.realWorldExample}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-white/[0.01] border border-dashed border-white/10 text-slate-400">
                <span className="text-3xl block mb-2">🌐</span>
                <p className="text-xs text-slate-300 font-semibold">
                  Kedua entitas ini terhubung secara tidak langsung melalui entitas perantara.
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                  Misalnya: Area terhubung ke Task melalui perantara Goal atau Project. Pilih pasangan relasi langsung seperti Area ↔ Goal, Task ↔ Daily Focus, atau Pomodoro ↔ Review.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: REAL-LIFE STORYBOARD (SIMULASI 7 HARI NYATA)                  */}
        {/* ==================================================================== */}
        {activeTab === "storyboard" && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
            <div className="max-w-2xl mb-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>🎬 Simulasi Alur Kehidupan 7 Hari</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono">
                  Skenario Nyata
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Pelajari bagaimana Anda berinteraksi dengan Personal Progress OS di dunia nyata: mulai dari bangun pagi di hari Senin, mengatasi distraksi ide liar, sesi fokus dengan Pomodoro, peringatan bot Telegram, hingga refleksi di hari Minggu malam.
              </p>
            </div>

            {/* Stepper Navigator */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
              {REAL_LIFE_STORYBOARD.map((step) => {
                const isActiveStep = currentStoryStep === step.stepNumber;
                return (
                  <button
                    key={step.stepNumber}
                    type="button"
                    onClick={() => setCurrentStoryStep(step.stepNumber)}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isActiveStep
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30"
                        : "bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/[0.08]"
                    }`}
                  >
                    <span>Langkah {step.stepNumber}</span>
                    <span className="block text-[10px] font-normal text-slate-300">
                      {step.phase.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Current Step Active Card */}
            {(() => {
              const step =
                REAL_LIFE_STORYBOARD.find((s) => s.stepNumber === currentStoryStep) ||
                REAL_LIFE_STORYBOARD[0];

              return (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-950 border border-indigo-500/30 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {step.phase}
                    </span>
                    <div className="flex gap-1.5">
                      {step.activeFeatures.map((fId) => (
                        <span
                          key={fId}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300"
                        >
                          #{fId}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        📍 Situasi Nyata:
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{step.situation}</p>

                      <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mt-4 mb-1">
                        👉 Tindakan Anda:
                      </h4>
                      <p className="text-xs text-indigo-200/90 leading-relaxed font-semibold">
                        {step.userAction}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                        🤖 Respon Personal Progress OS:
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{step.systemResponse}</p>

                      <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mt-4 mb-1">
                        💡 Intisari Produktivitas:
                      </h4>
                      <p className="text-xs text-emerald-200/90 leading-relaxed font-semibold">
                        {step.lesson}
                      </p>
                    </div>
                  </div>

                  {/* Navigation Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <button
                      type="button"
                      disabled={currentStoryStep === 1}
                      onClick={() => setCurrentStoryStep((prev) => Math.max(1, prev - 1))}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      ← Langkah Sebelumnya
                    </button>
                    <span className="text-xs font-mono text-slate-400">
                      {currentStoryStep} / {REAL_LIFE_STORYBOARD.length}
                    </span>
                    <button
                      type="button"
                      disabled={currentStoryStep === REAL_LIFE_STORYBOARD.length}
                      onClick={() =>
                        setCurrentStoryStep((prev) =>
                          Math.min(REAL_LIFE_STORYBOARD.length, prev + 1)
                        )
                      }
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      Langkah Selanjutnya →
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
