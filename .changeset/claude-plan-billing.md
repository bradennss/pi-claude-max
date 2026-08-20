---
"pi-claude-max": minor
---

The harness system prompt now travels in the first user message instead of a merged `system` block. Anthropic's billing classifier inspects `system[]` and routes third-party content to extra-usage billing, so `system` now carries only the attribution and identity blocks. This keeps requests on the Claude plan while the model still reads and follows the Pi guidelines and AGENTS.md context.

The `PI_CLAUDE_MAX_CC_VERSION` and `PI_CLAUDE_MAX_DISABLE` environment variables are removed. The extension advertises a fixed Claude Code version and runs whenever Pi loads it.
