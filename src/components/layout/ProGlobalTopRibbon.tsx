import React from "react";
import fs from "fs";
import path from "path";
import { ProLiveScoreRibbon, type ProTickerMatch } from "./ProLiveScoreRibbon";

function parseMatchesFromFile(
  fileName: string,
  leagueLabel: "Sultanlar" | "1. Lig" | "2. Lig",
  leagueKey: "sultanlar" | "1-lig" | "2-lig",
  href: string
): ProTickerMatch[] {
  try {
    const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", fileName);
    if (!fs.existsSync(/*turbopackIgnore: true*/ filePath)) return [];
    const raw = JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf-8"));
    const matches = Array.isArray(raw.tum_maclar) ? raw.tum_maclar : [];

    return matches.map((m: Record<string, unknown>, idx: number) => {
      const setA = m.set_a != null ? Number(m.set_a) : 0;
      const setB = m.set_b != null ? Number(m.set_b) : 0;
      const isFinished =
        m.durum === "BİTTİ" ||
        m.mac_durumu_kod === "F" ||
        m.mac_durumu_kod === "H" ||
        setA >= 3 ||
        setB >= 3;
      const isLive = m.durum === "CANLI" || m.mac_durumu_kod === "L";

      const rawDate = String(m.tarih || "");
      let isoDate = rawDate;
      if (rawDate.includes(".")) {
        const parts = rawDate.split(".");
        if (parts.length === 3) {
          isoDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }

      return {
        id: String(m.id || `${leagueKey}-${idx}`),
        league: leagueLabel,
        leagueKey,
        homeTeam: String(m.ev_sahibi || m.takim_a || "")
          .replace(/\s*\(.*?\)\s*/g, "")
          .trim(),
        awayTeam: String(m.konuk || m.takim_b || "")
          .replace(/\s*\(.*?\)\s*/g, "")
          .trim(),
        homeScore: isFinished || isLive ? setA : null,
        awayScore: isFinished || isLive ? setB : null,
        date: isoDate,
        displayDate: rawDate.slice(0, 5),
        time: String(m.saat || "--:--"),
        status: isLive ? "live" : isFinished ? "finished" : "upcoming",
        href,
      } satisfies ProTickerMatch;
    });
  } catch {
    return [];
  }
}

export function ProGlobalTopRibbon() {
  const sMatches = parseMatchesFromFile("sultanlar_ligi.json", "Sultanlar", "sultanlar", "/sultanlar-ligi");
  const k1Matches = parseMatchesFromFile("kadinlar_1_lig.json", "1. Lig", "1-lig", "/kadinlar-1-ligi");
  const k2Matches = parseMatchesFromFile("kadinlar_2_lig.json", "2. Lig", "2-lig", "/kadinlar-2-ligi");

  const selectBalanced = (list: ProTickerMatch[], maxFinished: number, maxUpcoming: number) => {
    const valid = list.filter((m) => m.homeTeam && m.awayTeam && /^\d{4}-\d{2}-\d{2}$/.test(m.date));
    const live = valid.filter((m) => m.status === "live");
    const finished = valid
      .filter((m) => m.status === "finished")
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, maxFinished);
    const upcoming = valid
      .filter((m) => m.status === "upcoming")
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, maxUpcoming);
    return [...live, ...finished, ...upcoming];
  };

  const tickerMatches: ProTickerMatch[] = [
    ...selectBalanced(sMatches, 5, 4),
    ...selectBalanced(k1Matches, 4, 3),
    ...selectBalanced(k2Matches, 3, 2),
  ];

  return <ProLiveScoreRibbon matches={tickerMatches} />;
}
