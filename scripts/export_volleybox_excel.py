#!/usr/bin/env python3
"""
scripts/export_volleybox_excel.py
Volleybox'ın yeni toplu Excel (.xlsx) maç yükleme şablonuna uygun dosyalar üretir.

Şablon Kuralları:
  - Sayfa adı: "Matches"
  - Sütun sırası:
    Gender | Date | Time | Tournament | Round | Home team | Away team | Home sets | Away sets | Arena
  - Dosya başına en fazla 200 maç (otomatik parçalama yapılır)
  - Oynanmamış maçlarda Home sets ve Away sets boş bırakılır

Kullanım Örnekleri:
  python scripts/export_volleybox_excel.py --pro
  python scripts/export_volleybox_excel.py --sultanlar
  python scripts/export_volleybox_excel.py --1-lig --status finished
  python scripts/export_volleybox_excel.py --city istanbul --out-dir exports/volleybox
"""

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import openpyxl
from openpyxl.styles import Font

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from scripts.push_volleybox_matches import (
    build_tournament_lookup,
    collect_unsynced_matches,
)
from scripts.sync_volleybox_matches import (
    CITIES_DIR,
    DATA_DIR,
    K2_FILE,
    MAPPINGS_FILE,
    normalize_name,
)

MAX_ROWS_PER_FILE = 200
SHEET_NAME = "Matches"
HEADERS = [
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
]

PRO_TOURNAMENT_NAMES: Dict[str, str] = {
    "o45086": "Vodafone Sultanlar Ligi",
    "o45210": "Türkiye Kadınlar Voleybol 1. Ligi",
    "o45047": "Türkiye Kadınlar Voleybol 2. Ligi",
}


def volleybox_ordinal(n: int) -> str:
    """Volleybox şablonundaki sıra eki yazımını döndürür (12nd ve 13rd dahil)."""
    if n == 11:
        return "11th"
    if n == 12:
        return "12nd"
    if n == 13:
        return "13rd"
    rem = n % 10
    if rem == 1:
        return f"{n}st"
    if rem == 2:
        return f"{n}nd"
    if rem == 3:
        return f"{n}rd"
    return f"{n}th"


def resolve_volleybox_tournament_name(
    t_url: str,
    category: str,
    tourn_lookup: Dict[str, str],
) -> str:
    """Volleybox URL'si veya kategori adından sezon eksiz turnuva adını çözer."""
    m = re.search(r"-(o\d+)(?:[/?#]|$)", t_url or "")
    if m and m.group(1) in PRO_TOURNAMENT_NAMES:
        return PRO_TOURNAMENT_NAMES[m.group(1)]

    # volleybox-mappings.json içindeki matched_as değerinden sezon son ekini kaldır
    if MAPPINGS_FILE.exists():
        with open(MAPPINGS_FILE, "r", encoding="utf-8") as f:
            mdata = json.load(f)
        for lg in mdata.get("leagues", []):
            lg_url = (lg.get("volleybox_url") or "").rstrip("/")
            if lg_url and t_url and lg_url.split("-o")[-1] == t_url.rstrip("/").split("-o")[-1]:
                matched_as = (lg.get("matched_as") or "").strip()
                if matched_as:
                    return re.sub(r"\s+20\d{2}[/-]\d{2}$", "", matched_as).strip()

    return category or "Unknown Tournament"


