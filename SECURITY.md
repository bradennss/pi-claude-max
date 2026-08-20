# Security Policy

## Scope and behavior

`pi-claude-max` is a Pi extension. Like all Pi extensions it runs with your full user permissions. This extension:

- Reads the outgoing Anthropic request — headers, system prompt, and first user message — in order to set the Claude Code `user-agent` and prepend the billing attribution header.
- Does **not** read, store, or transmit your credentials anywhere. It never sends data to any host other than the Anthropic endpoint Pi is already configured to use.
- Has no network calls, no telemetry, and no runtime dependencies.

## Terms-of-service risk

This extension makes Pi identify to Anthropic's API the way the official Claude Code CLI does, so that OAuth requests draw from a Claude Pro/Max subscription. Using a third-party harness with your subscription may violate Anthropic's terms of service and could affect your account. Use at your own risk.

## Reporting a vulnerability

Please report suspected vulnerabilities privately via a [GitHub security advisory](https://github.com/bradennss/pi-claude-max/security/advisories/new) or by email to hi@braden.lol. You will receive an acknowledgement within a few days.
