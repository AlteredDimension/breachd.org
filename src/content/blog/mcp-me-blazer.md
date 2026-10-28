---
title: MCP Me Blazer - Claude Code Visibility
date: 2026-10-28
tags: [writeup, cybersecurity]
excerpt: "How scared are you of MCPs in your environment? Pipe Claude Code's OpenTelemetry data into Prometheus, Loki, and Grafana and get every data point you need to make educated decisions instead of best guesses."
draft: false
---

Sanctioned Claude Code ... Cursor ... or anything of the like? How scared are you of MCPs in your environment? API calls made by an LLM that you (hopefully) don't trust can give some shivers to security folk - let's talk about it. More broadly though, let's go over getting every data point you can from these harnesses so you can make educated decisions instead of best guesses.

## Why Bother

Within the first stretch of turning this on, we found users sending company data to their personal repos - with Claude doing the pushing for them. We found people running Claude Code on personal accounts. And we found MCP servers nobody on the security team knew existed. None of that was visible before. All of it was visible after.

Coding agents aren't autocomplete anymore. They run shell commands, read and write files, call APIs, and connect to MCP servers that can reach basically anything you give them credentials for. From a security seat, that's a new actor in the environment doing real work with real permissions - and most orgs have zero visibility into what it's actually doing.

The questions I wanted answered were simple:

- Who's using it, and how much?
- What tools is it running, and what Bash commands is it executing?
- Which MCP servers are people connecting, and what tools are being called on them?
- What's it costing us?
- When something goes wrong, can we reconstruct what happened?

Good news: Claude Code has OpenTelemetry built in. It exports metrics (sessions, tokens, cost, lines of code, commits, PRs) and events (prompts, tool results, API requests and errors, permission decisions, MCP server connections). You just need somewhere to send it.

Quick note before going further: everything here was built and run as a **proof of concept**, so I'll call out where POC and the production plan differ.

## The Stack

Nothing exotic here - all open source, all self-hosted:

- **OpenTelemetry Collector** - the front door. Receives OTLP from every endpoint, authenticates it, processes it, and routes it.
- **Prometheus** - metrics (token usage, cost, sessions, active time).
- **Loki** - events and logs (prompts, tool results, MCP activity, API errors).
- **Grafana** - dashboards on top of both.

The flow looks like this:

```
Claude Code (endpoints)
   │  OTLP/HTTP over TLS + bearer token
   ▼
FortiGate (public IP, port forward)
   │
   ▼
OTel Collector ──► Prometheus (metrics)
   │
   └─────────────► Loki (events/logs)
                      │
                      ▼
                   Grafana
```

## Turning It On

Telemetry is off by default, and the juicy stuff is off even when telemetry is on. These are the variables that matter:

| Variable | What it does |
|---|---|
| `CLAUDE_CODE_ENABLE_TELEMETRY=1` | Turns telemetry on at all |
| `OTEL_METRICS_EXPORTER=otlp` | Ship metrics |
| `OTEL_LOGS_EXPORTER=otlp` | Ship events |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `http/protobuf` or `grpc` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Where to send it |
| `OTEL_EXPORTER_OTLP_HEADERS` | Auth header (bearer token) |
| `OTEL_LOG_TOOL_DETAILS=1` | Bash commands, MCP server and tool names, skill names, tool input. **Without this your MCP panels are empty.** |
| `OTEL_LOG_USER_PROMPTS=1` | Actual prompt text (redacted by default - you only get length) |
| `OTEL_LOG_TOOL_CONTENT=1` | Tool output content |

I turned on all three content flags. If the goal is visibility, half-visibility doesn't cut it - but it comes at a cost, which I'll get to.

