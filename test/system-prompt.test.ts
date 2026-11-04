import { expect, test } from "vitest";
import { CLAUDE_CODE_IDENTITY } from "../src/billing.ts";
import {
  type SystemBlock,
  buildClaudeCodeSystem,
  extractFirstUserMessageText,
  isOAuthClaudeCodeSystem,
} from "../src/system-prompt.ts";

const oauthSystem: SystemBlock[] = [
  {
    type: "text",
    text: CLAUDE_CODE_IDENTITY,
    cache_control: { type: "ephemeral" },
  },
  {
    type: "text",
    text: "You are an expert coding assistant.",
    cache_control: { type: "ephemeral", ttl: "1h" },
  },
];

test("recognizes only complete OAuth system block arrays", () => {
  expect(isOAuthClaudeCodeSystem(oauthSystem)).toBe(true);
  for (const system of [
    undefined,
    null,
    "a plain string system",
    [],
    [null],
    [{ type: "text", text: "You are a helpful assistant." }],
    [{ type: "text", text: `${CLAUDE_CODE_IDENTITY} Unrelated text.` }],
    [oauthSystem[0], null],
    [oauthSystem[0], { type: "image" }],
  ]) {
    expect(isOAuthClaudeCodeSystem(system)).toBe(false);
  }
});

test("extracts the first user text block for attribution", () => {
  expect(
    extractFirstUserMessageText([{ role: "user", content: "hi there" }]),
  ).toBe("hi there");
  expect(
    extractFirstUserMessageText([
      { role: "assistant", content: "ignored" },
      {
        role: "user",
        content: [{ type: "image" }, { type: "text", text: "block text" }],
      },
      { role: "user", content: "later text" },
    ]),
  ).toBe("block text");
  expect(extractFirstUserMessageText([])).toBe("");
  expect(extractFirstUserMessageText([{ role: "user" }])).toBe("");
  expect(
    extractFirstUserMessageText([
      { role: "user", content: [{ type: "image" }] },
    ]),
  ).toBe("");
});

test("prepends captured attribution without changing instructions or cache boundaries", () => {
  const system: SystemBlock[] = [
    ...oauthSystem,
    {
      type: "text",
      text: "Additional instructions.",
      cache_control: { type: "ephemeral" },
    },
  ];
  const messages = [
    { role: "user", content: "Reply with the single word: pong" },
  ];
  const original = structuredClone({ system, messages });
  const result = buildClaudeCodeSystem(system, messages, "2.1.311");
  expect(result).toEqual([
    {
      type: "text",
      text: "x-anthropic-billing-header: cc_version=2.1.311.7ca; cc_entrypoint=cli;",
    },
    ...original.system,
  ]);
  expect({ system, messages }).toEqual(original);
});

test("keeps identity-only requests valid without creating user messages", () => {
  const system = [oauthSystem[0]];
  const result = buildClaudeCodeSystem(system, [], "2.1.311");
  expect(result).toHaveLength(2);
  expect(result[1]).toEqual(system[0]);
  expect(result[0].text).toMatch(
    /cc_version=2\.1\.311\.[0-9a-f]{3}; cc_entrypoint=cli;/,
  );
});
