import argparse
import json
import os
import re
import tempfile
import time
import unicodedata
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ITUNES_SEARCH_URL = "https://itunes.apple.com/search"
DEFAULT_MUSICLIST_PATH = "nemupipiano-musiclist-search/data/musiclist.json"
DEFAULT_METADATA_PATH = (
    "nemupipiano-musiclist-search/data/dictionary/music_metadata.json"
)
DEFAULT_OVERRIDES_PATH = (
    "nemupipiano-musiclist-search/data/dictionary/search-overrides.json"
)
REQUEST_INTERVAL_SECONDS = 1.0
MAX_RETRIES = 4
RETRYABLE_HTTP_STATUSES = {429, 500, 502, 503, 504}
REFRESH_STATUSES = ("not_found", "needs_review")
MANUAL_MATCH_STATUS = "manual"
JST = timezone(timedelta(hours=9))

GENRE_ALIASES = {
    "pop": "ポップス",
    "ポップ": "ポップス",
    "anime": "アニメ",
    "アニメ": "アニメ",
    "tv soundtrack": "サウンドトラック",
    "tv サウンドトラック": "サウンドトラック",
    "チルドレン・ミュージック": "キッズ",
}
IGNORED_PROVIDER_GENRES = {
    "ミュージック",
    "ヴォーカル",
    "インストゥルメンタル",
    "テレビゲーム",
}

FEATURE_CLAUSE_PATTERN = re.compile(
    r"\s*[\(\[（【]\s*(?:feat(?:uring)?\.?|with)\b.*?[\)\]）】]\s*$",
    re.IGNORECASE,
)
ALTERNATE_VERSION_PATTERNS = (
    re.compile(r"\binstrumental\b", re.IGNORECASE),
    re.compile(r"\boff[\s_-]*vocal\b", re.IGNORECASE),
    re.compile(r"\bkaraoke\b", re.IGNORECASE),
    re.compile(r"\blive\b", re.IGNORECASE),
    re.compile(r"\bremix(?:ed)?\b", re.IGNORECASE),
    re.compile(r"\bremaster(?:ed)?\b", re.IGNORECASE),
    re.compile(r"\bcover\b", re.IGNORECASE),
    re.compile(r"\btv[\s_-]*size\b", re.IGNORECASE),
    re.compile(r"\bshort[\s_-]*(?:ver(?:sion)?\.?)\b", re.IGNORECASE),
    re.compile(r"\bacoustic\b", re.IGNORECASE),
    re.compile(r"\bpiano[\s_-]*(?:ver(?:sion)?\.?)\b", re.IGNORECASE),
    re.compile(r"(?<!\d)(?:19|20)\d{2}(?!\d)", re.IGNORECASE),
)


def normalize_match_text(value):
    text = unicodedata.normalize("NFKC", str(value or ""))
    return " ".join(text.strip().split()).casefold()


def normalize_variant_text(value, *, title=False):
    text = unicodedata.normalize("NFKC", str(value or "")).casefold().strip()
    if title:
        text = FEATURE_CLAUSE_PATTERN.sub("", text)
    text = re.sub(r"\b(?:feat(?:uring)?\.?|with)\b", "", text)
    text = re.sub(r"[&×・/／+＋,，:：;；'\"`´’‘“”._\-‐‑‒–—―~〜～]", "", text)
    text = re.sub(r"[\s\(\)\[\]{}（）【】「」『』]+", "", text)
    return text


def metadata_key(title, artist):
    return normalize_match_text(title), normalize_match_text(artist)


def parse_release_date(value):
    text = str(value or "").strip()
    return text[:10] if len(text) >= 10 else None


def alternate_version_markers(value):
    text = unicodedata.normalize("NFKC", str(value or ""))
    return {
        pattern.pattern
        for pattern in ALTERNATE_VERSION_PATTERNS
        if pattern.search(text)
    }


def is_unrequested_alternate_version(candidate_title, requested_title):
    return bool(alternate_version_markers(candidate_title) - alternate_version_markers(requested_title))