Do not rely on every developer exporting these in their shell. Push them through Claude Code's **managed settings file** so they're set org-wide and can't just be quietly unset by the user. For the POC, I deployed the managed settings file to endpoints through SentinelOne - we already had the agent everywhere, so it was the fastest path. For prod, the plan is to move to managed settings from the Claude admin console so config lives with the tool itself instead of riding on the EDR.

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "http/protobuf",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "https://telemetry.yourdomain.com:4318",
    "OTEL_EXPORTER_OTLP_HEADERS": "Authorization=Bearer <token>",
    "OTEL_LOG_TOOL_DETAILS": "1",
    "OTEL_LOG_USER_PROMPTS": "1",
    "OTEL_LOG_TOOL_CONTENT": "1"
  }
}
```

Here's a side effect worth calling out: because the settings are machine-level, telemetry flows no matter which account someone logs in with. That's exactly how we caught people using personal Claude accounts on company machines - the sessions showed up, just not tied to our org.

A couple gotchas I hit or almost hit:

- Env vars are read at startup. Change them, start a new session.
- Claude Code doesn't pass `OTEL_*` vars to the things it spawns - Bash, hooks, MCP servers. So you're seeing what Claude Code does with an MCP server (connection, tool name, success, duration), not the MCP server's own internals. If you want that side, the MCP server needs its own instrumentation.
- The cost metric is an estimate. Great for trends and "who's burning tokens," not for reconciling the invoice.

**A real note on prompt logging:** flipping `OTEL_LOG_USER_PROMPTS` and `OTEL_LOG_TOOL_CONTENT` on is a policy decision, not just a config change. Prompts and tool output contain code, internal context, pasted logs, and sometimes secrets people really shouldn't have pasted. Make sure your acceptable use policy and whoever owns employee monitoring are on board, and that users know it's being collected. Do it in the open.

## Getting It In The Door (Safely)

Endpoints aren't all sitting on the same network as the collector, so the collector had to be reachable. That means it's exposed, which means it gets treated like anything else exposed.

**Certs.** TLS on the OTLP receiver, no exceptions. Prompts and Bash commands going over the wire in plaintext is a nope.

**FortiGate port forwarding.** We already had a public IP on the FortiGate, so I set up a port forward on 4320 (OTLP over HTTP but I also changed it for testing purposes, 4318 is the recommended port) to the collector and nothing else. Grafana, Prometheus, and Loki stay internal. If you can lock the firewall policy down to known source IPs (office egress, VPN ranges), do it. If you've got remote folks all over the place and can't, that's what the auth is for - but don't let the auth be the only thing standing there. Turn on the FortiGate's IPS and logging on that policy so you know who's knocking.

**Bearer tokens.** The collector requires a bearer token via the `bearertokenauth` extension, and anything without it gets dropped at the door. For the POC I used two tokens. For prod, it's one token per team, so a leaked token gets revoked without breaking everyone and you can tell at a glance which team's traffic is which. Be honest about the limitation though: a token sitting in a managed settings file is readable by anyone on that machine, so treat it as "keeps the internet from writing junk into my telemetry," not "proves who sent this." Rotate them. Claude Code also supports a headers helper script for generating auth headers dynamically, which is worth a look if you want short-lived tokens.

Collector config skeleton:

```yaml
extensions:
  bearertokenauth:
    token: ${env:OTEL_INGEST_TOKEN}

receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
        tls:
          cert_file: /certs/fullchain.pem
          key_file: /certs/privkey.pem
        auth:
          authenticator: bearertokenauth

processors:
  batch: {}

exporters:
  prometheusremotewrite:
    endpoint: http://prometheus:9090/api/v1/write
  otlphttp/loki:
    endpoint: http://loki:3100/otlp

