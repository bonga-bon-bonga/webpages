import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT / "scripts" / "update_site_version.py"
SPEC = importlib.util.spec_from_file_location("update_site_version", SCRIPT_PATH)
update_site_version = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(update_site_version)


class UpdateSiteVersionTests(unittest.TestCase):
    def test_current_index_matches_version_source(self):
        version = update_site_version.load_version()
        index_text = update_site_version.INDEX_FILE.read_text(encoding="utf-8")

        self.assertEqual(
            update_site_version.render_index(index_text, version),
            index_text,
        )

    def test_render_index_updates_all_version_locations(self):
        index_text = "\n".join(
            (
                '<link href="musiclist-search.css?v=1.0.0">',
                '<p>ver.1.0.0 contact</p>',
                '<script src="musiclist-search.js?v=1.0.0"></script>',
            )
        )

        rendered = update_site_version.render_index(index_text, "2.3.4")

        self.assertEqual(rendered.count("2.3.4"), 3)
        self.assertNotIn("1.0.0", rendered)

    def test_rejects_invalid_version(self):
        with self.assertRaises(ValueError):
            update_site_version.validate_version("2.2")


if __name__ == "__main__":
    unittest.main()
