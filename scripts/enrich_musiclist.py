# scripts/enrich_musiclist.py
#####################################################
# musiclist.json の各エントリに対して、検索ワードとアーティストのエイリアスを生成して追加するスクリプト
#####################################################
import json
import os

from pykakasi import kakasi

OUTPUT_JSON_PATH = (
    os.environ.get("OUTPUT_JSON_PATH")
    or "nemupipiano-musiclist-search/data/musiclist.json"
)
ARTIST_ALIAS_DICTIONARY_PATH = (
    os.environ.get("ARTIST_ALIAS_DICTIONARY_PATH")
    or "nemupipiano-musiclist-search/data/artist_alias_dictionary.json"
)

kks = kakasi()

''' 重複を排除したリストを返す。'''
def unique(values):
    result = []
    seen = set()

    for value in values:
        value = str(value).strip()

        if not value:
            continue

        key = value.lower()

        if key in seen:
            continue

        seen.add(key)
        result.append(value)

    return result

''' キーを「タイトル|アーティスト」の形式で分割する。'''
def split_key(key):
    parts = key.split("|", 1)

    if len(parts) == 2:
        return parts[0], parts[1]

    return key, ""

''' アーティストのエイリアス辞書を読み込む。'''
def load_alias_dictionary():
    if not os.path.exists(ARTIST_ALIAS_DICTIONARY_PATH):
        return {}

    with open(
        ARTIST_ALIAS_DICTIONARY_PATH,
        "r",
        encoding="utf-8",
    ) as f:
        data = json.load(f)

    if isinstance(data, dict):
        return {
            str(key).strip(): unique(value)
            for key, value in data.items()
            if str(key).strip() and isinstance(value, list)
        }

    if isinstance(data, list):
        aliases = {}
        for item in data:
            if not isinstance(item, dict):
                continue

            for key, value in item.items():
                key = str(key).strip()
                if key and isinstance(value, list):
                    aliases[key] = unique(value)

        return aliases

    return {}

''' 与えられた文字列を変換し、バリエーションのリストを返す。'''
def convert_variants(text, alias_dictionary=None):
    text = str(text).strip()

    if not text:
        return []

    result = [text]
    result.extend((alias_dictionary or {}).get(text, []))

    converted = kks.convert(text)

    hira = "".join(
        item["hira"]
        for item in converted
    )

    kana = "".join(
        item["kana"]
        for item in converted
    )

    hepburn = "".join(
        item["hepburn"]
        for item in converted
    )

    result.extend(
        [
            hira,
            kana,
            hepburn,
            text.lower(),
        ]
    )

    return unique(result)

''' メイン関数 '''
def main():
    # 音楽リストを読み込む
    with open(
        OUTPUT_JSON_PATH,
        "r",
        encoding="utf-8",
    ) as f:
        musiclist = json.load(f)

    # エイリアス辞書を読み込む
    alias_dictionary = load_alias_dictionary()

    # 音楽リストの各エントリを処理する
    items = musiclist.get("items", {})
    for key, entry in items.items():
        title, artist = split_key(key)

        # 既存の検索ワードとアーティストのエイリアスを取得する
        search_words = (
            entry.get("searchWords")
            or []
        )

        # 既存のアーティストのエイリアスを取得する
        artist_aliases = (
            entry.get("artistAliases")
            or []
        )

        # 変換された曲名バリエーションを生成する
        generated_search_words = []
        for value in convert_variants(title, alias_dictionary):
            if value != title:
                generated_search_words.append(value)

        dictionary_artist_aliases = alias_dictionary.get(artist)
        generated_artist_aliases = []
        if dictionary_artist_aliases is None:
            # 変換されたアーティストのバリエーションを生成する
            for value in convert_variants(artist, alias_dictionary):
                if value != artist:
                    generated_artist_aliases.append(value)

        # 既存の検索ワードと生成された検索ワードを統合する
        entry["searchWords"] = unique(
            search_words
            + generated_search_words
        )

        if dictionary_artist_aliases is not None:
            # 辞書にアーティスト名がある場合は、辞書の内容を優先する
            entry["artistAliases"] = unique(dictionary_artist_aliases)
        else:
            # 既存のアーティストのエイリアスと生成されたアーティストのバリエーションを統合する
            entry["artistAliases"] = unique(
                artist_aliases
                + generated_artist_aliases
            )

        # タグを重複排除して更新する
        entry["tags"] = unique(
            entry.get("tags") or []
        )

    # 更新された音楽リストをJSONファイルに書き込む
    with open(
        OUTPUT_JSON_PATH,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            musiclist,
            f,
            ensure_ascii=False,
            indent=2,
        )
        f.write("\n")

    print(
        f"Enriched {len(items)} entries."
    )

if __name__ == "__main__":
    main()
