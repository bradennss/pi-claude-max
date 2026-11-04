import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { expect, test } from "vitest";
import claudeMax from "../index.ts";
import {
  CLAUDE_CODE_IDENTITY,
  billingAttribution,
  userAgent,
} from "../src/billing.ts";

type Handler = (
  event: { payload?: unknown; headers?: Record<string, string | null> },
  ctx: ExtensionContext,
) => unknown;

function loadExtension(provider = "anthropic", apiKey = "sk-ant-oat-test") {
  const handlers = new Map<string, Handler>();
  claudeMax({
    on: (name: string, handler: Handler) => handlers.set(name, handler),
  } as unknown as ExtensionAPI);
  const ctx = {
    model: { provider },
    modelRegistry: {
      getApiKeyForProvider: () => Promise.resolve(apiKey),
    },
    sessionManager: { getSessionId: () => "test-session" },
  } as unknown as ExtensionContext;
  const headersHandler = handlers.get("before_provider_headers");
  const requestHandler = handlers.get("before_provider_request");
  if (!headersHandler || !requestHandler)
    throw new Error("Missing request hooks");
  return {
    headers: (headers: Record<string, string | null>) =>
      headersHandler({ headers }, ctx),
    request: (payload: unknown) => requestHandler({ payload }, ctx),
  };
}

test("adds OAuth headers even when Pi supplies an empty custom-header map", async () => {
  const extension = loadExtension();
  const headers = {};
  await extension.headers(headers);
  expect(headers).toEqual({
    "user-agent": userAgent(),
    "x-app": "cli",
    "x-claude-code-session-id": "test-session",
  });
});

test("does not identify API-key requests or other providers as Claude Code", async () => {
  for (const extension of [
    loadExtension("anthropic", "sk-ant-api-test"),
    loadExtension("other"),
  ]) {
    const headers = { "user-agent": "original" };
    await extension.headers(headers);
    expect(headers).toEqual({ "user-agent": "original" });
  }
});

test("changes only the OAuth system prefix, preserving the rest of the request", () => {
  const payload = {
    system: [
      { type: "text", text: CLAUDE_CODE_IDENTITY },
      {
        type: "text",
        text: "Follow the harness instructions.",
        cache_control: { type: "ephemeral" },
      },
      { type: "text", text: "Additional system instructions." },
    ],
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", data: "test" } },
          { type: "text", text: "Describe this" },
        ],
      },
    ],
    tools: [{ name: "Read", input_schema: { type: "object" } }],
    metadata: { user_id: "existing-user-id" },
    thinking: { type: "adaptive" },
    stream: true,
  };
  const original = structuredClone(payload);
  const result = loadExtension().request(payload);
  expect(result).toEqual({
    ...original,
    system: [
      {
        type: "text",
        text: billingAttribution("Describe this"),
      },
      ...original.system,
    ],
  });
  expect(payload).toEqual(original);
  expect(loadExtension("other").request(payload)).toBeUndefined();
});

test("leaves ordinary and unsupported provider payloads unchanged", () => {
  for (const payload of [
    null,
    undefined,
    "text",
    {},
    { system: [{ type: "text", text: "API-key system prompt" }] },
    {
      system: [{ type: "text", text: CLAUDE_CODE_IDENTITY }],
      messages: "invalid",
    },
  ]) {
    expect(loadExtension().request(payload)).toBeUndefined();
  }
});
