import json
import unittest
from pathlib import Path


MUSICLIST_PATH = Path("nemupipiano-musiclist-search/data/musiclist.json")
PRESETS_PATH = Path(
    "nemupipiano-musiclist-search/data/fuzzy-search-presets.json"
)


def matches(song, match):
    tags = song.get("tags") if isinstance(song.get("tags"), dict) else {}
    classification = (
        song.get("classification")
        if isinstance(song.get("classification"), dict)
        else {}
    )

    def values(group):
        if group == "sourceCategories":
            return classification.get("sourceCategories", [])
        if group == "releaseDecade":
            return [song.get("releaseDecade")] if song.get("releaseDecade") else []
        return tags.get(group, [])

    return all(
        bool(set(expected_values) & set(values(group)))
        for group, expected_values in match.items()
    )


def stable_hash(value):
    result = 2166136261
    for character in str(value):
        result ^= ord(character)
        result = (result * 16777619) & 0xFFFFFFFF
    return result


def daily_order(keys, date_key, preset_key):
    seed = stable_hash(date_key)
    return sorted(keys, key=lambda key: (stable_hash(f"{seed}|{preset_key}|{key}"), key))


class FuzzySearchPresetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.songs = json.loads(MUSICLIST_PATH.read_text(encoding="utf-8"))
        cls.presets = json.loads(PRESETS_PATH.read_text(encoding="utf-8"))

    def test_every_preset_item_has_supported_match_conditions(self):
        supported_groups = {
            "themeTags",
            "moodTags",
            "motifTags",
            "sourceCategories",
            "releaseDecade",
        }
        for preset in self.presets:
            with self.subTest(preset=preset["title"]):
                self.assertTrue(preset["items"])
            for item in preset["items"]:
                with self.subTest(preset=preset["title"], item=item["label"]):
                    self.assertTrue(item["match"])
                    self.assertTrue(set(item["match"]) <= supported_groups)
                    self.assertTrue(
                        all(
                            isinstance(values, list) and values
                            for values in item["match"].values()
                        )
                    )

    def test_match_groups_use_and_and_values_within_group_use_or(self):
        matching_song = {
            "releaseDecade": "2020年代",
            "classification": {"sourceCategories": ["アニメ"]},
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
        self.assertTrue(
            matches(
                matching_song,
                {
                    "sourceCategories": ["アニメ", "映画"],
                    "releaseDecade": ["2020年代"],
                },
            )
        )
        self.assertFalse(
            matches(
                matching_song,
                {"themeTags": ["恋愛"], "moodTags": ["明るい"]},
            )
        )

    def test_daily_order_is_stable_and_changes_with_date(self):
        keys = [f"song-{index}" for index in range(20)]
        today = daily_order(keys, "20260705", "気分|元気になれる曲")
        self.assertEqual(
            today,
            daily_order(keys, "20260705", "気分|元気になれる曲"),
        )
        self.assertNotEqual(
            today,
            daily_order(keys, "20260706", "気分|元気になれる曲"),
        )


if __name__ == "__main__":
    unittest.main()
