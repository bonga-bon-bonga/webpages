import json
from pathlib import Path

try:
    from fetch_music_metadata import DEFAULT_METADATA_PATH
except ModuleNotFoundError:  # Support importing as scripts.validate_music_metadata_tags.
    from scripts.fetch_music_metadata import DEFAULT_METADATA_PATH


DEFAULT_TAG_DICTIONARY_PATH = (
    "nemupipiano-musiclist-search/data/dictionary/tag_dictionary.json"
)


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def validate_records(records, tag_dictionary):
    errors = []
    dictionary_groups = {
        ("classification", key): set(values)
        for key, values in tag_dictionary.get("classification", {}).items()
    }
    dictionary_groups.update(
        {
            ("tags", key): set(values)
            for key, values in tag_dictionary.get("tags", {}).items()
        }
    )

    for index, record in enumerate(records):
        label = f"record {index + 1} ({record.get('title', '')} / {record.get('artist', '')})"
        genres = record.get("classification", {}).get("genres", [])
        if len(genres) > 1:
            errors.append(f"{label}: genres must contain at most one value")

        if "cultureTags" in record.get("classification", {}):
            errors.append(f"{label}: cultureTags is not supported")

        for (group, field), allowed_values in dictionary_groups.items():
            values = record.get(group, {}).get(field, [])
            if not isinstance(values, list):
                errors.append(f"{label}: {group}.{field} must be an array")
                continue
            for value in values:
                if value not in allowed_values:
                    errors.append(
                        f"{label}: {group}.{field} contains undefined value '{value}'. "
                        "Check whether an existing dictionary value can be used before adding it."
                    )

        for tie_up in record.get("tieUps", []):
            if not isinstance(tie_up, dict) or set(tie_up) != {
                "series",
                "workTitle",
                "role",
            }:
                errors.append(
                    f"{label}: each tieUp must contain series, workTitle, and role"
                )

    return errors


def main():
    records = load_json(DEFAULT_METADATA_PATH)
    tag_dictionary = load_json(DEFAULT_TAG_DICTIONARY_PATH)
    errors = validate_records(records, tag_dictionary)
    if errors:
        raise SystemExit("\n".join(errors))
    print(f"Validated tags for {len(records)} music metadata records.")


if __name__ == "__main__":
    main()
