import json
import os

from pykakasi import kakasi

OUTPUT_JSON_PATH = (
    os.environ.get("OUTPUT_JSON_PATH")
    or "nemupipiano-musiclist-search/data/musiclist.json"
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


def convert_variants(text):
    text = str(text).strip()

    if not text:
        return []

    result = [text]

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

        for value in convert_variants(title):
            if value != title:
                generated_search_words.append(value)

        generated_artist_aliases = []

        for value in convert_variants(artist):
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
