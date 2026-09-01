# Baseline NLP Evaluation

Phase 9 evaluates two local, non-LLM classifiers over the Indonesian Phase 8 corpus:

- TF-IDF (unigrams and bigrams, sublinear term frequency) + Logistic Regression
- TF-IDF (unigrams and bigrams, sublinear term frequency) + Linear SVM

The TypeScript corpus remains the source of truth. `npm run nlp:export` creates the JSON interchange snapshot at `nlp/data/corpus_v1.json` for Python. The evaluator uses a stratified 80/20 split with `random_state=42`, so comparisons are reproducible.

Run:

```text
npm run nlp:export
npm run nlp:evaluate
npm run nlp:test
```

Metrics include accuracy, macro precision, macro recall, macro F1, per-intent scores, and a labeled confusion matrix. Macro metrics are the primary comparison because every intent should matter equally, including `UNKNOWN`.

The current corpus is intentionally small and phrase-oriented. Scores are a baseline, not evidence of production language understanding. Phase 9 should use this report to identify confused intent pairs and expand the held-out evaluation set before selecting a later model.
