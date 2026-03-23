#!/usr/bin/env node
/**
 * parse-args.js
 *
 * Parses and validates $ARGUMENTS for /sessions-checkpoint.
 * Expected format: "<action> [name]"
 *
 * Valid actions:  create, verify, list, clear
 * Name required: create, verify
 * Name format:   a-z, 0-9, hyphens only
 *
 * Usage:  node parse-args.js "create feature-start"
 * Exit 0: prints JSON { "action": "create", "name": "feature-start" }
 * Exit 1: prints usage error to stderr
 */

const VALID_ACTIONS = ['create', 'verify', 'list', 'clear'];
const NAME_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]+$/;
const ACTIONS_REQUIRING_NAME = ['create', 'verify'];

const USAGE = `
Usage: /sessions-checkpoint <action> [name]

Actions:
  create <name>   snapshot current state
  verify <name>   compare current state to a saved checkpoint
  list            show all checkpoints
  clear           remove old checkpoints (keeps last 5)

Examples:
  /sessions-checkpoint create feature-start
  /sessions-checkpoint verify feature-start
  /sessions-checkpoint list
`.trim();

const input = (process.argv[2] || '').trim();

if (!input) {
  console.error('No arguments provided.\n');
  console.error(USAGE);
  process.exit(1);
}

const tokens = input.split(/\s+/);
const action = tokens[0].toLowerCase();
const rawName = tokens.slice(1).join('-').toLowerCase(); // join remainder with hyphens

// Validate action
if (!VALID_ACTIONS.includes(action)) {
  console.error(`Unknown action: "${action}"\n`);
  console.error(USAGE);
  process.exit(1);
}

// Validate name requirement
if (ACTIONS_REQUIRING_NAME.includes(action) && !rawName) {
  console.error(`Action "${action}" requires a checkpoint name.\n`);
  console.error(`Example: /sessions-checkpoint ${action} my-checkpoint`);
  process.exit(1);
}

// Sanitize name if present
let name = rawName;
if (name) {
  const sanitized = name
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!NAME_RE.test(sanitized)) {
    console.error(`Invalid checkpoint name: "${rawName}"`);
    console.error('Allowed: a-z, 0-9, hyphens. Example: feature-start');
    process.exit(1);
  }

  if (sanitized !== rawName) {
    process.stderr.write(`Note: checkpoint name sanitized from "${rawName}" → "${sanitized}"\n`);
  }

  name = sanitized;
}

console.log(JSON.stringify({ action, name: name || null }));
