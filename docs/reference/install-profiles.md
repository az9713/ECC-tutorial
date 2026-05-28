# Install profiles

Profiles control which ECC components are installed. Choose the profile that matches your needs.

---

## Available profiles

### `minimal`

The lowest-footprint profile. Installs rules, agents, commands, and core skills. Excludes hooks.

Use when:
- You want ECC's knowledge without runtime automation
- Hooks feel too global for your setup
- You're on a low-context or local-model setup
- You only want coding standards and slash commands

```bash
./install.sh --profile minimal --target claude
```

```powershell
.\install.ps1 --profile minimal --target claude
# or
npx ecc-install --profile minimal --target claude
```

---

### `core`

Minimal + the hooks runtime. The recommended profile for most developers.

Use when:
- You want standard ECC behavior with automation
- You're on Claude Code and want TypeScript checking, auto-format, secret detection, and session memory
- You want hooks but not experimental features

```bash
./install.sh --profile core --target claude
```

Add hooks later to an existing minimal install:

```bash
./install.sh --target claude --modules hooks-runtime
```

Remove hooks from a core install:

```bash
./install.sh --profile core --without baseline:hooks --target claude
```

---

### `full`

Everything. All components, all hooks, all skills, all experimental features.

Use when:
- You want maximum capability
- You're using the manual install path (not plugin)
- You understand the components and want all of them

```bash
./install.sh --profile full

# Windows PowerShell
.\install.ps1 --profile full
# or
npx ecc-install --profile full
```

> **Warning:** Do not use `--profile full` after a `/plugin install`. The plugin already loads skills, commands, and hooks. Running the full installer after a plugin install creates duplicates. Use exactly one install path.

---

## Install path decision tree

```
Do you want the plugin (automatic updates, easiest install)?
├── Yes → /plugin install ecc@ecc
│         Then manually copy only rules/common + your language pack
│         DO NOT run ./install.sh afterward
└── No  → Do you want hooks?
          ├── No  → ./install.sh --profile minimal
          └── Yes → ./install.sh --profile core
                    (or --profile full for everything)
```

---

## Component-scoped installs

Install only specific modules without a full profile:

```bash
# Add only hooks runtime to an existing install
./install.sh --target claude --modules hooks-runtime

# Ask the advisor which components you need
npx ecc consult "security reviews and TDD" --target claude

# Component-scoped install from advisor output
npx ecc install --profile minimal --target claude --with capability:machine-learning
```

---

## Selective installs with the advisor

The packaged advisor finds the right components for your workflow:

```bash
npx ecc consult "mlops training model deployment" --target claude
```

Output includes matching components, related profiles, and install commands. Use `--preview` to inspect the file plan before installing.

---

## What each component includes

| Component | Minimal | Core | Full |
|-----------|---------|------|------|
| Rules (common) | ✓ | ✓ | ✓ |
| Language rule packs | User-selected | User-selected | All |
| Core skills | ✓ | ✓ | ✓ |
| Framework skills | Partial | Partial | All |
| Agents (61) | ✓ | ✓ | ✓ |
| Commands (76) | ✓ | ✓ | ✓ |
| Hooks runtime | ✗ | ✓ | ✓ |
| Experimental hooks | ✗ | ✗ | ✓ |
| MCP configs | User-configured | User-configured | User-configured |

MCP configs are always user-configured — ECC never auto-enables MCPs to avoid context bloat.

---

## Reset and uninstall

Preview removal before applying:

```bash
node scripts/uninstall.js --dry-run
```

Uninstall ECC-managed files:

```bash
node scripts/uninstall.js
```

Via the lifecycle wrapper:

```bash
node scripts/ecc.js list-installed    # see what's installed
node scripts/ecc.js doctor            # check for issues
node scripts/ecc.js repair            # fix without reinstalling
node scripts/ecc.js uninstall --dry-run
node scripts/ecc.js uninstall
```

ECC only removes files it recorded in its install-state. Unrelated files are never touched.

If you stacked install methods, clean up in this order:
1. Remove the Claude Code plugin install.
2. Run `node scripts/uninstall.js` from the ECC repo root.
3. Delete any rule folders you copied manually.
4. Reinstall once with a single path.

---

## See also

- [Quickstart](../getting-started/quickstart.md) — install walkthrough
- [Guide: Configure hooks](../guides/configure-hooks.md) — tune hook behavior after install
- [Troubleshooting](../troubleshooting/common-issues.md) — fix broken installs
