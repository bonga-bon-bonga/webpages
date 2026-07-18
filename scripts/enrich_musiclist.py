import json
import os

try:
    from sudachipy import Dictionary, SplitMode  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    Dictionary = None
    SplitMode = None

OUTPUT_JSON_PATH = (
    os.environ.get("OUTPUT_JSON_PATH")
    or "nemupipiano-musiclist-search/data/musiclist.json"
)
ARTIST_ALIAS_DICTIONARY_PATH = (
    os.environ.get("ARTIST_ALIAS_DICTIONARY_PATH")
    or "nemupipiano-musiclist-search/data/dictionary/artist_alias_dictionary.json"
)
MUSIC_ALIAS_DICTIONARY_PATH = (
    os.environ.get("MUSIC_ALIAS_DICTIONARY_PATH")
    or "nemupipiano-musiclist-search/data/dictionary/music_alias_dictionary.json"
)

''' ユニークな値のリストを作成する関数'''
def unique(values):
    result = []
    seen = set()

    # 値をループして、空白を削除し、重複を排除する
    for value in values:
        value = str(value or "").strip()
        if not value:
            continue

        key = value.lower()
        if key in seen:
            continue

        seen.add(key)
        result.append(value)

    return result


def normalize_tags(value):
    if isinstance(value, dict):
        return {
            str(key): unique(tag_values)
            if isinstance(tag_values, list)
            else tag_values
            for key, tag_values in value.items()
        }

    if isinstance(value, list):
        return unique(value)

    return {}

''' キーを分割する関数'''
def split_key(key):
    parts = key.split("|", 1)
    if len(parts) == 2:
        return parts[0], parts[1]

    return key, ""

''' カタカナをひらがなに変換する関数'''
def katakana_to_hiragana(text):
    converted = []
    for char in text:
        code = ord(char)
        if 0x30A1 <= code <= 0x30F6:
            converted.append(chr(code - 0x60))
        else:
            converted.append(char)

    return "".join(converted)

''' エイリアス辞書を読み込む関数'''
def load_alias_dictionary(path):
    if not os.path.exists(path):
        return {}

    # JSONファイルを読み込む
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 辞書形式のJSONを処理する
    if isinstance(data, dict):
        return {
            str(key).strip(): unique(value)
            for key, value in data.items()
            if str(key).strip() and isinstance(value, list)
        }

    # リスト形式のJSONを処理する
    if isinstance(data, list):
        aliases = {}
        for item in data:
            if not isinstance(item, dict):
                continue

            # 辞書形式のアイテムを処理する
            for key, value in item.items():
                key = str(key).strip()
                if key and isinstance(value, list):
                    aliases[key] = unique(value)

        return aliases

    return {}

''' SudachiPyのトークナイザーを作成する関数。SudachiPyがインストールされていない場合はエラーを発生させる。'''
def create_tokenizer():
    if Dictionary is None or SplitMode is None:
        raise RuntimeError("SudachiPy is required. Install SudachiPy and sudachidict_core.")

    return Dictionary(dict="core").create()

''' SudachiPyを使用してテキストの読みを取得する関数。読みが取得できない場合は表層形を使用する。'''
def sudachi_readings(text, tokenizer):
    tokens = tokenizer.tokenize(text, SplitMode.C)
    readings = []
    normalized = []

    # SudachiPyのトークンをループして、読みと正規化された形を取得する
    for token in tokens:
        reading = token.reading_form()
        if reading == "*":
            reading = token.surface()
        readings.append(reading)
        normalized.append(token.normalized_form())

    kana = "".join(readings)
    hira = katakana_to_hiragana(kana)
    normalized_text = "".join(normalized)

    return [hira, kana, normalized_text]

''' 変換バリアントを生成する関数。エイリアス辞書とSudachiPyの読みを使用して、テキストのバリエーションを生成する。'''
def convert_variants(text, tokenizer, alias_dictionary=None):
    text = str(text or "").strip()
    if not text:
        return []

    result = [text]
    result.extend((alias_dictionary or {}).get(text, []))
    result.extend(sudachi_readings(text, tokenizer))
    result.append(text.lower())

    return unique(result)

