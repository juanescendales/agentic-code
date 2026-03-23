#!/usr/bin/env node
/**
 * manage-checkpoints.js
 * CRUD for .claude/checkpoints.json — shared across all sessions in this repository.
 *
 * Commands:
 *   node manage-checkpoints.js create <name> [session_id]
 *     Creates a checkpoint entry with current git SHA + dirty file count.
 *     Prints the new entry as JSON.
 *
 *   node manage-checkpoints.js list
 *     Displays all checkpoints in a table.
 *
 *   node manage-checkpoints.js last
 *     Prints the last checkpoint as JSON. Exits 1 if none.
 *
 *   node manage-checkpoints.js clear [keep=5]
 *     Keeps the N most recent checkpoints, removes the rest.
 */
const fs  = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHECKPOINTS_FILE = path.join(process.cwd(), '.claude', 'checkpoints.json');

function read() {
  if (!fs.existsSync(CHECKPOINTS_FILE)) return { checkpoints: [], last: null };
  try { return JSON.parse(fs.readFileSync(CHECKPOINTS_FILE, 'utf8')); }
  catch (_) { return { checkpoints: [], last: null }; }
}

function write(data) {
  fs.mkdirSync(path.dirname(CHECKPOINTS_FILE), { recursive: true });
  const tmp = CHECKPOINTS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmp, CHECKPOINTS_FILE);
}

function gitSha() {
  try { return execSync('git rev-parse --short HEAD 2>/dev/null', { encoding: 'utf8' }).trim(); }
  catch (_) { return null; }
}

function dirtyCount() {
  try {
    const out = execSync('git status --porcelain 2>/dev/null', { encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean).length;
  } catch (_) { return 0; }
}

function col(s, n) { return String(s || '').slice(0, n).padEnd(n); }

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'create': {
    const name      = args[0];
    const sessionId = args[1] || '';
    if (!name) { console.error('Usage: node manage-checkpoints.js create <name> [session_id]'); process.exit(1); }
    const entry = {
      name,
      sha:        gitSha() || 'no-git',
      timestamp:  new Date().toISOString(),
      session_id: sessionId,
      dirty_files: dirtyCount(),
    };
    const data = read();
    data.checkpoints.push(entry);
    data.last = entry;
    write(data);
    console.log(JSON.stringify(entry));
    break;
  }

  case 'list': {
    const data = read();
    if (!data.checkpoints.length) { console.log('No checkpoints found.'); break; }
    console.log('Name                 SHA      Timestamp            Dirty  Session');
    console.log('─'.repeat(74));
    data.checkpoints.forEach(c => {
      const ts = (c.timestamp || '').slice(0, 19).replace('T', ' ');
      console.log(`${col(c.name,20)} ${col(c.sha,8)} ${ts}  ${col(c.dirty_files,6)} ${col(c.session_id,20)}`);
    });
    break;
  }

  case 'last': {
    const data = read();
    if (!data.last) { console.error('No checkpoints yet.'); process.exit(1); }
    console.log(JSON.stringify(data.last));
    break;
  }

  case 'clear': {
    const keep = parseInt(args[0] || '5', 10);
    const data = read();
    data.checkpoints = data.checkpoints.slice(-keep);
    data.last = data.checkpoints[data.checkpoints.length - 1] || null;
    write(data);
    console.log(`Kept last ${data.checkpoints.length} checkpoint(s).`);
    break;
  }

  default:
    console.error('Usage: node manage-checkpoints.js <create|list|last|clear> [args]');
    process.exit(1);
}
