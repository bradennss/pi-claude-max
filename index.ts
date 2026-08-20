/**
 * pi-claude-max - Route Anthropic OAuth requests through Claude Pro/Max
 * subscription billing.
 *
 * Env: PI_CLAUDE_MAX_CC_VERSION overrides the version; PI_CLAUDE_MAX_DISABLE=1 no-ops.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { resolveClaudeCodeVersion, userAgent } from "./src/billing.ts";
import {
  isOAuthClaudeCodeSystem,
  type MessageLike,
  mergeSystemBlocks,
} from "./src/system-prompt.ts";

export default function claudeMax(pi: ExtensionAPI): void {
  if (process.env.PI_CLAUDE_MAX_DISABLE === "1") return;

  const version = resolveClaudeCodeVersion();
  const ua = userAgent(version);

  pi.on("before_provider_headers", (event, ctx) => {
    if (ctx.model?.provider !== "anthropic") return;
    event.headers["user-agent"] = ua;
  });

  pi.on("before_provider_request", (event, ctx) => {
    if (ctx.model?.provider !== "anthropic") return undefined;
    const payload = event.payload as {
      system?: unknown;
      messages?: readonly MessageLike[];
    };
    if (!isOAuthClaudeCodeSystem(payload.system)) return undefined;
    return {
      ...payload,
      system: mergeSystemBlocks(
        payload.system,
        payload.messages ?? [],
        version,
      ),
    };
  });
}
