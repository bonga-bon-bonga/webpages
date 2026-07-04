import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import Mock
from urllib.parse import parse_qs, urlparse

from scripts.fetch_music_metadata import (
    ITunesSearchClient,
    build_record,
    empty_metadata,
    load_search_overrides,
    match_candidates,
    migrate_record_schema,
    parse_args,
    search_song,
    update_metadata,
)


JST = timezone(timedelta(hours=9))
FIXED_NOW = datetime(2026, 6, 27, 12, 0, 0, tzinfo=JST)


def candidate(track_id, release_date="2012-02-01T12:00:00Z", **overrides):
    result = {
        "kind": "song",
        "artistName": "ClariS",
        "trackName": "ナイショの話",
        "releaseDate": release_date,
        "primaryGenreName": "Anime",
        "trackTimeMillis": 261000,
        "collectionName": "ナイショの話 - EP",
        "trackId": track_id,
    }
    result.update(overrides)
    return result


class FakeClient:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def search(self, term, attribute=None):
        self.calls.append((term, attribute))
        return self.responses.pop(0)


class CandidateMatchingTests(unittest.TestCase):
    def test_single_exact_match(self):
        metadata = match_candidates(
            [candidate(1)], "ナイショの話", "ClariS", "primary"
        )
        self.assertEqual(metadata["matchStatus"], "auto_matched")
        self.assertEqual(metadata["matchStrategy"], "primary_exact")
        self.assertEqual(metadata["durationSeconds"], 261)

    def test_multiple_exact_matches_with_same_release_date(self):
        metadata = match_candidates(
            [candidate(2), candidate(1)], "ナイショの話", "ClariS", "primary"
        )
        self.assertEqual(metadata["matchStatus"], "auto_matched")
        self.assertEqual(metadata["candidateCount"], 2)
        self.assertEqual(metadata["itunesTrackId"], 1)

    def test_different_release_dates_need_review_and_use_oldest(self):
        metadata = match_candidates(
            [candidate(2, "2015-01-01T00:00:00Z"), candidate(1)],
            "ナイショの話",
            "ClariS",
            "primary",
        )
        self.assertEqual(metadata["matchStatus"], "needs_review")
        self.assertIn("multiple_release_dates", metadata["reviewReason"])
        self.assertEqual(metadata["releaseDate"], "2012-02-01")

    def test_missing_release_date_needs_review(self):
        metadata = match_candidates(
            [candidate(1), candidate(2, None)], "ナイショの話", "ClariS", "primary"
        )
        self.assertEqual(metadata["matchStatus"], "needs_review")
        self.assertIn("missing_release_date", metadata["reviewReason"])

    def test_artist_join_notation_difference_needs_review(self):
        metadata = match_candidates(
            [candidate(1, artistName="LiSA & Uru", trackName="再会")],
            "再会",
            "LiSA×Uru",
            "primary",
        )
        self.assertEqual(metadata["matchStatus"], "needs_review")
        self.assertEqual(metadata["matchStrategy"], "primary_normalized")
        self.assertIn("artist_not_exact", metadata["reviewReason"])

    def test_trailing_feature_difference_needs_review(self):
        metadata = match_candidates(
            [candidate(1, trackName="点描の唄 (feat. 井上苑子)", artistName="Mrs. GREEN APPLE")],
            "点描の唄",
            "Mrs. GREEN APPLE",
            "title_fallback",
        )
        self.assertEqual(metadata["matchStatus"], "needs_review")
        self.assertIn("title_not_exact", metadata["reviewReason"])

    def test_unrequested_alternate_version_is_not_selected(self):
        metadata = match_candidates(
            [candidate(1, trackName="ナイショの話 (Live)")],
            "ナイショの話",
            "ClariS",
            "primary",
        )
        self.assertIsNone(metadata)

    def test_duplicate_track_ids_are_removed(self):
        metadata = match_candidates(
            [candidate(1), candidate(1)], "ナイショの話", "ClariS", "primary"
        )
        self.assertEqual(metadata["candidateCount"], 1)

    def test_duplicate_fallback_fields_are_removed_without_track_id(self):
        first = candidate(None)
        second = dict(first)
        metadata = match_candidates(
            [first, second], "ナイショの話", "ClariS", "primary"
        )
        self.assertEqual(metadata["candidateCount"], 1)


