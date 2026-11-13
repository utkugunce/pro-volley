"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Globe,
  Trophy,
  PanelLeftClose,
} from "lucide-react";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { Kadinlar2LigTabType } from "./Kadinlar2LigHeader";

interface Kadinlar2LigSidebarProps {
  groups: Kadinlar2LigGroup[];
  selectedGroup: number | "all";
  activeTab: Kadinlar2LigTabType;
  /** @deprecated Favorites UI removed */
  favoritesCount?: number;
  /** @deprecated Favorites UI removed */
  showOnlyFavorites?: boolean;
  /** @deprecated Favorites UI removed */
  onToggleFavoritesOnly?: () => void;
  onSelectGroup: (groupNo: number | "all") => void;
  onSelectTab: (tab: Kadinlar2LigTabType) => void;
  onToggleCollapse?: () => void;
}

export const Kadinlar2LigSidebar: React.FC<Kadinlar2LigSidebarProps> = ({
  groups,
  selectedGroup,
  activeTab,
  onSelectGroup,
  onSelectTab,
  onToggleCollapse,
}) => {
  const totalTeams = groups.reduce((sum, group) => sum + group.takim_sayisi, 0);
  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(true);
  const [isGroupsOpen, setIsGroupsOpen] = useState(true);

  return (
    <div className="flex h-full flex-col bg-surface text-xs">
      {/* 1. Üst Başlık */}
      <div className="sticky top-0 z-10 border-b border-line/60 bg-surface px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy size={14} className="text-primary shrink-0" />
            <div className="min-w-0">
              <h2 className="font-bold leading-tight tracking-tight text-white text-[13px] truncate">
                Lig Ağacı
              </h2>
              <p className="text-[10px] text-ink-3 truncate">Uzman Posta Kadınlar 2. Ligi</p>
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
              className={`transform transition-transform duration-200 ${isQuickLinksOpen ? "rotate-0" : "-rotate-90"}`}
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
                href="/sultanlar-ligi"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="font-medium text-[11px] truncate">Vodafone Sultanlar Ligi</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono shrink-0">Süper Lig →</span>
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
            </div>
          )}
        </div>

        {/* 2. BÖLÜM: 16 GRUP HİYERARŞİSİ */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setIsGroupsOpen(!isGroupsOpen)}
            className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-3 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <BarChart3 size={12} className="text-primary" />
              <span>Lig Grupları (16 Grup)</span>
            </span>
            <ChevronDown
              size={12}
              className={`transform transition-transform duration-200 ${isGroupsOpen ? "rotate-0" : "-rotate-90"}`}
            />
          </button>

          {isGroupsOpen && (
            <div className="space-y-0.5 pt-0.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectGroup("all");
                    if (activeTab !== "standings" && activeTab !== "fixtures") {
                      onSelectTab("standings");
                    }
                  }}
                  className={`flex min-w-0 flex-1 items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                    selectedGroup === "all"
                      ? "bg-primary text-primary-fg font-bold shadow-xs"
                      : "text-ink-2 hover:bg-surface-raised/50 hover:text-white"
                  }`}
                >
                  <span className="truncate text-xs font-medium">Tüm Gruplar (1-16)</span>
                  <span className="font-mono tabular-nums text-[10px] opacity-80">
                    {groups.length} Grup
                  </span>
                </button>
                <Link
                  prefetch={false}
                  href="/kadinlar-2-ligi/fikstur/tum-gruplar"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectGroup("all");
                    onSelectTab("fixtures");
                  }}
                  className={`rounded-lg p-1.5 transition-colors ${
                    selectedGroup === "all" && activeTab === "fixtures"
                      ? "bg-primary/15 text-primary"
                      : "text-ink-3 hover:bg-surface-raised/50 hover:text-white"
                  }`}
                  title="Tüm Gruplar fikstürü"
                  aria-label="Tüm Gruplar fikstürü"
                >
                  <CalendarDays size={13} />
                </Link>
              </div>

              {groups.map((group) => {
                const isSelected = selectedGroup === group.grup_no;
                return (
                  <div key={group.grup_no} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectGroup(group.grup_no);
                        if (activeTab !== "standings" && activeTab !== "fixtures") {
                          onSelectTab("standings");
                        }
                      }}
                      className={`flex min-w-0 flex-1 items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary/20 text-white font-bold border border-primary/40"
                          : "text-ink-2 hover:bg-surface-raised/50 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isSelected ? "bg-primary" : "bg-ink-3"
                          }`}
                        />
                        <span className="truncate text-xs font-medium">Grup {group.grup_no}</span>
                      </div>
                      <span className="font-mono tabular-nums text-[10px] text-ink-3">
                        {group.takim_sayisi} Takım
                      </span>
                    </button>
                    <Link
                      prefetch={false}
                      href={`/kadinlar-2-ligi/fikstur${group.grup_no > 1 ? `/grup-${group.grup_no}` : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectGroup(group.grup_no);
                        onSelectTab("fixtures");
                      }}
                      className={`rounded-lg p-1.5 transition-colors ${
                        selectedGroup === group.grup_no && activeTab === "fixtures"
                          ? "bg-primary/15 text-primary"
                          : "text-ink-3 hover:bg-surface-raised/50 hover:text-white"
                      }`}
                      title={`Grup ${group.grup_no} fikstürü`}
                      aria-label={`Grup ${group.grup_no} fikstürü`}
                    >
                      <CalendarDays size={13} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