def empty_metadata(
    match_status,
    match_strategy="not_found",
    candidate_count=0,
    candidate_release_dates=None,
    review_reasons=None,
):
    return {
        "releaseDate": None,
        "releaseYear": None,
        "decade": None,
        "genre": None,
        "durationSeconds": None,
        "collectionName": None,
        "itunesTrackId": None,
        "matchStatus": match_status,
        "matchStrategy": match_strategy,
        "candidateCount": candidate_count,
        "candidateReleaseDates": candidate_release_dates or [],
        "reviewReason": review_reasons or [],
        "source": "itunes",
    }


def metadata_from_candidate(
    candidate,
    match_status,
    match_strategy,
    candidate_count,
    candidate_release_dates,
    review_reasons,
):
    # iTunes releaseDate may describe a reissue or compilation, not the song's first release.
    release_date = parse_release_date(candidate.get("releaseDate"))
    release_year = int(release_date[:4]) if release_date else None
    duration_millis = candidate.get("trackTimeMillis")
    duration_seconds = (
        int(round(float(duration_millis) / 1000))
        if isinstance(duration_millis, (int, float))
        else None
    )

    metadata = empty_metadata(
        match_status,
        match_strategy,
        candidate_count,
        candidate_release_dates,
        review_reasons,
    )
    metadata.update(
        {
            "releaseDate": release_date,
            "releaseYear": release_year,
            "decade": f"{release_year // 10 * 10}年代" if release_year else None,
            "genre": candidate.get("primaryGenreName") or None,
            "durationSeconds": duration_seconds,
            "collectionName": candidate.get("collectionName") or None,
            "itunesTrackId": candidate.get("trackId"),
        }
    )
    return metadata


def deduplicate_results(results):
    deduplicated = []
    seen = set()
    for result in results:
        if not isinstance(result, dict):
            continue
        track_id = result.get("trackId")
        key = (
            ("trackId", track_id)
            if track_id is not None
            else (
                "fields",
                normalize_match_text(result.get("trackName")),
                normalize_match_text(result.get("artistName")),
                normalize_match_text(result.get("collectionName")),
                parse_release_date(result.get("releaseDate")),
                result.get("kind"),
            )
        )
        if key in seen:
            continue
        seen.add(key)
        deduplicated.append(result)
    return deduplicated


def _candidate_sort_key(candidate):
    return (
        parse_release_date(candidate.get("releaseDate")) or "9999-99-99",
        candidate.get("trackId") or 0,
    )


def _selection_metadata(matches, title, artist, strategy, normalized, override_used):
    matches.sort(key=_candidate_sort_key)
    selected = matches[0]
    release_dates_with_missing = [
        parse_release_date(candidate.get("releaseDate")) for candidate in matches
    ]
    candidate_release_dates = sorted(
        {release_date for release_date in release_dates_with_missing if release_date}
    )
    review_reasons = []

    if len(candidate_release_dates) > 1:
        review_reasons.append("multiple_release_dates")
    if any(release_date is None for release_date in release_dates_with_missing):
        review_reasons.append("missing_release_date")
    if normalized:
        review_reasons.append("normalized_match")
        if normalize_match_text(selected.get("trackName")) != normalize_match_text(title):
            review_reasons.append("title_not_exact")
        if normalize_match_text(selected.get("artistName")) != normalize_match_text(artist):
            review_reasons.append("artist_not_exact")
    if override_used:
        review_reasons.append("search_override_used")

    match_status = "needs_review" if review_reasons else "auto_matched"
    return metadata_from_candidate(
        selected,
        match_status,
        strategy,
        len(matches),
        candidate_release_dates,
        review_reasons,
    )


