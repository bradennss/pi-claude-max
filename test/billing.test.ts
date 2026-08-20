import { expect, test } from "vitest";
import {
  DEFAULT_CLAUDE_CODE_VERSION,
  billingAttribution,
  computeFingerprint,
  resolveClaudeCodeVersion,
  userAgent,
} from "../src/billing.ts";

test("userAgent matches the Claude Code format", () => {
  expect(userAgent("2.1.211")).toBe("claude-cli/2.1.211 (external, cli)");
});

test("computeFingerprint reproduces a real captured fingerprint", () => {
  expect(
    computeFingerprint("Reply with the single word: pong", "2.1.211"),
  ).toBe("f82");
});

test("computeFingerprint is 3 lowercase hex chars and deterministic", () => {
  const fp = computeFingerprint("hello world example prompt", "2.1.211");
  expect(fp).toMatch(/^[0-9a-f]{3}$/);
  expect(computeFingerprint("hello world example prompt", "2.1.211")).toBe(fp);
});

test("computeFingerprint pads short messages with '0' instead of throwing", () => {
  expect(computeFingerprint("ab", "2.1.211")).toMatch(/^[0-9a-f]{3}$/);
});

test("billingAttribution renders the exact header line", () => {
  expect(
    billingAttribution("Reply with the single word: pong", "2.1.211"),
  ).toBe(
    "x-anthropic-billing-header: cc_version=2.1.211.f82; cc_entrypoint=cli;",
  );
});

test("resolveClaudeCodeVersion honors a valid override", () => {
  expect(resolveClaudeCodeVersion({ PI_CLAUDE_MAX_CC_VERSION: "2.2.0" })).toBe(
    "2.2.0",
  );
});

test("resolveClaudeCodeVersion rejects malformed overrides", () => {
  for (const bad of ["latest", "2.1", "v2.1.211", "", "  "]) {
    expect(resolveClaudeCodeVersion({ PI_CLAUDE_MAX_CC_VERSION: bad })).toBe(
      DEFAULT_CLAUDE_CODE_VERSION,
    );
  }
});

test("resolveClaudeCodeVersion defaults when unset", () => {
  expect(resolveClaudeCodeVersion({})).toBe(DEFAULT_CLAUDE_CODE_VERSION);
});
