"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Flame, Trophy, CheckCircle2, Calendar, ChevronRight } from "lucide-react";
import type { ActiveLeagueKey } from "./LeagueSwitcher";

export interface ProTickerMatch {
  id: string;
  league: "Sultanlar" | "1. Lig" | "2. Lig";
  leagueKey: "sultanlar" | "1-lig" | "2-lig";
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  displayDate: string;
  time: string;
  status: "live" | "finished" | "upcoming";
  href: string;
}

interface ProLiveScoreRibbonProps {
  matches: ProTickerMatch[];
}

export const ProLiveScoreRibbon: React.FC<ProLiveScoreRibbonProps> = ({ matches }) => {
  const [filter, setFilter] = useState<"all" | "sultanlar" | "1-lig" | "2-lig">("all");

  const filtered = matches.filter((m) => filter === "all" || m.leagueKey === filter);

  if (!matches || matches.length === 0) return null;

  const badgeColors: Record<ProTickerMatch["leagueKey"], string> = {
    sultanlar: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    "1-lig": "bg-rose-500/20 text-rose-300 border-rose-500/40",
    "2-lig": "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
  };

  return (
    <div
      aria-label="Pro Voleybol Canlı ve Son Skor Şeridi"
      className="w-full bg-gradient-to-r from-[#0C0A10] via-[#171221] to-[#0C0A10] border-b border-amber-500/20 text-xs select-none print:hidden"
    >
      <div className="max-w-[1720px] mx-auto px-2 sm:px-4 py-1.5 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
        {/* Sol Elit Skor Etiketi ve Hızlı Lig Filtresi */}
        <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-line/80">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-amber-500/20 to-rose-600/20 border border-amber-400/40 text-amber-300 font-display font-bold text-[10px] uppercase tracking-wider shadow-xs">
            <Flame size={12} className="text-amber-400 animate-pulse" />
            <span>PRO SKOR</span>
          </span>

          <div className="hidden md:inline-flex items-center gap-1 bg-surface-muted/90 p-0.5 rounded-lg border border-line/70">
            {(
              [
                { key: "all", label: "Tümü" },
                { key: "sultanlar", label: "Sultanlar" },
                { key: "1-lig", label: "1. Lig" },
                { key: "2-lig", label: "2. Lig" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  filter === tab.key
                    ? "bg-primary text-primary-fg shadow-xs"
                    : "text-ink-3 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kaydırılabilir Skor Kartları */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {filtered.map((m) => {
            const homeWon = m.status === "finished" && (m.homeScore ?? 0) > (m.awayScore ?? 0);
            const awayWon = m.status === "finished" && (m.awayScore ?? 0) > (m.homeScore ?? 0);

            return (
              <Link
                key={m.id}
                href={m.href}
                prefetch={false}
                className="group shrink-0 flex items-center gap-2.5 px-2.5 py-1 rounded-xl bg-surface/90 hover:bg-surface-raised border border-line/70 hover:border-amber-400/50 transition-all shadow-xs"
                title={`${m.league}: ${m.homeTeam} - ${m.awayTeam}`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-display font-bold uppercase tracking-wider border ${
                    badgeColors[m.leagueKey]
                  }`}
                >
                  {m.league}
                </span>

                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`max-w-[95px] truncate ${
                      homeWon ? "font-bold text-white" : "font-medium text-ink-2"
                    }`}
                  >
                    {m.homeTeam}
                  </span>

                  {m.status === "finished" || m.status === "live" ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-muted border border-line font-scoreboard font-bold text-[11px] text-amber-300">
                      <span>{m.homeScore}</span>
                      <span className="text-ink-3">:</span>
                      <span>{m.awayScore}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-muted/70 text-[10px] font-mono text-ink-3">
                      <Calendar size={10} className="text-amber-400/80" />
                      <span>{m.displayDate}</span>
                    </span>
                  )}

                  <span
                    className={`max-w-[95px] truncate ${
                      awayWon ? "font-bold text-white" : "font-medium text-ink-2"
                    }`}
                  >
                    {m.awayTeam}
                  </span>
                </div>

                {m.status === "finished" && (
                  <CheckCircle2 size={11} className="text-done shrink-0 opacity-80 group-hover:opacity-100" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Sağ Hızlı Takvim Linki */}
        <Link
          href="/takvim"
          prefetch={false}
          className="hidden xl:inline-flex items-center gap-1 ml-auto pl-2 border-l border-line/80 text-[11px] font-bold text-amber-300 hover:text-white shrink-0 transition-colors"
        >
          <Trophy size={12} className="text-amber-400" />
          <span>Maç Ajandası</span>
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
};
