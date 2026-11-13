"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ClipboardCopy,
  ExternalLink,
  Search,
  AlertTriangle,
  Terminal,
  EyeOff,
  Eye,
  RotateCcw,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { LeagueSwitcher } from "@/components/layout/LeagueSwitcher";
import { SettingsControls } from "@/components/SettingsControls";

export type CockpitLeagueKey = "sultanlar" | "1-lig" | "2-lig";

export interface VolleyboxCockpitMatch {
  id: string;
  leagueKey: CockpitLeagueKey;
  leagueLabel: string;
  grupAdi: string;
  hafta: string;
  tarih: string;
  isoDate: string;
  saat: string;
  salon: string;
  sehir: string;
  takimA: string;
  takimB: string;
  vbNameA: string | null;
  vbNameB: string | null;
  vbUrlA: string | null;
  vbUrlB: string | null;
  setA: string;
  setB: string;
  skor: string;
  setSonuclari: string[];
  isFinished: boolean;
  tournamentUrl: string;
}

export interface UnmappedTeamItem {
  leagueKey: CockpitLeagueKey;
  leagueLabel: string;
  teamName: string;
}

interface VolleyboxCockpitClientProps {
  matches: VolleyboxCockpitMatch[];
  unmappedTeams: UnmappedTeamItem[];
  updatedAtByLeague: Record<CockpitLeagueKey, string>;
}

const STORAGE_KEY = "pv-vb-entered-v1";

