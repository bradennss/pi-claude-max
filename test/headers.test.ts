import { expect, test } from "vitest";
import { userAgent } from "../src/billing.ts";
import { applyClaudeCodeHeaders } from "../src/headers.ts";

test("sets OAuth client identity and session headers without duplicate casing", () => {
  const headers = {
    "Anthropic-Beta": "claude-code-20250219, oauth-2025-04-20,other-beta",
    "User-Agent": "old-agent",
    "X-App": "old-app",
    "X-Claude-Code-Session-Id": "old-session",
    Authorization: "Bearer test-token",
    "X-Stainless-Runtime-Version": "v22.0.0",
  };
  const original = { ...headers };
  applyClaudeCodeHeaders(headers, "current-session");
  expect(headers).toEqual({
    "Anthropic-Beta": original["Anthropic-Beta"],
    Authorization: original.Authorization,
    "X-Stainless-Runtime-Version": "v22.0.0",
    "user-agent": userAgent(),
    "x-app": "cli",
    "x-claude-code-session-id": "current-session",
  });
});

test("uses the current session on each request", () => {
  const headers = {};
  applyClaudeCodeHeaders(headers, "first-session");
  applyClaudeCodeHeaders(headers, "next-session");
  expect(headers).toEqual({
    "user-agent": userAgent(),
    "x-app": "cli",
    "x-claude-code-session-id": "next-session",
  });
});
