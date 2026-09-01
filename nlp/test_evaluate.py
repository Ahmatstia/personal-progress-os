import unittest
from pathlib import Path

from evaluate import evaluate, load_corpus, normalize_text


class EvaluationTests(unittest.TestCase):
    def test_corpus_is_loadable_and_complete(self):
        corpus = load_corpus(Path(__file__).parent / "data" / "corpus_v1.json")
        self.assertEqual(corpus["version"], "1.0.0")
        self.assertEqual(len(corpus["examples"]), 480)

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


if __name__ == "__main__":
    unittest.main()
