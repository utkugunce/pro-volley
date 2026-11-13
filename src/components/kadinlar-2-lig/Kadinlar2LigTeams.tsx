"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { TeamBadge } from "@/components/TeamBadge";
import { Check, ClipboardCopy, ExternalLink, Swords } from "lucide-react";
import { Kadinlar2LigTeam } from "@/types/kadinlar2Lig";
import { slugify } from "@/utils/slugify";
import { triggerHaptic } from "@/utils/haptics";
import { getKadinlar2LigTeamName, K2_CATEGORY } from "@/utils/kadinlar2LigConverter";
import { resolveVolleyboxTeamMapping } from "@/utils/volleyboxWorkbench";
import { trIncludes } from "@/utils/turkishLocale";

interface Kadinlar2LigTeamsProps {
  teams: Kadinlar2LigTeam[];
  onSelectGroup?: (groupNo: number) => void;
  onCompareTeam?: (teamSlug: string) => void;
  searchQuery?: string;
  /** @deprecated Favorites UI removed */
  showOnlyFavorites?: boolean;
  compareBasePath?: string;
  leagueCategory?: string;
}

export const Kadinlar2LigTeams: React.FC<Kadinlar2LigTeamsProps> = ({
  teams,
  onSelectGroup,
  onCompareTeam,
  searchQuery = "",
  compareBasePath = "/kadinlar-2-ligi/karsilastir",
  leagueCategory,
}) => {
  const [filterGroup, setFilterGroup] = useState<number | "all">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveCategory = leagueCategory || K2_CATEGORY;

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const displayName = getKadinlar2LigTeamName(t.takim_adi, t.volleybox_name, effectiveCategory);
      if (filterGroup !== "all" && t.grup_no !== filterGroup) return false;
      if (searchQuery) {
        if (!trIncludes(t.takim_adi, searchQuery) && !trIncludes(displayName, searchQuery)) return false;
      }
      return true;
    });
  }, [teams, filterGroup, searchQuery, effectiveCategory]);

  const handleCopyTeam = (key: string, name: string) => {
    if (!name) return;
    triggerHaptic("selection");
    try {
      void navigator.clipboard?.writeText(name);
      setCopiedKey(key);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedKey(null), 1400);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Üst Bilgi Kartı */}
      <div className="bg-surface border border-line rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-ink flex items-center gap-2">
            <span>Kadınlar 2. Ligi Kulüpleri</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-surface-muted border border-line text-ink-2 font-mono tabular-nums">
              {filteredTeams.length} / {teams.length} Takım
            </span>
          </h2>
          <p className="text-xs text-ink-3 mt-0.5">
            16 gruptaki tüm kulüplerin resmi TVF bilgileri ve Volleybox oyuncu/teknik ekip kadroları
          </p>
        </div>

        {/* Grup Filtresi Dropdown */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-ink-3 font-bold uppercase tracking-wider">Filtre:</span>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="bg-surface-muted border border-line rounded-lg px-3 py-1.5 text-xs text-ink font-semibold focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">Tüm Gruplar (1-16)</option>
            {Array.from({ length: 16 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                Grup {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Takım Kartları Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredTeams.map((team, idx) => {
          const vb = resolveVolleyboxTeamMapping(team.takim_adi, effectiveCategory, "Türkiye");
          const displayName = getKadinlar2LigTeamName(
            team.takim_adi,
            team.volleybox_name,
            effectiveCategory
          );
          const vbUrl = team.volleybox_url || vb?.volleybox_url;
          const vbLogo = vb?.local_logo || vb?.logo_url || team.logo;
          const rowKey = String(team.takim_id || idx);
          const teamSlug = slugify(displayName);

          return (
            <div
              key={rowKey}
              className="bg-surface hover:bg-surface-raised border border-line hover:border-line-strong rounded-xl p-3.5 transition-colors flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <Link
                    prefetch={false}
                    href={`/takim/${teamSlug}`}
                    className="shrink-0 hover:opacity-80 transition-opacity"
                    title={`${displayName} Kulüp Profili`}
                  >
                    <TeamBadge name={displayName} logoUrl={vbLogo} size="md" />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Link
                        prefetch={false}
                        href={`/takim/${teamSlug}`}
                        className="font-bold text-xs sm:text-sm text-ink hover:text-primary transition-colors truncate block"
                        title={
                          displayName !== team.takim_adi
                            ? `${displayName} (TVF: ${team.takim_adi})`
                            : `${displayName} Kulüp Profilini Aç`
                        }
                      >
                        {displayName}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleCopyTeam(rowKey, displayName)}
                        className="shrink-0 p-1 min-w-[26px] min-h-[26px] flex items-center justify-center rounded text-ink-3 hover:text-primary cursor-pointer"
                        title={`Volleybox takım adını kopyala: ${displayName}`}
                        aria-label={`${displayName} adını kopyala`}
                      >
                        {copiedKey === rowKey ? (
                          <Check size={12} className="text-emerald-400" />
                        ) : (
                          <ClipboardCopy size={12} />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-ink-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onSelectGroup?.(team.grup_no)}
                        className="hover:text-ink transition-colors cursor-pointer font-semibold text-ink-2"
                      >
                        Grup {team.grup_no}
                      </button>
                      <span>•</span>
                      <span className="font-mono tabular-nums text-[10px]">
                        {team.o > 0
                          ? `#${team.sira} • ${team.g}G ${team.m}M • ${team.p} Puan`
                          : "Henüz maç yok"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Butonlar */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-line">
                <Link
                  prefetch={false}
                  href={`${compareBasePath}?takim1=${teamSlug}`}
                  onClick={(e) => {
                    if (onCompareTeam) {
                      e.preventDefault();
                      onCompareTeam(teamSlug);
                    }
                  }}
                  className="py-1 px-1.5 rounded-md bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line text-[10px] font-semibold text-center flex items-center justify-center gap-1 transition-colors"
                  title="H2H Karşılaştır"
                >
                  <Swords size={10} />
                  <span>H2H</span>
                </Link>

                <Link
                  prefetch={false}
                  href={`/takim/${teamSlug}`}
                  className="py-1 px-1.5 rounded-md bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line text-[10px] font-semibold text-center transition-colors"
                  title="Kadro ve Detaylar"
                >
                  <span>Kadro</span>
                </Link>

                {vbUrl ? (
                  <a
                    href={vbUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1 px-1.5 rounded-md bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line text-[10px] font-semibold text-center flex items-center justify-center gap-1 transition-colors"
                    title={`${displayName} Volleybox Profili`}
                  >
                    <span>VB</span>
                    <ExternalLink size={9} />
                  </a>
                ) : (
                  <div className="py-1 px-1.5 rounded-md bg-surface-muted text-ink-3 text-[10px] text-center border border-line">
                    -
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