def match_candidates(results, title, artist, strategy_prefix, override_used=False):
    songs = [
        result
        for result in deduplicate_results(results)
        if result.get("kind") == "song"
        and not is_unrequested_alternate_version(result.get("trackName"), title)
    ]
    exact_matches = [
        result
        for result in songs
        if normalize_match_text(result.get("trackName")) == normalize_match_text(title)
        and normalize_match_text(result.get("artistName")) == normalize_match_text(artist)
    ]
    if exact_matches:
        strategy = "override_exact" if override_used else f"{strategy_prefix}_exact"
        return _selection_metadata(
            exact_matches,
            title,
            artist,
            strategy,
            normalized=False,
            override_used=override_used,
        )

    normalized_matches = [
        result
        for result in songs
        if normalize_variant_text(result.get("trackName"), title=True)
        == normalize_variant_text(title, title=True)
        and normalize_variant_text(result.get("artistName"))
        == normalize_variant_text(artist)
    ]
    if normalized_matches:
        strategy = "override_normalized" if override_used else f"{strategy_prefix}_normalized"
        return _selection_metadata(
            normalized_matches,
            title,
            artist,
            strategy,
            normalized=True,
            override_used=override_used,
        )

    return None


class ITunesSearchClient:
    def __init__(
        self,
        opener=urlopen,
        sleep=time.sleep,
        monotonic=time.monotonic,
        request_interval=REQUEST_INTERVAL_SECONDS,
        max_retries=MAX_RETRIES,
    ):
        self.opener = opener
        self.sleep = sleep
        self.monotonic = monotonic
        self.request_interval = request_interval
        self.max_retries = max_retries
        self.last_request_at = None

    def search(self, term, attribute=None):
        parameters = {
            "term": term,
            "country": "JP",
            "media": "music",
            "entity": "musicTrack",
            "limit": 25,
        }
        if attribute:
            parameters["attribute"] = attribute
        request = Request(
            f"{ITUNES_SEARCH_URL}?{urlencode(parameters)}",
            headers={"User-Agent": "nemupipiano-musiclist-search/1.0"},
        )

        for attempt in range(self.max_retries + 1):
            try:
                self._wait_for_request_interval()
                with self.opener(request, timeout=30) as response:
                    payload = json.loads(response.read().decode("utf-8"))
                results = payload.get("results", [])
                return deduplicate_results(results if isinstance(results, list) else [])
            except HTTPError as error:
                if error.code not in RETRYABLE_HTTP_STATUSES or attempt >= self.max_retries:
                    raise
                retry_after = error.headers.get("Retry-After") if error.headers else None
                self.sleep(self._retry_delay(attempt, retry_after))
            except URLError:
                if attempt >= self.max_retries:
                    raise
                self.sleep(self._retry_delay(attempt))

        return []

    def _wait_for_request_interval(self):
        now = self.monotonic()
        if self.last_request_at is not None:
            remaining = self.request_interval - (now - self.last_request_at)
            if remaining > 0:
                self.sleep(remaining)
        self.last_request_at = self.monotonic()

    @staticmethod
    def _retry_delay(attempt, retry_after=None):
        try:
            server_delay = float(retry_after) if retry_after is not None else 0
        except (TypeError, ValueError):
            server_delay = 0
        return max(2**attempt, server_delay)


def search_song(client, title, artist, override=None):
    search_steps = [
        (f"{artist} {title}", None, title, artist, "primary", False),
        (title, "songTerm", title, artist, "title_fallback", False),
    ]
    if override:
        override_title = override["title"]
        override_artist = override["artist"]
        search_steps.extend(
            [
                (
                    f"{override_artist} {override_title}",
                    None,
                    override_title,
                    override_artist,
                    "override",
                    True,
                ),
                (
                    override_title,
                    "songTerm",
                    override_title,
                    override_artist,
                    "override",
                    True,
                ),
            ]
        )

    for term, attribute, match_title, match_artist, strategy, override_used in search_steps:
        results = client.search(term, attribute=attribute)
        metadata = match_candidates(
            results,
            match_title,
            match_artist,
            strategy,
            override_used=override_used,
        )
        if metadata is not None:
            return metadata

    return empty_metadata("not_found", review_reasons=["not_found"])


