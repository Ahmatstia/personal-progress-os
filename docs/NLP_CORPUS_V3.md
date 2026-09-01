# Phase 12: Corpus v3 and Hard Examples

## Objective

Phase 12 improves intent boundaries using actual Phase 10 SVM and Phase 11 embedding confusions. It preserves v1 and v2 and does not change the Phase 8 production classifier.

## Hard Confusion Pairs

Priority pairs were `ANALYTICS <-> STREAK`, `PROGRESS <-> GOAL_STATUS`, `ANALYTICS <-> REFLECTION`, `NEXT_ACTION <-> TASK_SEARCH`, `FOCUS <-> TASK_SEARCH`, `BOTTLENECK <-> OVERDUE`, `BOTTLENECK <-> MOTIVATION`, `TASK_SEARCH <-> TASK_STATUS`, `TASK_COMPLETE <-> TASK_STATUS`, `TASK_COMPLETE <-> SESSION_END`, `TASK_REOPEN <-> TASK_COMPLETE`, and `SESSION_START <-> TASK_REOPEN`.

## Intent Boundaries

- `ANALYTICS`: analysis of historical or aggregate performance data.
- `STREAK`: consecutive activity days or continuity records.
- `PROGRESS`: amount or percentage of achievement.
- `GOAL_STATUS`: condition or lifecycle state of a specific goal.
- `NEXT_ACTION`: the next concrete action to take.
- `TASK_SEARCH`: finding one or more tasks.
- `TASK_STATUS`: state of a particular task.
- `TASK_COMPLETE`: marking or discussing task completion.
- `FOCUS`: selecting or managing today's priority work.
- `BOTTLENECK`: obstacle causing work to stall.
- `OVERDUE`: work past its deadline.
- `REFLECTION`: subjective learning or experience reflection.

## Construction

`src/ai/corpus/v3.ts` derives from v2 and adds 10 hard examples per intent. The examples vary sentence length and register while preserving one human-identifiable intent. They use boundary cues such as data/trends for analytics, consecutive days for streak, status/state for goals and tasks, lookup language for search, and explicit start/stop verbs for sessions.

## Quality

| Metric | V3 |
|---|---:|
| Examples | 960 |
| Intents | 24 |
| Examples per intent | 40 |
| Exact duplicates | 0 |
| Normalized duplicates | 0 |
| Empty texts | 0 |
| Invalid labels | 0 |

The 92 samples shorter than three words are inherited from v1/v2 and retained because concise commands can be natural input. No label corrections or removals were made.

## Evaluation Protocol

The unchanged Phase 10 pipeline uses normalized text, a stratified 80/20 split, and `random_state=42`. V3 has 768 train and 192 test examples. Both Logistic Regression and Linear SVM are evaluated with the same TF-IDF configuration.

## Results

| Model | V2 Accuracy | V3 Accuracy | V2 Macro F1 | V3 Macro F1 | Delta |
|---|---:|---:|---:|---:|---:|
| Logistic Regression | 0.7014 | 0.7917 | 0.6975 | 0.7860 | +0.0885 |
| Linear SVM | 0.7431 | 0.8229 | 0.7411 | 0.8207 | +0.0796 |

The improvement is meaningful for both models while class distribution remains balanced. V3 is therefore evidence that corpus quality was a major bottleneck, but it is still an evaluation corpus and is not deployed.

## V3 Error Analysis

The strongest remaining SVM confusion is `TASK_REOPEN -> TASK_COMPLETE` (3), followed by `UNKNOWN -> TASK_SEARCH` (2), `TASK_COMPLETE -> TASK_STATUS` (2), `REFLECTION -> TODAY` (2), `NEXT_ACTION -> TODAY` (2), and `ANALYTICS -> TIME_SPENT` (2). Weakest intents are `TASK_REOPEN` (F1 0.5000), `TASK_COMPLETE` (0.6250), `NEXT_ACTION` (0.6667), `TASK_SEARCH` (0.7368), and `REFLECTION` (0.7500).

## Phase 13 Recommendation

**READY FOR TRANSFORMER**, as an offline experiment only. V3 raises SVM macro F1 to 0.8207, but the remaining errors are concentrated in meaningful semantic/action boundaries. A transformer should be compared against SVM on a new held-out set; production deployment still requires separate validation.
