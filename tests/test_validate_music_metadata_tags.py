import unittest

from scripts.validate_music_metadata_tags import validate_records


TAG_DICTIONARY = {
    "classification": {
        "genres": ["J-Pop", "ロック"],
        "subgenres": ["バラード"],
        "sourceCategories": ["アニメ"],
        "vocalTypes": ["女性ボーカル"],
    },
    "tags": {
        "themeTags": ["恋愛"],
        "moodTags": ["明るい"],
        "motifTags": ["星"],
        "eventTags": ["クリスマス"],
    },
}


def record():
    return {
        "title": "Song",
        "artist": "Artist",
        "classification": {
            "genres": ["J-Pop"],
            "subgenres": [],
            "sourceCategories": ["アニメ"],
            "vocalTypes": [],
        },
        "tags": {
            "themeTags": ["恋愛"],
            "moodTags": ["明るい"],
            "motifTags": ["星"],
            "eventTags": ["クリスマス"],
        },
        "tieUps": [
            {"series": "シリーズ", "workTitle": "作品", "role": "主題歌"}
        ],
    }


class TagValidationTests(unittest.TestCase):
    def test_accepts_dictionary_values_and_single_genre(self):
        self.assertEqual(validate_records([record()], TAG_DICTIONARY), [])

    def test_rejects_multiple_genres(self):
        value = record()
        value["classification"]["genres"] = ["J-Pop", "ロック"]
        errors = validate_records([value], TAG_DICTIONARY)
        self.assertTrue(any("at most one" in error for error in errors))

    def test_rejects_undefined_tag_with_dictionary_guidance(self):
        value = record()
        value["tags"]["themeTags"] = ["辞書外"]
        errors = validate_records([value], TAG_DICTIONARY)
        self.assertTrue(any("existing dictionary value" in error for error in errors))

    def test_rejects_undefined_motif_tag(self):
        value = record()
        value["tags"]["motifTags"] = ["辞書外"]
        errors = validate_records([value], TAG_DICTIONARY)
        self.assertTrue(any("tags.motifTags" in error for error in errors))

    def test_rejects_culture_tags(self):
        value = record()
        value["classification"]["cultureTags"] = []
        errors = validate_records([value], TAG_DICTIONARY)
        self.assertTrue(any("cultureTags is not supported" in error for error in errors))

    def test_requires_series_in_tie_up(self):
        value = record()
        value["tieUps"] = [{"workTitle": "作品", "role": "主題歌"}]
        errors = validate_records([value], TAG_DICTIONARY)
        self.assertTrue(any("series, workTitle, and role" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
