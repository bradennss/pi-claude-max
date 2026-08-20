import { expect, test } from "vitest";
import { CLAUDE_CODE_IDENTITY } from "../src/billing.ts";
import {
  type SystemBlock,
  extractFirstUserMessageText,
  isOAuthClaudeCodeSystem,
  mergeSystemBlocks,
} from "../src/system-prompt.ts";

const oauthSystem: SystemBlock[] = [
  {
    type: "text",
    text: CLAUDE_CODE_IDENTITY,
    cache_control: { type: "ephemeral" },
  },
  { type: "text", text: "You are an expert coding assistant." },
];

test("isOAuthClaudeCodeSystem detects the OAuth Claude Code shape", () => {
  expect(isOAuthClaudeCodeSystem(oauthSystem)).toBe(true);
});

test("isOAuthClaudeCodeSystem rejects API-key / foreign shapes", () => {
  expect(isOAuthClaudeCodeSystem(undefined)).toBe(false);
  expect(isOAuthClaudeCodeSystem("a plain string system")).toBe(false);
  expect(isOAuthClaudeCodeSystem([])).toBe(false);
  expect(
    isOAuthClaudeCodeSystem([
      { type: "text", text: "You are a helpful assistant." },
    ]),
  ).toBe(false);
});

test("extractFirstUserMessageText handles string and block content", () => {
  expect(
    extractFirstUserMessageText([{ role: "user", content: "hi there" }]),
  ).toBe("hi there");
  expect(
    extractFirstUserMessageText([
      { role: "assistant", content: "ignored" },
      { role: "user", content: [{ type: "text", text: "block text" }] },
    ]),
  ).toBe("block text");
  expect(extractFirstUserMessageText([])).toBe("");
});

test("mergeSystemBlocks collapses to one block with attribution + identity + user text", () => {
  const messages = [
    { role: "user", content: "Reply with the single word: pong" },
  ];
  const merged = mergeSystemBlocks(oauthSystem, messages, "2.1.211");
  expect(merged.length).toBe(1);
  expect(merged[0].text).toBe(
    "x-anthropic-billing-header: cc_version=2.1.211.f82; cc_entrypoint=cli;\n\n" +
      `${CLAUDE_CODE_IDENTITY}\n\n` +
      "You are an expert coding assistant.",
  );
});

test("mergeSystemBlocks preserves cache_control from the first block", () => {
  const merged = mergeSystemBlocks(oauthSystem, [], "2.1.211");
  expect(merged[0].cache_control).toEqual({ type: "ephemeral" });
});

test("mergeSystemBlocks works when there is no user system block", () => {
  const single: SystemBlock[] = [{ type: "text", text: CLAUDE_CODE_IDENTITY }];
  const merged = mergeSystemBlocks(
    single,
    [{ role: "user", content: "x" }],
    "2.1.211",
  );
  expect(merged.length).toBe(1);
  expect(merged[0].text.endsWith(CLAUDE_CODE_IDENTITY)).toBe(true);
  expect("cache_control" in merged[0]).toBe(false);
});
