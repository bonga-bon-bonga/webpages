import hashlib
import json
import os


def calculate_table_hash(table):
    """Return a stable SHA-256 hash for a Google Visualization table."""
    payload = json.dumps(
        table,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def has_unchanged_input(hash_path, current_hash, output_path):
    if not os.path.exists(output_path) or not os.path.exists(hash_path):
        return False

    with open(hash_path, "r", encoding="utf-8") as f:
        previous_hash = f.read().strip()

    return bool(previous_hash) and previous_hash == current_hash


def save_hash(hash_path, current_hash):
    os.makedirs(os.path.dirname(hash_path) or ".", exist_ok=True)
    with open(hash_path, "w", encoding="utf-8") as f:
        f.write(f"{current_hash}\n")
