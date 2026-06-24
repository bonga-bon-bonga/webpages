import json
import os
import re
import unicodedata

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
SEARCH_ENHANCEMENTS_PATH = (
    os.environ.get("SEARCH_ENHANCEMENTS_PATH")
    or "nemupipiano-musiclist-search/data/dictionary/search-enhancements.json"
)

GOOGLE_SHEET_URL = (
    f"https://docs.google.com/spreadsheets/d/"
    f"{SPREADSHEET_ID}/gviz/tq?tqx=out:json"
)

KNOWN_HEADERS = {"No", "弾ける曲", "曲名", "アーティスト", "ジャンル", "補足"}
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

''' 正規化されたセルのテキストを返す関数 '''
def normalize_cell_text(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()

''' 正規化されたテキストを返す関数 '''
def normalize_text(value):
    return unicodedata.normalize("NFKC", str(value or "").translate(ROMAN_NUMERAL_MAP)).lower()

''' 検索キーを作成する関数 '''
def create_search_key(value):
    text = normalize_text(value)
    text = re.sub(r"\s+", "", text)
    text = re.sub(r"[\u2010\u2013\u2014\u2015]", "-", text)
    text = re.sub(r"[\uff5e\u301c]", "~", text)
    text = re.sub(r"[\(\)\[\]\{\}<>\u3008\u3009\u300a\u300b\u300c\u300d\u300e\u300f\u3010\u3011\u3014\u3015\u3016\u3017\u3018\u3019\u301a\u301b]", "", text)
    text = re.sub(r"[!?*\"#$%&',.:\uff1a;\uff1b\uff65\u30fb\u2026\u2025\u3001\u3002|]", "", text)
    return text

''' セルの値を取得する関数 '''
def cell_value(cell):
    if not cell:
        return ""

    return cell.get("f") or cell.get("v") or ""


''' 行から値を取得する関数 '''
def pick_value(row, japanese_key, english_key):
    return normalize_cell_text(row.get(japanese_key) or row.get(english_key))


''' 番号をフォーマットする関数 '''
def format_no(value):
    text = normalize_cell_text(value)
    if not text:
        return ""

    try:
        number = float(text)
    except ValueError:
        return text

    return int(number) if number.is_integer() else number


''' ユニークな値のリストを作成する関数'''
def unique(values):
    result = []
    seen = set()

    for value in values:
        value = normalize_cell_text(value)
        if not value:
            continue

        key = value.lower()
        if key in seen:
            continue

        seen.add(key)
        result.append(value)

    return result

''' キーを分割する関数 '''
def song_key(title, artist):
    return f"{create_search_key(title)}|{create_search_key(artist)}"

''' タイトルとアーティスト名を分割する関数 '''
def normalize_entry(value):
    # インスタンスが辞書でない場合は空の検索ワードを返す
    if not isinstance(value, dict):
        return {"titleSearchWords": [], "artistSearchWords": [], "tags": []}

    # タイトルとアーティスト名の検索ワードをユニークにして返す
    return {
        "titleSearchWords": unique(
            value.get("titleSearchWords")
            if isinstance(value.get("titleSearchWords"), list)
            else value.get("searchWords")
            if isinstance(value.get("searchWords"), list)
            else []
        ),
        "artistSearchWords": unique(
            value.get("artistSearchWords")
            if isinstance(value.get("artistSearchWords"), list)
            else value.get("artistAliases")
            if isinstance(value.get("artistAliases"), list)
            else []
        ),
        "tags": unique(value.get("tags") if isinstance(value.get("tags"), list) else []),
    }

''' SudachiPyの読みを取得する関数。'''
def load_sheet():

    # Google SheetsからJSONデータを取得
    if requests is None:
        from urllib.request import urlopen

        with urlopen(GOOGLE_SHEET_URL, timeout=30) as response:
            text = response.read().decode("utf-8")
    else:
        response = requests.get(GOOGLE_SHEET_URL, timeout=30)
        response.raise_for_status()
        text = response.text

    # Google SheetsのJSONレスポンスからデータを抽出
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
    data_rows = raw_rows

    # ヘッダーが既知のヘッダーと一致しない場合、最初の行をヘッダーとして推測する
    if not any(header in KNOWN_HEADERS for header in headers) and raw_rows:
        first_row_cells = raw_rows[0].get("c", [])
        inferred = []
        for idx in range(len(headers)):
            cell = first_row_cells[idx] if idx < len(first_row_cells) else None
            inferred.append(normalize_cell_text(cell_value(cell)) or headers[idx])

        if any(header in KNOWN_HEADERS for header in inferred):
            headers = inferred
            data_rows = raw_rows[1:]

    # データ行を辞書形式に変換する
    rows = []
    for row in data_rows:
        cells = row.get("c", [])
        values = [
            cell_value(cells[i]) if i < len(cells) else ""
            for i in range(len(headers))
        ]
        rows.append(dict(zip(headers, values)))

    return rows


def load_existing_entries():
    if not os.path.exists(OUTPUT_JSON_PATH):
        return {}

    with open(OUTPUT_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = {}
    if isinstance(data, dict) and isinstance(data.get("items"), dict):
        for key, value in data["items"].items():
            entries[str(key)] = normalize_entry(value)
        return entries

    items = data.get("items") if isinstance(data, dict) else data
    if not isinstance(items, list):
        return entries

    for item in items:
        if not isinstance(item, dict):
            continue

        keys = [
            item.get("songKey"),
            song_key(item.get("displayTitle"), item.get("displayArtist")),
            f"{normalize_cell_text(item.get('sourceTitle'))}|{normalize_cell_text(item.get('sourceArtist'))}",
        ]
        entry = normalize_entry(item)
        for key in keys:
            key = normalize_cell_text(key)
            if key:
                entries[key] = entry

    return entries


def load_search_enhancements():
    if not os.path.exists(SEARCH_ENHANCEMENTS_PATH):
        return {"titleCorrections": {}, "artistCorrections": {}}

    with open(SEARCH_ENHANCEMENTS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        return {"titleCorrections": {}, "artistCorrections": {}}

    if "titleCorrections" not in data and "artistCorrections" not in data:
        data = {"titleCorrections": data, "artistCorrections": {}}

    return {
        "titleCorrections": normalize_corrections(data.get("titleCorrections")),
        "artistCorrections": normalize_corrections(data.get("artistCorrections")),
    }

''' 検索補正を正規化する関数。 '''
def normalize_corrections(value):
    if not isinstance(value, dict):
        return {}

    return {
        create_search_key(key): normalize_cell_text(correction)
        for key, correction in value.items()
        if create_search_key(key) and normalize_cell_text(correction)
    }

''' 値を補正する関数。補正が存在する場合は補正値を返し、存在しない場合は元の値を返す。'''
def corrected_value(source_value, corrections):
    return corrections.get(create_search_key(source_value)) or source_value

''' musiclistを構築する関数。Google Sheetsから音楽リストを取得し、既存のエントリと検索補正を適用して結果を出力する。 '''
def build_musiclist(sheet_rows, existing_entries, search_enhancements):
    output_items = []
    title_corrections = search_enhancements["titleCorrections"]
    artist_corrections = search_enhancements["artistCorrections"]

    for row in sheet_rows:
        source_title = pick_value(row, "曲名", "title").replace("〜", "～")
        source_artist = pick_value(row, "アーティスト", "artist").replace("〜", "～")
        if not source_title and not source_artist:
            continue

        display_title = corrected_value(source_title, title_corrections)
        display_artist = corrected_value(source_artist, artist_corrections)
        key = song_key(display_title, display_artist)
        legacy_key = f"{source_title}|{source_artist}"
        existing = normalize_entry(
            existing_entries.get(key)
            or existing_entries.get(legacy_key)
            or existing_entries.get(f"{display_title}|{display_artist}")
        )
        genre = pick_value(row, "ジャンル", "genre")

        output_items.append(
            {
                "no": format_no(pick_value(row, "No", "no")),
                "displayTitle": display_title,
                "displayArtist": display_artist,
                "songKey": key,
                "titleSearchWords": existing["titleSearchWords"],
                "artistSearchWords": existing["artistSearchWords"],
                "tags": unique(existing["tags"] + ([genre] if genre else [])),
                "sourceTitle": source_title,
                "sourceArtist": source_artist,
                "playable": pick_value(row, "弾ける曲", "playable"),
                "genre": genre,
                "note": pick_value(row, "補足", "note"),
            }
        )

    return output_items

''' JSONデータを保存する関数。 '''
def save_json(data):
    os.makedirs(os.path.dirname(OUTPUT_JSON_PATH) or ".", exist_ok=True)
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

''' メイン関数。Google Sheetsから音楽リストを取得し、既存のエントリと検索補正を適用して結果を出力する。'''
def main():
    sheet_rows = load_sheet()
    existing_entries = load_existing_entries()
    search_enhancements = load_search_enhancements()
    musiclist = build_musiclist(sheet_rows, existing_entries, search_enhancements)
    save_json(musiclist)
    print(f"Updated {len(musiclist)} records.")


if __name__ == "__main__":
    main()
