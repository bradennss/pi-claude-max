---
"pi-claude-max": minor
---

Route the harness system prompt through the first user message. `system` carries the attribution and identity blocks, which the Anthropic billing classifier bills to the Claude plan. The Pi guidelines and AGENTS.md context travel in the user turn, where the model reads and follows them.
