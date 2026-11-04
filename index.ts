/**
 * pi-claude-max routes Anthropic OAuth requests to Claude Pro/Max subscription
 * billing.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { applyClaudeCodeHeaders } from "./src/headers.ts";
import {
  isOAuthClaudeCodeSystem,
  type MessageLike,
  buildClaudeCodeSystem,
} from "./src/system-prompt.ts";

export default function claudeMax(pi: ExtensionAPI): void {
  pi.on("before_provider_headers", async (event, ctx) => {
    if (ctx.model?.provider !== "anthropic") return;
    // This hook runs before the SDK adds its OAuth beta and auth headers.
    const apiKey = await ctx.modelRegistry.getApiKeyForProvider("anthropic");
    if (!apiKey?.includes("sk-ant-oat")) return;
    applyClaudeCodeHeaders(event.headers, ctx.sessionManager.getSessionId());
  });

  pi.on("before_provider_request", (event, ctx) => {
    if (ctx.model?.provider !== "anthropic") return undefined;
    if (!event.payload || typeof event.payload !== "object") return undefined;
    const payload = event.payload as {
      system?: unknown;
      messages?: readonly MessageLike[];
    };
    if (!isOAuthClaudeCodeSystem(payload.system)) return undefined;
    if (payload.messages !== undefined && !Array.isArray(payload.messages)) {
      return undefined;
    }
    return {
      ...payload,
      system: buildClaudeCodeSystem(payload.system, payload.messages ?? []),
    };
  });
}
