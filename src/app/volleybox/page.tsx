import { Metadata } from "next";
import {
  VolleyboxCockpitClient,
  type CockpitLeagueKey,
  type UnmappedTeamItem,
  type VolleyboxCockpitMatch,
} from "@/components/volleybox/VolleyboxCockpitClient";
import type { Match, StandingItem } from "@/types/fixture";
import type { Kadinlar2LigData, Kadinlar2LigMatch } from "@/types/kadinlar2Lig";
import {
  convertK2MatchToMatch,
  getKadinlar2LigTeamName,
} from "@/utils/kadinlar2LigConverter";
import { getKadinlar1LigData } from "@/utils/kadinlar1LigServer";
import { getKadinlar2LigData } from "@/utils/kadinlar2LigServer";
import { getSultanlarLigiData } from "@/utils/sultanlarLigiServer";
import { trLower } from "@/utils/turkishLocale";
import {
  getVolleyboxTournamentMatchesUrl,
  resolveVolleyboxTeamMapping,
  toVolleyboxMatchesUrl,
} from "@/utils/volleyboxWorkbench";

export const metadata: Metadata = {
  title: "Volleybox Maç Giriş Kokpiti",
  description: "TVF lig maçlarını Volleybox'a hızlı giriş ve eşleştirme aracı.",
  robots: { index: false, follow: false },
};

export const revalidate = 300;

function toIsoDate(raw: string): string {
  if (!raw) return "";
  if (raw.includes(".")) {
    const parts = raw.split(".");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }
  return raw;
}

