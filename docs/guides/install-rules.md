# Install language rules

Add language-specific coding standards and patterns to your Claude Code setup.

Rules apply permanently to every session once installed. Install only the language packs you actively use.

---

## Prerequisites

- Git installed (`git --version`)
- The ECC repo cloned (`git clone https://github.com/affaan-m/ECC.git`)

---

## 1. Decide: user-level or project-level?

**User-level rules** (`~/.claude/rules/ecc/`) apply to every project on your machine.
Use for: your primary language stack.

**Project-level rules** (`.claude/rules/ecc/`) apply only to the current project.
Use for: project-specific language packs you don't use elsewhere.

---

## 2. Install common rules (required for all setups)

macOS / Linux:

```bash
cd ECC   # the cloned repo
mkdir -p ~/.claude/rules/ecc
cp -r rules/common ~/.claude/rules/ecc/
```

Windows PowerShell:

```powershell
cd ECC
New-Item -ItemType Directory -Force -Path "$HOME/.claude/rules/ecc" | Out-Null
Copy-Item -Recurse rules/common "$HOME/.claude/rules/ecc/"
```

> **Important:** Copy the directory itself, not its contents. Use `cp -r rules/common ~/.claude/rules/ecc/`, not `cp -r rules/common/* ~/.claude/rules/ecc/`. The language-specific rules reference `../common/` — flattening breaks those paths.

---

## 3. Install language packs

Available packs:

| Pack | Languages / Frameworks |
|------|----------------------|
| `typescript` | TypeScript, JavaScript, React, Next.js |
| `python` | Python, Django, FastAPI, pytest |
| `golang` | Go |
| `swift` | Swift, SwiftUI, Apple platforms |
| `php` | PHP 8+, Laravel, Composer |
| `ruby` | Ruby, Rails, RSpec |
| `arkts` | HarmonyOS, ArkTS |

macOS / Linux — install one or more:

```bash
cp -r rules/typescript ~/.claude/rules/ecc/
cp -r rules/python ~/.claude/rules/ecc/
cp -r rules/golang ~/.claude/rules/ecc/
```

Windows PowerShell:

```powershell
Copy-Item -Recurse rules/typescript "$HOME/.claude/rules/ecc/"
Copy-Item -Recurse rules/python "$HOME/.claude/rules/ecc/"
```

---

## 4. Verify installation

```bash
ls ~/.claude/rules/ecc/
```

Expected output:

```
common/    typescript/    python/
```

Each directory should contain multiple `.md` files. If a directory is empty, the copy may have failed.

---

## 5. Restart Claude Code

Rules load at session start. Restart Claude Code (start a new session) for the rules to take effect.

Verify rules are active by asking Claude Code: "What are the ECC testing requirements?"
You should get a response referencing 80% coverage and test-first methodology from `rules/common/testing.md`.

---

## Install for a specific project only

Copy to the project's `.claude/` directory instead:

```bash
cd /your/project
mkdir -p .claude/rules/ecc
cp -r /path/to/ECC/rules/common .claude/rules/ecc/
cp -r /path/to/ECC/rules/typescript .claude/rules/ecc/
```

Project-level rules take precedence over user-level rules when both exist.

---

## Update rules after ECC updates

ECC ships updated rule packs with each release. Re-run the copy commands to update:

```bash
cd ECC
git pull

# Overwrite existing rules
cp -r rules/common ~/.claude/rules/ecc/
cp -r rules/typescript ~/.claude/rules/ecc/
```

---

## Remove a language pack

```bash
# macOS / Linux
rm -rf ~/.claude/rules/ecc/typescript

# Windows PowerShell
Remove-Item -Recurse -Force "$HOME/.claude/rules/ecc/typescript"
```

---

## Troubleshooting

**Rules not applying after restart.** Check the path — rules must be in `~/.claude/rules/ecc/`, with the `ecc/` subdirectory. Rules in `~/.claude/rules/` without the namespace may conflict with other installed rule packs.

**Language rules overwriting common rules.** You flattened the directory structure. Delete the rules directory and redo the copy using `cp -r rules/common` (directory, not contents).

**Too many rules causing context bloat.** Each file adds tokens. Uninstall language packs you don't use. A TypeScript developer doesn't need `golang/` and `arkts/`.

**Rules from a previous ECC version are stale.** Run `git pull` in the ECC repo and re-copy the directories.