def resolve_volleybox_round(item: Dict[str, Any]) -> str:
    """TVF hafta ve grup bilgisini Volleybox Excel şablonundaki Round değerine çevirir."""
    slug = (item.get("city_slug") or "").lower()
    group_raw = str(item.get("group") or "").strip()
    week_raw = str(item.get("week") or "").strip()

    week_num: Optional[int] = None
    wm = re.search(r"(\d+)", week_raw)
    if wm:
        week_num = int(wm.group(1))

    # Kadınlar 2. Ligi: şablonda "Group 1" .. "Group 16"
    if slug == "kadinlar-2-ligi":
        gm = re.search(r"(\d+)", group_raw)
        if gm:
            return f"Group {int(gm.group(1))}"
        return "Regular Season"

    # Grup harfi varsa (örn. "A Grubu", "Grup B", "B")
    grp_letter_m = re.search(r"\b([A-J])\b", group_raw.upper())
    if not grp_letter_m:
        grp_letter_m = re.match(r"^([A-J])\s*GRUB", group_raw.upper())
    if grp_letter_m and not item.get("is_single_group"):
        letter = grp_letter_m.group(1)
        if week_num and 1 <= week_num <= 28:
            return f"{volleybox_ordinal(week_num)} round - Group {letter}"
        return f"Group {letter}"

    # Sayısal grup (örn. "1. Grup", "Grup 3")
    grp_num_m = re.search(r"(\d+)", group_raw)
    if grp_num_m and not item.get("is_single_group"):
        return f"Group {int(grp_num_m.group(1))}"

    # Tek gruplu lig (ör. Sultanlar Ligi)
    if week_num and 1 <= week_num <= 36:
        return f"regular season - {volleybox_ordinal(week_num)} round"

    return "Regular Season"


def build_hall_to_arena_map() -> Dict[str, str]:
    """Senkronize edilmiş maçlardan TVF salon -> Volleybox arena eşleme tablosu çıkarır."""
    counts: Dict[str, Counter] = defaultdict(Counter)
    files: List[Path] = [
        DATA_DIR / "sultanlar_ligi.json",
        DATA_DIR / "kadinlar_1_lig.json",
        K2_FILE,
    ]
    if CITIES_DIR.exists():
        files.extend(sorted(CITIES_DIR.glob("*.json")))

    for fp in files:
        if not fp.exists():
            continue
        try:
            with open(fp, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            continue

        matches = data.get("tum_maclar") or data.get("matches") or []
        for m in matches:
            vb = m.get("volleybox") or {}
            if not vb.get("synced"):
                continue
            vb_hall = (vb.get("vb_hall") or "").strip()
            tvf_hall = (m.get("salon") or m.get("hall") or "").strip()
            if vb_hall and tvf_hall and tvf_hall not in ("-", "TBD"):
                counts[normalize_name(tvf_hall)][vb_hall] += 1

    return {k: counter.most_common(1)[0][0] for k, counter in counts.items()}


def format_excel_time(raw_time: str) -> str:
    t = (raw_time or "").strip()
    if not t or t in ("--:--", "-", "TBD"):
        return ""
    if re.match(r"^\d{2}:\d{2}$", t):
        return f"{t}:00"
    if re.match(r"^\d{2}:\d{2}:\d{2}$", t):
        return t
    return ""


def write_matches_workbook(rows: List[List[Any]], out_path: Path) -> None:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = SHEET_NAME
    ws.append(HEADERS)
    for cell in ws[1]:
        cell.font = Font(bold=True)
    for row in rows:
        ws.append(row)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out_path)


