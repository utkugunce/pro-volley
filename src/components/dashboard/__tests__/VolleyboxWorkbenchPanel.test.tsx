import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Match } from "@/types/fixture";
import { VolleyboxWorkbenchPanel } from "../VolleyboxWorkbenchPanel";

describe("VolleyboxWorkbenchPanel", () => {
  it("renders separate date and time copy buttons, copies Volleybox hall name, and links edit button to league /matches", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    const matches: Match[] = [
      {
        id: "m-synced-ref",
        city: "İstanbul",
        date: "2026-10-18",
        time: "12:00",
        hall: "Bahçelievler Hasan Doğan S.S.",
        category: "Genç Kızlar Süper Lig",
        age_group: "Genç",
        gender: "Kız",
        group: "A Grubu",
        match_no: "100",
        home_team: "VakıfBank",
        away_team: "Eczacıbaşı",
        status: "finished",
        home_score: 3,
        away_score: 0,
        volleybox: {
          synced: true,
          has_score: true,
          match_id: 999,
          vb_hall: "Hasan Doğan Spor Kompleksi",
        },
      },
      {
        id: "m-disc-1",
        city: "İstanbul",
        date: "2026-10-25",
        time: "17:45",
        hall: "Hasan Doğan Spor Salonu",
        category: "Genç Kızlar Süper Lig",
        age_group: "Genç",
        gender: "Kız",
        group: "A Grubu",
        match_no: "105",
        home_team: "Fenerbahçe",
        away_team: "Galatasaray",
        status: "upcoming",
        volleybox: {
          synced: true,
          has_score: false,
          match_id: 1005,
          url: "https://women.volleybox.net/m1005",
          discrepancy: {
            has_diff: true,
            date_diff: true,
            time_diff: true,
            hall_diff: true,
            vb_date: "2026-10-24",
            vb_time: "15:00",
            vb_hall: "50. Yıl Deniz Esinduy Voleybol Salonu",
          },
        },
      },
    ];

    render(<VolleyboxWorkbenchPanel matches={matches} city="İstanbul" />);

    const dateBtn = screen.getByRole("button", { name: /Tarih \(2026-10-25\)/i });
    const timeBtn = screen.getByRole("button", { name: /Saat \(17:45\)/i });
    const hallBtn = screen.getByRole("button", { name: /Salonu Kopyala/i });

    expect(dateBtn).toBeInTheDocument();
    expect(timeBtn).toBeInTheDocument();
    expect(hallBtn).toBeInTheDocument();

    fireEvent.click(dateBtn);
    expect(writeText).toHaveBeenCalledWith("2026-10-25");

    fireEvent.click(timeBtn);
    expect(writeText).toHaveBeenCalledWith("17:45");

    fireEvent.click(hallBtn);
    expect(writeText).toHaveBeenCalledWith("Hasan Doğan Spor Kompleksi");

    const editLink = screen.getByRole("link", { name: /VB'de Düzenle \(Maçlar\)/i });
    const href = editLink.getAttribute("href") || "";
    expect(href).toContain("https://women.volleybox.net/tr/");
    expect(href.endsWith("/matches")).toBe(true);
  });

  it("filters across multiple pro leagues when showLeagueFilter is enabled", () => {
    const matches: Match[] = [
      {
        id: "pro-1",
        city: "İstanbul",
        date: "2026-11-01",
        time: "19:00",
        hall: "Burhan Felek",
        category: "Vodafone Sultanlar Ligi",
        age_group: "Büyük Kadınlar",
        gender: "Kadın",
        group: "Sultanlar",
        match_no: "1",
        home_team: "Eczacıbaşı Dynavit",
        away_team: "VakıfBank",
        status: "finished",
        home_score: 3,
        away_score: 2,
        set_scores: ["25-20", "22-25", "25-18", "20-25", "15-12"],
        volleybox: { synced: true, has_score: false, match_id: 5001 },
      },
      {
        id: "pro-2",
        city: "Ankara",
        date: "2026-11-02",
        time: "16:00",
        hall: "TVF Başkent",
        category: "Uzman Posta Kadınlar 2. Ligi",
        age_group: "Büyük Kadınlar",
        gender: "Kadın",
        group: "1. Grup",
        match_no: "2",
        home_team: "Takım X",
        away_team: "Takım Y",
        status: "finished",
        home_score: 3,
        away_score: 0,
        set_scores: ["25-15", "25-18", "25-19"],
        volleybox: { synced: true, has_score: false, match_id: 5002 },
      },
    ];

    render(
      <VolleyboxWorkbenchPanel
        matches={matches}
        city="Türkiye"
        showLeagueFilter
        hideEnsureFullData
      />
    );

    const select = screen.getByLabelText("Lig Filtresi") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(screen.getByText(/Takım X/)).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "Vodafone Sultanlar Ligi" } });
    expect(screen.queryByText(/Takım X/)).not.toBeInTheDocument();
    expect(screen.getByText(/VakıfBank/)).toBeInTheDocument();
  });
});
