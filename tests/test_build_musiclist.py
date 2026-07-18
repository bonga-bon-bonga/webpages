import importlib
import os
import sys
import unittest
from unittest.mock import patch


ENVIRONMENT = {
    "NEMUPIPIANO_SPREADSHEET_ID": "spreadsheet-id",
    "NEMUPIPIANO_GID_POPS": "0",
    "NEMUPIPIANO_GID_DISNEY": "100",
    "NEMUPIPIANO_GID_GHIBLI": "200",
}


def import_build_musiclist():
    scripts_path = os.path.abspath("scripts")
    if scripts_path not in sys.path:
        sys.path.insert(0, scripts_path)
    sys.modules.pop("build_musiclist", None)
    with patch.dict(os.environ, ENVIRONMENT, clear=False):
        return importlib.import_module("build_musiclist")


def table(headers, rows):
    return {
        "cols": [{"label": header} for header in headers],
        "rows": [
            {"c": [{"v": value} if value != "" else None for value in row]}
            for row in rows
        ],
    }


class BuildMusiclistTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = import_build_musiclist()

    def test_formats_source_numbers(self):
        self.assertEqual(self.module.format_source_no(12.0, "list"), "list#12")
        self.assertEqual(self.module.format_source_no("3", "disney"), "disney#3")
        self.assertEqual(self.module.format_source_no("4.5", "ghibli"), "ghibli#4.5")

    def test_parses_optional_headers_for_disney_and_ghibli(self):
        source_table = table(
            ["No", "曲名", "アーティスト"],
            [[1, "ホール・ニュー・ワールド", "Alan Menken"]],
        )
        rows = self.module.parse_sheet_table(source_table, "disney")
        self.assertEqual(rows[0]["曲名"], "ホール・ニュー・ワールド")
        self.assertEqual(rows[0]["_numberPrefix"], "disney")
        self.assertNotIn("ジャンル", rows[0])

    def test_rejects_sheet_without_common_required_headers(self):
        source_table = table(["No", "曲名"], [[1, "Missing artist"]])
        with self.assertRaisesRegex(
            ValueError,
            "Missing required columns for ghibli: アーティスト",
        ):
            self.module.parse_sheet_table(source_table, "ghibli")

    def test_builds_records_from_all_sheet_types(self):
        rows = [
            {"No": 1, "曲名": "POPS", "アーティスト": "Artist", "_numberPrefix": "list"},
            {"No": 2, "曲名": "Disney", "アーティスト": "Artist", "_numberPrefix": "disney"},
            {"No": 3, "曲名": "Ghibli", "アーティスト": "Artist", "_numberPrefix": "ghibli"},
        ]
        musiclist = self.module.build_musiclist(
            rows,
            existing_entries={},
            search_enhancements={"titleCorrections": {}, "artistCorrections": {}},
        )
        self.assertEqual(
            [item["no"] for item in musiclist],
            ["list#1", "disney#2", "ghibli#3"],
        )

    def test_merges_music_metadata_into_existing_record(self):
        rows = [
            {
                "No": 1,
                "曲名": "Song",
                "アーティスト": "Artist",
                "ジャンル": "Sheet Genre",
                "_numberPrefix": "list",
            }
        ]
        key = self.module.song_key("Song", "Artist")
        musiclist = self.module.build_musiclist(
            rows,
            existing_entries={
                key: {
                    "titleSearchWords": ["song"],
                    "artistSearchWords": ["artist"],
                    "releaseDecade": "1990年代",
                    "classification": {"custom": ["keep"], "genres": ["旧"]},
                    "tags": {"customTags": ["keep"], "themeTags": ["旧"]},
                    "tieUps": [{"series": "Old", "workTitle": "Old Work", "role": "旧"}],
                }
            },
            search_enhancements={"titleCorrections": {}, "artistCorrections": {}},
            metadata_entries={
                key: {
                    "releaseDecade": "2020年代",
                    "classification": {"genres": ["J-Pop"], "vocalTypes": []},
                    "tags": {"themeTags": ["希望"], "moodTags": ["明るい"]},
                    "tieUps": [{"series": "Series", "workTitle": "Work", "role": "主題歌"}],
                }
            },
        )

        self.assertEqual(musiclist[0]["releaseDecade"], "2020年代")
        self.assertEqual(
            musiclist[0]["classification"],
            {"custom": ["keep"], "genres": ["J-Pop"], "vocalTypes": []},
        )
        self.assertEqual(
            musiclist[0]["tags"],
            {
                "customTags": ["keep"],
                "themeTags": ["希望"],
                "moodTags": ["明るい"],
            },
        )
        self.assertEqual(
            musiclist[0]["tieUps"],
            [{"series": "Series", "workTitle": "Work", "role": "主題歌"}],
        )

    def test_preserves_existing_metadata_when_source_value_is_missing(self):
        rows = [
            {"No": 1, "曲名": "Song", "アーティスト": "Artist", "_numberPrefix": "list"}
        ]
        key = self.module.song_key("Song", "Artist")
        musiclist = self.module.build_musiclist(
            rows,
            existing_entries={
                key: {
                    "releaseDecade": "2000年代",
                    "classification": {"genres": ["ロック"]},
                    "tags": {"themeTags": ["青春"]},
                    "tieUps": [{"series": "Existing", "workTitle": "Existing Work", "role": "OP"}],
                }
            },
            search_enhancements={"titleCorrections": {}, "artistCorrections": {}},
            metadata_entries={key: {"classification": {}, "tags": {}}},
        )

        self.assertEqual(musiclist[0]["releaseDecade"], "2000年代")
        self.assertEqual(musiclist[0]["classification"], {"genres": ["ロック"]})
        self.assertEqual(musiclist[0]["tags"], {"themeTags": ["青春"]})
        self.assertEqual(
            musiclist[0]["tieUps"],
            [{"series": "Existing", "workTitle": "Existing Work", "role": "OP"}],
        )

    def test_metadata_changes_affect_input_hash(self):
        sheet_hash = "sheet-hash"
        first = self.module.build_input_hash(
            sheet_hash,
            [{"metadata": {"releaseDecade": "2010年代"}}],
            {"titleCorrections": {}, "artistCorrections": {}, "songCorrections": {}},
        )
        second = self.module.build_input_hash(
            sheet_hash,
            [{"metadata": {"releaseDecade": "2020年代"}}],
            {"titleCorrections": {}, "artistCorrections": {}, "songCorrections": {}},
        )
        self.assertNotEqual(first, second)

    def test_search_enhancements_changes_affect_input_hash(self):
        sheet_hash = "sheet-hash"
        metadata = [{"metadata": {"releaseDecade": "2020年代"}}]
        first = self.module.build_input_hash(
            sheet_hash,
            metadata,
            {"titleCorrections": {}, "artistCorrections": {}, "songCorrections": {}},
        )
        second = self.module.build_input_hash(
            sheet_hash,
            metadata,
            {
                "titleCorrections": {},
                "artistCorrections": {},
                "songCorrections": {
                    self.module.song_key("Song", "Composer"): {
                        "displayArtist": "Singer",
                        "includeSourceArtistInSearch": False,
                    }
                },
            },
        )
        self.assertNotEqual(first, second)

    def test_applies_artist_correction_to_only_the_matching_song(self):
        corrections = self.module.normalize_song_corrections(
            [
                {
                    "sourceTitle": "Target Song",
                    "sourceArtist": "Composer",
                    "displayArtist": "Singer",
                    "includeSourceArtistInSearch": False,
                }
            ]
        )
        rows = [
            {
                "No": 1,
                "曲名": "Target Song",
                "アーティスト": "Composer",
                "_numberPrefix": "list",
            },
            {
                "No": 2,
                "曲名": "Other Song",
                "アーティスト": "Composer",
                "_numberPrefix": "list",
            },
        ]
        musiclist = self.module.build_musiclist(
            rows,
            existing_entries={
                self.module.song_key("Target Song", "Composer"): {
                    "artistSearchWords": ["composer"],
                }
            },
            search_enhancements={
                "titleCorrections": {},
                "artistCorrections": {},
                "songCorrections": corrections,
            },
        )

        self.assertEqual(musiclist[0]["displayArtist"], "Singer")
        self.assertEqual(musiclist[0]["sourceArtist"], "Composer")
        self.assertEqual(musiclist[0]["artistSearchWords"], [])
        self.assertFalse(musiclist[0]["includeSourceArtistInSearch"])
        self.assertEqual(
            musiclist[0]["songKey"], self.module.song_key("Target Song", "Singer")
        )
        self.assertEqual(musiclist[1]["displayArtist"], "Composer")
        self.assertNotIn("includeSourceArtistInSearch", musiclist[1])

    def test_rejects_duplicate_song_correction_source_keys(self):
        corrections = [
            {
                "sourceTitle": "Song",
                "sourceArtist": "Artist",
                "displayArtist": "Singer A",
                "includeSourceArtistInSearch": False,
            },
            {
                "sourceTitle": "Ｓｏｎｇ",
                "sourceArtist": "Ａｒｔｉｓｔ",
                "displayArtist": "Singer B",
                "includeSourceArtistInSearch": True,
            },
        ]
        with self.assertRaisesRegex(ValueError, "Duplicate songCorrections"):
            self.module.normalize_song_corrections(corrections)

    def test_normalize_entry_keeps_metadata_when_called_repeatedly(self):
        entry = {
            "releaseDecade": "2010年代",
            "classification": {"genres": ["J-Pop"]},
            "tags": {"themeTags": ["恋愛"]},
            "tieUps": [{"series": "Series", "workTitle": "Work", "role": "OP"}],
        }
        normalized = self.module.normalize_entry(entry)
        normalized_again = self.module.normalize_entry(normalized)

        self.assertEqual(normalized_again["releaseDecade"], "2010年代")
        self.assertEqual(normalized_again["classification"], {"genres": ["J-Pop"]})
        self.assertEqual(
            normalized_again["metadataTags"], {"themeTags": ["恋愛"]}
        )
        self.assertEqual(
            normalized_again["tieUps"],
            [{"series": "Series", "workTitle": "Work", "role": "OP"}],
        )

    def test_loads_three_sheets_and_combines_hash_input(self):
        tables = {
            "0": table(["No", "曲名", "アーティスト"], [[1, "POPS", "Artist"]]),
            "100": table(["No", "曲名", "アーティスト"], [[2, "Disney", "Artist"]]),
            "200": table(["No", "曲名", "アーティスト"], [[3, "Ghibli", "Artist"]]),
        }
        with patch.object(
            self.module,
            "fetch_sheet_table",
            side_effect=lambda gid: tables[gid],
        ) as fetch:
            rows, combined_hash = self.module.load_sheets()

        self.assertEqual(fetch.call_count, 3)
        self.assertEqual([row["_numberPrefix"] for row in rows], ["list", "disney", "ghibli"])
        self.assertEqual(len(combined_hash), 64)


if __name__ == "__main__":
    unittest.main()
