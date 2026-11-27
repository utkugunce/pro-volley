import type { Match } from "@/types/fixture";
import { trLower } from "@/utils/turkishLocale";
import {
  getResolvedVolleyboxHallName,
  getResolvedVolleyboxTeamName,
  resolveVolleyboxLeagueMapping,
} from "@/utils/volleyboxWorkbench";

export const VOLLEYBOX_EXCEL_SHEET_NAME = "Matches";
export const VOLLEYBOX_EXCEL_MAX_ROWS = 200;
export const VOLLEYBOX_EXCEL_HEADERS = [
  "Gender",
  "Date",
  "Time",
  "Tournament",
  "Round",
  "Home team",
  "Away team",
  "Home sets",
  "Away sets",
  "Arena",
] as const;

export type VolleyboxExcelCell = string | number | null | undefined;
export type VolleyboxExcelRow = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  number | null,
  number | null,
  string,
];

/** Returns Volleybox's exact ordinal suffix (including 12nd and 13rd). */
export function volleyboxOrdinal(n: number): string {
  if (n === 11) return "11th";
  if (n === 12) return "12nd";
  if (n === 13) return "13rd";
  const rem = n % 10;
  if (rem === 1) return `${n}st`;
  if (rem === 2) return `${n}nd`;
  if (rem === 3) return `${n}rd`;
  return `${n}th`;
}

/** Converts DD.MM.YYYY or YYYY-MM-DD to YYYY-MM-DD, or empty string if invalid. */
export function toIsoDate(rawDate?: string): string {
  const s = (rawDate || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parts = s.split(".");
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return "";
}

/** Normalizes HH:MM to HH:MM:00 for Volleybox Excel import. */
export function formatExcelTime(rawTime?: string): string {
  const s = (rawTime || "").trim();
  if (!s || s === "--:--" || s === "-" || s === "TBD") return "";
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  return "";
}

/** Resolves the exact Volleybox Tournament name (without trailing season). */
export function resolveVolleyboxExcelTournament(match: Match): string {
  const catLower = trLower(match.category || "");
  if (catLower.includes("sultanlar")) return "Vodafone Sultanlar Ligi";
  if (catLower.includes("1. lig") || catLower.includes("1.lig")) {
    return "Türkiye Kadınlar Voleybol 1. Ligi";
  }
  if (catLower.includes("2. lig") || catLower.includes("2.lig")) {
    return "Türkiye Kadınlar Voleybol 2. Ligi";
  }

  const mapping = resolveVolleyboxLeagueMapping(match.category || "", match.city);
  if (mapping?.matched_as) {
    return mapping.matched_as.replace(/\s+20\d{2}[/-]\d{2}$/, "").trim();
  }
  return (match.category || "Unknown Tournament").trim();
}

/** Maps TVF group and optional week info to an allowed Volleybox Excel Round string. */
export function resolveVolleyboxExcelRound(match: Match, weekHint?: string): string {
  const catLower = trLower(match.category || "");
  const groupRaw = (match.group || "").trim();
  const weekSource = (weekHint || match.week || groupRaw).trim();
  const weekMatch = weekSource.match(/(\d+)\s*\.\s*hafta/i) || weekSource.match(/^(\d+)$/);
  const weekNum = weekMatch ? parseInt(weekMatch[1], 10) : null;

  if (catLower.includes("2. lig") || catLower.includes("2.lig")) {
    const gm = groupRaw.match(/(\d+)/);
    return gm ? `Group ${parseInt(gm[1], 10)}` : "Regular Season";
  }

  const isSingleGroup = catLower.includes("sultanlar");
  const grpLetterMatch =
    groupRaw.toUpperCase().match(/\b([A-J])\b/) ||
    groupRaw.toUpperCase().match(/^([A-J])\s*GRUB/);
  if (grpLetterMatch && !isSingleGroup) {
    const letter = grpLetterMatch[1];
    if (weekNum && weekNum >= 1 && weekNum <= 28) {
      return `${volleyboxOrdinal(weekNum)} round - Group ${letter}`;
    }
    return `Group ${letter}`;
  }

  const grpNumMatch = groupRaw.match(/(\d+)/);
  if (grpNumMatch && !isSingleGroup && !weekSource.match(/hafta/i)) {
    return `Group ${parseInt(grpNumMatch[1], 10)}`;
  }

  if (weekNum && weekNum >= 1 && weekNum <= 36) {
    return `regular season - ${volleyboxOrdinal(weekNum)} round`;
  }

  return "Regular Season";
}

function parseSets(match: Match): [number | null, number | null] {
  if (
    typeof match.home_score === "number" &&
    typeof match.away_score === "number" &&
    (match.home_score > 0 || match.away_score > 0)
  ) {
    return [match.home_score, match.away_score];
  }
  const scoreStr = (match.score || "").trim();
  const m = scoreStr.match(/^(\d+)\s*[-:]\s*(\d+)$/);
  if (m) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    if (a > 0 || b > 0) return [a, b];
  }
  return [null, null];
}

