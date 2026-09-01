import unittest
from pathlib import Path

from evaluate import audit_corpus, evaluate, load_corpus, normalize_text


class EvaluationTests(unittest.TestCase):
    def test_corpus_is_loadable_and_complete(self):
        corpus = load_corpus(Path(__file__).parent / "data" / "corpus_v1.json")
        self.assertEqual(corpus["version"], "1.0.0")
        self.assertEqual(len(corpus["examples"]), 480)

    def test_corpus_quality_invariants(self):
        for filename, expected_version, expected_count in (("corpus_v1.json", "1.0.0", 480), ("corpus_v2.json", "2.0.0", 720)):
            corpus = load_corpus(Path(__file__).parent / "data" / filename)
            self.assertRegex(corpus["version"], r"^\d+\.\d+\.\d+$")
            self.assertEqual(corpus["version"], expected_version)
            self.assertEqual(len(corpus["examples"]), expected_count)
            self.assertTrue(all(example.get("text", "").strip() for example in corpus["examples"]))
            self.assertTrue(all(example.get("intent") in corpus["intents"] for example in corpus["examples"]))
            self.assertEqual(audit_corpus(corpus)["duplicateExact"], 0)
            self.assertTrue(all(count > 0 for count in audit_corpus(corpus)["classDistribution"].values()))

    def test_normalization_is_stable(self):
        self.assertEqual(normalize_text("  Apa yg harus saya kerjain??? "), "apa yang harus saya mengerjakan")

    def test_both_models_produce_comparable_metrics(self):
        result = evaluate()
        self.assertEqual(set(result["models"]), {"tfidf_logistic_regression", "tfidf_linear_svm"})
        for metrics in result["models"].values():
            self.assertGreaterEqual(metrics["accuracy"], 0)
            self.assertLessEqual(metrics["accuracy"], 1)
            self.assertEqual(len(metrics["intents"]), 24)
            self.assertEqual(len(metrics["confusionMatrix"]), 24)
            self.assertIn("weightedF1", metrics)
            self.assertLessEqual(len(metrics["topConfusionPairs"]), 10)
            self.assertTrue(all(set(example) == {"actual", "predicted", "text"} for example in metrics["misclassifiedExamples"]))


if __name__ == "__main__":
    unittest.main()
