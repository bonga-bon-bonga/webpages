# scripts/build_musiclist.py
#####################################################
# musiclist.json を Google スプレッドシートの内容で更新するスクリプト
#####################################################
import json
import os

try:
    import requests  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    requests = None

SPREADSHEET_ID = os.environ.get("NEMUPIPIANO_SPREADSHEET_ID")
if not SPREADSHEET_ID:
    raise SystemExit("Missing env var: NEMUPIPIANO_SPREADSHEET_ID")

OUTPUT_JSON_PATH = (
    os.environ.get("OUTPUT_JSON_PATH")
    or "nemupipiano-musiclist-search/data/musiclist.json"
)

GOOGLE_SHEET_URL = (
    f"https://docs.google.com/spreadsheets/d/"
    f"{SPREADSHEET_ID}/gviz/tq?tqx=out:json"
)

KNOWN_HEADERS = {"No", "弾ける曲", "曲名", "アーティスト", "ジャンル", "補足"}
DEFAULT_ENTRY = {
    "searchWords": [],
    "artistAliases": [],
    "tags": [],
}


def normalize_text(value):
    return str(value or "").strip()


def cell_value(cell):
    if not cell:
        return ""

    return cell.get("f") or cell.get("v") or ""


def pick_value(row, japanese_key, english_key):
    return normalize_text(row.get(japanese_key) or row.get(english_key))


def build_item_key(title, artist):
    return f"{title}|{artist}"


def empty_musiclist():
    return {"items": {}}


def normalize_entry(value):
    if not isinstance(value, dict):
        return dict(DEFAULT_ENTRY)

    return {
        "searchWords": value.get("searchWords") if isinstance(value.get("searchWords"), list) else [],
        "artistAliases": value.get("artistAliases") if isinstance(value.get("artistAliases"), list) else [],
        "tags": value.get("tags") if isinstance(value.get("tags"), list) else [],
    }


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

    if not any(header in KNOWN_HEADERS for header in headers) and raw_rows:
        first_row_cells = raw_rows[0].get("c", [])
        inferred = []
        for idx in range(len(headers)):
            cell = first_row_cells[idx] if idx < len(first_row_cells) else None
            inferred.append(normalize_text(cell_value(cell)) or headers[idx])

        if any(header in KNOWN_HEADERS for header in inferred):
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

    return rows


def load_json():
    if not os.path.exists(OUTPUT_JSON_PATH):
        return empty_musiclist()

    with open(OUTPUT_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict) and isinstance(data.get("items"), dict):
        return {
            "items": {
                str(key): normalize_entry(value)
                for key, value in data["items"].items()
            }
        }

    if isinstance(data, dict) and isinstance(data.get("items"), list):
        items = data["items"]
    elif isinstance(data, list):
        items = data
    else:
        return empty_musiclist()

    migrated = empty_musiclist()
    for item in items:
        if not isinstance(item, dict):
            continue

        title = normalize_text(item.get("title"))
        artist = normalize_text(item.get("artist"))
        if not title and not artist:
            continue

        migrated["items"][build_item_key(title, artist)] = normalize_entry(item)

    return migrated


def build_musiclist(sheet_rows, existing_musiclist):
    existing_items = existing_musiclist.get("items", {})
    output_items = {}

    for row in sheet_rows:
        title = pick_value(row, "曲名", "title")
        artist = pick_value(row, "アーティスト", "artist")
        if not title and not artist:
            continue

        key = build_item_key(title, artist)
        output_items[key] = normalize_entry(existing_items.get(key))

    return {"items": output_items}


def save_json(data):
    os.makedirs(os.path.dirname(OUTPUT_JSON_PATH) or ".", exist_ok=True)
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main():
    sheet_rows = load_sheet()
    existing_musiclist = load_json()
    musiclist = build_musiclist(sheet_rows, existing_musiclist)
    save_json(musiclist)
    print(f"Updated {len(musiclist['items'])} records.")


if __name__ == "__main__":
    main()
