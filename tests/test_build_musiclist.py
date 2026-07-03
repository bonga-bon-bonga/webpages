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
