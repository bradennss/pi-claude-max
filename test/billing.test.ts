import { expect, test } from "vitest";
import {
  billingAttribution,
  computeFingerprint,
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
