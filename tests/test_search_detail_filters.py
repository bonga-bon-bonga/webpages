import json
import unittest
from pathlib import Path


MUSICLIST_PATH = Path("nemupipiano-musiclist-search/data/musiclist.json")


def detail_matches(song, filters):
    classification = (
        song.get("classification")
        if isinstance(song.get("classification"), dict)
        else {}
    )
    if filters.get("genre") and song.get("genre") != filters["genre"]:
        return False
    for field in ("subgenres", "sourceCategories", "vocalTypes"):
        selected = filters.get(field)
        if selected and selected not in classification.get(field, []):
            return False
    anime_drama = filters.get("animeDrama")
    if anime_drama:
        category, series = anime_drama.split("|", 1)
        if category == "special":
            prefix = "ghibli#" if series == "ghibli" else "disney#"
            return str(song.get("no", "")).lower().startswith(prefix)
        if category not in classification.get("sourceCategories", []):
            return False
        if not any(
            tie_up.get("series") == series
            for tie_up in song.get("tieUps", [])
            if isinstance(tie_up, dict)
        ):
            return False
    return not filters.get("releaseDecade") or (
        song.get("releaseDecade") == filters["releaseDecade"]
    )


class SearchDetailFilterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.songs = json.loads(MUSICLIST_PATH.read_text(encoding="utf-8"))

    def test_each_detail_filter_has_options(self):
        self.assertTrue({song.get("genre") for song in self.songs if song.get("genre")})
        for field in ("subgenres", "sourceCategories", "vocalTypes"):
            values = {
                value
                for song in self.songs
                for value in song.get("classification", {}).get(field, [])
            }
            with self.subTest(field=field):
                self.assertTrue(values)
        self.assertTrue(
            {song.get("releaseDecade") for song in self.songs if song.get("releaseDecade")}
        )

    def test_detail_conditions_are_combined_with_and(self):
        filters = {
            "subgenres": "バラード",
            "sourceCategories": "ドラマ",
            "vocalTypes": "女性ボーカル",
            "releaseDecade": "2010年代",
        }
        matched = [song for song in self.songs if detail_matches(song, filters)]
        self.assertTrue(matched)
        for song in matched:
            self.assertIn("バラード", song["classification"]["subgenres"])
            self.assertIn("ドラマ", song["classification"]["sourceCategories"])
            self.assertIn("女性ボーカル", song["classification"]["vocalTypes"])
            self.assertEqual(song["releaseDecade"], "2010年代")

    def test_detail_filter_can_match_without_keyword(self):
        self.assertTrue(
            any(
                detail_matches(song, {"sourceCategories": "アニメ"})
                for song in self.songs
            )
        )

    def test_anime_drama_filter_uses_tie_up_series(self):
        options = [
            (
                category,
                tie_up.get("series"),
            )
            for song in self.songs
            for category in ("アニメ", "ドラマ")
            if category in song.get("classification", {}).get("sourceCategories", [])
            for tie_up in song.get("tieUps", [])
            if isinstance(tie_up, dict) and tie_up.get("series")
        ]
        self.assertTrue(options)

        category, series = options[0]
        matched = [
            song
            for song in self.songs
            if detail_matches(song, {"animeDrama": f"{category}|{series}"})
        ]
        self.assertTrue(matched)
        for song in matched:
            self.assertIn(category, song["classification"]["sourceCategories"])
            self.assertTrue(any(tie_up.get("series") == series for tie_up in song["tieUps"]))

    def test_anime_drama_special_filters_match_source_lists(self):
        for kind in ("ghibli", "disney"):
            with self.subTest(kind=kind):
                matched = [
                    song
                    for song in self.songs
                    if detail_matches(song, {"animeDrama": f"special|{kind}"})
                ]
                self.assertTrue(matched)
                self.assertTrue(
                    all(str(song.get("no", "")).lower().startswith(f"{kind}#") for song in matched)
                )


if __name__ == "__main__":
    unittest.main()
