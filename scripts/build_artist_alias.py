import json
import os
import re

try:
    import requests  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    requests = None

INPUT_SPREADSHEET_ID = os.environ.get("INPUT_SPREADSHEET_ID")
if not INPUT_SPREADSHEET_ID:
    raise SystemExit("Missing env var: INPUT_SPREADSHEET_ID")

OUTPUT_JSON_PATH = (
    os.environ.get("ARTIST_ALIAS_DICTIONARY_PATH")
    or "nemupipiano-musiclist-search/data/artist_alias_dictionary.json"
)

GOOGLE_SHEET_URL = (
    f"https://docs.google.com/spreadsheets/d/"
    f"{INPUT_SPREADSHEET_ID}/gviz/tq?tqx=out:json"
)

ARTIST_HEADERS = {"アーティスト名", "artist", "artistName", "artist_name"}
HIRAGANA_HEADERS = {"ひらがな", "hiragana", "hira"}
KATAKANA_HEADERS = {"カタカナ", "katakana", "kana"}
ENGLISH_HEADERS = {"英字", "英語", "english", "alphabet", "roman", "romaji"}
KNOWN_HEADERS = ARTIST_HEADERS | HIRAGANA_HEADERS | KATAKANA_HEADERS | ENGLISH_HEADERS


def normalize_text(value):
    return str(value or "").strip()


def normalize_header(value):
    return normalize_text(value).replace(" ", "").replace("　", "")


NORMALIZED_KNOWN_HEADERS = {normalize_header(header) for header in KNOWN_HEADERS}


def cell_value(cell):
    if not cell:
        return ""

    return cell.get("f") or cell.get("v") or ""


def unique(values):
    result = []
    seen = set()

    for value in values:
        value = normalize_text(value)
        if not value:
            continue

        key = value.casefold()
        if key in seen:
            continue

        seen.add(key)
        result.append(value)

    return result


def split_alias_values(value):
    value = normalize_text(value)
    if not value:
        return []

    return [
        part.strip()
        for part in re.split(r"[\n\r,、，]+", value)
        if part.strip()
    ]


def find_header(headers, candidates):
    normalized_candidates = {normalize_header(candidate) for candidate in candidates}

    for header in headers:
        if normalize_header(header) in normalized_candidates:
            return header

    return None


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
        normalize_text(col.get("label") or col.get("id") or f"col{idx + 1}")
        for idx, col in enumerate(cols)
    ]
    data_rows = raw_rows

    if not any(normalize_header(header) in NORMALIZED_KNOWN_HEADERS for header in headers) and raw_rows:
        first_row_cells = raw_rows[0].get("c", [])
        inferred = []
        for idx in range(len(headers)):
            cell = first_row_cells[idx] if idx < len(first_row_cells) else None
            inferred.append(normalize_text(cell_value(cell)) or headers[idx])

        if any(normalize_header(header) in NORMALIZED_KNOWN_HEADERS for header in inferred):
            headers = inferred
            data_rows = raw_rows[1:]

    rows = []
    for row in data_rows:
        cells = row.get("c", [])
        values = [
            cell_value(cells[i]) if i < len(cells) else ""
            for i in range(len(headers))
        ]
        rows.append(dict(zip(headers, values)))

    return headers, rows


def build_alias_dictionary(headers, rows):
    artist_header = find_header(headers, ARTIST_HEADERS)
    alias_headers = [
        header
        for header in [
            find_header(headers, HIRAGANA_HEADERS),
            find_header(headers, KATAKANA_HEADERS),
            find_header(headers, ENGLISH_HEADERS),
        ]
        if header
    ]

    if not artist_header:
        raise ValueError("Missing required column: アーティスト名")

    if not alias_headers:
        raise ValueError("Missing alias columns: ひらがな, カタカナ, 英字")

    alias_dictionary = {}

    for row in rows:
        artist = normalize_text(row.get(artist_header))
        if not artist:
            continue

        aliases = []
        for header in alias_headers:
            aliases.extend(split_alias_values(row.get(header)))

        alias_dictionary[artist] = unique(aliases)

    return alias_dictionary


def save_json(data):
    os.makedirs(os.path.dirname(OUTPUT_JSON_PATH) or ".", exist_ok=True)
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main():
    headers, rows = load_sheet()
    alias_dictionary = build_alias_dictionary(headers, rows)
    save_json(alias_dictionary)
    print(f"Updated {len(alias_dictionary)} artist aliases.")


if __name__ == "__main__":
    main()
