import { Metadata } from "next";
import {
  VolleyboxCockpitClient,
  type CockpitLeagueKey,
  type UnmappedTeamItem,
  type VolleyboxCockpitMatch,
} from "@/components/volleybox/VolleyboxCockpitClient";
import { getSultanlarLigiData } from "@/utils/sultanlarLigiServer";
import { getKadinlar1LigData } from "@/utils/kadinlar1LigServer";
import { getKadinlar2LigData } from "@/utils/kadinlar2LigServer";

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
    data: ReturnType<typeof getSultanlarLigiData>;
  }[] = [
    { key: "sultanlar", label: "Sultanlar Ligi", data: getSultanlarLigiData() },
    { key: "1-lig", label: "Kadınlar 1. Lig", data: getKadinlar1LigData() },
    { key: "2-lig", label: "Kadınlar 2. Lig", data: getKadinlar2LigData() },
  ];

  const matches: VolleyboxCockpitMatch[] = [];
  const unmappedMap = new Map<string, UnmappedTeamItem>();
  const updatedAtByLeague: Record<CockpitLeagueKey, string> = {
    sultanlar: "",
    "1-lig": "",
    "2-lig": "",
  };

  for (const ds of datasets) {
    const meta = ds.data?.metadata;
    updatedAtByLeague[ds.key] = meta?.guncellenme_zamani
      ? String(meta.guncellenme_zamani).slice(0, 16).replace("T", " ")
      : "";
    const tournamentUrl = meta?.resmi_kaynaklar?.volleybox_turnuva || "";
    const list = Array.isArray(ds.data?.tum_maclar) ? ds.data.tum_maclar : [];

    for (let i = 0; i < list.length; i++) {
      const m = list[i] as unknown as Record<string, unknown>;
      const takimA = String(m.takim_a || m.ev_sahibi || "").trim();
      const takimB = String(m.takim_b || m.konuk || "").trim();
      if (!takimA || !takimB) continue;

      const vbNameA = m.takim_a_volleybox_name ? String(m.takim_a_volleybox_name) : null;
      const vbNameB = m.takim_b_volleybox_name ? String(m.takim_b_volleybox_name) : null;

      if (!vbNameA) {
        unmappedMap.set(`${ds.key}:${takimA}`, {
          leagueKey: ds.key,
          leagueLabel: ds.label,
          teamName: takimA,
        });
      }
      if (!vbNameB) {
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
      const setSonuclari = Array.isArray(m.set_sonuclari)
        ? m.set_sonuclari.map((s) => String(s))
        : [];

      matches.push({
        id: String(m.id || `${ds.key}-${i}`),
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
        vbUrlA: m.takim_a_volleybox_url ? String(m.takim_a_volleybox_url) : null,
        vbUrlB: m.takim_b_volleybox_url ? String(m.takim_b_volleybox_url) : null,
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
      unmappedTeams={Array.from(unmappedMap.values())}
      updatedAtByLeague={updatedAtByLeague}
    />
  );
}