class SearchStrategyTests(unittest.TestCase):
    def test_primary_match_stops_following_searches(self):
        client = FakeClient([[candidate(1)]])
        metadata = search_song(client, "ナイショの話", "ClariS")
        self.assertEqual(metadata["matchStrategy"], "primary_exact")
        self.assertEqual(client.calls, [("ClariS ナイショの話", None)])

    def test_title_fallback_runs_after_primary_miss(self):
        client = FakeClient([[], [candidate(1)]])
        metadata = search_song(client, "ナイショの話", "ClariS")
        self.assertEqual(metadata["matchStrategy"], "title_fallback_exact")
        self.assertEqual(
            client.calls,
            [("ClariS ナイショの話", None), ("ナイショの話", "songTerm")],
        )

    def test_override_runs_only_after_normal_searches_miss(self):
        override_candidate = candidate(
            3,
            trackName="再会 (produced by Ayase)",
            artistName="LiSA & Uru",
        )
        override = {"title": "再会 (produced by Ayase)", "artist": "LiSA & Uru"}
        client = FakeClient([[], [], [override_candidate]])
        metadata = search_song(client, "再会", "LiSA×Uru", override)
        self.assertEqual(metadata["matchStatus"], "needs_review")
        self.assertEqual(metadata["matchStrategy"], "override_exact")
        self.assertIn("search_override_used", metadata["reviewReason"])
        self.assertEqual(len(client.calls), 3)

    def test_override_fallback_stops_when_match_found(self):
        override_candidate = candidate(
            3,
            trackName="再会 (produced by Ayase)",
            artistName="LiSA & Uru",
        )
        override = {"title": "再会 (produced by Ayase)", "artist": "LiSA & Uru"}
        client = FakeClient([[], [], [], [override_candidate]])
        metadata = search_song(client, "再会", "LiSA×Uru", override)
        self.assertEqual(metadata["matchStrategy"], "override_exact")
        self.assertEqual(len(client.calls), 4)

    def test_no_override_does_not_run_override_search(self):
        client = FakeClient([[], []])
        metadata = search_song(client, "unknown", "unknown")
        self.assertEqual(metadata["matchStatus"], "not_found")
        self.assertEqual(metadata["matchStrategy"], "not_found")
        self.assertEqual(len(client.calls), 2)


class RequestParameterTests(unittest.TestCase):
    def test_request_parameters(self):
        requests = []

        class Response:
            def __enter__(self):
                return self

            def __exit__(self, *_):
                return None

            def read(self):
                return b'{"results": []}'

        def opener(request, timeout):
            requests.append((request, timeout))
            return Response()

        client = ITunesSearchClient(
            opener=opener,
            sleep=lambda _: None,
            request_interval=0,
        )
        client.search("ClariS ナイショの話")
        client.search("ナイショの話", attribute="songTerm")
        primary = parse_qs(urlparse(requests[0][0].full_url).query)
        fallback = parse_qs(urlparse(requests[1][0].full_url).query)
        self.assertNotIn("attribute", primary)
        self.assertEqual(fallback["attribute"], ["songTerm"])
        self.assertEqual(primary["limit"], ["25"])
        self.assertEqual(fallback["limit"], ["25"])


class OverrideLoadingTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.path = Path(self.directory.name) / "search-overrides.json"

    def tearDown(self):
        self.directory.cleanup()

    def test_missing_file_returns_empty_mapping(self):
        self.assertEqual(load_search_overrides(str(self.path)), {})

    def test_loads_override_by_normalized_original_names(self):
        self.path.write_text(
            json.dumps(
                {
                    "songOverrides": {
                        "再会|LiSA×Uru": {
                            "title": "再会 (produced by Ayase)",
                            "artist": "LiSA & Uru",
                        }
                    }
                },
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        overrides = load_search_overrides(str(self.path))
        self.assertIn(("再会", "lisa×uru"), overrides)

    def test_invalid_structure_raises_clear_error(self):
        self.path.write_text("[]", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "songOverrides object"):
            load_search_overrides(str(self.path))

    def test_invalid_json_raises_clear_error(self):
        self.path.write_text("{", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Invalid JSON in search overrides"):
            load_search_overrides(str(self.path))

    def test_array_override_value_is_rejected(self):
        self.path.write_text(
            json.dumps({"songOverrides": {"a|b": [{"title": "a", "artist": "b"}]}}),
            encoding="utf-8",
        )
        with self.assertRaisesRegex(ValueError, "only title and artist"):
            load_search_overrides(str(self.path))


class CacheAndRefreshTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.metadata_path = Path(self.directory.name) / "music_metadata.json"
        metadata = empty_metadata("not_found", review_reasons=["not_found"])
        self.existing = build_record("ナイショの話", "ClariS", metadata, now=FIXED_NOW)
        self.metadata_path.write_text(
            json.dumps([self.existing], ensure_ascii=False), encoding="utf-8"
        )

    def tearDown(self):
        self.directory.cleanup()

    def test_existing_record_does_not_call_api(self):
        client = FakeClient([])
        requested, skipped = update_metadata(
            [("ナイショの話", "ClariS")], str(self.metadata_path), client
        )
        self.assertEqual((requested, skipped), (0, 1))
        self.assertEqual(client.calls, [])

    def test_refresh_status_not_found_only_refreshes_not_found(self):
        client = FakeClient([[candidate(1)]])
        requested, skipped = update_metadata(
            [("ナイショの話", "ClariS")],
            str(self.metadata_path),
            client,
            refresh_status="not_found",
            now=FIXED_NOW,
        )
        self.assertEqual((requested, skipped), (1, 0))
        saved = json.loads(self.metadata_path.read_text(encoding="utf-8"))[0]
        self.assertEqual(saved["status"], "auto_matched")

    def test_refresh_status_needs_review_only_refreshes_needs_review(self):
        self.existing["status"] = "needs_review"
        self.metadata_path.write_text(
            json.dumps([self.existing], ensure_ascii=False), encoding="utf-8"
        )
        client = FakeClient([[candidate(1)]])
        requested, skipped = update_metadata(
            [("ナイショの話", "ClariS")],
            str(self.metadata_path),
            client,
            refresh_status="needs_review",
            now=FIXED_NOW,
        )
        self.assertEqual((requested, skipped), (1, 0))

    def test_refresh_status_skips_non_matching_status(self):
        client = FakeClient([])
        requested, skipped = update_metadata(
            [("ナイショの話", "ClariS")],
            str(self.metadata_path),
            client,
            refresh_status="needs_review",
        )
        self.assertEqual((requested, skipped), (0, 1))

    def test_refresh_does_not_overwrite_manual_record(self):
        self.existing["status"] = "manual"
        self.existing["metadata"]["manualValue"] = "keep"
        self.metadata_path.write_text(
            json.dumps([self.existing], ensure_ascii=False), encoding="utf-8"
        )
        client = FakeClient([])
        requested, skipped = update_metadata(
            [("ナイショの話", "ClariS")],
            str(self.metadata_path),
            client,
            refresh=True,
        )
        saved = json.loads(self.metadata_path.read_text(encoding="utf-8"))[0]
        self.assertEqual((requested, skipped), (0, 1))
        self.assertEqual(client.calls, [])
        self.assertEqual(saved["status"], "manual")
        self.assertEqual(saved["metadata"]["manualValue"], "keep")

    def test_refresh_status_does_not_overwrite_manual_record(self):
        self.existing["status"] = "manual"
        self.metadata_path.write_text(
            json.dumps([self.existing], ensure_ascii=False), encoding="utf-8"
        )
        client = FakeClient([])
        requested, skipped = update_metadata(
            [("ナイショの話", "ClariS")],
            str(self.metadata_path),
            client,
            refresh_status="not_found",
        )
        self.assertEqual((requested, skipped), (0, 1))
        self.assertEqual(client.calls, [])

    def test_refresh_preserves_manual_tags_and_unknown_fields(self):
        self.existing["tags"] = {
            "themeTags": ["冬"],
            "moodTags": ["明るい"],
            "motifTags": ["雪"],
            "customTags": ["手動"],
        }
        self.existing["tieUps"] = [
            {"series": "シリーズ", "workTitle": "アニメ", "role": "ED"}
        ]
        self.existing["manualNote"] = "keep"
        self.existing["metadata"]["manualReleaseMemo"] = "keep"
        self.metadata_path.write_text(
            json.dumps([self.existing], ensure_ascii=False), encoding="utf-8"
        )
        client = FakeClient([[candidate(1)]])
        update_metadata(
            [("ナイショの話", "ClariS")],
            str(self.metadata_path),
            client,
            refresh=True,
            now=FIXED_NOW,
        )
        saved = json.loads(self.metadata_path.read_text(encoding="utf-8"))[0]
        self.assertEqual(saved["tags"]["themeTags"], ["冬"])
        self.assertEqual(saved["tags"]["moodTags"], ["明るい"])
        self.assertEqual(saved["tags"]["motifTags"], ["雪"])
        self.assertNotIn("sceneTags", saved["tags"])
        self.assertEqual(saved["tags"]["customTags"], ["手動"])
        self.assertEqual(
            saved["tieUps"],
            [{"series": "シリーズ", "workTitle": "アニメ", "role": "ED"}],
        )
        self.assertEqual(saved["manualNote"], "keep")
        self.assertEqual(saved["metadata"]["manualReleaseMemo"], "keep")
        self.assertEqual(saved["title"], "ナイショの話")
        self.assertEqual(saved["artist"], "ClariS")

    def test_override_refresh_keeps_original_title_and_artist(self):
        override_candidate = candidate(
            3,
            trackName="再会 (produced by Ayase)",
            artistName="LiSA & Uru",
        )
        existing = build_record(
            "再会",
            "LiSA×Uru",
            empty_metadata("not_found", review_reasons=["not_found"]),
            now=FIXED_NOW,
        )
        self.metadata_path.write_text(
            json.dumps([existing], ensure_ascii=False), encoding="utf-8"
        )
        client = FakeClient([[], [], [override_candidate]])
        overrides = {
            ("再会", "lisa×uru"): {
                "title": "再会 (produced by Ayase)",
                "artist": "LiSA & Uru",
            }
        }
        update_metadata(
            [("再会", "LiSA×Uru")],
            str(self.metadata_path),
            client,
            overrides=overrides,
            refresh_status="not_found",
            now=FIXED_NOW,
        )
        saved = json.loads(self.metadata_path.read_text(encoding="utf-8"))[0]
        self.assertEqual(saved["title"], "再会")
        self.assertEqual(saved["artist"], "LiSA×Uru")
        self.assertEqual(saved["status"], "needs_review")


class MetadataSchemaTests(unittest.TestCase):
    def test_migrates_legacy_record_to_new_schema(self):
        legacy = {
            "title": "ナイショの話",
            "artist": "ClariS",
            "metadata": {
                "releaseDate": "2012-02-01",
                "releaseYear": 2012,
                "decade": "2010年代",
                "genre": "アニメ",
                "durationSeconds": 261,
                "collectionName": "偽物語 劇伴音楽集",
                "itunesTrackId": 1535798069,
                "matchStatus": "auto_matched",
                "source": "itunes",
                "matchStrategy": "legacy_exact",
            },
            "tags": {
                "themeTags": ["恋愛"],
                "moodTags": ["明るい"],
                "tieUps": ["偽物語"],
            },
            "generatedAt": "2026-06-27T19:36:24+09:00",
        }

        migrated = migrate_record_schema(legacy)

        self.assertEqual(
            migrated["metadata"],
            {
                "releaseDate": "2012-02-01",
                "releaseDecade": "2010年代",
                "durationSeconds": 261,
                "collectionName": "偽物語 劇伴音楽集",
            },
        )
        self.assertEqual(
            migrated["classification"]["genres"],
            ["アニソン"],
        )
        self.assertEqual(
            migrated["classification"]["sourceCategories"],
            ["アニメ"],
        )
        self.assertEqual(migrated["classification"]["subgenres"], [])
        self.assertNotIn("cultureTags", migrated["classification"])
        self.assertNotIn("sceneTags", migrated["tags"])
        self.assertNotIn("tieUps", migrated["tags"])
        self.assertEqual(
            migrated["tieUps"],
            [{"series": "", "workTitle": "偽物語", "role": ""}],
        )
        self.assertEqual(
            migrated["source"],
            {"provider": "itunes", "trackId": 1535798069},
        )
        self.assertEqual(migrated["status"], "auto_matched")

    def test_preserves_new_manual_classification_and_tie_ups(self):
        record = {
            "title": "ナイショの話",
            "artist": "ClariS",
            "metadata": {},
            "classification": {
                "genres": ["J-Pop"],
                "subgenres": ["アニソンポップ"],
                "sourceCategories": ["アニメ"],
                "vocalTypes": ["女性ボーカル", "デュオ"],
            },
            "tags": {
                "themeTags": ["恋愛"],
                "moodTags": ["明るい"],
                "motifTags": ["月"],
            },
            "tieUps": [
                {"series": "物語シリーズ", "workTitle": "偽物語", "role": "ED"}
            ],
            "source": {"provider": "itunes", "trackId": 1535798069},
            "status": "manual",
        }

        migrated = migrate_record_schema(record)

        self.assertEqual(migrated["classification"], record["classification"])
        self.assertEqual(migrated["tags"], record["tags"])
        self.assertEqual(migrated["tieUps"], record["tieUps"])
        self.assertEqual(migrated["status"], "manual")


class ArgumentTests(unittest.TestCase):
    def test_refresh_and_refresh_status_are_mutually_exclusive(self):
        with self.assertRaises(SystemExit):
            parse_args(["--refresh", "--refresh-status", "not_found"])

    def test_invalid_refresh_status_is_rejected(self):
        with self.assertRaises(SystemExit):
            parse_args(["--refresh-status", "auto_matched"])

    def test_title_and_artist_can_be_filtered_by_refresh_status(self):
        args = parse_args(
            [
                "--title",
                "ナイショの話",
                "--artist",
                "ClariS",
                "--refresh-status",
                "not_found",
            ]
        )
        self.assertEqual(args.refresh_status, "not_found")


if __name__ == "__main__":
    unittest.main()
