import { expect, test } from "vitest";
import {
  DEFAULT_CLAUDE_CODE_VERSION,
  billingAttribution,
  computeFingerprint,
  userAgent,
} from "../src/billing.ts";

test("userAgent matches the Claude Code format", () => {
  expect(userAgent("2.1.280")).toBe("claude-cli/2.1.280 (external, cli)");
});

test("userAgent defaults to the advertised version", () => {
  expect(userAgent()).toBe(
    `claude-cli/${DEFAULT_CLAUDE_CODE_VERSION} (external, cli)`,
  );
});

test("computeFingerprint reproduces a real captured fingerprint", () => {
  expect(
    computeFingerprint("Reply with the single word: pong", "2.1.211"),
  ).toBe("f82");
});

test("computeFingerprint is 3 lowercase hex chars and deterministic", () => {
  const fp = computeFingerprint("hello world example prompt", "2.1.280");
  expect(fp).toMatch(/^[0-9a-f]{3}$/);
  expect(computeFingerprint("hello world example prompt", "2.1.280")).toBe(fp);
});

test("computeFingerprint pads short messages with '0' instead of throwing", () => {
  expect(computeFingerprint("ab", "2.1.280")).toMatch(/^[0-9a-f]{3}$/);
});

test("billingAttribution matches the captured 2.1.311 fingerprint", () => {
  expect(
    billingAttribution("Reply with the single word: pong", "2.1.311"),
  ).toBe(
    "x-anthropic-billing-header: cc_version=2.1.311.7ca; cc_entrypoint=cli;",
  );
});