def export_excel_batches(
    city_filter: Optional[str] = None,
    include_pro: bool = True,
    status_filter: str = "all",
    out_dir: Path = BASE_DIR / "exports" / "volleybox",
    dry_run: bool = False,
) -> List[Tuple[Path, int]]:
    with open(MAPPINGS_FILE, "r", encoding="utf-8") as f:
        mappings_data = json.load(f)
    tourn_lookup = build_tournament_lookup(mappings_data)
    hall_map = build_hall_to_arena_map()

    by_tournament = collect_unsynced_matches(
        tourn_lookup=tourn_lookup,
        city_filter=city_filter,
        include_pro=include_pro,
        ignore_quarantine=True,
    )

    all_rows: List[List[Any]] = []
    for t_url, items in by_tournament.items():
        if not items:
            continue
        tourn_name = resolve_volleybox_tournament_name(
            t_url, items[0].get("category", ""), tourn_lookup
        )
        for item in items:
            h_sets = item.get("home_sets")
            a_sets = item.get("away_sets")
            is_played = h_sets is not None and a_sets is not None
            if status_filter == "finished" and not is_played:
                continue
            if status_filter == "upcoming" and is_played:
                continue

            home_name = (item.get("home_team_vb_name") or item.get("home_team") or "").strip()
            away_name = (item.get("away_team_vb_name") or item.get("away_team") or "").strip()
            raw_hall = (item.get("hall") or "").strip()
            arena = hall_map.get(normalize_name(raw_hall), raw_hall) if raw_hall else ""

            all_rows.append([
                "Women",
                item.get("date", ""),
                format_excel_time(item.get("time", "")),
                tourn_name,
                resolve_volleybox_round(item),
                home_name,
                away_name,
                int(h_sets) if is_played else None,
                int(a_sets) if is_played else None,
                arena,
            ])

    # Tarih + saat sıralaması
    all_rows.sort(key=lambda r: (r[1], r[2], r[3], r[5]))

    if dry_run or not all_rows:
        return [(out_dir / "dry-run.xlsx", len(all_rows))] if all_rows else []

    stamp = datetime.now().strftime("%Y%m%d_%H%M")
    prefix = (city_filter or ("pro" if include_pro else "all")).replace(" ", "_")
    written: List[Tuple[Path, int]] = []
    total_chunks = (len(all_rows) + MAX_ROWS_PER_FILE - 1) // MAX_ROWS_PER_FILE
    for idx in range(total_chunks):
        chunk = all_rows[idx * MAX_ROWS_PER_FILE : (idx + 1) * MAX_ROWS_PER_FILE]
        part_suffix = f"_part{idx + 1}" if total_chunks > 1 else ""
        out_path = out_dir / f"volleybox_matches_{prefix}_{stamp}{part_suffix}.xlsx"
        write_matches_workbook(chunk, out_path)
        written.append((out_path, len(chunk)))

    return written


def main() -> None:
    parser = argparse.ArgumentParser(description="Volleybox Excel (.xlsx) maç yükleme dışa aktarıcı")
    parser.add_argument("--pro", action="store_true", help="Tüm profesyonel ligler (Sultanlar, 1. Lig, 2. Lig)")
    parser.add_argument("--sultanlar", action="store_true", help="Sadece Vodafone Sultanlar Ligi")
    parser.add_argument("--1-lig", dest="lig1", action="store_true", help="Sadece Kadınlar 1. Ligi")
    parser.add_argument("--2-lig", dest="lig2", action="store_true", help="Sadece Kadınlar 2. Ligi")
    parser.add_argument("--city", type=str, default=None, help="Belirli il slug'ı (örn. istanbul)")
    parser.add_argument("--status", choices=["all", "finished", "upcoming"], default="all")
    parser.add_argument("--out-dir", type=str, default=str(BASE_DIR / "exports" / "volleybox"))
    parser.add_argument("--dry-run", action="store_true", help="Dosya yazmadan özet göster")
    args = parser.parse_args()

    city_filter = args.city
    if args.sultanlar:
        city_filter = "sultanlar-ligi"
    elif args.lig1:
        city_filter = "kadinlar-1-ligi"
    elif args.lig2:
        city_filter = "kadinlar-2-ligi"
    elif args.pro and not city_filter:
        city_filter = "pro"

    results = export_excel_batches(
        city_filter=city_filter,
        include_pro=True,
        status_filter=args.status,
        out_dir=Path(args.out_dir),
        dry_run=args.dry_run,
    )

    if not results:
        print("Dışa aktarılacak senkronize edilmemiş maç bulunamadı.")
        return

    if args.dry_run:
        print(f"[DRY-RUN] Toplam {results[0][1]} maç dışa aktarılacak.")
        return

    total = sum(count for _, count in results)
    print(f"Toplam {total} maç {len(results)} Excel dosyasına aktarıldı:")
    for path, count in results:
        print(f"  - {path} ({count} maç)")


if __name__ == "__main__":
    main()
