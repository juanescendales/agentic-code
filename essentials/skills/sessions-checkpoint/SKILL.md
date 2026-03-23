---
name: sessions-checkpoint
description: Create and verify git-based checkpoints within a workflow to track progress and detect regressions. Use when the user runs /sessions-checkpoint or wants to snapshot state mid-task.
origin: essentials
---

# Sessions Checkpoint

Lightweight git-based snapshots for tracking progress and detecting regressions mid-workflow.

## When to Activate

Only when user explicitly runs `/sessions-checkpoint`.

## Usage

```
/sessions-checkpoint create <name>   # snapshot current state
/sessions-checkpoint verify <name>   # compare current state to a checkpoint
/sessions-checkpoint list            # show all checkpoints
/sessions-checkpoint clear           # remove old checkpoints (keeps last 5)
```

## Process

### Step 0: Parse and validate arguments

```bash
! node scripts/parse-args.js "$ARGUMENTS"
```

If the script exits with an error, show the error message and stop.

If it exits successfully, it prints JSON like `{"action":"create","name":"feature-start"}`. Read `action` and `name` from this output. If the script printed a sanitization warning to stderr, show it to the user.

---

### create \<name\>

1. Report current git status (dirty files, staged changes).
2. Create the checkpoint entry:

```bash
! node scripts/manage-checkpoints.js create <name>
```

The script prints JSON `{ name, sha, timestamp, dirty_files }`. Use `sha` for the confirmation.

3. Confirm: "Checkpoint `<name>` created at `<sha>`."

---

### verify \<name\>

1. Find the checkpoint:

```bash
! node scripts/manage-checkpoints.js list
```

Locate the entry with matching `name` and extract its `sha`.

2. Compare current state:

```bash
! git diff <sha> --stat
```

3. Report:

```
CHECKPOINT COMPARISON: <name>
════════════════════════════════
SHA: <sha>
Files changed: X
<git diff --stat output>
```

---

### list

```bash
! node scripts/manage-checkpoints.js list
```

---

### clear

Keep the last 5 checkpoints:

```bash
! node scripts/manage-checkpoints.js clear 5
```

Confirm: "Kept last N checkpoint(s)."

---

## Typical Workflow

```
START         → /sessions-checkpoint create feature-start
IMPLEMENT     → /sessions-checkpoint create core-done
TEST          → /sessions-checkpoint verify core-done
REFACTOR      → /sessions-checkpoint create refactor-done
READY FOR PR  → /sessions-checkpoint verify feature-start
```

---

## Notes

- Checkpoints are stored in `.claude/checkpoints.json` — shared across all sessions for this project
- They complement `/sessions-save` (which captures intent and context); checkpoints capture git state
- `/sessions-save` and `/sessions-update` auto-create checkpoints — manual checkpoints are for mid-task snapshots
- If there is no git repo, SHA will be `no-git` and verify will have limited output
