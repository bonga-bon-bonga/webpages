import json
import os
import re
import unicodedata
from datetime import date, datetime
from urllib.parse import parse_qs, quote, urlparse
from zoneinfo import ZoneInfo

from sheet_hash import calculate_table_hash, has_unchanged_input, save_hash

try:
    import requests  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    requests = None


ALIAS_SPREADSHEET_ID = os.environ.get("ALIAS_SPREADSHEET_ID")
if not ALIAS_SPREADSHEET_ID:
    raise SystemExit("Missing env var: ALIAS_SPREADSHEET_ID")

ALIAS_GID_PERFORMANCE_PREVIEW = os.environ.get("ALIAS_GID_PERFORMANCE_PREVIEW")
if not ALIAS_GID_PERFORMANCE_PREVIEW:
    raise SystemExit("Missing env var: ALIAS_GID_PERFORMANCE_PREVIEW")

OUTPUT_JSON_PATH = (
    os.environ.get("PERFORMANCE_PREVIEW_PATH")
    or "nemupipiano-musiclist-search/data/performance_preview.json"
)
HASH_PATH = (
    os.environ.get("PERFORMANCE_PREVIEW_HASH_PATH")
    or "nemupipiano-musiclist-search/data/hash/performance_preview"
)
EMBED_ORIGIN = os.environ.get("PERFORMANCE_PREVIEW_EMBED_ORIGIN") or "http://localhost:8000"

GOOGLE_SHEET_URL = (
    f"https://docs.google.com/spreadsheets/d/"
    f"{ALIAS_SPREADSHEET_ID}/gviz/tq?gid={ALIAS_GID_PERFORMANCE_PREVIEW}"
    f"&headers=1&tqx=out:json"
)

ROMAN_NUMERAL_MAP = str.maketrans(
    {
        "Ⅰ": "1",
        "Ⅱ": "2",
        "Ⅲ": "3",
        "Ⅳ": "4",
        "Ⅴ": "5",
        "Ⅵ": "6",
        "Ⅶ": "7",
        "Ⅷ": "8",
        "Ⅸ": "9",
        "Ⅹ": "10",
        "ⅰ": "1",
        "ⅱ": "2",
        "ⅲ": "3",
        "ⅳ": "4",
        "ⅴ": "5",
        "ⅵ": "6",
        "ⅶ": "7",
        "ⅷ": "8",
        "ⅸ": "9",
        "ⅹ": "10",
    }
)

HEADER_ALIASES = {
    "no": {"no", "No", "NO", "番号"},
    "title": {"曲名", "title", "song", "musicname", "music_name"},
    "artist": {"アーティスト", "artist", "artistname", "artist_name"},
    "stream_url": {"配信URL", "URL", "url", "youtube", "YouTube", "動画URL"},
    "start": {"開始位置", "開始", "start", "startTime", "start_time"},
    "end": {"終了位置", "終了", "end", "endTime", "end_time"},
    "preview": {"preview", "Preview", "プレビュー"},
    "hash": {"ハッシュ値(SHA256)", "ハッシュ値", "SHA256", "sha256", "hash"},
    "date": {"配信日", "日付", "年月日", "date", "publishedAt", "published_at"},
}

REQUIRED_FIELDS = {"no", "title", "artist", "stream_url", "start", "end", "preview"}


