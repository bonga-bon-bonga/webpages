from fetch_music_metadata import (
    DEFAULT_METADATA_PATH,
    load_metadata_records,
    save_json_atomic,
)


def main():
    records = load_metadata_records(DEFAULT_METADATA_PATH)
    save_json_atomic(DEFAULT_METADATA_PATH, records)
    print(f"Migrated {len(records)} music metadata records.")


if __name__ == "__main__":
    main()
