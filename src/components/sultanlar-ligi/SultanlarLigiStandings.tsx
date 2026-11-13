"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { TeamBadge } from "@/components/TeamBadge";
import Link from "next/link";
import {
  AlertTriangle,
  Calculator,
  Check,
  ChevronRight,
  ClipboardCopy,
  Download,
  ExternalLink,
  Swords,
  Trophy,
} from "lucide-react";
import { StandingItem } from "@/types/fixture";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { slugify } from "@/utils/slugify";
import { triggerHaptic } from "@/utils/haptics";
import { convertK2MatchToMatch, getKadinlar2LigTeamName } from "@/utils/kadinlar2LigConverter";
import { isMatchScored } from "@/utils/matchScoring";
import { trIncludes, trLower } from "@/utils/turkishLocale";
import {
  detectStandingsAnomalies,
  parseWorkbenchStandingKey,
  resolveVolleyboxTeamMapping,
  type StandingsAnomalyTeamDiff,
} from "@/utils/volleyboxWorkbench";
import { StandingsOperatorBanner } from "@/components/standings/StandingsOperatorBanner";
import { StandingsSimulatorView } from "@/components/standings/StandingsSimulatorView";

const SULTANLAR_CATEGORY = "Vodafone Sultanlar Ligi";
const STANDING_KEY = `Türkiye - ${SULTANLAR_CATEGORY}`;

interface SultanlarLigiStandingsProps {
  group: Kadinlar2LigGroup;
  searchQuery?: string;
  /** @deprecated Favorites UI removed */
  showOnlyFavorites?: boolean;
  onCompareTeam?: (teamSlug: string) => void;
}