''' 音楽リストを読み込む関数。リスト形式または辞書形式のJSONをサポートする。'''
def load_musiclist():
    with open(OUTPUT_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # リスト形式のJSONをそのまま返す
    if isinstance(data, list):
        return data, "list"

    # 辞書形式のJSONをリスト形式に変換する
    if isinstance(data, dict) and isinstance(data.get("items"), dict):
        items = []
        for key, value in data["items"].items():
            title, artist = split_key(str(key))
            entry = value if isinstance(value, dict) else {}
            items.append(
                {
                    "displayTitle": title,
                    "displayArtist": artist,
                    "songKey": key,
                    "titleSearchWords": entry.get("titleSearchWords")
                    or entry.get("searchWords")
                    or [],
                    "artistSearchWords": entry.get("artistSearchWords")
                    or entry.get("artistAliases")
                    or [],
                    "tags": entry.get("tags") or [],
                }
            )

        return items, "list"

    raise ValueError("Unsupported musiclist.json format")

''' タイトルを取得する関数'''
def entry_title(entry):
    return str(entry.get("displayTitle") or entry.get("sourceTitle") or entry.get("title") or "").strip()

''' アーティスト名を取得する関数'''
def entry_artist(entry):
    return str(entry.get("displayArtist") or entry.get("sourceArtist") or entry.get("artist") or "").strip()

''' 辞書から値を取得する関数。複数のキーを指定でき、最初に見つかった値を返す。'''
def dictionary_values(dictionary, *keys):
    for key in keys:
        key = str(key or "").strip()
        if key in dictionary:
            return dictionary[key]

    return None

''' メイン関数。音楽リストを読み込み、タイトルとアーティスト名の検索ワードを生成し、結果を出力する。'''
def main():
    tokenizer = create_tokenizer()
    musiclist, _ = load_musiclist()
    artist_alias_dictionary = load_alias_dictionary(ARTIST_ALIAS_DICTIONARY_PATH)
    music_alias_dictionary = load_alias_dictionary(MUSIC_ALIAS_DICTIONARY_PATH)

    for entry in musiclist:
        if not isinstance(entry, dict):
            continue

        title = entry_title(entry)
        artist = entry_artist(entry)
        source_title = entry.get("sourceTitle")
        source_artist = entry.get("sourceArtist")
        title_search_words = entry.get("titleSearchWords") or entry.get("searchWords") or []
        artist_search_words = entry.get("artistSearchWords") or entry.get("artistAliases") or []

        # タイトルの検索ワードを生成する
        dictionary_title_words = dictionary_values(music_alias_dictionary, title, source_title)
        if dictionary_title_words is not None:
            entry["titleSearchWords"] = unique(title_search_words + dictionary_title_words)
        else:
            generated_title_words = [
                value
                for value in convert_variants(title, tokenizer, music_alias_dictionary)
                if value != title
            ]
            entry["titleSearchWords"] = unique(title_search_words + generated_title_words)

        # アーティストの検索ワードを生成する
        artist_dictionary_keys = [artist]
        if entry.get("includeSourceArtistInSearch") is not False:
            artist_dictionary_keys.append(source_artist)
        dictionary_artist_words = dictionary_values(
            artist_alias_dictionary,
            *artist_dictionary_keys,
        )
        if dictionary_artist_words is not None:
            entry["artistSearchWords"] = unique(dictionary_artist_words)
        else:
            generated_artist_words = [
                value
                for value in convert_variants(artist, tokenizer, artist_alias_dictionary)
                if value != artist
            ]
            entry["artistSearchWords"] = unique(artist_search_words + generated_artist_words)

        entry["tags"] = normalize_tags(entry.get("tags"))

        # 不要なフィールドを削除する
        entry.pop("searchWords", None)
        entry.pop("artistAliases", None)

    # 出力ファイルに書き込む
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(musiclist, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Enriched {len(musiclist)} entries.")


if __name__ == "__main__":
    main()
