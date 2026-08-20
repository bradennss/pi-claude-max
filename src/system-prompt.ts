import {
  CLAUDE_CODE_IDENTITY,
  billingAttribution,
  resolveClaudeCodeVersion,
} from "./billing.ts";

export interface SystemBlock {
  type: string;
  text: string;
  cache_control?: unknown;
}

export interface MessageLike {
  role?: string;
  content?: string | { type?: string; text?: string }[];
}

/** True only for the Anthropic OAuth Claude Code system shape. */
export function isOAuthClaudeCodeSystem(
  system: unknown,
): system is SystemBlock[] {
  if (!Array.isArray(system) || system.length < 1) return false;
  const first = system[0] as Partial<SystemBlock> | undefined;
  return (
    first?.type === "text" &&
    typeof first.text === "string" &&
    first.text.startsWith(CLAUDE_CODE_IDENTITY)
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

/**
 * Collapse the OAuth system blocks into a single block:
 * `<attribution>\n\n<identity>[\n\n<user system prompt>]`, preserving cache_control.
 */
export function mergeSystemBlocks(
  system: SystemBlock[],
  messages: readonly MessageLike[] = [],
  version: string = resolveClaudeCodeVersion(),
): SystemBlock[] {
  const cacheControl = system[0]?.cache_control;
  const userSystemText = system[1]?.text;
  const prefix = `${billingAttribution(
    extractFirstUserMessageText(messages),
    version,
  )}\n\n${CLAUDE_CODE_IDENTITY}`;
  const text = userSystemText ? `${prefix}\n\n${userSystemText}` : prefix;
  return [
    {
      type: "text",
      text,
      ...(cacheControl ? { cache_control: cacheControl } : {}),
    },
  ];
}