export const SultanlarLigiStandings: React.FC<SultanlarLigiStandingsProps> = ({
  group,
  searchQuery = "",
  onCompareTeam,
}) => {
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [copiedTeamKey, setCopiedTeamKey] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const teams = useMemo(() => group?.puan_durumu || [], [group?.puan_durumu]);
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const displayName = getKadinlar2LigTeamName(t.takim_adi, t.volleybox_name, SULTANLAR_CATEGORY);
      if (searchQuery) {
        if (!trIncludes(t.takim_adi, searchQuery) && !trIncludes(displayName, searchQuery)) {
          return false;
        }
      }
      return true;
    });
  }, [teams, searchQuery]);

  const { standingItems, finishedMatches, upcomingMatches, activeContext, groupAnomaly, diffByTeam } =
    useMemo(() => {
      const converted = (group?.fikstur || []).map((m) =>
        convertK2MatchToMatch(m, {
          category: SULTANLAR_CATEGORY,
          age_group: "Büyük Kadınlar",
          gender: "Kadın",
        })
      );
      const finished = converted.filter(isMatchScored);
      const upcoming = converted.filter((m) => !isMatchScored(m));
      const items: StandingItem[] = teams.map((t) => ({
        rank: t.sira,
        team: getKadinlar2LigTeamName(t.takim_adi, t.volleybox_name, SULTANLAR_CATEGORY),
        played: t.o,
        won: t.g,
        lost: t.m,
        points: t.p,
        sets_won: t.as,
        sets_lost: t.vs,
        set_ratio: t.sav,
        points_won: t.asp,
        points_lost: t.vsp,
        point_ratio: t.spav,
        form: [],
      }));
      const ctx = parseWorkbenchStandingKey(STANDING_KEY, "Türkiye");
      const anomalies =
        items.length > 0 && finished.length > 0
          ? detectStandingsAnomalies(finished, { [STANDING_KEY]: items }, "Türkiye")
          : [];
      const anomaly = anomalies[0] || null;
      const diffMap = new Map<string, StandingsAnomalyTeamDiff>();
      (anomaly?.discrepancyTeams || []).forEach((d) => {
        diffMap.set(trLower(d.team), d);
      });
      return {
        standingItems: items,
        finishedMatches: finished,
        upcomingMatches: upcoming,
        activeContext: ctx,
        groupAnomaly: anomaly,
        diffByTeam: diffMap,
      };
    }, [group?.fikstur, teams]);

  const handleCopyTeam = (key: string, name: string) => {
    if (!name) return;
    triggerHaptic("selection");
    try {
      void navigator.clipboard?.writeText(name);
      setCopiedTeamKey(key);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedTeamKey(null), 1400);
    } catch {
      // Clipboard API unavailable
    }
  };

  const handleDownloadCsv = () => {
    const BOM = "\uFEFF";
    const header = [
      "Sıra",
      "Takım",
      "Oynadığı",
      "Galibiyet",
      "Mağlubiyet",
      "Puan",
      "Aldığı Set",
      "Verdiği Set",
      "Set Oranı",
      "Aldığı Sayı",
      "Verdiği Sayı",
      "Sayı Oranı",
    ].join(";");
    const rows = teams.map((row) => {
      const escapedTeam =
        row.takim_adi.includes(";") || row.takim_adi.includes('"')
          ? `"${row.takim_adi.replace(/"/g, '""')}"`
          : row.takim_adi;
      return [
        row.sira,
        escapedTeam,
        row.o,
        row.g,
        row.m,
        row.p,
        row.as,
        row.vs,
        row.sav,
        row.asp,
        row.vsp,
        row.spav,
      ].join(";");
    });
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(BOM + [header, ...rows].join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `Vodafone_Sultanlar_Ligi_Puan_Durumu.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <StandingsOperatorBanner
        activeContext={activeContext}
        city="Türkiye"
        items={standingItems}
        finishedMatches={finishedMatches}
        upcomingMatches={upcomingMatches}
        forfeitCount={groupAnomaly?.forfeitMatchCount ?? 0}
        discrepancyTeams={groupAnomaly?.discrepancyTeams ?? []}
      />

      {/* 1. Üst Başlık & Kontroller */}
      <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-xs">
        <div className="p-3 sm:p-4 bg-surface-raised/40 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center text-amber-400">
              <Trophy size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-ink">
                  Vodafone Sultanlar Ligi
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  Lig Etabı
                </span>
              </div>
              <p className="text-[11px] text-ink-3">
                14 Takım • İlk 4 Şampiyonluk Play-off, 5-8 Klasman, Son 2 Düşme
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Olasılık Simülatörü Butonu */}
            <button
              onClick={() => {
                triggerHaptic();
                setShowSimulator(!showSimulator);
              }}
              className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border transition-all cursor-pointer ${
                showSimulator
                  ? "bg-primary text-primary-fg border-primary shadow-xs"
                  : "bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border-line"
              }`}
              title="Kalan maçların skorlarını simüle ederek puan tablosunu hesapla"
            >
              <Calculator size={13} />
              <span className="hidden sm:inline">Puan Simülatörü</span>
              <span className="sm:hidden">{showSimulator ? "Kapat" : "Simülatör"}</span>
            </button>

            {/* Detaylı Skorlar Butonu */}
            <button
              onClick={() => setShowDetailedStats(!showDetailedStats)}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-xl bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line transition-all cursor-pointer"
            >
              <span>{showDetailedStats ? "Detayları Gizle" : "Detaylı Skorlar"}</span>
              <ChevronRight
                size={12}
                className={`transform transition-transform ${showDetailedStats ? "rotate-90" : ""}`}
              />
            </button>

            {/* CSV İndir */}
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Puan tablosunu Excel uyumlu CSV olarak indir"
            >
              <Download size={12} className="text-emerald-400" />
              <span className="hidden sm:inline">CSV İndir</span>
            </button>

            <span className="text-[10px] sm:text-xs text-ink-3 font-mono font-bold bg-surface-muted px-2 py-0.5 rounded-lg border border-line">
              {teams.length} Takım
            </span>
          </div>
        </div>

        {/* Simülatör Açıksa */}
        {showSimulator && (
          <div className="p-3 sm:p-4 border-b border-line bg-surface-raised/20">
            <StandingsSimulatorView
              mode="k2"
              k2Rows={teams}
              k2Matches={group.fikstur || []}
              cutoff={4}
              onClose={() => setShowSimulator(false)}
            />
          </div>
        )}

        {/* 2. Puan Durumu Tablosu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-muted text-ink-3 font-bold border-b border-line uppercase text-[10px] sm:text-[11px] tracking-wider">
                <th className="py-2.5 sm:py-3 px-2 text-center w-10 sm:w-12">#</th>
                <th className="py-2.5 sm:py-3 px-3 min-w-[220px]">Takım</th>
                <th className="py-2.5 sm:py-3 px-2 text-center w-9 sm:w-11" title="Oynanan Maç">O</th>
                <th className="py-2.5 sm:py-3 px-2 text-center w-9 sm:w-11" title="Galibiyet">G</th>
                <th className="py-2.5 sm:py-3 px-2 text-center w-9 sm:w-11" title="Mağlubiyet">M</th>
                <th className="py-2.5 sm:py-3 px-2.5 text-center w-14 sm:w-20 hidden md:table-cell" title="Alınan Set - Verilen Set (Oran)">Setler</th>
                <th className="py-2.5 sm:py-3 px-2.5 text-center w-16 sm:w-24 hidden lg:table-cell" title="Alınan Sayı - Verilen Sayı (Oran)">Sayılar</th>
                {showDetailedStats && (
                  <>
                    <th className="py-2.5 px-2 text-center text-emerald-400 bg-surface-raised hidden xl:table-cell" title="3-0 Galibiyet">3-0</th>
                    <th className="py-2.5 px-2 text-center text-emerald-400 bg-surface-raised hidden xl:table-cell" title="3-1 Galibiyet">3-1</th>
                    <th className="py-2.5 px-2 text-center text-emerald-400 bg-surface-raised hidden xl:table-cell" title="3-2 Galibiyet">3-2</th>
                    <th className="py-2.5 px-2 text-center text-rose-400 bg-surface-raised hidden xl:table-cell" title="2-3 Mağlubiyet">2-3</th>
                    <th className="py-2.5 px-2 text-center text-rose-400 bg-surface-raised hidden xl:table-cell" title="1-3 Mağlubiyet">1-3</th>
                    <th className="py-2.5 px-2 text-center text-rose-400 bg-surface-raised hidden xl:table-cell" title="0-3 Mağlubiyet">0-3</th>
                  </>
                )}
                <th className="py-2.5 sm:py-3 px-2 text-center w-12 sm:w-16 bg-surface-raised font-bold text-ink" title="Puan">P</th>
                <th className="py-2.5 sm:py-3 px-3 text-right w-28 sm:w-36">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-10 text-center text-ink-3 text-xs">
                    Aranan kriterlere uygun takım bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team, idx) => {
                  const isChampionship = team.sira <= 4;
                  const isClassification = team.sira >= 5 && team.sira <= 8;
                  const isRelegation = team.sira >= 13;

                  const displayName = getKadinlar2LigTeamName(
                    team.takim_adi,
                    team.volleybox_name,
                    SULTANLAR_CATEGORY
                  );
                  const rowKey = String(team.takim_id || idx);
                  const teamSlug = slugify(team.takim_adi);

                  const vb = resolveVolleyboxTeamMapping(team.takim_adi, SULTANLAR_CATEGORY, "Türkiye");
                  const vbUrl = team.volleybox_url || vb?.volleybox_url;
                  const vbLogo = vb?.local_logo || vb?.logo_url || team.logo;
                  const teamDiff = diffByTeam.get(trLower(displayName)) || diffByTeam.get(trLower(team.takim_adi));

                  return (
                    <tr
                      key={rowKey}
                      className={`hover:bg-surface-raised/40 transition-colors ${
                        isChampionship
                          ? "border-l-4 border-l-amber-400 bg-amber-400/5"
                          : isClassification
                          ? "border-l-4 border-l-blue-400 bg-blue-400/5"
                          : isRelegation
                          ? "border-l-4 border-l-rose-500 bg-rose-500/5"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      {/* Sıra Numarası */}
                      <td className="py-2 sm:py-2.5 px-2 text-center">
                        <span
                          className={`font-bold font-mono tabular-nums text-xs ${
                            isChampionship
                              ? "text-amber-400"
                              : isClassification
                              ? "text-blue-400"
                              : isRelegation
                              ? "text-rose-400"
                              : "text-ink-3"
                          }`}
                        >
                          {team.sira}
                        </span>
                      </td>

                      {/* Takım Adı & Rozet */}
                      <td className="py-2 sm:py-2.5 px-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <TeamBadge name={displayName} logoUrl={vbLogo} size="sm" className="shrink-0" />

                          <div className="min-w-0 flex-1 flex flex-col">
                            <span className="font-semibold text-ink truncate text-xs sm:text-[13px] leading-tight">
                              {displayName}
                            </span>
                            {team.volleybox_name && team.volleybox_name !== team.takim_adi && (
                              <span className="text-[10px] text-ink-3 truncate leading-none mt-0.5">
                                {team.takim_adi}
                              </span>
                            )}
                          </div>

                          {teamDiff && (
                            <span
                              className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-scoreboard tabular-nums font-bold shrink-0"
                              title={`TVF Tablosu: ${teamDiff.tvfPlayed}O / ${teamDiff.tvfWon}G · Fikstürdeki Biten Maç: ${teamDiff.calcPlayed}O / ${teamDiff.calcWon}G`}
                            >
                              <AlertTriangle size={9} className="text-amber-400" />
                              <span>{teamDiff.tvfPlayed}≠{teamDiff.calcPlayed}</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopyTeam(rowKey, displayName)}
                            className="shrink-0 p-1 rounded text-ink-3 hover:text-primary hover:bg-surface-raised transition-colors cursor-pointer"
                            title={`Volleybox takım adını kopyala: ${displayName}`}
                            aria-label={`${displayName} adını kopyala`}
                          >
                            {copiedTeamKey === rowKey ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <ClipboardCopy size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Oynanan */}
                      <td className="py-2 sm:py-2.5 px-2 text-center font-mono tabular-nums text-ink font-medium">
                        {team.o}
                      </td>

                      {/* Galibiyet */}
                      <td className="py-2 sm:py-2.5 px-2 text-center font-mono tabular-nums text-emerald-400 font-bold">
                        {team.g}
                      </td>

                      {/* Mağlubiyet */}
                      <td className="py-2 sm:py-2.5 px-2 text-center font-mono tabular-nums text-rose-400">
                        {team.m}
                      </td>

                      {/* Setler */}
                      <td className="py-2 sm:py-2.5 px-2.5 text-center font-mono tabular-nums text-ink-2 text-[11px] hidden md:table-cell">
                        <span>{team.as} - {team.vs}</span>
                        <span className="text-[10px] text-ink-3 ml-1">({team.sav})</span>
                      </td>

                      {/* Sayılar */}
                      <td className="py-2 sm:py-2.5 px-2.5 text-center font-mono tabular-nums text-ink-3 text-[11px] hidden lg:table-cell">
                        <span>{team.asp} - {team.vsp}</span>
                        <span className="text-[10px] text-ink-3 ml-1">({team.spav})</span>
                      </td>

                      {/* Detaylı Skorlar */}
                      {showDetailedStats && (
                        <>
                          <td className="py-2 px-2 text-center font-mono tabular-nums text-ink-2 bg-surface-raised/40 hidden xl:table-cell">{team.a3_0}</td>
                          <td className="py-2 px-2 text-center font-mono tabular-nums text-ink-2 bg-surface-raised/40 hidden xl:table-cell">{team.a3_1}</td>
                          <td className="py-2 px-2 text-center font-mono tabular-nums text-ink-2 bg-surface-raised/40 hidden xl:table-cell">{team.a3_2}</td>
                          <td className="py-2 px-2 text-center font-mono tabular-nums text-ink-3 bg-surface-raised/40 hidden xl:table-cell">{team.v2_3}</td>
                          <td className="py-2 px-2 text-center font-mono tabular-nums text-ink-3 bg-surface-raised/40 hidden xl:table-cell">{team.v1_3}</td>
                          <td className="py-2 px-2 text-center font-mono tabular-nums text-ink-3 bg-surface-raised/40 hidden xl:table-cell">{team.v0_3}</td>
                        </>
                      )}

                      {/* Puan */}
                      <td className="py-2 sm:py-2.5 px-2 text-center font-mono tabular-nums font-bold text-sm text-ink bg-surface-raised/60">
                        {team.p}
                      </td>

                      {/* İşlem */}
                      <td className="py-2 sm:py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            prefetch={false}
                            href={`/sultanlar-ligi/karsilastir?takim1=${teamSlug}`}
                            onClick={(e) => {
                              if (onCompareTeam) {
                                e.preventDefault();
                                onCompareTeam(teamSlug);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line transition-colors"
                            title="H2H Karşılaştır"
                          >
                            <Swords size={11} />
                            <span className="hidden sm:inline">H2H</span>
                          </Link>

                          {vbUrl && (
                            <a
                              href={vbUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                              title="Volleybox Kulüp Sayfası & Kadro"
                            >
                              <span>Kadro</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Alt Açıklama / Gösterge Lejandı */}
        <div className="p-3 bg-surface-raised/40 border-t border-line flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-400 border border-amber-300" />
              <span className="text-ink font-medium">1-4: Şampiyonluk Etabı (Play-off)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-blue-400 border border-blue-300" />
              <span className="text-ink font-medium">5-8: Klasman Etabı (Avrupa Kupaları)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500 border border-rose-400" />
              <span className="text-ink font-medium">13-14: 1. Lig&apos;e Düşme Hattı</span>
            </div>
          </div>

          <div className="font-mono text-[10px] text-ink-3">
            Puan eşitliğinde: Galibiyet Sayısı &gt; Set Oranı &gt; Sayı Oranı
          </div>
        </div>
      </div>
    </div>
  );
};
