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


def split_key(key):
    parts = key.split("|", 1)

    if len(parts) == 2:
        return parts[0], parts[1]

    return key, ""


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


def main():
    with open(
        OUTPUT_JSON_PATH,
        "r",
        encoding="utf-8",
    ) as f:
        musiclist = json.load(f)

    items = musiclist.get("items", {})
    alias_dictionary = load_alias_dictionary()

    for key, entry in items.items():
        title, artist = split_key(key)

        search_words = (
            entry.get("searchWords")
            or []
        )

        artist_aliases = (
            entry.get("artistAliases")
            or []
        )

        generated_search_words = []

        for value in convert_variants(title, alias_dictionary):
            if value != title:
                generated_search_words.append(value)

        generated_artist_aliases = []

        for value in convert_variants(artist, alias_dictionary):
            if value != artist:
                generated_artist_aliases.append(value)

        entry["searchWords"] = unique(
            search_words
            + generated_search_words
        )

        entry["artistAliases"] = unique(
            artist_aliases
            + generated_artist_aliases
        )

        entry["tags"] = unique(
            entry.get("tags") or []
        )

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