def load_json(path, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_search_overrides(path):
    if not os.path.exists(path):
        return {}
    try:
        data = load_json(path, {})
    except json.JSONDecodeError as error:
        raise ValueError(f"Invalid JSON in search overrides: {path}: {error}") from error

    if not isinstance(data, dict) or not isinstance(data.get("songOverrides"), dict):
        raise ValueError("search-overrides.json must contain a songOverrides object")

    overrides = {}
    for raw_key, value in data["songOverrides"].items():
        if not isinstance(raw_key, str) or "|" not in raw_key:
            raise ValueError("Each search override key must use '<title>|<artist>' format")
        if not isinstance(value, dict) or set(value) != {"title", "artist"}:
            raise ValueError("Each search override must contain only title and artist")
        if not isinstance(value["title"], str) or not isinstance(value["artist"], str):
            raise ValueError("Search override title and artist must be strings")
        if not value["title"].strip() or not value["artist"].strip():
            raise ValueError("Search override title and artist must not be empty")
        title, artist = raw_key.split("|", 1)
        key = metadata_key(title, artist)
        if key in overrides:
            raise ValueError(f"Duplicate normalized search override key: {raw_key}")
        overrides[key] = {
            "title": value["title"].strip(),
            "artist": value["artist"].strip(),
        }
    return overrides


def save_json_atomic(path, data):
    directory = os.path.dirname(path) or "."
    os.makedirs(directory, exist_ok=True)
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            dir=directory,
            prefix=f".{os.path.basename(path)}.",
            suffix=".tmp",
            delete=False,
        ) as temporary_file:
            temporary_path = temporary_file.name
            json.dump(data, temporary_file, ensure_ascii=False, indent=2)
            temporary_file.write("\n")
            temporary_file.flush()
            os.fsync(temporary_file.fileno())
        os.replace(temporary_path, path)
    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.unlink(temporary_path)


def load_metadata_records(path):
    data = load_json(path, [])
    if not isinstance(data, list):
        raise ValueError(f"Metadata file must contain a JSON array: {path}")
    return [
        migrate_record_schema(record)
        for record in data
        if isinstance(record, dict)
    ]


def _string_list(value):
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _migrate_tie_ups(value):
    if not isinstance(value, list):
        return []
    tie_ups = []
    for item in value:
        if isinstance(item, dict):
            series = str(item.get("series") or "").strip()
            work_title = str(item.get("workTitle") or "").strip()
            role = str(item.get("role") or "").strip()
        else:
            series = ""
            work_title = str(item or "").strip()
            role = ""
        if work_title:
            tie_ups.append(
                {"series": series, "workTitle": work_title, "role": role}
            )
    return tie_ups


def _provider_genre_classification(value):
    genre = str(value or "").strip()
    normalized = normalize_match_text(genre)
    source_category_map = {
        "anime": "アニメ",
        "アニメ": "アニメ",
        "game": "ゲーム",
        "games": "ゲーム",
        "ゲーム": "ゲーム",
    }
    source_categories = (
        [source_category_map[normalized]] if normalized in source_category_map else []
    )
    canonical_genre = GENRE_ALIASES.get(normalized, genre)
    if genre in IGNORED_PROVIDER_GENRES:
        canonical_genre = ""
    return ([canonical_genre] if canonical_genre else []), source_categories


