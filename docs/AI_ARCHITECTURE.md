# AI Architecture

Personal Progress OS uses AI as an interpretation layer above domain services. Database records and existing services remain the source of truth; Phase 8 does not call an external model.

## Flow

User input -> normalization -> baseline intent classifier -> entity extraction -> validated interpretation -> context route descriptor -> existing domain service.

`IntentClassifier` is the replaceable contract. The current `BaselineClassifier` uses deterministic weighted phrases. A future TF-IDF classifier, transformer, or LLM adapter can implement the same interface without changing the API contract.

## Confidence

High is at least 0.80, medium is 0.55-0.79, and low is below 0.55. Low-confidence input is returned as `UNKNOWN`; no intent is forced.

## Entities and routing

The current extractor handles simple goal, date, duration, priority, and status phrases. The router maps intents to domain handlers such as `today`, `progress`, `analytics`, `review`, `task`, `session`, and `focus`. It returns descriptors only; executing domain mutations is future work.

## Baseline evaluation

Phase 9 adds a separate Python evaluation module under `nlp/`. It exports the TypeScript corpus to JSON and compares TF-IDF plus Logistic Regression with TF-IDF plus Linear SVM using a fixed stratified split. This evaluator is offline and does not affect the Next.js inference path.

## Limitations and roadmap

Phrase matching is language-specific. The Phase 9 baseline is also limited by the current 20 examples per intent and should be treated as a comparison point, not a production quality claim. Later phases can evaluate transformer fine-tuning, LLM integration, and an adaptive coach, without making an LLM the data authority.
