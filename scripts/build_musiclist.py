# scripts/build_musiclist.py
import os
import json
import hashlib
from datetime import datetime, timezone

try:
    import requests  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    requests = None

SPREADSHEET_ID = (
    os.environ.get("SPREADSHEET_ID")
    or os.environ.get("SPREAD_SHEET_ID")
)
if not SPREADSHEET_ID:
    raise SystemExit("Missing env var: SPREADSHEET_ID (or SPREAD_SHEET_ID)")

OUTPUT_JSON_PATH = os.environ.get(
    "OUTPUT_JSON_PATH",
    "nemupipiano-musiclist-search/data/musiclist.json",
)

GOOGLE_SHEET_URL = (
    f"https://docs.google.com/spreadsheets/d/"
    f"{SPREADSHEET_ID}/gviz/tq?tqx=out:json"
)

''' 時間をUTCで取得する関数 '''
def utc_now():
    return datetime.now(timezone.utc).isoformat()

''' 正規化されたテキストを取得する関数 '''
def normalize_text(value):
    return str(value or "").strip()

''' マッチキーを作成する関数 '''
def create_match_key(title, artist):
    return (
        normalize_text(title).lower(),
        normalize_text(artist).lower(),
    )

''' 曲が弾けるかどうかを判定する関数 '''
def is_playable(value):
    raw = str(value or "")
    normalized = raw.strip().lower()

    return (
        "〇" in raw
        or "○" in raw
        or "yes" in normalized
    )

''' Googleスプレッドシートからデータを取得する関数 '''
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
        (col.get("label") or col.get("id") or f"col{idx + 1}").strip()
        for idx, col in enumerate(cols)
    ]

    known_headers = {"No", "弾ける曲", "曲名", "アーティスト", "ジャンル", "補足"}
    data_rows = raw_rows

    # ラベルが取れない場合、1行目がヘッダーになっているパターンがあるため推測する
    if not any(h in known_headers for h in headers) and raw_rows:
        first_row_cells = raw_rows[0].get("c", [])
        inferred = []
        for idx in range(len(headers)):
            cell = first_row_cells[idx] if idx < len(first_row_cells) else None
            value = "" if cell is None else str(cell.get("v", ""))
            inferred.append(value.strip() or headers[idx])

        if any(h in known_headers for h in inferred):
            headers = inferred
            data_rows = raw_rows[1:]

    rows = []
    for row in data_rows:
        cells = row.get("c", [])
        values = [
            "" if i >= len(cells) or cells[i] is None else cells[i].get("v", "")
            for i in range(len(headers))
        ]
        rows.append(dict(zip(headers, values)))

    return rows

''' スプレッドシートのリビジョンを計算する関数 '''
def calc_revision(rows):
    targets = []

    for row in rows:
        targets.append(
            "|".join(
                [
                    str(row.get("No", "") or row.get("no", "")),
                    str(row.get("弾ける曲", "") or row.get("playable", "")),
                    str(row.get("曲名", "") or row.get("title", "")),
                    str(row.get("アーティスト", "") or row.get("artist", "")),
                    str(row.get("ジャンル", "") or row.get("genre", "")),
                    str(row.get("補足", "") or row.get("note", "")),
            )
        )

    source = "\n".join(targets)

    return hashlib.sha256(
        source.encode("utf-8")
    ).hexdigest()

''' JSONファイルを読み込む関数 '''
def load_json():
    if not os.path.exists(OUTPUT_JSON_PATH):
        return {
            "schemaVersion": 1,
            "generatedAt": "",
            "spreadsheetRevision": "",
            "items": [],
        }

    # JSONファイルを読み込む
    with open(
        OUTPUT_JSON_PATH,
        "r",
        encoding="utf-8",
    ) as f:
        data = json.load(f)

    if not isinstance(data, dict):
        return {
            "schemaVersion": 1,
            "generatedAt": "",
            "spreadsheetRevision": "",
            "items": [],
        }

    return data

''' JSONファイルを保存する関数 '''
def save_json(data):
    os.makedirs(os.path.dirname(OUTPUT_JSON_PATH) or ".", exist_ok=True)
    with open(
        OUTPUT_JSON_PATH,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            data,
            f,
            ensure_ascii=False,
            indent=2,
        )

''' メイン関数 '''
def main():
    sheet_rows = load_sheet()
    revision = calc_revision(sheet_rows)
    musiclist = load_json()

    # スプレッドシートのリビジョンが変わっていない場合は処理をスキップする
    if (musiclist.get("spreadsheetRevision") == revision):
        print("Spreadsheet has not changed. Skip.")
        return

    # 現在のUTC時刻を取得する
    now = utc_now()

    # 既存のアイテムをマップに登録する
    items = musiclist.get("items", [])
    item_map = {}
    for item in items:
        key = create_match_key(
            item.get("title"),
            item.get("artist"),
        )
        item_map[key] = item

    updated_items = []

    # 既存のアイテムを更新する
    for row in sheet_rows:
        no = str(
            row.get("No")
            or row.get("no")
            or ""
        )

        # 曲の情報を取得する
        playable = is_playable(row.get("弾ける曲") or row.get("playable"))
        title = normalize_text(row.get("曲名") or row.get("title"))
        artist = normalize_text(row.get("アーティスト") or row.get("artist"))
        genre = normalize_text(row.get("ジャンル") or row.get("genre"))
        note = normalize_text(row.get("補足") or row.get("note"))

        # 既存のアイテムを検索するためのマッチキーを作成する
        key = create_match_key(title, artist)
        existing = item_map.get(key)

        # 新しい曲の場合は新しいアイテムを作成する
        if existing is None:
            updated_items.append(
                {
                    "no": no,
                    "version": 1,
                    "createdAt": now,
                    "updatedAt": now,
                    "active": True,
                    "playable": playable,
                    "title": title,
                    "artist": artist,
                    "genre": genre,
                    "note": note,
                    "searchWords": [],
                    "artistAliases": [artist],
                    "tags": [],
                }
            )

            continue

        changed = False

        fields = [
            "no",
            "playable",
            "title",
            "artist",
            "genre",
            "note",
        ]

        new_values = {
            "no": no,
            "playable": playable,
            "title": title,
            "artist": artist,
            "genre": genre,
            "note": note,
        }

        # 既存のアイテムのフィールドを更新する
        for field in fields:
            # 既存の値と新しい値が異なる場合は更新する
            if existing.get(field) != new_values[field]:
                changed = True
                existing[field] = new_values[field]

        # 更新があった場合は既存のアイテムのバージョンと更新日時を更新する
        if changed:
            existing["version"] = (
                existing.get("version", 1)
                + 1
            )
            existing["updatedAt"] = now

        updated_items.append(existing)

    # 既存のアイテムをNoでソートする
    updated_items.sort(
        key=lambda x: str(x.get("no", ""))
    )

    # JSONファイルを更新する
    musiclist["generatedAt"] = now
    musiclist["spreadsheetRevision"] = revision
    musiclist["items"] = updated_items

    # JSONファイルを保存する
    save_json(musiclist)

    print(
        f"Updated {len(updated_items)} records."
    )

if __name__ == "__main__":
    main()
