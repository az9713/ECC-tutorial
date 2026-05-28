# Quickstart

Get ECC installed and run your first command in under 5 minutes.

**Prerequisites:** [Claude Code v2.1+, Node.js 18+](prerequisites.md)

---

## Path A: Plugin install (recommended)

This is the fastest path. The plugin auto-loads agents, skills, commands, and hooks. You then copy rules manually.

### 1. Add the ECC marketplace and install the plugin

In Claude Code, run:

```
/plugin marketplace add https://github.com/affaan-m/ECC
/plugin install ecc@ecc
```

Expected output:

```
✓ Marketplace added: ecc
✓ Plugin installed: ecc@ecc
  61 agents · 246 skills · 76 commands
```

### 2. Copy language rules

Rules can't be distributed via the plugin system. Clone the repo and copy what you need:

```bash
git clone https://github.com/affaan-m/ECC.git
cd ECC
npm install

# macOS / Linux — copy common rules + your language stack
mkdir -p ~/.claude/rules/ecc
cp -r rules/common ~/.claude/rules/ecc/
cp -r rules/typescript ~/.claude/rules/ecc/   # replace with your stack
```

```powershell
# Windows PowerShell
New-Item -ItemType Directory -Force -Path "$HOME/.claude/rules/ecc" | Out-Null
Copy-Item -Recurse rules/common "$HOME/.claude/rules/ecc/"
Copy-Item -Recurse rules/typescript "$HOME/.claude/rules/ecc/"   # replace with your stack
```

Available language packs: `typescript`, `python`, `golang`, `swift`, `php`, `ruby`, `arkts`.

### 3. Restart Claude Code and verify

Restart Claude Code (or start a new session), then check what's installed:

```
/plugin list ecc@ecc
```

Expected output: a list of 61 agents, 246 skills, and 76 commands.

### 4. Run your first command

```
/ecc:plan "Add user authentication with email and password"
```

The planner agent returns a phased implementation blueprint.

---

## Path B: Manual install (fallback)

Use this if the plugin path fails or you want more control.

### 1. Clone and install

```bash
git clone https://github.com/affaan-m/ECC.git
cd ECC
npm install
```

### 2. Install all components

```bash
# macOS / Linux
./install.sh --profile full

# Windows PowerShell
.\install.ps1 --profile full
# or: npx ecc-install --profile full
```

Expected output:

```
✓ Agents installed: 61
✓ Skills installed: 246
✓ Commands installed: 76
✓ Hooks installed
✓ Rules installed
```

### 3. Verify

```bash
node scripts/ecc.js list-installed
```

### 4. Run your first command

```
/plan "Add user authentication with email and password"
```

---

## Don't stack install methods

> **Warning:** Use exactly one install path. Running `/plugin install` and then `./install.sh --profile full` creates duplicated skills and broken hook behavior. If you accidentally stacked them, see [Reset ECC](../troubleshooting/common-issues.md#i-accidentally-stacked-install-methods-and-things-are-broken).

---

## What just happened

The plugin loaded 61 agents, 246 skills, and 76 commands into Claude Code. When you typed `/ecc:plan`, Claude Code matched the command to the `planner` agent and ran it in a delegated context. The agent had access to `Read`, `Grep`, `Glob`, and `Bash` tools — it analyzed your request and returned a structured implementation plan without modifying any files.

---

## Next steps

- [Onboarding](onboarding.md) — understand the full system conceptually
- [Concepts: Skills](../concepts/skills.md) — learn how skills activate automatically
- [Concepts: Hooks](../concepts/hooks.md) — understand what runs automatically in the background
- [Guide: Install language rules](../guides/install-rules.md) — add more language packs
