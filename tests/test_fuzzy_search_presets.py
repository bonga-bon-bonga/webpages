import json
import unittest
from pathlib import Path


MUSICLIST_PATH = Path("nemupipiano-musiclist-search/data/musiclist.json")
PRESETS_PATH = Path(
    "nemupipiano-musiclist-search/data/fuzzy-search-presets.json"
)


def matches(song, match):
    tags = song.get("tags") if isinstance(song.get("tags"), dict) else {}
    return all(
        bool(set(expected_values) & set(tags.get(group, [])))
        for group, expected_values in match.items()
    )


class FuzzySearchPresetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.songs = json.loads(MUSICLIST_PATH.read_text(encoding="utf-8"))
        cls.presets = json.loads(PRESETS_PATH.read_text(encoding="utf-8"))

    def test_every_preset_item_has_matching_songs(self):
        for preset in self.presets:
            with self.subTest(preset=preset["title"]):
                self.assertTrue(preset["items"])
            for item in preset["items"]:
                with self.subTest(preset=preset["title"], item=item["label"]):
                    self.assertTrue(any(matches(song, item["match"]) for song in self.songs))

    def test_match_groups_use_and_and_values_within_group_use_or(self):
        matching_song = {
            "tags": {
                "themeTags": ["恋愛"],
                "moodTags": ["切ない"],
                "motifTags": ["春"],
            }
        }
        self.assertTrue(
            matches(
                matching_song,
                {"themeTags": ["恋愛"], "moodTags": ["切ない"]},
            )
        )
        self.assertTrue(matches(matching_song, {"motifTags": ["桜", "春"]}))
        self.assertFalse(
            matches(
                matching_song,
                {"themeTags": ["恋愛"], "moodTags": ["明るい"]},
            )
        )


if __name__ == "__main__":
    unittest.main()
