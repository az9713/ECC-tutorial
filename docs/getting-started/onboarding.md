# Onboarding

A conceptual guide for engineers who are new to ECC. By the end of this doc, you'll have a clear mental model of what ECC does, how its pieces work together, and why it's structured the way it is.

---

## What is ECC, really?

If you've set up a new developer laptop before, you know there's a difference between "I have VS Code installed" and "I have VS Code with my linter, formatter, snippets, extensions, custom keybindings, and project templates configured." The second version reflects months of accumulated experience about how to work productively.

ECC is that accumulated experience, but for AI coding tools.

Claude Code out of the box is like a blank VS Code: powerful, but knowing nothing about your standards, nothing about your team's patterns, nothing about what "good code" means in your context. ECC fills that gap with:

- Rules that encode what "good code" looks like (always on, every session)
- Skills that encode how to approach common tasks (planning, TDD, security review)
- Agents that specialize in specific domains (Go review, TypeScript review, build error resolution)
- Hooks that enforce standards automatically (format on save, secret detection, session memory)

---

## The five components

### Rules — the base layer

Rules are always on. They load into every session, regardless of what you're doing. Think of them like ESLint config — they enforce standards without you having to think about them.

The rules are organized in two layers:

```
rules/
├── common/       ← language-agnostic principles (always install)
└── typescript/   ← language-specific extensions (add what you use)
    python/
    golang/
    ...
```

`rules/common/` covers: code style, git workflow, testing requirements (80% coverage), performance, security, agent delegation patterns, and hook architecture. Language-specific rules extend these with framework-specific patterns.

You copy rules to `~/.claude/rules/ecc/` and they load in every Claude Code session from that point on.

### Skills — the workflow library

Skills are the primary workflow surface. They are knowledge modules: step-by-step processes, decision trees, code patterns, and domain expertise. A skill activates when what you're doing matches its domain.

You don't invoke most skills manually. When you ask Claude Code to write tests, the `tdd-workflow` skill is there. When you're working with Django, the `django-patterns` skill provides context. Skills make Claude Code smarter about your specific task without you having to explain the domain every time.

Skills live in `skills/*/SKILL.md` — a Markdown file with YAML frontmatter. The structure is intentionally simple so they work across Claude Code, Codex, Cursor, and OpenCode.

### Agents — the specialists

When you have a task that needs specialization and you don't want it polluting your main session context, you delegate to an agent.

Agents are defined in `agents/*.md`. Each agent has:
- A name and description (used for routing)
- A set of allowed tools (scoped — a reviewer can read but not write)
- A model preference (code-reviewer on Opus, exploration agents on Haiku)
- A system prompt defining its role

ECC ships 61 agents. A few you'll use regularly:

| Agent | What it does |
|-------|-------------|
| `planner` | Breaks a feature request into a phased implementation plan |
| `code-reviewer` | Reviews code for quality, security, and correctness |
| `tdd-guide` | Enforces the red-green-refactor cycle |
| `build-error-resolver` | Diagnoses and fixes build failures |
| `security-reviewer` | OWASP Top 10 audit |
| `go-reviewer` | Go-specific code review |
| `typescript-reviewer` | TypeScript/JavaScript code review |

### Hooks — the automations

Hooks fire on tool events. They run without you asking. The hook system is what separates ECC from a collection of prompts — it enforces standards automatically.

Key hooks ECC ships:

| Hook | When it fires | What it does |
|------|--------------|-------------|
| `SessionStart` | Session begins | Loads project memory context |
| `pre:bash:dispatcher` | Before any bash command | Checks for tmux, git push guard, GateGuard |
| `post:edit:typecheck` | After file edits | Runs TypeScript typecheck |
| `post:edit:format` | After file edits | Auto-formats the file |
| `pre:bash:secret-check` | Before bash | Detects `sk-`, `ghp_`, `AKIA` patterns |
| `Stop` | Session ends | Saves state, extracts patterns for learning |

Hooks use a profile system: `ECC_HOOK_PROFILE=minimal|standard|strict`. Standard is the default. You can disable individual hooks with `ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"`.

### Commands — the workflow shortcuts

Commands are user-triggered slash commands. They're the explicit entry point into ECC workflows when you want to run something on demand.

```
/ecc:plan "Add OAuth"     → delegates to planner agent
/code-review              → delegates to code-reviewer agent
/build-fix                → delegates to build-error-resolver agent
/security-scan            → runs AgentShield security audit
```

Commands are maintained in `commands/` during the transition from commands to skills. New workflow development lands in skills first; many commands are lightweight wrappers.

---

## How the pieces fit together: a real scenario

Here's a complete feature workflow with ECC:

**Monday morning: you're adding email verification to a SaaS app.**

1. **Session starts.** The `SessionStart` hook fires. It loads your project's recent observations — last Friday you were working on the auth module, and that context is injected. You don't have to re-explain where you were.

2. **You plan.** You run `/ecc:plan "Add email verification flow"`. The `planner` agent (using Opus for complex reasoning) returns a 4-phase implementation plan: schema migration → email service → verification endpoint → UI flow.

3. **You implement phase 1.** You ask Claude Code to implement the schema migration. The `tdd-workflow` skill is active. Claude Code writes the failing test first, then the migration, then verifies the test passes. After each file edit, the `post:edit:typecheck` hook runs — TypeScript errors are caught immediately, not at build time.

4. **You ask for a review.** `/code-review` spawns the `code-reviewer` agent. It reads only the files that changed (no main-session context bloat) and returns structured findings: one security issue (parameterized query missing), two style issues, a performance suggestion.

5. **You fix the security issue.** Before running a bash command to apply a DB migration, the `pre:bash:dispatcher` hook checks for secrets. Clean. The migration runs.

6. **You stop for the day.** The `Stop` hook fires. It captures what you did: schema migration pattern, how you resolved the parameterized query issue, the testing sequence. These become instincts in the continuous-learning system.

7. **Tuesday morning.** `SessionStart` injects yesterday's context. You pick up exactly where you left off.

---

## Why it's structured this way

**Why are rules separate from skills?**

Rules need to be always-on — you don't want to manually invoke coding standards. Skills are domain-specific and contextual — you don't want every skill loaded in every session. The separation maps to the difference between "how we always work" (rules) and "what we know about this task" (skills).

**Why can't the plugin distribute rules?**

This is an upstream Claude Code limitation. The plugin system can distribute skills, agents, and commands, but rules require a different install path. It's intentional — it prevents plugins from silently modifying your Claude Code behavior in ways you didn't explicitly choose.

**Why 61 agents instead of one general agent?**

Scope and cost. A general agent that could do everything would need broad tool access, large context, and expensive models. A specialized `go-reviewer` agent needs only `Read`, `Grep`, and `Glob` — it runs fast, costs less, and is better at its specific task because its prompt is focused.

---

## Where to go next

| You want to... | Go here |
|----------------|---------|
| Get running immediately | [Quickstart](quickstart.md) |
| Understand agents deeply | [Concepts: Agents](../concepts/agents.md) |
| Understand how skills activate | [Concepts: Skills](../concepts/skills.md) |
| Understand what hooks run automatically | [Concepts: Hooks](../concepts/hooks.md) |
| Add language-specific rules | [Guide: Install language rules](../guides/install-rules.md) |
| Write your own skill | [Guide: Write a skill](../guides/write-a-skill.md) |
| Reduce token costs | [Guide: Token optimization](../guides/token-optimization.md) |
