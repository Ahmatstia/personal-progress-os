import unittest
from pathlib import Path

import numpy as np

from embedding_classifier import EmbeddingIntentClassifier, confidence_level
from evaluate_embedding import evaluate


class EmbeddingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.classifier = EmbeddingIntentClassifier()
        cls.classifier.fit(["lihat progres saya", "beri saya semangat"], ["PROGRESS", "MOTIVATION"])

    def test_embedding_shape_and_normalization(self):
        vectors = self.classifier.encode(["bagaimana kemajuan saya"])
        self.assertEqual(vectors.shape, (1, 384))
        self.assertAlmostEqual(float(np.linalg.norm(vectors[0])), 1.0, places=4)

    def test_cosine_prediction_and_confidence(self):
        result = self.classifier.predict_one("saya ingin melihat progres")
        self.assertEqual(result, self.classifier.predict_one("saya ingin melihat progres"))
        self.assertEqual(result["intent"], "PROGRESS")
        self.assertGreaterEqual(result["similarity"], -1)
        self.assertLessEqual(result["similarity"], 1)
        self.assertIn(result["confidence"], {"HIGH", "MEDIUM", "LOW"})

    def test_empty_input_and_confidence_threshold(self):
        self.assertEqual(self.classifier.predict_one(""), {"intent": "UNKNOWN", "similarity": 0.0, "confidence": "LOW"})
        self.assertEqual(confidence_level(0.8), "HIGH")
        self.assertEqual(confidence_level(0.6), "MEDIUM")
        self.assertEqual(confidence_level(0.2), "LOW")

    def test_embedding_evaluation_report(self):
        result = evaluate(Path(__file__).parent / "data" / "corpus_v2.json")
        self.assertEqual(result["corpus"]["examples"], 720)
        self.assertEqual(result["embedding"]["dimension"], 384)
        self.assertIn("macroF1", result["metrics"])
        self.assertEqual(len(result["metrics"]["confusionMatrix"]), 24)
        self.assertLessEqual(len(result["metrics"]["topConfusionPairs"]), 10)


if __name__ == "__main__":
    unittest.main()