def normalize_cell_text(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_text(value):
    return unicodedata.normalize("NFKC", str(value or "").translate(ROMAN_NUMERAL_MAP)).lower()


def create_search_key(value):
    text = normalize_text(value)
    text = re.sub(r"\s+", "", text)
    text = re.sub(r"[\u2010\u2013\u2014\u2015]", "-", text)
    text = re.sub(r"[\uff5e\u301c]", "~", text)
    text = re.sub(
        r"[\(\)\[\]\{\}<>\u3008\u3009\u300a\u300b\u300c\u300d\u300e\u300f\u3010\u3011\u3014\u3015\u3016\u3017\u3018\u3019\u301a\u301b]",
        "",
        text,
    )
    text = re.sub(r"[!?*\"#$%&',.:\uff1a;\uff1b\uff65\u30fb\u2026\u2025\u3001\u3002|]", "", text)
    return text


def song_key(title, artist):
    return f"{create_search_key(title)}|{create_search_key(artist)}"


def normalize_header(value):
    return normalize_text(value).replace(" ", "").replace("　", "")


NORMALIZED_HEADER_ALIASES = {
    field: {normalize_header(alias) for alias in aliases}
    for field, aliases in HEADER_ALIASES.items()
}


def cell_value(cell):
    if not cell:
        return ""
    return cell.get("f") or cell.get("v") or ""


def row_values(row, column_count):
    cells = (row or {}).get("c", [])
    return [
        cell_value(cells[i]) if i < len(cells) else ""
        for i in range(column_count)
    ]


def load_sheet():
    if requests is None:
        from urllib.request import urlopen

        with urlopen(GOOGLE_SHEET_URL, timeout=30) as response:
            text = response.read().decode("utf-8")
    else:
        response = requests.get(GOOGLE_SHEET_URL, timeout=30)
        response.raise_for_status()
        text = response.text

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("Unexpected Google Sheets response format")

    data = json.loads(text[start : end + 1])
    table = data.get("table", {})
    cols = table.get("cols", [])
    raw_rows = table.get("rows", [])

    headers = [
        normalize_cell_text(col.get("label") or col.get("id") or f"col{idx + 1}")
        for idx, col in enumerate(cols)
    ]
    rows = [dict(zip(headers, row_values(row, len(headers)))) for row in raw_rows]
    return headers, rows, calculate_table_hash(table)


def resolve_headers(headers):
    resolved = {}
    for field, aliases in NORMALIZED_HEADER_ALIASES.items():
        for header in headers:
            normalized = normalize_header(header)
            first_token = normalize_header(str(header).split(maxsplit=1)[0])
            if normalized in aliases or first_token in aliases:
                resolved[field] = header
                break

    missing = sorted(REQUIRED_FIELDS - set(resolved))
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")
    return resolved


def pick(row, headers, field):
    header = headers.get(field)
    return normalize_cell_text(row.get(header)) if header else ""


def no_value(value):
    text = normalize_cell_text(value)
    try:
        number = float(text)
    except ValueError:
        return -1
    return int(number) if number.is_integer() else number


def parse_seconds(value):
    text = normalize_cell_text(value)
    if not text:
        return None
    if re.fullmatch(r"\d+(?:\.\d+)?", text):
        return int(float(text))

    parts = text.split(":")
    if len(parts) in {2, 3} and all(part.strip().isdigit() for part in parts):
        numbers = [int(part) for part in parts]
        if len(numbers) == 2:
            minutes, seconds = numbers
            return minutes * 60 + seconds
        hours, minutes, seconds = numbers
        return hours * 3600 + minutes * 60 + seconds

    return None


def parse_date(value):
    text = normalize_cell_text(value)
    if not text:
        return None

    if re.fullmatch(r"\d+(?:\.\d+)?", text):
        # Google Sheets serial date. Excel/Sheets day 1 is 1899-12-31, but 1900
        # leap-year compatibility makes 1899-12-30 the practical epoch.
        try:
            return date.fromordinal(date(1899, 12, 30).toordinal() + int(float(text)))
        except ValueError:
            return None

    normalized = text.replace("/", "-").replace(".", "-")
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(normalized, fmt).date()
        except ValueError:
            continue
    return None


def month_keys(today=None):
    current = today or datetime.now(ZoneInfo("Asia/Tokyo")).date()
    keys = []
    year = current.year
    month = current.month
    for offset in range(3):
        shifted = month - offset
        shifted_year = year
        while shifted <= 0:
            shifted += 12
            shifted_year -= 1
        keys.append(f"{shifted_year:04d}-{shifted:02d}")
    return keys


def month_key(value):
    parsed = parse_date(value)
    return f"{parsed.year:04d}-{parsed.month:02d}" if parsed else None


def is_preview_enabled(value):
    return normalize_cell_text(value) in {"○", "〇", "◯", "o", "O", "true", "TRUE", "1", "yes", "YES"}


def youtube_video_id(url):
    parsed = urlparse(normalize_cell_text(url))
    host = parsed.netloc.lower()
    if "youtu.be" in host:
        return parsed.path.strip("/").split("/")[0]
    if "youtube.com" in host:
        if parsed.path.startswith("/embed/"):
            return parsed.path.split("/")[2]
        if parsed.path.startswith("/shorts/"):
            return parsed.path.split("/")[2]
        query = parse_qs(parsed.query)
        return (query.get("v") or [""])[0]
    return ""


def build_embed_url(stream_url, start, end=None):
    video_id = youtube_video_id(stream_url)
    if not video_id or start is None:
        return ""

    params = [
        f"start={start}",
        "enablejsapi=1",
        "autoplay=0",
        "mute=0",
        "controls=1",
        "playsinline=1",
        "fs=1",
        "disablekb=0",
        "cc_load_policy=0",
        "rel=0",
        f"origin={quote(EMBED_ORIGIN, safe='')}",
    ]
    if end is not None and end > start:
        params.insert(1, f"end={end}")
    return f"https://www.youtube.com/embed/{video_id}?{'&'.join(params)}"


def eligible_preview_record(row, headers):
    return all(pick(row, headers, field) for field in REQUIRED_FIELDS) and is_preview_enabled(
        pick(row, headers, "preview")
    )


def performance_record(row, headers):
    start = parse_seconds(pick(row, headers, "start"))
    end = parse_seconds(pick(row, headers, "end"))
    stream_url = pick(row, headers, "stream_url")
    return {
        "no": pick(row, headers, "no"),
        "streamUrl": stream_url,
        "start": start,
        "end": end,
    }


def build_performance_preview(headers, rows):
    resolved_headers = resolve_headers(headers)
    grouped = {}

    for row in rows:
        title = pick(row, resolved_headers, "title")
        artist = pick(row, resolved_headers, "artist")
        if not title or not artist:
            continue

        key = song_key(title, artist)
        grouped.setdefault(
            key,
            {
                "title": title,
                "artist": artist,
                "rows": [],
            },
        )
        grouped[key]["rows"].append(row)

    current_month, previous_month, two_months_ago = month_keys()
    result = {}

    for key in sorted(grouped):
        item = grouped[key]
        rows_for_song = item["rows"]
        recent_rows = sorted(rows_for_song, key=lambda row: no_value(pick(row, resolved_headers, "no")), reverse=True)
        preview_rows = [row for row in rows_for_song if eligible_preview_record(row, resolved_headers)]
        preview_row = max(
            preview_rows,
            key=lambda row: no_value(pick(row, resolved_headers, "no")),
            default=None,
        )

        unique_hashes = set()
        monthly_hashes = {
            "currentMonth": set(),
            "previousMonth": set(),
            "twoMonthsAgo": set(),
        }
        for row in rows_for_song:
            row_hash = pick(row, resolved_headers, "hash") or f"no:{pick(row, resolved_headers, 'no')}"
            if not row_hash:
                continue
            unique_hashes.add(row_hash)

            row_month = month_key(pick(row, resolved_headers, "date"))
            if row_month == current_month:
                monthly_hashes["currentMonth"].add(row_hash)
            elif row_month == previous_month:
                monthly_hashes["previousMonth"].add(row_hash)
            elif row_month == two_months_ago:
                monthly_hashes["twoMonthsAgo"].add(row_hash)

        preview = None
        if preview_row:
            preview = performance_record(preview_row, resolved_headers)
            preview["embedUrl"] = build_embed_url(
                preview["streamUrl"],
                preview["start"],
                preview["end"],
            )

        result[key] = {
            "title": item["title"],
            "artist": item["artist"],
            "preview": preview,
            "recentPerformances": [
                performance_record(row, resolved_headers)
                for row in recent_rows[:3]
            ],
            "counts": {
                "currentMonth": len(monthly_hashes["currentMonth"]),
                "previousMonth": len(monthly_hashes["previousMonth"]),
                "twoMonthsAgo": len(monthly_hashes["twoMonthsAgo"]),
                "total": len(unique_hashes),
            },
        }

    return result


def save_json(data):
    os.makedirs(os.path.dirname(OUTPUT_JSON_PATH) or ".", exist_ok=True)
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main():
    headers, rows, sheet_hash = load_sheet()
    if has_unchanged_input(HASH_PATH, sheet_hash, OUTPUT_JSON_PATH):
        print("Performance preview spreadsheet is unchanged. Skipping update.")
        return

    performance_preview = build_performance_preview(headers, rows)
    save_json(performance_preview)
    save_hash(HASH_PATH, sheet_hash)
    print(f"Updated {len(performance_preview)} performance preview records.")


if __name__ == "__main__":
    main()