/** Converts Match objects to Volleybox Excel rows (skipping rows without valid ISO date). */
export function buildVolleyboxExcelRows(matches: Match[]): VolleyboxExcelRow[] {
  const rows: VolleyboxExcelRow[] = [];
  for (const m of matches) {
    const isoDate = toIsoDate(m.date);
    if (!isoDate) continue;

    const homeTeam = (
      m.volleybox?.host_name ||
      getResolvedVolleyboxTeamName(m.home_team, m.category, m.city)
    ).trim();
    const awayTeam = (
      m.volleybox?.guest_name ||
      getResolvedVolleyboxTeamName(m.away_team, m.category, m.city)
    ).trim();
    if (!homeTeam || !awayTeam) continue;

    const [homeSets, awaySets] = parseSets(m);
    const arena = getResolvedVolleyboxHallName(m.hall || "", m.volleybox?.vb_hall ?? undefined);

    rows.push([
      "Women",
      isoDate,
      formatExcelTime(m.time),
      resolveVolleyboxExcelTournament(m),
      resolveVolleyboxExcelRound(m),
      homeTeam,
      awayTeam,
      homeSets,
      awaySets,
      arena === "-" ? "" : arena,
    ]);
  }
  return rows.sort((a, b) => a[1].localeCompare(b[1]) || a[2].localeCompare(b[2]));
}

/** Splits rows into Volleybox-compliant batches of at most 200 matches. */
export function chunkVolleyboxExcelRows(
  rows: VolleyboxExcelRow[],
  maxRows = VOLLEYBOX_EXCEL_MAX_ROWS
): VolleyboxExcelRow[][] {
  const chunks: VolleyboxExcelRow[][] = [];
  for (let i = 0; i < rows.length; i += maxRows) {
    chunks.push(rows.slice(i, i + maxRows));
  }
  return chunks;
}

// --- Minimal zero-dependency OOXML (.xlsx) writer ---

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function colRef(colIdx: number, rowNum: number): string {
  let col = "";
  let n = colIdx + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    n = Math.floor((n - 1) / 26);
  }
  return `${col}${rowNum}`;
}

function buildSheetXml(
  headers: readonly string[],
  rows: readonly (readonly VolleyboxExcelCell[])[]
): string {
  const rowXml: string[] = [];
  const allRows: readonly (readonly VolleyboxExcelCell[])[] = [headers, ...rows];

  allRows.forEach((row, rIdx) => {
    const rowNum = rIdx + 1;
    const cellsXml: string[] = [];
    row.forEach((val, cIdx) => {
      if (val === null || val === undefined || val === "") return;
      const ref = colRef(cIdx, rowNum);
      if (typeof val === "number" && Number.isFinite(val)) {
        cellsXml.push(`<c r="${ref}"><v>${val}</v></c>`);
      } else {
        const styleAttr = rIdx === 0 ? ' s="1"' : "";
        cellsXml.push(
          `<c r="${ref}" t="inlineStr"${styleAttr}><is><t>${escapeXml(String(val))}</t></is></c>`
        );
      }
    });
    rowXml.push(`<row r="${rowNum}">${cellsXml.join("")}</row>`);
  });

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${rowXml.join("")}</sheetData>` +
    "</worksheet>"
  );
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function buildStoreZip(entries: ZipEntry[]): Uint8Array {
  const enc = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = enc.encode(entry.name);
    const data = entry.data;
    const crc = crc32(data);

    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    localParts.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);

    offset += local.length;
  }

  const centralSize = centralParts.reduce((sum, p) => sum + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalSize = offset + centralSize + eocd.length;
  const out = new Uint8Array(totalSize);
  let pos = 0;
  for (const p of localParts) {
    out.set(p, pos);
    pos += p.length;
  }
  for (const p of centralParts) {
    out.set(p, pos);
    pos += p.length;
  }
  out.set(eocd, pos);
  return out;
}

/** Builds a valid .xlsx workbook binary with a single sheet named "Matches". */
export function buildVolleyboxXlsxBytes(rows: readonly VolleyboxExcelRow[]): Uint8Array {
  const enc = new TextEncoder();
  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    "</Types>";

  const rootRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    "</Relationships>";

  const workbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets><sheet name="${escapeXml(VOLLEYBOX_EXCEL_SHEET_NAME)}" sheetId="1" r:id="rId1"/></sheets>` +
    "</workbook>";

  const workbookRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    "</Relationships>";

  const styles =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
    "</styleSheet>";

  const sheet1 = buildSheetXml(VOLLEYBOX_EXCEL_HEADERS, rows);

  return buildStoreZip([
    { name: "[Content_Types].xml", data: enc.encode(contentTypes) },
    { name: "_rels/.rels", data: enc.encode(rootRels) },
    { name: "xl/workbook.xml", data: enc.encode(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: enc.encode(workbookRels) },
    { name: "xl/styles.xml", data: enc.encode(styles) },
    { name: "xl/worksheets/sheet1.xml", data: enc.encode(sheet1) },
  ]);
}

/** Triggers browser download of one or more <=200-row Volleybox .xlsx files. */
export function downloadVolleyboxExcelFiles(matches: Match[], filenamePrefix = "volleybox_matches"): number {
  const rows = buildVolleyboxExcelRows(matches);
  if (rows.length === 0) return 0;

  const chunks = chunkVolleyboxExcelRows(rows, VOLLEYBOX_EXCEL_MAX_ROWS);
  const stamp = new Date().toISOString().slice(0, 10);

  chunks.forEach((chunk, idx) => {
    const bytes = buildVolleyboxXlsxBytes(chunk);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const part = chunks.length > 1 ? `_part${idx + 1}` : "";
    a.href = url;
    a.download = `${filenamePrefix}_${stamp}${part}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  return rows.length;
}
