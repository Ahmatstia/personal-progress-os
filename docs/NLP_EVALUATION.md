# Baseline NLP Evaluation

Phase 9 evaluates two local, non-LLM classifiers over the Indonesian Phase 8 corpus:

- TF-IDF (unigrams and bigrams, sublinear term frequency) + Logistic Regression
- TF-IDF (unigrams and bigrams, sublinear term frequency) + Linear SVM

The TypeScript corpus remains the source of truth. `npm run nlp:export` creates the JSON interchange snapshot at `nlp/data/corpus_v1.json` for Python, while `npm run nlp:export:v2` creates `nlp/data/corpus_v2.json`. The evaluator uses a stratified 80/20 split with `random_state=42`, so comparisons are reproducible.

Run:

```text
npm run nlp:export
npm run nlp:evaluate
npm run nlp:export:v2
npm run nlp:evaluate:v2
npm run nlp:export:v3
npm run nlp:evaluate:v3
npm run nlp:test
```

Metrics include accuracy, macro precision, macro recall, macro F1, weighted F1, per-intent scores, a labeled confusion matrix, top-10 confusion pairs, and misclassified examples. Macro metrics are the primary comparison because every intent should matter equally, including `UNKNOWN`.

The corpus is intentionally phrase-oriented. Scores are a baseline, not evidence of production language understanding. Use `--json` for the complete error analysis report. Phase 10 and Phase 12 compare versioned corpora with the same pipeline; these corpora do not replace the Phase 8 production classifier.
