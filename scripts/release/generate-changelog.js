#!/usr/bin/env node
/**
 * Changelog generator for Magnus Flipper AI
 * Generates CHANGELOG.md from git commits using conventional commit format
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.join(process.cwd(), 'CHANGELOG.md');

// Conventional commit types
const TYPES = {
  feat: 'Features',
  fix: 'Fixes',
  perf: 'Performance',
  refactor: 'Refactoring',
  docs: 'Documentation',
  style: 'Style',
  test: 'Tests',
  chore: 'Chores',
  ci: 'CI/CD',
  infra: 'Infrastructure',
  worker: 'Worker Updates',
  build: 'Build System',
};

// Get version from package.json
function getCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return pkg.version;
}

// Get git commits since last tag
function getCommitsSinceLastTag() {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', {
      encoding: 'utf8',
    }).trim();
    
    if (!lastTag) {
      // No tags, get all commits
      return execSync('git log --pretty=format:"%h|%s|%b"', { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(Boolean);
    }
    
    return execSync(`git log ${lastTag}..HEAD --pretty=format:"%h|%s|%b"`, {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

// Parse commit message
function parseCommit(commitLine) {
  const [hash, subject, ...bodyParts] = commitLine.split('|');
  const body = bodyParts.join('|');
  
  // Match conventional commit format: type(scope): description
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
  
  if (match) {
    const [, type, scope, description] = match;
    return {
      hash: hash?.substring(0, 7),
      type: type.toLowerCase(),
      scope: scope || null,
      description,
      body: body || null,
    };
  }
  
  // Fallback for non-conventional commits
  return {
    hash: hash?.substring(0, 7),
    type: 'chore',
    scope: null,
    description: subject,
    body: body || null,
  };
}

// Group commits by type
function groupCommits(commits) {
  const grouped = {};
  
  for (const commit of commits) {
    const type = commit.type;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(commit);
  }
  
  return grouped;
}

// Generate changelog entry
function generateChangelogEntry(version, date, groupedCommits) {
  let changelog = `## [${version}] - ${date}\n\n`;
  
  // Add sections in order
  const order = ['feat', 'fix', 'perf', 'worker', 'infra', 'ci', 'build', 'refactor', 'docs', 'test', 'chore'];
  
  for (const type of order) {
    if (groupedCommits[type] && groupedCommits[type].length > 0) {
      const typeName = TYPES[type] || type;
      changelog += `### ${typeName}\n\n`;
      
      for (const commit of groupedCommits[type]) {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        changelog += `- ${scope}${commit.description}`;
        if (commit.hash) {
          changelog += ` (${commit.hash})`;
        }
        changelog += '\n';
      }
      
      changelog += '\n';
    }
  }
  
  return changelog;
}

// Main function
function main() {
  const version = process.env.NEW_VERSION || getCurrentVersion();
  const date = new Date().toISOString().split('T')[0];
  
  console.log(`Generating changelog for version ${version}...`);
  
  const commits = getCommitsSinceLastTag();
  const parsedCommits = commits.map(parseCommit);
  const grouped = groupCommits(parsedCommits);
  
  const entry = generateChangelogEntry(version, date, grouped);
  
  // Read existing changelog
  let existingChangelog = '';
  if (fs.existsSync(CHANGELOG_PATH)) {
    existingChangelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  } else {
    existingChangelog = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
  }
  
  // Insert new entry after header
  const headerEnd = existingChangelog.indexOf('## [');
  if (headerEnd === -1) {
    // No existing entries, append
    fs.writeFileSync(CHANGELOG_PATH, existingChangelog + entry);
  } else {
    // Insert after header
    const before = existingChangelog.substring(0, headerEnd);
    const after = existingChangelog.substring(headerEnd);
    fs.writeFileSync(CHANGELOG_PATH, before + entry + after);
  }
  
  console.log(`✓ Changelog generated: ${CHANGELOG_PATH}`);
}

main();

