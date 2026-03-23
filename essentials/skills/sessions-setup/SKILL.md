---
name: sessions-setup
description: Initialize session storage for this project by creating .claude/sessions.yml. Run this once per repository before using any other session skills. Use when the user runs /sessions-setup or when another session skill reports that sessions.yml is missing.
origin: essentials
---

# Sessions Setup

Initialize session storage for this project. Creates `.claude/sessions.yml`, which tells all other session skills where to store sessions and what to call this project.

## When to Activate

- When user explicitly runs `/sessions-setup`
- When any other session skill says `.claude/sessions.yml` is missing and redirects here

## Usage

```
/sessions-setup              # interactive setup with defaults
/sessions-setup <name>       # use <name> as the project name (skip that prompt)
```

## Process

### Step 1: Check if already initialized

```bash
! node scripts/sessions-config.js read
```

If the command succeeds and prints `{ project, sessions_dir }`, sessions.yml already exists. Tell the user:

```
Already initialized:
  Project:      <project>
  Sessions dir: <sessions_dir>

To change these settings, edit .claude/sessions.yml directly.
```

Then stop — do not overwrite an existing config.

### Step 2: Determine the project name

If `$ARGUMENTS` is provided, validate and sanitize it:

```bash
! node scripts/validate-project-name.js "$ARGUMENTS"
```

If the script exits with an error, show the error and stop.
If it prints a different name than what was given, show: `Using project name: <sanitized>`

If no `$ARGUMENTS`, detect automatically:

```bash
! node scripts/sessions-config.js init
```

This auto-detects the name from `git remote get-url origin` or the current directory name.
Read the printed `{ project, sessions_dir }` and inform the user of the detected name.

If `$ARGUMENTS` was provided (and validated), call init with the name:

```bash
! node scripts/sessions-config.js init <sanitized-name>
```

### Step 3: Confirm storage location

After `init` succeeds, it prints `{ project, sessions_dir }`. Show the user:

```
Sessions initialized for this project:

  Project:      <project>
  Sessions dir: <sessions_dir>

Config written to: .claude/sessions.yml

To change the storage location, edit sessions_dir in .claude/sessions.yml.
Options:
  ~/.claude/sessions        → user-level (default, recommended)
  .claude/sessions          → inside this repo (add to .gitignore)
  /any/absolute/path        → custom location
```

### Step 4: Recommend next step

```
Run /sessions-save to start your first session for this project.
```

---

## Notes

- One project per repository — `sessions.yml` ties this repo to one project name
- Sessions directory is project-specific: sessions_dir already includes the project name
- This skill is idempotent: running it twice will not overwrite an existing config
- If you need to rename the project or change storage, edit `.claude/sessions.yml` directly
