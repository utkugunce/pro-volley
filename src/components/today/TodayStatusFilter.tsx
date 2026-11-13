"use client";

import React from "react";
import type { TodayQuickStatus } from "@/hooks/useTodayMatchesData";
import type { DashboardKpis } from "@/utils/todayMatches";

interface TodayStatusFilterProps {
  quickStatus: TodayQuickStatus;
  setQuickStatus: (status: TodayQuickStatus) => void;
  dashboardKpis: DashboardKpis;
}

/** Hızlı Filtre Butonları (Tümü / Oynanacak / Bitenler). */
export function TodayStatusFilter({ quickStatus, setQuickStatus, dashboardKpis }: TodayStatusFilterProps) {
  return (
    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap" role="tablist" aria-label="Maç durum filtresi">
      <span className="text-[11px] text-slate-400 font-medium mr-1">Durum:</span>
      <button
        type="button"
        role="tab"
        aria-selected={quickStatus === "all"}
        onClick={() => setQuickStatus("all")}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          quickStatus === "all"
            ? "bg-selected-strong text-white shadow-glow-selected font-bold"
            : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white border border-slate-700/50"
        }`}
      >
        Tümü ({dashboardKpis.todayTotal})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={quickStatus === "upcoming"}
        onClick={() => setQuickStatus("upcoming")}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
          quickStatus === "upcoming"
            ? "bg-sky-600 text-white shadow-xs font-bold"
            : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white border border-slate-700/50"
        }`}
      >
        Oynanacak ({dashboardKpis.todayUpcoming})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={quickStatus === "finished"}
        onClick={() => setQuickStatus("finished")}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
          quickStatus === "finished"
            ? "bg-emerald-600 text-white shadow-xs font-bold"
            : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white border border-slate-700/50"
        }`}
      >
        Bitenler ({dashboardKpis.todayFinished})
      </button>
    </div>
  );
}
