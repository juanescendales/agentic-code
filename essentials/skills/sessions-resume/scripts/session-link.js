#!/usr/bin/env node
/**
 * session-link.js
 * Manages .claude/session.json — the active session pointer for the current project.
 *
 * Commands:
 *   node session-link.js read
 *     Prints session_dir to stdout. Exits 1 if no active session.
 *
 *   node session-link.js write <project> <session_dir> [claude_session_id]
 *     Writes (or overwrites) .claude/session.json.
 *     Preserves opened_at if the file already exists.
 *
 *   node session-link.js clear
 *     Deletes .claude/session.json.
 */
const fs = require('fs');
const path = require('path');

const LINK_FILE = path.join(process.cwd(), '.claude', 'session.json');
const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'read': {
    if (!fs.existsSync(LINK_FILE)) {
      console.error('No active session found in this project.');
      console.error('Run /sessions-save <project> or /sessions-resume <project> first.');
      process.exit(1);
    }
    try {
      const data = JSON.parse(fs.readFileSync(LINK_FILE, 'utf8'));
      if (!data.session_dir) throw new Error('Missing session_dir field');
      console.log(data.session_dir);
    } catch (e) {
      console.error('session.json is malformed: ' + e.message);
      process.exit(1);
    }
    break;
  }

  case 'write': {
    const [project, sessionDir, claudeSessionId] = args;
    if (!project || !sessionDir) {
      console.error('Usage: node session-link.js write <project> <session_dir> [claude_session_id]');
      process.exit(1);
    }
    const now = new Date().toISOString();
    let openedAt = now;
    if (fs.existsSync(LINK_FILE)) {
      try {
        const prev = JSON.parse(fs.readFileSync(LINK_FILE, 'utf8'));
        if (prev.opened_at) openedAt = prev.opened_at;
      } catch (_) {}
    }
    const data = {
      project,
      session_dir: sessionDir,
      claude_session_id: claudeSessionId || '',
      opened_at: openedAt,
      updated_at: now,
    };
    fs.mkdirSync(path.dirname(LINK_FILE), { recursive: true });
    fs.writeFileSync(LINK_FILE, JSON.stringify(data, null, 2) + '\n');
    console.log('Session link written: ' + sessionDir);
    break;
  }

  case 'clear': {
    if (fs.existsSync(LINK_FILE)) {
      fs.unlinkSync(LINK_FILE);
      console.log('Session link cleared.');
    } else {
      console.log('No session link to clear.');
    }
    break;
  }

  default:
    console.error('Usage: node session-link.js <read|write|clear> [args]');
    process.exit(1);
}
