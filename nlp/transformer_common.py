from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any

import numpy as np
import torch
from sklearn.model_selection import train_test_split
from torch import nn
from transformers import AutoModel, AutoTokenizer

from evaluate import RANDOM_STATE, TEST_SIZE, load_corpus, normalize_text

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
MAX_LENGTH = 48
SEED = 42
EPOCHS = 3
BATCH_SIZE = 16
LEARNING_RATE = 2e-5
MODEL_DIR = Path(__file__).resolve().parent / "models" / "transformer_v3"


def seed_everything(seed: int = SEED) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def split_corpus(path: Path) -> tuple[list[str], list[str], list[str], list[str], list[str]]:
    corpus = load_corpus(path)
    examples = corpus["examples"]
    texts = [normalize_text(example["text"]) for example in examples]
    labels = [example["intent"] for example in examples]
    train_texts, test_texts, train_labels, test_labels = train_test_split(
        texts, labels, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=labels
    )
    return train_texts, test_texts, train_labels, test_labels, sorted(set(labels))


class TransformerIntentModel(nn.Module):
    def __init__(self, model_name: str = MODEL_NAME, num_labels: int = 24, local_files_only: bool = True) -> None:
        super().__init__()
        self.encoder = AutoModel.from_pretrained(model_name, local_files_only=local_files_only)
        self.dropout = nn.Dropout(0.1)
        self.classifier = nn.Linear(self.encoder.config.hidden_size, num_labels)

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        output = self.encoder(input_ids=input_ids, attention_mask=attention_mask)
        mask = attention_mask.unsqueeze(-1).float()
        pooled = (output.last_hidden_state * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)
        return self.classifier(self.dropout(pooled))


def encode(tokenizer: Any, texts: list[str]) -> dict[str, torch.Tensor]:
    return tokenizer(texts, padding=True, truncation=True, max_length=MAX_LENGTH, return_tensors="pt")


def save_metadata(path: Path, labels: list[str]) -> None:
    path.mkdir(parents=True, exist_ok=True)
    (path / "labels.json").write_text(json.dumps({"labels": labels}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (path / "training_config.json").write_text(json.dumps({"model": MODEL_NAME, "maxLength": MAX_LENGTH, "epochs": EPOCHS, "batchSize": BATCH_SIZE, "learningRate": LEARNING_RATE, "seed": SEED}, indent=2) + "\n", encoding="utf-8")