service:
  extensions: [bearertokenauth]
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheusremotewrite]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlphttp/loki]
```

(For per-team tokens in prod, swap the single-token extension for one that checks against a list, or run a small auth proxy in front.)

## Dashboards

No reason to reinvent the wheel here. Credit where it's due:

- **Prometheus Stack** (Grafana dashboard ID 25255) for the Claude Code metrics - sessions, token usage by type and model, cost, active time, lines changed, commits and PRs.
- **[claude-code-metrics-stack](https://github.com/acreeger/claude-code-metrics-stack)** by acreeger for the prompt side.

Those got me most of the way in an afternoon.

The part that didn't exist was what I actually cared most about - **MCP tracking** - so I built a custom section for it:

- **MCP servers in use** - which servers are being connected, by how many users. This is your shadow MCP inventory. If something shows up here that nobody's heard of, that's a conversation. (It was, more than once.)
- **MCP connection attempts and failures** - failed connections can mean misconfig, or can mean someone's trying to reach something they shouldn't.
- **MCP tool calls by server and tool** - what's actually being invoked, not just what's installed.
- **Success/failure and duration per MCP tool** - flaky or slow tools stand out fast.
- **Top users by MCP activity** - not to hunt anyone down, but to know who to talk to when something new appears.

Example LogQL to get you started (field names depend on how your Loki ingests OTLP attributes, so adjust):

```
sum by (tool_name) (
  count_over_time({service_name="claude-code"} | event_name="claude_code.tool_result" | tool_name=~"mcp.*" [24h])
)
```

## What We Found

This is where the POC paid for itself.

**Company data going to personal repos - pushed by Claude.** With tool details on, every Bash command the agent runs shows up. We saw users having Claude add personal remotes and push company code to their own repos. Claude did exactly what it was asked - that's the point. The agent isn't the insider threat; it's just a very efficient pair of hands. Without telemetry, that's a `git push` that never shows up anywhere we're looking.

**Personal Claude accounts.** Because the managed settings applied at the machine level, sessions from personal accounts still reported in - they just weren't attached to our org. That's company code being processed under consumer terms instead of our sanctioned enterprise setup, which is a whole different data handling story.

**Unknown MCP servers.** A couple of MCP servers showed up that weren't on anyone's radar. Every one of those is a third-party integration with whatever access the user handed it. You can't assess risk on something you don't know exists.

None of these were things we went looking for. They fell out of the data once it was there - which is the whole argument for doing this.

## The Elephant In The Room

Here's the thing nobody tells you: **the second you turn on prompt and tool content logging, your telemetry stack becomes one of the most sensitive data stores in the company.** It's now holding source code, internal architecture, Bash commands, file paths, tool output, and whatever secrets people pasted into prompts.

So lock it down like one:

- Grafana behind SSO, with access limited to the people who actually need to see prompts. Metrics dashboards and prompt dashboards don't need the same audience.
- Loki and Prometheus never exposed - only the collector faces out.
- Set a retention period on Loki on purpose instead of "forever by default."
- Audit who's querying prompt data. Watching the watchers is part of the job.

Which brings me to what's next.

## What's Next

This is what's planned to take it from POC to something I'd defend in an audit.

**Redaction with OTTL.** Redact at the collector, before anything hits storage. The OpenTelemetry Transformation Language in the collector's `transform` processor lets you pattern-match and scrub prompt and tool content on the way through - API keys, tokens, passwords, cloud keys, JWTs, emails, whatever's sensitive in your world. Rough shape:

```yaml
processors:
  transform/redact:
    error_mode: ignore
    log_statements:
      - context: log
        statements:
          - replace_pattern(attributes["prompt"], "AKIA[0-9A-Z]{16}", "[REDACTED_AWS_KEY]")
          - replace_pattern(attributes["prompt"], "eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+", "[REDACTED_JWT]")
          - replace_pattern(attributes["prompt"], "(?i)(password|secret|api[_-]?key|token)\\s*[:=]\\s*\\S+", "$$1=[REDACTED]")
```

Apply the same idea to tool content, since that's where file contents and command output land. Redaction is never perfect - regex catches the obvious stuff, not the creative stuff - so it reduces risk, it doesn't remove it. The access controls above still matter.

**Data classification.** Tag events as they pass through the collector (e.g. public / internal / confidential / restricted) based on what they contain and which event type they are. Classification drives everything downstream: who can see it, how long it's kept, and where it goes.

**Monthly batch to Azure cold storage.** Loki keeps the recent, hot stuff for dashboards and investigations. Everything gets batched monthly to Azure Blob in the cold tier for long-term retention - cheap storage for data you hopefully never need but really want when you do. Turn on immutability policies so the archive can't be quietly edited, and use lifecycle rules to handle tiering and deletion automatically so retention is enforced, not remembered.

**Prod rollout.** Move managed settings from SentinelOne to the Claude admin console, cut over to per-team tokens, and get rotation on a schedule.

## Wrap Up

MCPs don't have to be scary - unknown MCPs are scary. So are personal accounts and personal repos you can't see. The point of all of this is turning "I think people are using it for X" into "here's exactly what it's doing." Turn the telemetry on, get it in the door safely, build the dashboards that answer your actual questions, and then remember you just created something worth protecting.

Make educated decisions, not best guesses.
