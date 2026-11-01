import csv
import contextlib
import hashlib
import io
import json
import shutil
import tempfile
import unittest
from unittest.mock import patch
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RELEASE = ROOT / 'delivery/kaggle'


class IntegrationContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.atlas = json.loads((RELEASE / 'atlas_summary.json').read_text(encoding='utf-8'))
        cls.catalog = list(csv.DictReader(io.StringIO((RELEASE / 'feature_catalog.csv').read_text(encoding='utf-8'))))

    def test_compiled_definitions_match_original_source_rows(self):
        for source in self.atlas['sources']:
            path = ROOT / 'data/source-snapshots' / source['feature_catalog']
            original = list(csv.DictReader(io.StringIO(path.read_text(encoding='utf-8-sig'))))
            compiled = [json.loads(row['original_definition_json']) for row in self.catalog if row['source_id'] == source['source_id']]
            self.assertEqual(compiled, original)

    def test_no_pooled_population_or_effect_is_invented(self):
        for key in ['pooled_population_count', 'pooled_injury_count', 'cross_source_effect_estimate']:
            self.assertIsNone(self.atlas[key])
        self.assertEqual(len({source['outcome'] for source in self.atlas['sources']}), 3)

    def test_missing_linkage_and_return_cannot_be_reported_as_available(self):
        for domain in self.atlas['matrix']['domains']:
            if domain['domain_id'] in ['multimodal_followup', 'verified_return', 'complete_exposure']:
                for source in self.atlas['sources']:
                    self.assertEqual(domain[source['source_id']], 'not_available')

    def test_compiled_metrics_reconcile_independently(self):
        frozen = ROOT / 'data/source-snapshots'
        football = json.loads((frozen / 'European_Football_Injuries/reports/dataset_summary.json').read_text(encoding='utf-8'))
        source = next(s for s in self.atlas['sources'] if s['source_id'] == 'european_football')
        self.assertEqual(source['metrics']['absence_records'], football['analysis_records'])
        self.assertEqual(source['metrics']['reported_episode_days_sum'], football['reported_total_days_out'])
        runners = self.atlas['charts']['runners_primary_validation']
        for row in runners:
            self.assertAlmostEqual(float(row['Label fraction']), int(row['Labels']) / int(row['Rows']))
        self.assertEqual(len(runners), 3)

    def test_frozen_source_archive_matches_manifest(self):
        with zipfile.ZipFile(RELEASE / 'source_snapshots.zip') as archive:
            for item in self.atlas['source_manifest']['files']:
                self.assertEqual(hashlib.sha256(archive.read(item['path'])).hexdigest(), item['sha256'])

    def test_notebook_runs_offline_against_release(self):
        notebook = json.loads((ROOT / 'notebooks/01_evidence_atlas_audit.ipynb').read_text(encoding='utf-8'))
        namespace = {'__name__': '__main__'}
        for index, cell in enumerate(notebook['cells']):
            if cell['cell_type'] == 'code':
                with self.subTest(cell=index):
                    with contextlib.redirect_stdout(io.StringIO()):
                        exec(compile(''.join(cell['source']), f'notebook-cell-{index}', 'exec'), namespace)

    def test_notebook_supports_kaggle_expanded_archive(self):
        notebook = json.loads((ROOT / 'notebooks/01_evidence_atlas_audit.ipynb').read_text(encoding='utf-8'))
        with tempfile.TemporaryDirectory(prefix='sports-rehab-kaggle-') as temporary:
            mounted = Path(temporary)
            for item in RELEASE.iterdir():
                if item.is_file() and item.name != 'source_snapshots.zip':
                    shutil.copyfile(item, mounted / item.name)
            with zipfile.ZipFile(RELEASE / 'source_snapshots.zip') as archive:
                for member in archive.namelist():
                    target = mounted / 'source_snapshots' / member
                    self.assertTrue(target.resolve().is_relative_to(mounted.resolve()))
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(archive.read(member))
            namespace = {'__name__': '__main__'}
            with patch('pathlib.Path.cwd', return_value=mounted), contextlib.redirect_stdout(io.StringIO()):
                for cell in notebook['cells']:
                    if cell['cell_type'] == 'code':
                        exec(compile(''.join(cell['source']), 'expanded-kaggle-cell', 'exec'), namespace)


if __name__ == '__main__':
    unittest.main()
