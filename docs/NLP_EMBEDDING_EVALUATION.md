# Phase 11: Embedding Evaluation

## Objective

Phase 11 tests whether a local sentence embedding representation improves intent classification for Indonesian paraphrases, short queries, and overlapping vocabulary. The experiment is isolated from `/api/ai/interpret`; Phase 8 deterministic classification remains production behavior.

## Model

- Model: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- Library: `sentence-transformers` 5.5.0
- Dimension: 384
- Language: multilingual, including Indonesian
- Runtime: local CPU inference, `local_files_only=True`
- Method: sentence embeddings, normalized centroid per intent, cosine similarity

The model was already available in the local Hugging Face cache, so no API key or external inference service is needed. A clean machine must provide the model cache before running the experiment because this phase intentionally does not download models at runtime.

## Architecture

```text
text
  -> Phase 9-compatible normalization
  -> sentence embedding
  -> normalized centroid for each intent
  -> cosine similarity
  -> predicted intent + similarity + heuristic confidence
```

Confidence levels are heuristic labels only: HIGH at similarity `>= 0.75`, MEDIUM at `>= 0.55`, otherwise LOW. Similarity is not calibrated probability. Empty input returns `UNKNOWN` with LOW confidence.

## Dataset and Protocol

Corpus v2 contains 720 examples across 24 intents. The same stratified 80/20 protocol as Phase 10 is used: 576 train, 144 test, `random_state=42`. The test set is not changed to favor embeddings.

## Benchmark

| Model | Accuracy | Macro Precision | Macro Recall | Macro F1 | Weighted F1 |
|---|---:|---:|---:|---:|---:|
| TF-IDF + Linear SVM | 0.7431 | 0.7621 | 0.7431 | 0.7411 | 0.7411 |
| Embedding centroid | 0.6736 | 0.7112 | 0.6736 | 0.6687 | 0.6687 |

Macro F1 delta, embedding minus SVM: `-0.0724`. Embedding fit and test latency was approximately 8.65 seconds on the local CPU run, including model initialization. This is an experiment-level timing, not a production SLA.

## Error Analysis

Embedding top confusion pairs:

- `GOAL_STATUS -> PROGRESS`: 3
- `REVIEW -> ANALYTICS`: 2
- `NEXT_ACTION -> TASK_SEARCH`: 2
- `FOCUS -> TASK_SEARCH`: 2
- `BOTTLENECK -> OVERDUE`: 2
- `BOTTLENECK -> MOTIVATION`: 2
- `ANALYTICS -> REFLECTION`: 2

Weakest embedding intents by F1 were `ANALYTICS` (0.0000), `BOTTLENECK` (0.2000), `NEXT_ACTION` (0.2857), `TASK_SEARCH` (0.4000), and `TASK_COMPLETE` (0.5333). Strongest were `SESSION_END` (1.0000), `TIME_SPENT` (0.9231), `GOAL_CREATE` (0.9231), `HELP` (0.9091), and `UNKNOWN` (0.8333).

The embedding representation did not resolve the main semantic overlaps better than the sparse SVM baseline on this corpus. Centroid averaging also removes some fine-grained action cues that distinguish related intents.

## Production Decision

**KEEP SVM.** The embedding classifier is not a production candidate because it is 7.24 macro-F1 points below TF-IDF + Linear SVM. It remains useful as an offline comparison and future hybrid component, but it must not replace the Phase 8 classifier or change the existing API.

Run the experiment with:

```text
npm run nlp:evaluate:embedding
npm run nlp:benchmark:embedding
npm run nlp:test
```

## Limitations and Phase 12

The corpus has 720 curated examples but only one fixed split, and centroid classification is deliberately simple. The cached multilingual model is general-purpose rather than Indonesian-specific, and CPU inference is relatively slow. Phase 12 transformer fine-tuning is not automatically justified: first consider more held-out natural examples and a supervised/hybrid approach, then evaluate a transformer only if the semantic confusion persists and computational cost is acceptable.
