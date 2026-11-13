import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Match } from "@/types/fixture";
import { VolleyboxCockpitClient, type VolleyboxCockpitMatch } from "../VolleyboxCockpitClient";

describe("VolleyboxCockpitClient", () => {
  const sampleWorkbenchMatch: Match = {
    id: "sultanlar-1",
    city: "İstanbul",
    date: "2026-11-05",
    time: "19:00",
    hall: "TVF Burhan Felek Vestel Voleybol Salonu",
    category: "Vodafone Sultanlar Ligi",
    age_group: "Büyük Kadınlar",
    gender: "Kadın",
    group: "Vodafone Sultanlar Ligi",
    match_no: "101",
    home_team: "VakıfBank",
    away_team: "Fenerbahçe",
    status: "finished",
    home_score: 3,
    away_score: 1,
    score: "3 - 1",
    set_scores: ["25-20", "22-25", "25-18", "25-21"],
    volleybox: {
      synced: true,
      has_score: false,
      match_id: 7001,
    },
  };

  const sampleChecklistMatch: VolleyboxCockpitMatch = {
    id: "sultanlar-1",
    leagueKey: "sultanlar",
    leagueLabel: "Sultanlar Ligi",
    grupAdi: "Vodafone Sultanlar Ligi",
    hafta: "5",
    tarih: "05.11.2026",
    isoDate: "2026-11-05",
    saat: "19:00",
    salon: "TVF Burhan Felek Vestel Voleybol Salonu",
    sehir: "İstanbul",
    takimA: "VakıfBank",
    takimB: "Fenerbahçe",
    vbNameA: "VakıfBank",
    vbNameB: "Fenerbahçe Medicana",
    vbUrlA: null,
    vbUrlB: null,
    setA: "3",
    setB: "1",
    skor: "3 - 1",
    setSonuclari: ["25-20", "22-25", "25-18", "25-21"],
    isFinished: true,
    tournamentUrl: "https://women.volleybox.net/tr/vodafone-sultanlar-ligi-o1/matches",
  };

  it("defaults to Operatör İş Kuyruğu view, renders league VB /matches quick links, and opens MatchInspectorPanel from Checklist", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(
      <VolleyboxCockpitClient
        matches={[sampleChecklistMatch]}
        workbenchMatches={[sampleWorkbenchMatch]}
        workbenchStandings={{}}
        unmappedTeams={[]}
        updatedAtByLeague={{ sultanlar: "2026-11-05 20:00", "1-lig": "-", "2-lig": "-" }}
        tournamentUrlsByLeague={{
          sultanlar: "https://women.volleybox.net/tr/vodafone-sultanlar-ligi-o1/matches",
          "1-lig": "https://women.volleybox.net/tr/kadinlar-1-ligi-o2/matches",
          "2-lig": "https://women.volleybox.net/tr/kadinlar-2-ligi-o3/matches",
        }}
      />
    );

    expect(screen.getByText(/Tüm Pro Ligler — Volleybox Operatör İş Kuyruğu/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sultanlar VB Maçlar/i })).toHaveAttribute(
      "href",
      "https://women.volleybox.net/tr/vodafone-sultanlar-ligi-o1/matches"
    );

    // Checklist sekmesine geçip "İncele" ile sağ paneli aç
    fireEvent.click(screen.getByRole("button", { name: /Checklist/i }));
    fireEvent.click(screen.getByRole("button", { name: /İncele/i }));

    expect(screen.getByLabelText("Maç Detay Paneli")).toBeInTheDocument();
    expect(screen.getByText(/Salonu Kopyala/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