export default function VolleyboxPage() {
  const datasets: {
    key: CockpitLeagueKey;
    label: string;
    canonicalCategory: string;
    isSingleGroup: boolean;
    data: Kadinlar2LigData;
  }[] = [
    {
      key: "sultanlar",
      label: "Sultanlar Ligi",
      canonicalCategory: "Vodafone Sultanlar Ligi",
      isSingleGroup: true,
      data: getSultanlarLigiData(),
    },
    {
      key: "1-lig",
      label: "Kadınlar 1. Lig",
      canonicalCategory: "Arabica Coffee House Kadınlar Voleybol 1. Ligi",
      isSingleGroup: false,
      data: getKadinlar1LigData(),
    },
    {
      key: "2-lig",
      label: "Kadınlar 2. Lig",
      canonicalCategory: "Kadınlar 2. Ligi",
      isSingleGroup: false,
      data: getKadinlar2LigData(),
    },
  ];

  const matches: VolleyboxCockpitMatch[] = [];
  const workbenchMatches: Match[] = [];
  const workbenchStandings: Record<string, StandingItem[]> = {};
  const unmappedMap = new Map<string, UnmappedTeamItem>();
  const updatedAtByLeague: Record<CockpitLeagueKey, string> = {
    sultanlar: "",
    "1-lig": "",
    "2-lig": "",
  };
  const tournamentUrlsByLeague: Record<CockpitLeagueKey, string> = {
    sultanlar: "",
    "1-lig": "",
    "2-lig": "",
  };

  for (const ds of datasets) {
    const meta = ds.data?.metadata;
    updatedAtByLeague[ds.key] = meta?.guncellenme_zamani
      ? String(meta.guncellenme_zamani).slice(0, 16).replace("T", " ")
      : "";
    const rawTournamentUrl = meta?.resmi_kaynaklar?.volleybox_turnuva || "";
    const tournamentUrl =
      getVolleyboxTournamentMatchesUrl(ds.canonicalCategory, "Türkiye") ||
      toVolleyboxMatchesUrl(rawTournamentUrl) ||
      rawTournamentUrl ||
      "";
    tournamentUrlsByLeague[ds.key] = tournamentUrl;

    const gruplar = Array.isArray(ds.data?.gruplar) ? ds.data.gruplar : [];
    for (const g of gruplar) {
      const groupName =
        g.grup_adi ||
        (ds.key === "1-lig"
          ? g.grup_no === 1
            ? "A Grubu"
            : "B Grubu"
          : `${g.grup_no}. Grup`);
      const standingKey = ds.isSingleGroup
        ? `Türkiye - ${ds.canonicalCategory}`
        : `Türkiye - ${ds.canonicalCategory} - ${groupName}`;

      workbenchStandings[standingKey] = (g.puan_durumu || []).map((t) => ({
        rank: t.sira,
        team: getKadinlar2LigTeamName(t.takim_adi, t.volleybox_name, ds.canonicalCategory),
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
    }

    const list = Array.isArray(ds.data?.tum_maclar) ? ds.data.tum_maclar : [];

    for (let i = 0; i < list.length; i++) {
      const rawMatch = list[i] as Kadinlar2LigMatch;
      const m = rawMatch as unknown as Record<string, unknown>;
      const takimA = String(m.takim_a || m.ev_sahibi || "").trim();
      const takimB = String(m.takim_b || m.konuk || "").trim();
      if (!takimA || !takimB) continue;

      const matchId = String(m.id || `${ds.key}-${i}`);
      const cityForLookup = String(m.sehir || "Türkiye");

      const converted = convertK2MatchToMatch(rawMatch, {
        category: ds.canonicalCategory,
        age_group: "Büyük Kadınlar",
        gender: "Kadın",
      });
      if (!converted.id) {
        converted.id = matchId;
      }
      workbenchMatches.push(converted);

      const mappingA = resolveVolleyboxTeamMapping(takimA, ds.canonicalCategory, cityForLookup);
      const mappingB = resolveVolleyboxTeamMapping(takimB, ds.canonicalCategory, cityForLookup);

      const vbNameA = m.takim_a_volleybox_name
        ? String(m.takim_a_volleybox_name)
        : mappingA?.matched_as?.trim() || null;
      const vbNameB = m.takim_b_volleybox_name
        ? String(m.takim_b_volleybox_name)
        : mappingB?.matched_as?.trim() || null;

      if (!vbNameA && takimA !== "TBD" && trLower(takimA) !== "bay") {
        unmappedMap.set(`${ds.key}:${takimA}`, {
          leagueKey: ds.key,
          leagueLabel: ds.label,
          teamName: takimA,
        });
      }
      if (!vbNameB && takimB !== "TBD" && trLower(takimB) !== "bay") {
        unmappedMap.set(`${ds.key}:${takimB}`, {
          leagueKey: ds.key,
          leagueLabel: ds.label,
          teamName: takimB,
        });
      }

      const setA = String(m.set_a ?? "");
      const setB = String(m.set_b ?? "");
      const isFinished =
        m.durum === "BİTTİ" ||
        m.mac_durumu_kod === "F" ||
        m.mac_durumu_kod === "H" ||
        Number(setA) >= 3 ||
        Number(setB) >= 3;

      const rawDate = String(m.tarih || "");
      const setSonuclari =
        converted.set_scores && converted.set_scores.length > 0
          ? converted.set_scores
          : Array.isArray(m.set_sonuclari)
            ? m.set_sonuclari.map((s) => String(s))
            : [];

      matches.push({
        id: matchId,
        leagueKey: ds.key,
        leagueLabel: ds.label,
        grupAdi: String(m.grup_adi || ""),
        hafta: String(m.hafta || ""),
        tarih: rawDate,
        isoDate: toIsoDate(rawDate),
        saat: String(m.saat || "--:--"),
        salon: String(m.salon || ""),
        sehir: String(m.sehir || ""),
        takimA,
        takimB,
        vbNameA,
        vbNameB,
        vbUrlA: m.takim_a_volleybox_url
          ? String(m.takim_a_volleybox_url)
          : mappingA?.volleybox_url || null,
        vbUrlB: m.takim_b_volleybox_url
          ? String(m.takim_b_volleybox_url)
          : mappingB?.volleybox_url || null,
        setA,
        setB,
        skor: String(m.skor || ""),
        setSonuclari,
        isFinished,
        tournamentUrl,
      });
    }
  }

  return (
    <VolleyboxCockpitClient
      matches={matches}
      workbenchMatches={workbenchMatches}
      workbenchStandings={workbenchStandings}
      unmappedTeams={Array.from(unmappedMap.values())}
      updatedAtByLeague={updatedAtByLeague}
      tournamentUrlsByLeague={tournamentUrlsByLeague}
    />
  );
}

