import json
import os
import re
import unicodedata

from sheet_hash import calculate_table_hash, has_unchanged_input, save_hash

try:
    import requests  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    requests = None

SPREADSHEET_ID = os.environ.get("NEMUPIPIANO_SPREADSHEET_ID")
if not SPREADSHEET_ID:
    raise SystemExit("Missing env var: NEMUPIPIANO_SPREADSHEET_ID")


def required_env(name):
    value = os.environ.get(name)
    if value is None or not value.strip():
        raise SystemExit(f"Missing env var: {name}")
    return value.strip()


SHEET_SOURCES = (
    {
        "gid": required_env("NEMUPIPIANO_GID_POPS"),
        "numberPrefix": "list",
    },
    {
        "gid": required_env("NEMUPIPIANO_GID_DISNEY"),
        "numberPrefix": "disney",
    },
    {
        "gid": required_env("NEMUPIPIANO_GID_GHIBLI"),
        "numberPrefix": "ghibli",
    },
)

OUTPUT_JSON_PATH = (
    os.environ.get("OUTPUT_JSON_PATH")
    or "nemupipiano-musiclist-search/data/musiclist.json"
)
SEARCH_ENHANCEMENTS_PATH = (
    os.environ.get("SEARCH_ENHANCEMENTS_PATH")
    or "nemupipiano-musiclist-search/data/dictionary/search-enhancements.json"
)
MUSIC_METADATA_PATH = (
    os.environ.get("MUSIC_METADATA_PATH")
    or "nemupipiano-musiclist-search/data/dictionary/music_metadata.json"
)
HASH_PATH = (
    os.environ.get("MUSICLIST_HASH_PATH")
    or "nemupipiano-musiclist-search/data/hash/musiclist"
)

KNOWN_HEADERS = {"No", "弾ける曲", "曲名", "アーティスト", "ジャンル", "補足"}
REQUIRED_HEADERS = {"No", "曲名", "アーティスト"}
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
def format_source_no(value, prefix):
    text = normalize_cell_text(value)
    if not text:
        return ""

    try:
        number = float(text)
    except ValueError:
        formatted = text
    else:
        formatted = str(int(number)) if number.is_integer() else str(number)

    return f"{prefix}#{formatted}"


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
        return {
            "titleSearchWords": [],
            "artistSearchWords": [],
            "releaseDecade": None,
            "classification": {},
            "metadataTags": {},
            "tieUps": [],
        }

    metadata_tags = value.get("metadataTags")
    if not isinstance(metadata_tags, dict):
        metadata_tags = value.get("tags")
    metadata_tags = metadata_tags if isinstance(metadata_tags, dict) else {}
    classification = value.get("classification")
    classification = classification if isinstance(classification, dict) else {}
    tie_ups = value.get("tieUps")
    tie_ups = tie_ups if isinstance(tie_ups, list) else []

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
        "releaseDecade": value.get("releaseDecade"),
        "classification": classification,
        "metadataTags": metadata_tags,
        "tieUps": tie_ups,
    }


def merge_mapping(existing, incoming):
    result = dict(existing) if isinstance(existing, dict) else {}
    if not isinstance(incoming, dict):
        return result

    for key, value in incoming.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = merge_mapping(result[key], value)
        else:
            result[key] = value

    return result

def google_sheet_url(gid):
    return (
        f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq"
        f"?gid={gid}&tqx=out:json"
    )


def fetch_sheet_table(gid):
    url = google_sheet_url(gid)

    # Google SheetsからJSONデータを取得
    if requests is None:
        from urllib.request import urlopen

        with urlopen(url, timeout=30) as response:
            text = response.read().decode("utf-8")
    else:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        text = response.text

    # Google SheetsのJSONレスポンスからデータを抽出
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("Unexpected Google Sheets response format")

    data = json.loads(text[start : end + 1])
    return data.get("table", {})


