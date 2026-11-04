import {
  CLAUDE_CODE_IDENTITY,
  DEFAULT_CLAUDE_CODE_VERSION,
  billingAttribution,
} from "./billing.ts";

export interface SystemBlock {
  type: "text";
  text: string;
  cache_control?: unknown;
}

export interface MessageLike {
  role?: string;
  content?: string | { type?: string; text?: string }[];
}

/** Keep the harness instructions and their cache boundaries at system priority. */
export function buildClaudeCodeSystem(
  system: readonly SystemBlock[],
  messages: readonly MessageLike[] = [],
  version: string = DEFAULT_CLAUDE_CODE_VERSION,
): SystemBlock[] {
  return [
    {
      type: "text",
      text: billingAttribution(extractFirstUserMessageText(messages), version),
    },
    ...system,
  ];
}

function isSystemBlock(block: unknown): block is SystemBlock {
  return (
    block !== null &&
    typeof block === "object" &&
    "type" in block &&
    block.type === "text" &&
    "text" in block &&
    typeof block.text === "string"
  );
}

/** True only for the Anthropic OAuth Claude Code system shape. */
export function isOAuthClaudeCodeSystem(
  system: unknown,
): system is SystemBlock[] {
  return (
    Array.isArray(system) &&
    system.length > 0 &&
    system.every(isSystemBlock) &&
    system[0].text === CLAUDE_CODE_IDENTITY
  );
}

/** Text of the first user message, used to seed the fingerprint. */
export function extractFirstUserMessageText(
  messages: readonly MessageLike[] = [],
): string {
  const message = messages.find((m) => m.role === "user");

  if (!message) return "";
  if (typeof message.content === "string") return message.content;

  if (Array.isArray(message.content)) {
    const block = message.content.find((c) => c.type === "text");
    return block?.text ?? "";
  }

  return "";
}
