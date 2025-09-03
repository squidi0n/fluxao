#!/usr/bin/env node

import { spawn } from 'child_process';
import { watch } from 'fs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

console.log('🔄 Auto-Backup System gestartet (wie Replit)');

// Git Repository initialisieren falls nicht vorhanden
if (!existsSync('.git')) {
  console.log('📝 Git Repository wird initialisiert...');
  spawn('git', ['init'], { stdio: 'inherit' });
  spawn('git', ['config', 'user.name', 'FluxAO Auto-Backup'], { stdio: 'inherit' });
  spawn('git', ['config', 'user.email', 'backup@fluxao.dev'], { stdio: 'inherit' });
}

// Letzte Backup-Zeit tracken
let lastBackup = 0;
const BACKUP_DELAY = 2000; // 2 Sekunden debounce

// Überwachte Dateien/Ordner
const watchPaths = [
  'app/',
  'components/', 
  'lib/',
  'prisma/',
  'auth.ts',
  'next.config.js',
  'package.json'
];

function createBackup(changedFile) {
  const now = Date.now();
  
  // Debounce - nicht zu oft backuppen
  if (now - lastBackup < BACKUP_DELAY) {
    return;
  }
  
  lastBackup = now;
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const message = `Auto-backup: ${changedFile} at ${timestamp}`;
  
  console.log(`💾 ${message}`);
  
  // Git add & commit
  const gitAdd = spawn('git', ['add', '.'], { stdio: 'pipe' });
  gitAdd.on('close', () => {
    const gitCommit = spawn('git', ['commit', '-m', message], { stdio: 'pipe' });
    gitCommit.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Backup erstellt: ${changedFile}`);
      }
    });
  });
}

// File Watcher starten (WSL-kompatibel)
console.log('👀 Überwache Dateien...');

// Einfacherer Ansatz für WSL: Git Status-based watching
function watchForChanges() {
  const gitStatus = spawn('git', ['status', '--porcelain'], { stdio: 'pipe' });
  let output = '';
  
  gitStatus.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  gitStatus.on('close', () => {
    if (output.trim()) {
      const changedFiles = output.split('\n').filter(line => line.trim());
      if (changedFiles.length > 0) {
        const firstFile = changedFiles[0].slice(3); // Remove git status prefix
        createBackup(firstFile);
      }
    }
  });
}

// Check every 3 seconds for changes (WSL-safe)
setInterval(watchForChanges, 3000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Auto-Backup System gestoppt');
  process.exit(0);
});

console.log('✅ Auto-Backup läuft! Jede Datei-Änderung wird automatisch gesichert.');
console.log('💡 Backups als Git-Commits in .git/');
console.log('🔍 Historie: git log --oneline');