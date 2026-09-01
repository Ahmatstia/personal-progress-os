import json
import unittest
from pathlib import Path

import torch
from transformers import AutoTokenizer

from evaluate_transformer import evaluate
from transformer_common import MODEL_DIR, TransformerIntentModel, encode


class TransformerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.labels = json.loads((MODEL_DIR / "labels.json").read_text(encoding="utf-8"))["labels"]
        cls.tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, local_files_only=True)
        cls.model = TransformerIntentModel(model_name=MODEL_DIR.as_posix(), num_labels=len(cls.labels))
        cls.model.classifier.load_state_dict(torch.load(MODEL_DIR / "classifier.pt", map_location="cpu", weights_only=True))
        cls.model.eval()

    def test_label_mapping_and_output_shape(self):
        self.assertEqual(len(self.labels), 24)
        tokens = encode(self.tokenizer, ["bagaimana progres saya", "saya mau mulai sesi"])
        with torch.inference_mode():
            output = self.model(tokens["input_ids"], tokens["attention_mask"])
        self.assertEqual(tuple(output.shape), (2, 24))

    def test_prediction_decoding_is_deterministic(self):
        tokens = encode(self.tokenizer, ["berapa kemajuan target saya"])
        with torch.inference_mode():
            first = self.model(tokens["input_ids"], tokens["attention_mask"]).argmax(dim=1).item()
            second = self.model(tokens["input_ids"], tokens["attention_mask"]).argmax(dim=1).item()
        self.assertEqual(first, second)
        self.assertIn(self.labels[first], self.labels)

    def test_evaluation_contains_metrics_and_errors(self):
        result = evaluate(Path(__file__).parent / "data" / "corpus_v3.json", MODEL_DIR)
        self.assertEqual(result["corpus"]["examples"], 960)
        self.assertIn("accuracy", result["metrics"])
        self.assertIn("macroF1", result["metrics"])
        self.assertEqual(len(result["metrics"]["confusionMatrix"]), 24)
        self.assertIn("singleTextLatencyMs", result["transformer"])


if __name__ == "__main__":
    unittest.main()
