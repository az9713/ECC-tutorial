# Prerequisites

What you need before installing ECC.

---

### Claude Code CLI v2.1+

ECC requires Claude Code v2.1 or later. Earlier versions have incompatible plugin hook behavior.

Verify:

```bash
claude --version
```

Expected output: `2.1.x` or higher.

Install or update: [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)

---

### Node.js 18+

ECC's hook scripts and install tooling require Node.js 18 or later.

Verify:

```bash
node --version
```

Expected output: `v18.x.x` or higher.

Install: [nodejs.org/download](https://nodejs.org/en/download)

---

### Git

Required to clone the repo for manual installs or rule copying.

Verify:

```bash
git --version
```

Expected output: `git version 2.x.x`

Install: [git-scm.com/downloads](https://git-scm.com/downloads)

---

### Package manager (for scripts)

Any of: `npm` (comes with Node.js), `pnpm`, `yarn`, or `bun`.

ECC auto-detects your preferred package manager. No specific one is required.

---

## Plugin install path (recommended)

If you install ECC via `/plugin install ecc@ecc`, you need:

- Claude Code CLI v2.1+ (above)
- No other prerequisites — the plugin installs automatically

---

## Manual install path

If you install via `./install.sh` or `.\install.ps1`, you additionally need:

- Git (to clone the repo)
- Node.js 18+ (for hook scripts)
- A package manager (npm/pnpm/yarn/bun) to install dependencies

---

## Optional: Python 3.8+ (for dashboard GUI)

The desktop dashboard (`ecc_dashboard.py`) requires Python 3.8+ with Tkinter.

Verify:

```bash
python3 --version
```

If you don't need the dashboard, skip Python entirely.

---

## OS compatibility

ECC runs on **Windows, macOS, and Linux**. All hook scripts are written in Node.js for cross-platform compatibility. PowerShell installers are provided for Windows; bash installers for macOS and Linux.
