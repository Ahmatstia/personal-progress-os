# NLP Corpus Engineering

Phase 10 improves the Indonesian corpus using the Phase 9 held-out errors rather than adding random paraphrases.

## Versions

| Metric | v1 | v2 |
|---|---:|---:|
| Examples | 480 | 720 |
| Intents | 24 | 24 |
| Average per intent | 20 | 30 |
| Exact duplicates | 0 | 0 |

`src/ai/corpus/v1.ts` remains unchanged and `activeCorpus` still points to v1. `src/ai/corpus/v2.ts` adds 10 examples per intent and is exported separately to `nlp/data/corpus_v2.json`.

## Error Findings

Phase 9's Linear SVM most often confused:

- `ANALYTICS -> STREAK` (2)
- `TODAY -> NEXT_ACTION` (1)
- `TIME_SPENT -> STREAK` (1)
- `TASK_SEARCH -> TASK_STATUS` (1)
- `TASK_REOPEN -> TASK_COMPLETE` (1)

The weakest v1 intents by SVM F1 were `ANALYTICS` (0.0000), `REFLECTION` (0.2857), `BOTTLENECK` (0.5000), `FOCUS` (0.5000), and `PROGRESS` (0.5000). Strongest were `TASK_SEARCH`, `TASK_CREATE`, `OVERDUE`, `COMPLETION` (0.8571), and `UNKNOWN` (0.8000).

The additions emphasize explicit semantic cues: analytics uses data, trends, graphs, and metrics; streak uses consecutive days and records; session intents use start/stop actions; task status/search/completion use distinct lookup, state, and mutation language. Formal, conversational, and light informal Indonesian variants were added without introducing heavy typo or narrow slang coverage.

## v2 Quality

The v2 audit reports 720 samples, 30 per intent, no exact duplicates, no empty text, and no invalid labels. It reports 92 samples under three words across the inherited corpus; these are retained because short commands can be natural user input and similarity alone is not sufficient evidence for deletion.

## Benchmark

Both versions use the same stratified 80/20 split and `random_state=42`. Phase 10 results are recorded in the final implementation report and can be regenerated with `npm run nlp:evaluate:v2`.

The v2 corpus is not wired into production inference. This preserves the Phase 8 deterministic classifier and keeps the benchmark isolated from application behavior.
