import importlib
import os
import sys
import unittest


def import_enrich_musiclist():
    scripts_path = os.path.abspath("scripts")
    if scripts_path not in sys.path:
        sys.path.insert(0, scripts_path)
    sys.modules.pop("enrich_musiclist", None)
    return importlib.import_module("enrich_musiclist")


class EnrichMusiclistTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = import_enrich_musiclist()

    def test_normalize_tags_preserves_metadata_tag_groups(self):
        self.assertEqual(
            self.module.normalize_tags(
                {
                    "themeTags": ["恋愛", "恋愛"],
                    "moodTags": ["明るい"],
                    "motifTags": ["花"],
                }
            ),
            {
                "themeTags": ["恋愛"],
                "moodTags": ["明るい"],
                "motifTags": ["花"],
            },
        )

    def test_normalize_tags_supports_legacy_array(self):
        self.assertEqual(self.module.normalize_tags(["アニメ", "アニメ"]), ["アニメ"])


if __name__ == "__main__":
    unittest.main()
