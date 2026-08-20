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

export interface RelocatedPayload {
  system: SystemBlock[];
  messages: MessageLike[];
}

/**
 * Build a request that the Anthropic classifier bills to the Claude plan.
 * `system` holds the attribution and identity blocks. The harness system prompt
 * goes into the first user message, where the model reads and follows it.
 */
export function relocateSystemToUser(
  system: SystemBlock[],
  messages: readonly MessageLike[] = [],
  version: string = resolveClaudeCodeVersion(),
): RelocatedPayload {
  const attribution = billingAttribution(
    extractFirstUserMessageText(messages),
    version,
  );
  const cache = { type: "ephemeral" };
  const newSystem: SystemBlock[] = [
    { type: "text", text: attribution },
    { type: "text", text: CLAUDE_CODE_IDENTITY, cache_control: cache },
  ];
  const userSystemText = system[1]?.text ?? "";
  const relocated: MessageLike[] = messages.map((m) => ({ ...m }));

  if (userSystemText) {
    const wrapped = `<system-instructions>\n${userSystemText}\n</system-instructions>`;
    const firstUserIndex = relocated.findIndex((m) => m.role === "user");

    if (firstUserIndex === -1) {
      relocated.unshift({ role: "user", content: wrapped });
    } else {
      const target = relocated[firstUserIndex];

      if (typeof target.content === "string") {
        target.content = `${wrapped}\n\n${target.content}`;
      } else if (Array.isArray(target.content)) {
        target.content = [{ type: "text", text: wrapped }, ...target.content];
      } else {
        target.content = wrapped;
      }
    }
  }
  return { system: newSystem, messages: relocated };
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
