"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ClipboardCheck,
  Globe,
  Trophy,
  PanelLeftClose,
} from "lucide-react";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { SultanlarTabType } from "@/utils/sultanlarLigiRoutes";
import { getKadinlar2LigTeamName } from "@/utils/kadinlar2LigConverter";

interface SultanlarLigiSidebarProps {
  groups: Kadinlar2LigGroup[];
  activeTab: SultanlarTabType;
  /** @deprecated Favorites UI removed */
  favoritesCount?: number;
  /** @deprecated Favorites UI removed */
  showOnlyFavorites?: boolean;
  /** @deprecated Favorites UI removed */
  onToggleFavoritesOnly?: () => void;
  onSelectTab: (tab: SultanlarTabType) => void;
  onToggleCollapse?: () => void;
}

export const SultanlarLigiSidebar: React.FC<SultanlarLigiSidebarProps> = ({
  groups,
  onSelectTab,
  onToggleCollapse,
}) => {
  const teams = groups[0]?.puan_durumu || [];
  const totalTeams = teams.length || 14;
  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(true);

  return (
    <div className="flex h-full flex-col bg-surface text-xs">
      {/* 1. Üst Başlık */}
      <div className="sticky top-0 z-10 border-b border-line/60 bg-surface px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy size={14} className="text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-bold leading-tight tracking-tight text-white text-[13px] truncate">
                Lig Ağacı
              </h2>
              <p className="text-[10px] text-ink-3 truncate">Vodafone Sultanlar Ligi</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono tabular-nums text-[11px] font-medium text-ink-3">
              {totalTeams} Takım
            </span>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-raised/80 hover:bg-surface-raised text-ink-2 hover:text-white border border-line/60 transition-all cursor-pointer text-[11px] font-semibold active:scale-95"
                title="Lig Ağacını Daralt"
                aria-label="Lig Ağacını Daralt"
              >
                <PanelLeftClose size={13} className="text-primary" />
                <span>Daralt</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-2.5">
        {/* 1. BÖLÜM: KOKPİT & ULUSAL LİGLER */}
        <div className="space-y-1 pb-2 border-b border-line/50">
          <button
            type="button"
            onClick={() => setIsQuickLinksOpen(!isQuickLinksOpen)}
            className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-3 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Globe size={12} className="text-primary" />
              <span>Kokpit &amp; Ulusal Ligler</span>
            </span>
            <ChevronDown
              size={12}
              className={`transform transition-transform duration-200 ${
                isQuickLinksOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
          </button>

          {isQuickLinksOpen && (
            <div className="space-y-0.5 pt-0.5">
              <Link
                prefetch={false}
                href="/volleybox"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <ClipboardCheck size={13} className="text-emerald-400 shrink-0" />
                  <span className="font-semibold text-[11px] truncate">Volleybox Kokpit</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono shrink-0">İş Kuyruğu →</span>
              </Link>

              <Link
                prefetch={false}
                href="/kadinlar-1-ligi"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="font-medium text-[11px] truncate">Arabica Kadınlar 1. Ligi</span>
                </span>
                <span className="text-[10px] text-ink-3 font-mono shrink-0">A &amp; B Grubu →</span>
              </Link>

              <Link
                prefetch={false}
                href="/kadinlar-2-ligi"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="font-medium text-[11px] truncate">Uzman Posta 2. Lig</span>
                </span>
                <span className="text-[10px] text-ink-3 font-mono shrink-0">16 Grup →</span>
              </Link>
            </div>
          )}
        </div>

        {/* 2. BÖLÜM: LİG AĞACI & TAKIMLAR */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-3">
            <span>Sultanlar Ligi Takımları</span>
            <span className="font-mono text-[10px]">{teams.length} Takım</span>
          </div>

          <div className="space-y-0.5">
            {teams.map((t, idx) => {
              const displayName = getKadinlar2LigTeamName(
                t.takim_adi,
                t.volleybox_name,
                "Vodafone Sultanlar Ligi"
              );
              return (
                <button
                  key={t.takim_adi}
                  type="button"
                  onClick={() => onSelectTab("standings")}
                  className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-4 text-center font-mono text-[10px] font-bold shrink-0 ${
                        idx < 4
                          ? "text-amber-400"
                          : idx >= 12
                          ? "text-live"
                          : "text-ink-3"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-medium text-white truncate">
                      {displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-1">
                    <span className="text-[10px] font-mono tabular-nums text-primary font-bold">
                      {t.p}P
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