def migrate_record_schema(record):
    """Convert legacy metadata records while preserving manual extensions."""
    record = record if isinstance(record, dict) else {}
    legacy_metadata = record.get("metadata")
    legacy_metadata = legacy_metadata if isinstance(legacy_metadata, dict) else {}
    existing_classification = record.get("classification")
    existing_classification = (
        existing_classification if isinstance(existing_classification, dict) else {}
    )
    existing_tags = record.get("tags")
    existing_tags = existing_tags if isinstance(existing_tags, dict) else {}
    existing_source = record.get("source")
    existing_source = existing_source if isinstance(existing_source, dict) else {}

    legacy_metadata_keys = {
        "releaseDate",
        "releaseYear",
        "releaseDecade",
        "decade",
        "genre",
        "durationSeconds",
        "collectionName",
        "itunesTrackId",
        "matchStatus",
        "matchStrategy",
        "candidateCount",
        "candidateReleaseDates",
        "reviewReason",
        "source",
    }
    metadata_extensions = {
        key: value
        for key, value in legacy_metadata.items()
        if key not in legacy_metadata_keys
    }

    legacy_genre = str(legacy_metadata.get("genre") or "").strip()
    generated_genres, generated_source_categories = _provider_genre_classification(
        legacy_genre
    )
    existing_genres = _string_list(existing_classification.get("genres"))
    genres = []
    for existing_genre in existing_genres:
        canonical_genres, _ = _provider_genre_classification(existing_genre)
        if canonical_genres:
            genres = canonical_genres[:1]
            break
    if not genres and legacy_genre:
        genres = generated_genres
    source_categories = _string_list(
        existing_classification.get("sourceCategories")
    ) or generated_source_categories

    legacy_tie_ups = existing_tags.get("tieUps")
    tie_ups = record.get("tieUps")
    if not isinstance(tie_ups, list):
        tie_ups = legacy_tie_ups

    known_top_level_keys = {
        "title",
        "artist",
        "metadata",
        "classification",
        "tags",
        "tieUps",
        "source",
        "status",
        "generatedAt",
    }
    top_level_extensions = {
        key: value for key, value in record.items() if key not in known_top_level_keys
    }

    return {
        "title": str(record.get("title") or "").strip(),
        "artist": str(record.get("artist") or "").strip(),
        "metadata": {
            **metadata_extensions,
            "releaseDate": legacy_metadata.get("releaseDate"),
            "releaseDecade": legacy_metadata.get("releaseDecade")
            or legacy_metadata.get("decade"),
            "durationSeconds": legacy_metadata.get("durationSeconds"),
            "collectionName": legacy_metadata.get("collectionName"),
        },
        "classification": {
            **{
                key: value
                for key, value in existing_classification.items()
                if key != "cultureTags"
            },
            "genres": genres,
            "subgenres": _string_list(existing_classification.get("subgenres")),
            "sourceCategories": source_categories,
            "vocalTypes": _string_list(existing_classification.get("vocalTypes"))
            or (["インスト"] if legacy_genre == "インストゥルメンタル" else []),
        },
        "tags": {
            **{
                key: value
                for key, value in existing_tags.items()
                if key not in {"tieUps", "sceneTags"}
            },
            "themeTags": _string_list(existing_tags.get("themeTags")),
            "moodTags": _string_list(existing_tags.get("moodTags")),
        },
        "tieUps": _migrate_tie_ups(tie_ups),
        "source": {
            **existing_source,
            "provider": existing_source.get("provider")
            or legacy_metadata.get("source")
            or "itunes",
            "trackId": existing_source.get("trackId")
            if "trackId" in existing_source
            else legacy_metadata.get("itunesTrackId"),
        },
        "status": record.get("status")
        or legacy_metadata.get("matchStatus")
        or "not_found",
        "generatedAt": record.get("generatedAt"),
        **top_level_extensions,
    }


def musiclist_pairs(path):
    data = load_json(path, [])
    if not isinstance(data, list):
        raise ValueError(f"Music list must contain a JSON array: {path}")

    pairs = []
    seen = set()
    for item in data:
        if not isinstance(item, dict):
            continue
        title = str(item.get("displayTitle") or item.get("sourceTitle") or "").strip()
        artist = str(item.get("displayArtist") or item.get("sourceArtist") or "").strip()
        if (not title or not artist) and isinstance(item.get("songKey"), str):
            title, separator, artist = item["songKey"].partition("|")
            if not separator:
                artist = ""
        if not title or not artist:
            continue
        key = metadata_key(title, artist)
        if key in seen:
            continue
        seen.add(key)
        pairs.append((title, artist))
    return pairs


