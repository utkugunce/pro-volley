import { describe, expect, it } from "vitest";
import type { Match } from "@/types/fixture";
import {
  VOLLEYBOX_EXCEL_HEADERS,
  VOLLEYBOX_EXCEL_MAX_ROWS,
  buildVolleyboxExcelRows,
  buildVolleyboxXlsxBytes,
  chunkVolleyboxExcelRows,
  resolveVolleyboxExcelRound,
  resolveVolleyboxExcelTournament,
  volleyboxOrdinal,
} from "@/utils/volleyboxExcel";

describe("volleyboxExcel", () => {
  it("formats Volleybox ordinals including 12nd and 13rd", () => {
    expect(volleyboxOrdinal(1)).toBe("1st");
    expect(volleyboxOrdinal(2)).toBe("2nd");
    expect(volleyboxOrdinal(3)).toBe("3rd");
    expect(volleyboxOrdinal(4)).toBe("4th");
    expect(volleyboxOrdinal(11)).toBe("11th");
    expect(volleyboxOrdinal(12)).toBe("12nd");
    expect(volleyboxOrdinal(13)).toBe("13rd");
    expect(volleyboxOrdinal(21)).toBe("21st");
    expect(volleyboxOrdinal(22)).toBe("22nd");
    expect(volleyboxOrdinal(23)).toBe("23rd");
  });

  it("resolves exact Volleybox tournament and round names for pro leagues", () => {
    const sultanlarMatch: Match = {
      id: "s1",
      date: "22.11.2026",
      time: "19:00",
      hall: "Burhan Felek",
      category: "Vodafone Sultanlar Ligi",
      age_group: "Büyük Kadınlar",
      gender: "Kadın",
      group: "12. Hafta",
      match_no: "s1",
      home_team: "Fenerbahçe Medicana",
      away_team: "VakıfBank",
      home_score: 3,
      away_score: 1,
      status: "finished",
    };
    expect(resolveVolleyboxExcelTournament(sultanlarMatch)).toBe("Vodafone Sultanlar Ligi");
    expect(resolveVolleyboxExcelRound(sultanlarMatch)).toBe("regular season - 12nd round");

    const lig1Match: Match = {
      id: "l1",
      date: "2026-11-22",
      time: "14:00",
      hall: "TVF 50. Yıl",
      category: "Arabica Coffee House Kadınlar Voleybol 1. Ligi",
      age_group: "Büyük Kadınlar",
      gender: "Kadın",
      group: "B Grubu",
      match_no: "l1",
      home_team: "İlbank",
      away_team: "Karşıyaka",
      status: "upcoming",
    };
    expect(resolveVolleyboxExcelTournament(lig1Match)).toBe("Türkiye Kadınlar Voleybol 1. Ligi");
    expect(resolveVolleyboxExcelRound(lig1Match, "7")).toBe("7th round - Group B");

    const lig2Match: Match = {
      id: "l2",
      date: "22.11.2026",
      time: "15:00",
      hall: "Talat Özkarslı",
      category: "Kadınlar 2. Ligi",
      age_group: "Büyük Kadınlar",
      gender: "Kadın",
      group: "14. Grup",
      match_no: "l2",
      home_team: "Takım A",
      away_team: "Takım B",
      status: "upcoming",
    };
    expect(resolveVolleyboxExcelTournament(lig2Match)).toBe("Türkiye Kadınlar Voleybol 2. Ligi");
    expect(resolveVolleyboxExcelRound(lig2Match)).toBe("Group 14");
  });

  it("builds rows with numeric sets for played matches and null sets for upcoming matches", () => {
    const matches: Match[] = [
      {
        id: "m1",
        date: "22.11.2026",
        time: "19:00",
        hall: "Burhan Felek",
        category: "Vodafone Sultanlar Ligi",
        age_group: "Büyük Kadınlar",
        gender: "Kadın",
        group: "4. Hafta",
        match_no: "m1",
        home_team: "Fenerbahçe",
        away_team: "Galatasaray",
        home_score: 3,
        away_score: 0,
        status: "finished",
        volleybox: {
          synced: false,
          host_name: "Fenerbahçe Medicana",
          guest_name: "Galatasaray Daikin",
        },
      },
      {
        id: "m2",
        date: "29.11.2026",
        time: "17:00",
        hall: "VakıfBank Spor Sarayı",
        category: "Vodafone Sultanlar Ligi",
        age_group: "Büyük Kadınlar",
        gender: "Kadın",
        group: "5. Hafta",
        match_no: "m2",
        home_team: "VakıfBank",
        away_team: "Eczacıbaşı",
        status: "upcoming",
      },
    ];

    const rows = buildVolleyboxExcelRows(matches);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual([
      "Women",
      "2026-11-22",
      "19:00:00",
      "Vodafone Sultanlar Ligi",
      "regular season - 4th round",
      "Fenerbahçe Medicana",
      "Galatasaray Daikin",
      3,
      0,
      "TVF Burhan Felek Vestel Voleybol Salonu",
    ]);
    expect(rows[1][7]).toBeNull();
    expect(rows[1][8]).toBeNull();
  });

  it("chunks rows into batches of at most 200 matches and builds a valid xlsx zip", () => {
    expect(VOLLEYBOX_EXCEL_HEADERS).toHaveLength(10);
    const sampleRow = [
      "Women",
      "2026-11-22",
      "19:00:00",
      "Vodafone Sultanlar Ligi",
      "regular season - 4th round",
      "Team A",
      "Team B",
      3,
      1,
      "Arena",
    ] as [string, string, string, string, string, string, string, number | null, number | null, string];

    const rows = Array.from({ length: 205 }, () => sampleRow);
    const chunks = chunkVolleyboxExcelRows(rows, VOLLEYBOX_EXCEL_MAX_ROWS);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(200);
    expect(chunks[1]).toHaveLength(5);

    const bytes = buildVolleyboxXlsxBytes([sampleRow]);
    // PK\x03\x04 ZIP local file header
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('name="Matches"');
    expect(text).toContain("xl/worksheets/sheet1.xml");
    expect(text).toContain("Vodafone Sultanlar Ligi");
  });
});
