# Phase 13: Transformer Evaluation

## Objective

Phase 13 tests a locally fine-tuned transformer against the official Phase 12 TF-IDF + Linear SVM baseline on Indonesian intent classification. This is an offline research pipeline only; the Phase 8 production classifier and `/api/ai/interpret` are unchanged.

## Dataset and Split

Corpus v3 is used without modification: 960 examples, 24 intents, and 40 examples per intent. The comparison uses the same stratified 80/20 split as Phase 10-12 with `random_state=42`: 768 train and 192 test examples. The test set is never used during training.

## Transformer Model

- Model: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- Library: `transformers` with PyTorch
- Hidden dimension: 384
- Language: multilingual, including Indonesian
- Maximum sequence length: 48
- Local/offline: yes, `local_files_only=True`
- Base model artifact: `model.safetensors`
- Classifier: one linear head over mean-pooled token representations

The model was selected because it was already present in the local Hugging Face cache and is substantially lighter than a large transformer. No API key, external inference, or external corpus transfer is used.

## Training Configuration

- Epochs: 3
- Batch size: 16
- Learning rate: `2e-5`
- Optimizer: AdamW
- Loss: cross-entropy
- Seed: 42 for Python, NumPy, PyTorch, and DataLoader shuffle
- Device: CPU fallback used successfully
- Training loss: `3.0702 -> 2.4703 -> 1.7696`

The saved artifact contains the encoder safetensors, tokenizer, label mapping, training configuration, and a separate classification head. Generated artifacts are ignored under `nlp/models/`.

## Benchmark

| Model | Accuracy | Macro Precision | Macro Recall | Macro F1 | Weighted F1 |
|---|---:|---:|---:|---:|---:|
| TF-IDF + Linear SVM | 0.8229 | 0.8407 | 0.8229 | 0.8207 | 0.8207 |
| Transformer classifier | 0.7448 | 0.8073 | 0.7448 | 0.7368 | 0.7368 |

Transformer macro F1 delta versus SVM: `-0.0839`. The transformer does not beat the baseline on corpus v3.

## Error Analysis

Transformer top confusion pairs:

- `TASK_SEARCH -> TASK_STATUS`: 3
- `REFLECTION -> TODAY`: 3
- `PROGRESS -> GOAL_STATUS`: 3
- `ANALYTICS -> REFLECTION`: 3
- `TASK_SEARCH -> GOAL_STATUS`: 2
- `TASK_COMPLETE -> TASK_REOPEN`: 2
- `GOAL_STATUS -> PROGRESS`: 2
- `ANALYTICS -> TIME_SPENT`: 2

Weakest transformer intents were `ANALYTICS` (F1 0.2222), `REFLECTION` (0.3529), `GOAL_STATUS` (0.5000), `TASK_SEARCH` (0.5455), and `UNKNOWN` (0.5455). Strongest were `OVERDUE`, `MOTIVATION`, `GOAL_CREATE`, and `FOCUS` (1.0000), followed by `STREAK` (0.8750).

The transformer improved some action/priority boundaries, but did not reduce the most important semantic overlap consistently. `ANALYTICS`, `REFLECTION`, `TASK_SEARCH`, and `PROGRESS/GOAL_STATUS` remain problematic.

## Latency

Measured after model initialization on local CPU:

- Single text mean: 16.39 ms
- Median: 16.20 ms
- Minimum: 15.02 ms
- Maximum: 17.46 ms
- Batch of 192 test texts: 691.30 ms

These numbers exclude model loading and are experiment-level measurements.

## Model Size

Generated artifact size:

- Encoder `model.safetensors`: 470,637,416 bytes
- Tokenizer: 17,083,597 bytes
- Classification head and metadata: 49,484 bytes
- Total: 487,761,273 bytes, approximately 465.1 MiB

The artifact is not committed to the repository.

## Production Decision

**KEEP SVM.** The transformer macro F1 is `0.7368`, which is `0.0839` below SVM's `0.8207`. Its latency is acceptable for a research candidate, but the accuracy regression and large artifact make it unsuitable as a production replacement. The production Phase 8 classifier remains unchanged.

## Reproducibility

```text
npm run nlp:train:transformer
npm run nlp:evaluate:transformer
npm run nlp:benchmark:transformer
npm run nlp:test
```

The model must already exist in the local Hugging Face cache. A clean environment should fail clearly rather than silently downloading a model.

## Next Phase Recommendation

Do not proceed directly to transformer deployment. Continue targeted corpus/error analysis or test a lighter supervised hybrid approach first. A future transformer experiment is reasonable only with a new held-out set and a clear plan to reduce the remaining action and semantic-boundary confusions.
