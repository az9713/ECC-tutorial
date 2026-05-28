# Rules

Rules are always-on guidelines that apply to every Claude Code session. Unlike skills (context-activated) or hooks (event-triggered), rules are permanently loaded and shape Claude Code's behavior on every request.

---

## What problem rules solve

Without rules, you repeat the same instructions in every session: "use TypeScript strict mode", "always write tests", "never commit secrets", "use conventional commits". Rules eliminate this repetition. You define them once; they apply everywhere, automatically.

---

## How rules work

Rules are Markdown files in `~/.claude/rules/` (user-level, applies to all projects) or `.claude/rules/` (project-level). Claude Code loads these files at session start and includes them as persistent context.

ECC ships rules in two layers:

```
rules/
├── common/       ← language-agnostic principles (always install)
│   ├── coding-style.md    ← immutability, file organization, naming
│   ├── git-workflow.md    ← conventional commits, PR process
│   ├── testing.md         ← TDD requirement, 80% coverage
│   ├── performance.md     ← model selection, context management
│   ├── patterns.md        ← design patterns, skeleton projects
│   ├── hooks.md           ← hook architecture, TodoWrite usage
│   ├── agents.md          ← when to delegate to subagents
│   └── security.md        ← mandatory security checks
├── typescript/   ← TypeScript/JavaScript specific
├── python/       ← Python specific
├── golang/       ← Go specific
├── swift/        ← Swift specific
├── php/          ← PHP specific
├── ruby/         ← Ruby / Rails specific
└── arkts/        ← HarmonyOS / ArkTS specific
```

Language-specific directories extend `common/` — they add framework tools, language idioms, and code examples while referencing the common rules for general principles.

---

## What the common rules encode

### `coding-style.md`

- Prefer immutability: `const` over `let`, frozen objects, readonly types
- File organization: one export per file for complex modules, co-locate tests
- Naming: descriptive over abbreviated, domain terms over generic names
- Maximum file length guidelines

### `git-workflow.md`

- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Commit scope requirements
- PR title and description format
- Branch naming: `feat/`, `fix/`, `docs/`

### `testing.md`

- Test-first default: write failing tests before implementation
- 80% coverage requirement on new code
- Test pyramid: unit > integration > e2e
- Test naming convention: `describe('what') → it('should ...')`

### `security.md`

- Never hardcode credentials — use environment variables
- Input validation on all user-facing surfaces
- Parameterized queries — never string-concatenated SQL
- OWASP Top 10 checklist before any auth, payment, or data-handling feature

### `agents.md`

- When to delegate: tasks that need >3 file reads, specialized language review, security audit
- How to scope agent tasks: one bounded task per agent invocation
- When not to delegate: simple inline fixes, single-file changes

### `performance.md`

- Model routing: Haiku for exploration, Sonnet for implementation, Opus for architectural reasoning
- Context window discipline: `/compact` at logical breakpoints, `/clear` between unrelated tasks
- MCP server limits: keep under 10 enabled per project

---

## Language-specific rules

Language-specific rule packs extend `common/` with:

| Pack | Key additions |
|------|--------------|
| `typescript/` | Strict mode, type safety patterns, ESLint config, React/Next.js conventions |
| `python/` | Type hints, PEP 8, pytest patterns, Django/FastAPI conventions |
| `golang/` | Go idioms, error handling patterns, goroutine safety, testing with `t.Helper()` |
| `swift/` | Swift actors, protocol-based DI, Apple platform patterns |
| `php/` | Modern PHP 8+, Composer, Laravel conventions |
| `ruby/` | Ruby idioms, Rails conventions, RSpec patterns |
| `arkts/` | HarmonyOS component lifecycle, ArkTS type constraints |

---

## Installation

Rules are not distributable via the Claude Code plugin system. You copy them manually.

**User-level** (applies to all projects):

```bash
# macOS / Linux
mkdir -p ~/.claude/rules/ecc
cp -r rules/common ~/.claude/rules/ecc/
cp -r rules/typescript ~/.claude/rules/ecc/    # add your language packs
```

```powershell
# Windows PowerShell
New-Item -ItemType Directory -Force -Path "$HOME/.claude/rules/ecc" | Out-Null
Copy-Item -Recurse rules/common "$HOME/.claude/rules/ecc/"
Copy-Item -Recurse rules/typescript "$HOME/.claude/rules/ecc/"
```

**Project-level** (applies only to the current project):

```bash
mkdir -p .claude/rules/ecc
cp -r rules/common .claude/rules/ecc/
cp -r rules/typescript .claude/rules/ecc/
```

> **Important:** Copy entire directories, not their contents. `cp -r rules/common ~/.claude/rules/ecc/` not `cp -r rules/common/* ~/.claude/rules/ecc/`. Language-specific files reference `../common/` and flattening breaks those references.

---

## Rules vs. skills vs. hooks

| | Rules | Skills | Hooks |
|--|-------|--------|-------|
| **When active** | Always, every session | Context-based activation | Event-triggered |
| **What they do** | Define standards and principles | Provide domain knowledge and workflow steps | Automate enforcement |
| **Format** | Markdown (no frontmatter needed) | Markdown with YAML frontmatter | JSON + Node.js scripts |
| **Install path** | `~/.claude/rules/ecc/` (manual copy) | Via plugin or manual | Via plugin or installer |

---

## Common gotchas

**Rules not loading.** Check the directory path. User-level rules go in `~/.claude/rules/ecc/` (with the `ecc/` namespace). Do not put them directly in `~/.claude/rules/` — they'll collide with other rule packs.

**Language rule overwrites common rule.** This happens when you flatten the directory structure. Copy entire directories, not individual files.

**Rules bloating context.** Each rules file adds tokens to your context. Install only the language packs you actively use. Avoid installing all language packs globally.

**Project rules conflict with user rules.** Project-level rules (`.claude/rules/`) take precedence over user-level rules (`~/.claude/rules/`). If you have both, the project-level version wins.

---

## See also

- [Guide: Install language rules](../guides/install-rules.md) — step-by-step installation
- [Concepts: Skills](skills.md) — for domain-specific knowledge (vs. always-on principles)
- [Concepts: Hooks](hooks.md) — for automated enforcement (vs. declarative standards)
