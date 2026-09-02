# ADR-002: Deterministic, approved knowledge only for tax answers

- **Date:** 2026-09-02
- **Status:** Accepted

## Context

Tax advice must be traceable to approved sources and must not fabricate answers. The locked requirements exclude AI, LLMs, RAG, embeddings, and vector databases.

## Decision

Use explicit, versioned decision trees and approved knowledge versions. When no approved path matches, return no definitive answer and offer consultation where appropriate.

## Alternatives rejected

- **LLM or RAG answer generation:** cannot provide the required deterministic, source-approved result.
- **Generic rule engine:** premature abstraction and explicitly out of scope.

## Consequences

Tax Q&A implementation remains blocked until the owner supplies approved sources, rules, effective dates, and review information.
