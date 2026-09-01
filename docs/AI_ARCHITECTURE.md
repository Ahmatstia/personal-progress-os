# AI Architecture

Personal Progress OS uses AI as an interpretation layer above domain services. Database records and existing services remain the source of truth; Phase 8 does not call an external model.

## Flow

User input -> normalization -> baseline intent classifier -> entity extraction -> validated interpretation -> context route descriptor -> existing domain service.

`IntentClassifier` is the replaceable contract. The current `BaselineClassifier` uses deterministic weighted phrases. A future TF-IDF classifier, transformer, or LLM adapter can implement the same interface without changing the API contract.

## Confidence

High is at least 0.80, medium is 0.55-0.79, and low is below 0.55. Low-confidence input is returned as `UNKNOWN`; no intent is forced.

## Entities and routing

The current extractor handles simple goal, date, duration, priority, and status phrases. The router maps intents to domain handlers such as `today`, `progress`, `analytics`, `review`, `task`, `session`, and `focus`. It returns descriptors only; executing domain mutations is future work.

## Limitations and roadmap

Phrase matching is language-specific and not a model evaluation system. Phase 9 should add a held-out evaluation set with TF-IDF plus Logistic Regression or Linear SVM. Later phases can evaluate transformer fine-tuning, LLM integration, and an adaptive coach, without making an LLM the data authority.
