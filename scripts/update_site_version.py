import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SITE_DIR = ROOT / "nemupipiano-musiclist-search"
VERSION_FILE = SITE_DIR / "version.json"
INDEX_FILE = SITE_DIR / "index.html"
VERSION_PATTERN = re.compile(r"^\d+\.\d+\.\d+$")

INDEX_REPLACEMENTS = (
    (
        re.compile(r'(musiclist-search\.css\?v=)[^"\s]+'),
        lambda version: rf"\g<1>{version}",
        "CSS cache version",
    ),
    (
        re.compile(r'(<p>ver\.)\d+\.\d+\.\d+(\s)'),
        lambda version: rf"\g<1>{version}\g<2>",
        "footer version",
    ),
    (
        re.compile(r'(musiclist-search\.js\?v=)[^"\s]+'),
        lambda version: rf"\g<1>{version}",
        "JavaScript cache version",
    ),
)


def validate_version(version):
    value = str(version or "").strip()
    if not VERSION_PATTERN.fullmatch(value):
        raise ValueError(f"Version must use x.y.z format: {version!r}")
    return value


def load_version(path=VERSION_FILE):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return validate_version(data.get("version"))


def render_index(index_text, version):
    version = validate_version(version)
    rendered = index_text
    for pattern, replacement, label in INDEX_REPLACEMENTS:
        rendered, count = pattern.subn(replacement(version), rendered)
        if count != 1:
            raise ValueError(f"Expected exactly one {label}, found {count}")
    return rendered


def write_version(version, path=VERSION_FILE):
    version = validate_version(version)
    Path(path).write_text(
        json.dumps({"version": version}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def sync_index(version, index_path=INDEX_FILE, check=False):
    path = Path(index_path)
    current = path.read_text(encoding="utf-8")
    rendered = render_index(current, version)
    if check:
        if rendered != current:
            raise ValueError(
                f"{path} is not synchronized with version {version}. "
                "Run scripts/update_site_version.py."
            )
        return False
    if rendered == current:
        return False
    path.write_text(rendered, encoding="utf-8")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Update the music list site's version source and HTML references."
    )
    parser.add_argument("version", nargs="?", help="New version in x.y.z format")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when index.html does not match version.json",
    )
    args = parser.parse_args()

    if args.check and args.version:
        parser.error("version cannot be combined with --check")

    if args.version:
        version = validate_version(args.version)
        write_version(version)
    else:
        version = load_version()

    sync_index(version, check=args.check)
    print(f"Site version is synchronized: {version}")


if __name__ == "__main__":
    main()
