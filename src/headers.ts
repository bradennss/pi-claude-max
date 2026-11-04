import { userAgent } from "./billing.ts";

export function applyClaudeCodeHeaders(
  headers: Record<string, string | null | undefined>,
  sessionId: string,
): void {
  const replacements: Record<string, string> = {
    "user-agent": userAgent(),
    "x-app": "cli",
    "x-claude-code-session-id": sessionId,
  };
  for (const name of Object.keys(headers)) {
    if (Object.hasOwn(replacements, name.toLowerCase())) {
      Reflect.deleteProperty(headers, name);
    }
  }
  Object.assign(headers, replacements);
}
