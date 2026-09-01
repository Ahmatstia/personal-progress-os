from __future__ import annotations

import argparse
from pathlib import Path

import torch
from torch.optim import AdamW
from torch.utils.data import DataLoader, TensorDataset
from transformers import AutoTokenizer

from transformer_common import BATCH_SIZE, EPOCHS, LEARNING_RATE, MODEL_DIR, MODEL_NAME, TransformerIntentModel, encode, save_metadata, seed_everything, split_corpus


def train(corpus_path: Path, output_dir: Path = MODEL_DIR) -> Path:
    seed_everything()
    train_texts, _, train_labels, _, intents = split_corpus(corpus_path)
    label_to_id = {label: index for index, label in enumerate(intents)}
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, local_files_only=True)
    tokens = encode(tokenizer, train_texts)
    labels = torch.tensor([label_to_id[label] for label in train_labels], dtype=torch.long)
    dataset = TensorDataset(tokens["input_ids"], tokens["attention_mask"], labels)
    loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True, generator=torch.Generator().manual_seed(42))
    model = TransformerIntentModel(num_labels=len(intents))
    optimizer = AdamW(model.parameters(), lr=LEARNING_RATE)
    loss_fn = torch.nn.CrossEntropyLoss()
    model.train()
    for epoch in range(EPOCHS):
        total_loss = 0.0
        for input_ids, attention_mask, batch_labels in loader:
            optimizer.zero_grad()
            loss = loss_fn(model(input_ids, attention_mask), batch_labels)
            loss.backward()
            optimizer.step()
            total_loss += float(loss.detach())
        print(f"epoch {epoch + 1}/{EPOCHS} loss={total_loss / len(loader):.4f}")
    output_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.classifier.state_dict(), output_dir / "classifier.pt")
    model.encoder.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    save_metadata(output_dir, intents)
    return output_dir


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune the local transformer on corpus v3.")
    parser.add_argument("--corpus", type=Path, default=Path(__file__).resolve().parent / "data" / "corpus_v3.json")
    parser.add_argument("--output", type=Path, default=MODEL_DIR)
    args = parser.parse_args()
    print(f"Saved transformer artifact to {train(args.corpus, args.output)}")
