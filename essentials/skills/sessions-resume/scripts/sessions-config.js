#!/usr/bin/env node
/**
 * sessions-config.js
 * Foundation script for all session skills.
 * Reads .claude/sessions.yml and resolves the sessions directory.
 *
 * Commands:
 *   node sessions-config.js read
 *     Prints JSON { project, sessions_dir } — auto-detects defaults if yml missing.
 *
 *   node sessions-config.js init [project-name]
 *     Creates .claude/sessions.yml with defaults if it doesn't exist.
 *     Prints JSON { project, sessions_dir } on success.
 */
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execSync } = require('child_process');

const CONFIG_FILE = path.join(process.cwd(), '.claude', 'sessions.yml');

function parseYml(content) {
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key   = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();
    if (key && value) result[key] = value;
  }
  return result;
}

function detectProjectName() {
  try {
    const remote = execSync('git remote get-url origin 2>/dev/null', { encoding: 'utf8' }).trim();
    if (remote) {
      const m = remote.match(/\/([^/]+?)(\.git)?$/);
      if (m) return m[1];
    }
  } catch (_) {}
  return path.basename(process.cwd());
}

function resolveSessionsDir(rawPath, projectName) {
  if (!rawPath) {
    return path.join(os.homedir(), '.claude', 'sessions', projectName);
  }
  let resolved;
  if (rawPath.startsWith('~/')) {
    resolved = path.join(os.homedir(), rawPath.slice(2));
  } else if (path.isAbsolute(rawPath)) {
    resolved = rawPath;
  } else {
    resolved = path.resolve(process.cwd(), rawPath);
  }
  // If path ends with bare "sessions" (a root, not a project dir), append project name
  if (path.basename(resolved) === 'sessions') {
    resolved = path.join(resolved, projectName);
  }
  return resolved;
}

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'read': {
    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
      config = parseYml(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
    const project     = config.project     || detectProjectName();
    const sessionsDir = resolveSessionsDir(config.sessions_dir, project);
    console.log(JSON.stringify({ project, sessions_dir: sessionsDir }));
    break;
  }

  case 'init': {
    if (fs.existsSync(CONFIG_FILE)) {
      process.stderr.write('sessions.yml already exists: ' + CONFIG_FILE + '\n');
      const config = parseYml(fs.readFileSync(CONFIG_FILE, 'utf8'));
      const project = config.project || detectProjectName();
      console.log(JSON.stringify({ project, sessions_dir: resolveSessionsDir(config.sessions_dir, project) }));
      break;
    }
    const projectName = args[0] || detectProjectName();
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, [
      '# Session storage configuration — one project per repository.',
      '',
      'project: ' + projectName,
      '',
      '# Where to store sessions for this project. Options:',
      '#   .claude/sessions          → inside this repo (gitignore recommended)',
      '#   ~/.claude/sessions        → user-level (~/.claude/sessions/' + projectName + ')',
      '#   /any/absolute/path        → fully custom location',
      'sessions_dir: ~/.claude/sessions',
      '',
    ].join('\n'));
    const sessionsDir = resolveSessionsDir('~/.claude/sessions', projectName);
    process.stderr.write('Created: ' + CONFIG_FILE + '\n');
    console.log(JSON.stringify({ project: projectName, sessions_dir: sessionsDir }));
    break;
  }

  default:
    console.error('Usage: node sessions-config.js <read|init> [project-name]');
    process.exit(1);
}