export const VolleyboxCockpitClient: React.FC<VolleyboxCockpitClientProps> = ({
  matches,
  unmappedTeams,
  updatedAtByLeague,
}) => {
  const [leagueFilter, setLeagueFilter] = useState<"all" | CockpitLeagueKey>("all");
  const [statusFilter, setStatusFilter] = useState<"finished" | "upcoming" | "unmapped" | "all">("finished");
  const [searchQuery, setSearchQuery] = useState("");
  const [hideEntered, setHideEntered] = useState(false);
  const [activeView, setActiveView] = useState<"matches" | "unmapped" | "cli">("matches");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [enteredIds, setEnteredIds] = useState<Record<string, boolean>>({});
  const [pageSize, setPageSize] = useState(100);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setEnteredIds(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleEntered = (id: string) => {
    setEnteredIds((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const clearEntered = () => {
    setEnteredIds({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      setTimeout(() => setCopiedId((curr) => (curr === key ? null : curr)), 1500);
    } catch {
      // ignore
    }
  };

  const stats = useMemo(() => {
    const finished = matches.filter((m) => m.isFinished).length;
    const upcoming = matches.length - finished;
    const missingMapping = matches.filter((m) => !m.vbNameA || !m.vbNameB).length;
    const enteredCount = Object.keys(enteredIds).length;
    return {
      total: matches.length,
      finished,
      upcoming,
      missingMapping,
      enteredCount,
    };
  }, [matches, enteredIds]);

  const filteredMatches = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("tr");
    return matches
      .filter((m) => {
        if (leagueFilter !== "all" && m.leagueKey !== leagueFilter) return false;
        if (statusFilter === "finished" && !m.isFinished) return false;
        if (statusFilter === "upcoming" && m.isFinished) return false;
        if (statusFilter === "unmapped" && m.vbNameA && m.vbNameB) return false;
        if (hideEntered && enteredIds[m.id]) return false;
        if (q) {
          const hay = [
            m.takimA,
            m.takimB,
            m.vbNameA || "",
            m.vbNameB || "",
            m.grupAdi,
            m.tarih,
            m.salon,
            m.sehir,
          ]
            .join(" ")
            .toLocaleLowerCase("tr");
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (statusFilter === "upcoming") {
          return a.isoDate.localeCompare(b.isoDate) || a.saat.localeCompare(b.saat);
        }
        return b.isoDate.localeCompare(a.isoDate) || b.saat.localeCompare(a.saat);
      });
  }, [matches, leagueFilter, statusFilter, searchQuery, hideEntered, enteredIds]);

  const visibleMatches = useMemo(
    () => filteredMatches.slice(0, pageSize),
    [filteredMatches, pageSize]
  );

  const formatMatchCopyLine = (m: VolleyboxCockpitMatch) => {
    const home = m.vbNameA || m.takimA;
    const away = m.vbNameB || m.takimB;
    const scorePart = m.isFinished
      ? `${m.setA}-${m.setB}${m.setSonuclari.length ? ` (${m.setSonuclari.join(", ")})` : ""}`
      : "Oynanmadı";
    return `${m.tarih} ${m.saat} | ${home} - ${away} | ${scorePart}`;
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Üst Bar */}
      <header className="bg-canvas/95 backdrop-blur border-b border-line/70 sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 flex-wrap">
            <BrandLogo />
            <LeagueSwitcher activeLeague="volleybox" />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <SettingsControls />
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-screen-2xl w-full mx-auto px-3 sm:px-4 py-5 flex-1 space-y-4">
        {/* Başlık & KPI Şeridi */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-surface border border-line/70 rounded-2xl p-4">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              TVF → Volleybox Maç Giriş Kokpiti
            </h1>
            <p className="text-xs text-ink-2 mt-0.5">
              Sultanlar: {updatedAtByLeague["sultanlar"] || "-"} • 1. Lig: {updatedAtByLeague["1-lig"] || "-"} • 2. Lig: {updatedAtByLeague["2-lig"] || "-"}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            <div className="bg-canvas/70 border border-line/60 rounded-xl px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">Toplam</div>
              <div className="text-base font-black text-white tabular-nums">{stats.total}</div>
            </div>
            <div className="bg-canvas/70 border border-line/60 rounded-xl px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">Oynandı</div>
              <div className="text-base font-black text-amber-400 tabular-nums">{stats.finished}</div>
            </div>
            <div className="bg-canvas/70 border border-line/60 rounded-xl px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">Gelecek</div>
              <div className="text-base font-black text-sky-400 tabular-nums">{stats.upcoming}</div>
            </div>
            <div className="bg-canvas/70 border border-line/60 rounded-xl px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">Eşleşmeyen</div>
              <div className="text-base font-black text-rose-400 tabular-nums">{unmappedTeams.length}</div>
            </div>
            <div className="bg-canvas/70 border border-line/60 rounded-xl px-3 py-2 col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">Girildi ✓</div>
              <div className="text-base font-black text-emerald-400 tabular-nums">{stats.enteredCount}</div>
            </div>
          </div>
        </div>

        {/* Görünüm Sekmeleri */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface border border-line/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveView("matches")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeView === "matches" ? "bg-primary text-primary-fg font-bold" : "text-ink-2 hover:text-white"
              }`}
            >
              Maç Listesi ({filteredMatches.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveView("unmapped")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeView === "unmapped" ? "bg-rose-500 text-white font-bold" : "text-ink-2 hover:text-white"
              }`}
            >
              <AlertTriangle size={13} />
              <span>Eşleşmeyen Takımlar ({unmappedTeams.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("cli")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeView === "cli" ? "bg-emerald-500 text-black font-bold" : "text-ink-2 hover:text-white"
              }`}
            >
              <Terminal size={13} />
              <span>Bot Komutları</span>
            </button>
          </div>

          {stats.enteredCount > 0 && (
            <button
              type="button"
              onClick={clearEntered}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised border border-line/70 text-ink-2 hover:text-white cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Girildi İşaretlerini Sıfırla</span>
            </button>
          )}
        </div>

        {activeView === "matches" && (
          <>
            {/* Filtre Çubuğu */}
            <div className="bg-surface border border-line/70 rounded-2xl p-3 flex flex-wrap items-center gap-2.5">
              {/* Lig Filtresi */}
              <div className="inline-flex items-center gap-1 bg-canvas p-1 rounded-xl border border-line/60 text-xs">
                {(
                  [
                    ["all", "Tümü"],
                    ["sultanlar", "Sultanlar"],
                    ["1-lig", "1. Lig"],
                    ["2-lig", "2. Lig"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLeagueFilter(key)}
                    className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                      leagueFilter === key ? "bg-amber-400 text-black" : "text-ink-2 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Durum Filtresi */}
              <div className="inline-flex items-center gap-1 bg-canvas p-1 rounded-xl border border-line/60 text-xs">
                {(
                  [
                    ["finished", "Skoru Girilmiş"],
                    ["upcoming", "Gelecek"],
                    ["unmapped", "Eşleşmeyen"],
                    ["all", "Tümü"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(key)}
                    className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                      statusFilter === key ? "bg-emerald-400 text-black" : "text-ink-2 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Arama */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Takım, grup, tarih veya salon ara..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-canvas border border-line/70 text-xs text-white placeholder:text-ink-3 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Girilenleri Gizle */}
              <button
                type="button"
                onClick={() => setHideEntered((v) => !v)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border cursor-pointer transition-colors ${
                  hideEntered
                    ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
                    : "bg-canvas border-line/70 text-ink-2 hover:text-white"
                }`}
              >
                {hideEntered ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>Girilenleri Gizle</span>
              </button>
            </div>

            {/* Maç Satırları */}
            <div className="space-y-2">
              {visibleMatches.length === 0 ? (
                <div className="bg-surface border border-line/70 rounded-2xl p-8 text-center text-sm text-ink-2">
                  Seçili filtrelere uygun maç bulunamadı.
                </div>
              ) : (
                visibleMatches.map((m) => {
                  const isEntered = Boolean(enteredIds[m.id]);
                  const hasUnmapped = !m.vbNameA || !m.vbNameB;
                  const copyLineKey = `line-${m.id}`;

                  return (
                    <div
                      key={m.id}
                      className={`bg-surface border rounded-xl p-3 transition-colors ${
                        isEntered
                          ? "border-emerald-500/40 opacity-65"
                          : hasUnmapped
                          ? "border-rose-500/40"
                          : "border-line/70 hover:border-line"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Sol: Lig, Tarih, Takımlar */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-2">
                            <span className="font-bold px-2 py-0.5 rounded bg-canvas border border-line/70 text-amber-300">
                              {m.leagueLabel}
                            </span>
                            {m.grupAdi && <span className="text-ink-3">{m.grupAdi}</span>}
                            {m.hafta && <span className="text-ink-3">• {m.hafta}. Hafta</span>}
                            <span className="font-mono text-white font-semibold">
                              {m.tarih} {m.saat}
                            </span>
                            {m.salon && <span className="text-ink-3 truncate max-w-[220px]">• {m.salon}</span>}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2">
                            {/* Ev Sahibi */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <button
                                type="button"
                                onClick={() => copyText(m.vbNameA || m.takimA, `a-${m.id}`)}
                                className="text-left font-bold text-sm text-white hover:text-amber-300 truncate cursor-pointer"
                                title={`Kopyala: ${m.vbNameA || m.takimA}`}
                              >
                                {m.vbNameA || m.takimA}
                              </button>
                              {!m.vbNameA && (
                                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  VB Yok
                                </span>
                              )}
                              {copiedId === `a-${m.id}` && <Check size={12} className="text-emerald-400 shrink-0" />}
                            </div>

                            {/* Skor */}
                            <div className="flex items-center gap-2 justify-center">
                              {m.isFinished ? (
                                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono font-black text-sm">
                                  {m.setA} - {m.setB}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-lg bg-canvas border border-line/60 text-ink-3 font-mono text-xs">
                                  vs
                                </span>
                              )}
                            </div>

                            {/* Konuk */}
                            <div className="flex items-center gap-1.5 min-w-0 sm:justify-end">
                              {copiedId === `b-${m.id}` && <Check size={12} className="text-emerald-400 shrink-0" />}
                              {!m.vbNameB && (
                                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  VB Yok
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => copyText(m.vbNameB || m.takimB, `b-${m.id}`)}
                                className="text-left sm:text-right font-bold text-sm text-white hover:text-amber-300 truncate cursor-pointer"
                                title={`Kopyala: ${m.vbNameB || m.takimB}`}
                              >
                                {m.vbNameB || m.takimB}
                              </button>
                            </div>
                          </div>

                          {m.setSonuclari.length > 0 && (
                            <div className="text-[11px] font-mono text-ink-2">
                              Setler: {m.setSonuclari.join("  •  ")}
                            </div>
                          )}
                        </div>

                        {/* Sağ: Aksiyonlar */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => copyText(formatMatchCopyLine(m), copyLineKey)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-canvas hover:bg-surface-raised border border-line/70 text-xs font-semibold text-ink-2 hover:text-white cursor-pointer"
                          >
                            {copiedId === copyLineKey ? (
                              <Check size={13} className="text-emerald-400" />
                            ) : (
                              <ClipboardCopy size={13} />
                            )}
                            <span>{copiedId === copyLineKey ? "Kopyalandı" : "Satır Kopyala"}</span>
                          </button>

                          {m.tournamentUrl && (
                            <a
                              href={m.tournamentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-canvas hover:bg-surface-raised border border-line/70 text-xs font-semibold text-sky-300 hover:text-sky-200"
                            >
                              <span>Volleybox</span>
                              <ExternalLink size={12} />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleEntered(m.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                              isEntered
                                ? "bg-emerald-500 text-black border-emerald-400"
                                : "bg-canvas hover:bg-emerald-500/15 border-line/70 text-ink-2 hover:text-emerald-300"
                            }`}
                          >
                            <CheckCircle2 size={13} />
                            <span>{isEntered ? "Girildi" : "Girildi İşaretle"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {filteredMatches.length > pageSize && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setPageSize((s) => s + 100)}
                    className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-raised border border-line/70 text-xs font-bold text-white cursor-pointer"
                  >
                    Daha Fazla Göster ({filteredMatches.length - pageSize} maç kaldı)
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === "unmapped" && (
          <div className="bg-surface border border-line/70 rounded-2xl p-4 space-y-3">
            <h2 className="text-sm font-bold text-white">
              Volleybox Eşleşmesi Eksik Takımlar ({unmappedTeams.length})
            </h2>
            {unmappedTeams.length === 0 ? (
              <p className="text-xs text-emerald-300">Tüm takımlar Volleybox ile eşleştirilmiş durumda.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {unmappedTeams.map((t, i) => (
                  <div
                    key={`${t.leagueKey}-${t.teamName}-${i}`}
                    className="flex items-center justify-between gap-2 bg-canvas border border-line/60 rounded-xl px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{t.teamName}</div>
                      <div className="text-[10px] text-ink-3">{t.leagueLabel}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(t.teamName, `unmap-${i}`)}
                      className="p-1.5 rounded-lg bg-surface hover:bg-surface-raised text-ink-2 hover:text-white cursor-pointer"
                      title="Takım adını kopyala"
                    >
                      {copiedId === `unmap-${i}` ? <Check size={13} className="text-emerald-400" /> : <ClipboardCopy size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === "cli" && (
          <div className="bg-surface border border-line/70 rounded-2xl p-4 space-y-3">
            <h2 className="text-sm font-bold text-white">TVF → Volleybox CLI Komutları</h2>
            <div className="space-y-2 text-xs font-mono">
              {[
                ["Tüm pro ligleri çek", "python scripts/scrape_pro_leagues.py --all"],
                ["Volleybox maçlarını senkronize et", "python scripts/sync_volleybox_matches.py"],
                ["Eksik maçları Volleybox'a gönder (Pro)", "python scripts/push_volleybox_matches.py --pro"],
                ["Bot sağlık kontrolü", "python scripts/check_bot_health.py --pro"],
              ].map(([label, cmd], idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 bg-canvas border border-line/60 rounded-xl px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-sans text-ink-3 mb-0.5">{label}</div>
                    <div className="text-emerald-300 truncate">{cmd}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(cmd, `cmd-${idx}`)}
                    className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised border border-line/70 text-ink-2 hover:text-white cursor-pointer shrink-0"
                  >
                    {copiedId === `cmd-${idx}` ? "Kopyalandı" : "Kopyala"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