def build_record(title, artist, metadata, existing_record=None, now=None):
    existing_record = migrate_record_schema(existing_record or {})
    existing_metadata = existing_record["metadata"]
    existing_classification = existing_record["classification"]
    generated_genre = str(metadata.get("genre") or "").strip()
    generated_genres, generated_source_categories = _provider_genre_classification(
        generated_genre
    )
    genres = existing_classification["genres"] or generated_genres
    source_categories = (
        existing_classification["sourceCategories"] or generated_source_categories
    )
    generated_at = (now or datetime.now(JST)).astimezone(JST).isoformat(timespec="seconds")
    return {
        **existing_record,
        "title": title,
        "artist": artist,
        "metadata": {
            **existing_metadata,
            "releaseDate": metadata.get("releaseDate"),
            "releaseDecade": metadata.get("decade"),
            "durationSeconds": metadata.get("durationSeconds"),
            "collectionName": metadata.get("collectionName"),
        },
        "classification": {
            **existing_classification,
            "genres": genres,
            "sourceCategories": source_categories,
        },
        "source": {
            **existing_record["source"],
            "provider": metadata.get("source") or "itunes",
            "trackId": metadata.get("itunesTrackId"),
        },
        "status": metadata.get("matchStatus") or "not_found",
        "generatedAt": generated_at,
    }


def update_metadata(
    pairs,
    metadata_path,
    client,
    overrides=None,
    refresh=False,
    refresh_status=None,
    now=None,
):
    records = load_metadata_records(metadata_path)
    index = {
        metadata_key(record.get("title"), record.get("artist")): position
        for position, record in enumerate(records)
    }
    overrides = overrides or {}
    requested = 0
    skipped = 0

    for title, artist in pairs:
        key = metadata_key(title, artist)
        existing_position = index.get(key)
        existing_record = records[existing_position] if existing_position is not None else None
        existing_status = existing_record.get("status") if existing_record else None
        if existing_status == MANUAL_MATCH_STATUS:
            should_fetch = False
        elif refresh_status:
            should_fetch = existing_position is not None and existing_status == refresh_status
        else:
            should_fetch = refresh or existing_position is None
        if not should_fetch:
            skipped += 1
            continue

        metadata = search_song(client, title, artist, overrides.get(key))
        record = build_record(title, artist, metadata, existing_record, now=now)
        if existing_position is None:
            index[key] = len(records)
            records.append(record)
        else:
            records[existing_position] = record
        save_json_atomic(metadata_path, records)
        requested += 1

    return requested, skipped


def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        description="Fetch song metadata from the iTunes Search API."
    )
    parser.add_argument("--title", help="Song title")
    parser.add_argument("--artist", help="Artist name")
    refresh_group = parser.add_mutually_exclusive_group()
    refresh_group.add_argument(
        "--refresh",
        action="store_true",
        help="Fetch metadata again even when a cached record exists.",
    )
    refresh_group.add_argument(
        "--refresh-status",
        choices=REFRESH_STATUSES,
        help="Fetch cached records again only when status has this value.",
    )
    args = parser.parse_args(argv)
    if bool(args.title) != bool(args.artist):
        parser.error("--title and --artist must be specified together")
    return args


def main(argv=None):
    args = parse_args(argv)
    pairs = (
        [(args.title.strip(), args.artist.strip())]
        if args.title and args.artist
        else musiclist_pairs(DEFAULT_MUSICLIST_PATH)
    )
    overrides = load_search_overrides(DEFAULT_OVERRIDES_PATH)
    client = ITunesSearchClient()
    requested, skipped = update_metadata(
        pairs,
        DEFAULT_METADATA_PATH,
        client,
        overrides=overrides,
        refresh=args.refresh,
        refresh_status=args.refresh_status,
    )
    print(f"Fetched {requested} records. Skipped {skipped} cached records.")


if __name__ == "__main__":
    main()