def parse_sheet_table(table, number_prefix):
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

    missing_headers = REQUIRED_HEADERS - set(headers)
    if missing_headers:
        missing = ", ".join(sorted(missing_headers))
        raise ValueError(f"Missing required columns for {number_prefix}: {missing}")

    # データ行を辞書形式に変換する
    rows = []
    for row in data_rows:
        cells = row.get("c", [])
        values = [
            cell_value(cells[i]) if i < len(cells) else ""
            for i in range(len(headers))
        ]
        parsed_row = dict(zip(headers, values))
        parsed_row["_numberPrefix"] = number_prefix
        rows.append(parsed_row)

    return rows


def load_sheets():
    rows = []
    hash_sources = []
    for source in SHEET_SOURCES:
        table = fetch_sheet_table(source["gid"])
        rows.extend(parse_sheet_table(table, source["numberPrefix"]))
        hash_sources.append({"gid": source["gid"], "table": table})

    return rows, calculate_table_hash({"sheets": hash_sources})


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


def load_music_metadata():
    if not os.path.exists(MUSIC_METADATA_PATH):
        return {}, []

    with open(MUSIC_METADATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("music_metadata.json must contain a JSON array")

    entries = {}
    for record in data:
        if not isinstance(record, dict):
            continue

        title = normalize_cell_text(record.get("title"))
        artist = normalize_cell_text(record.get("artist"))
        if not title and not artist:
            continue

        metadata = record.get("metadata")
        metadata = metadata if isinstance(metadata, dict) else {}
        classification = record.get("classification")
        classification = classification if isinstance(classification, dict) else {}
        tags = record.get("tags")
        tags = tags if isinstance(tags, dict) else {}
        tie_ups = record.get("tieUps")
        tie_ups = tie_ups if isinstance(tie_ups, list) else []
        entries[song_key(title, artist)] = {
            "releaseDecade": metadata.get("releaseDecade"),
            "classification": classification,
            "tags": tags,
            "tieUps": tie_ups,
        }

    return entries, data


def build_input_hash(sheet_hash, metadata_records):
    return calculate_table_hash(
        {"spreadsheetHash": sheet_hash, "musicMetadata": metadata_records}
    )

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
def build_musiclist(
    sheet_rows,
    existing_entries,
    search_enhancements,
    metadata_entries=None,
):
    output_items = []
    title_corrections = search_enhancements["titleCorrections"]
    artist_corrections = search_enhancements["artistCorrections"]
    metadata_entries = metadata_entries or {}

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
        metadata = (
            metadata_entries.get(key)
            or metadata_entries.get(song_key(source_title, source_artist))
            or {}
        )
        release_decade = metadata.get("releaseDecade")
        if release_decade is None:
            release_decade = existing["releaseDecade"]
        classification = merge_mapping(
            existing["classification"], metadata.get("classification")
        )
        metadata_tags = merge_mapping(
            existing["metadataTags"], metadata.get("tags")
        )
        tie_ups = metadata.get("tieUps")
        if not isinstance(tie_ups, list):
            tie_ups = existing["tieUps"]
        genre = pick_value(row, "ジャンル", "genre")

        output_items.append(
            {
                "no": format_source_no(
                    pick_value(row, "No", "no"),
                    row["_numberPrefix"],
                ),
                "displayTitle": display_title,
                "displayArtist": display_artist,
                "songKey": key,
                "titleSearchWords": existing["titleSearchWords"],
                "artistSearchWords": existing["artistSearchWords"],
                "releaseDecade": release_decade,
                "classification": classification,
                "tags": metadata_tags,
                "tieUps": tie_ups,
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
    sheet_rows, sheet_hash = load_sheets()
    metadata_entries, metadata_records = load_music_metadata()
    input_hash = build_input_hash(sheet_hash, metadata_records)
    if has_unchanged_input(HASH_PATH, input_hash, OUTPUT_JSON_PATH):
        print("Music list inputs are unchanged. Skipping update.")
        return

    existing_entries = load_existing_entries()
    search_enhancements = load_search_enhancements()
    musiclist = build_musiclist(
        sheet_rows,
        existing_entries,
        search_enhancements,
        metadata_entries,
    )
    save_json(musiclist)
    save_hash(HASH_PATH, input_hash)
    print(f"Updated {len(musiclist)} records.")


if __name__ == "__main__":
    main()
