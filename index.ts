/**
 * pi-claude-max routes Anthropic OAuth requests to Claude Pro/Max subscription
 * billing.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { DEFAULT_CLAUDE_CODE_VERSION, userAgent } from "./src/billing.ts";
import {
  isOAuthClaudeCodeSystem,
  type MessageLike,
  relocateSystemToUser,
} from "./src/system-prompt.ts";

export default function claudeMax(pi: ExtensionAPI): void {
  const version = DEFAULT_CLAUDE_CODE_VERSION;
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
    const { system, messages } = relocateSystemToUser(
      payload.system,
      payload.messages ?? [],
      version,
    );
    return { ...payload, system, messages };
  });
}
