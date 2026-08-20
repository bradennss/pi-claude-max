import { createHash } from "node:crypto";

export const DEFAULT_CLAUDE_CODE_VERSION = "2.1.211";

export const CLAUDE_CODE_IDENTITY =
  "You are Claude Code, Anthropic's official CLI for Claude.";

const FINGERPRINT_SALT = "59cf53e54c78";
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

/** Resolve the effective Claude Code version from a validated env override. */
export function resolveClaudeCodeVersion(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const override = env.PI_CLAUDE_MAX_CC_VERSION?.trim();
  return override && VERSION_PATTERN.test(override)
    ? override
    : DEFAULT_CLAUDE_CODE_VERSION;
}

/** The `user-agent` header value Claude Code sends. */
export function userAgent(
  version: string = resolveClaudeCodeVersion(),
): string {
  return `claude-cli/${version} (external, cli)`;
}

/** Derive the billing fingerprint from the first user message. */
export function computeFingerprint(
  firstUserMessageText: string,
  version: string = resolveClaudeCodeVersion(),
): string {
  const sampled = [4, 7, 20]
    .map((i) => firstUserMessageText[i] || "0")
    .join("");
  return createHash("sha256")
    .update(`${FINGERPRINT_SALT}${sampled}${version}`)
    .digest("hex")
    .slice(0, 3);
}

/** Build the `x-anthropic-billing-header` attribution line. */
export function billingAttribution(
  firstUserMessageText: string,
  version: string = resolveClaudeCodeVersion(),
): string {
  const fingerprint = computeFingerprint(firstUserMessageText, version);
  return `x-anthropic-billing-header: cc_version=${version}.${fingerprint}; cc_entrypoint=cli;`;
}
