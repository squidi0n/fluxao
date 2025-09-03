#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import clearNextCache from './clear-cache.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port range to try
const MIN_PORT = 3000;
const MAX_PORT = 3100;

// Function to check if a port is available on both IPv4 and IPv6
async function checkPort(port) {
  // Check IPv4
  const ipv4Available = await new Promise((resolve) => {
    const tester = net.createServer();

    tester.once('error', (err) => {
      resolve(false);
    });

    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port, '0.0.0.0');
  });

  if (!ipv4Available) return false;

  // Check IPv6
  const ipv6Available = await new Promise((resolve) => {
    const tester = net.createServer();

    tester.once('error', (err) => {
      resolve(false);
    });

    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });

    try {
      tester.listen(port, '::');
    } catch (err) {
      resolve(false);
    }
  });

  return ipv4Available && ipv6Available;
}

// Find an available port
async function findAvailablePort() {
  console.log('📊 Prüfe Ports...');
  for (let port = MIN_PORT; port <= MAX_PORT; port++) {
    process.stdout.write(`\r  Port ${port}...`);
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      console.log(`\r  Port ${port}... verfügbar! ✅`);
      return port;
    } else {
      console.log(`\r  Port ${port}... belegt ❌`);
    }
  }
  throw new Error(`Keine freien Ports zwischen ${MIN_PORT} und ${MAX_PORT} gefunden!`);
}

// Update .env.local with the new port
function updateEnvFile(port) {
  const envPath = path.join(__dirname, '..', '.env.local');

  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');

    // Update NEXTAUTH_URL
    content = content.replace(/NEXTAUTH_URL=.*/, `NEXTAUTH_URL=http://localhost:${port}`);

    // Update NEXT_PUBLIC_BASE_URL
    content = content.replace(
      /NEXT_PUBLIC_BASE_URL=.*/,
      `NEXT_PUBLIC_BASE_URL=http://localhost:${port}`,
    );

    fs.writeFileSync(envPath, content);
    console.log(`✅ .env.local aktualisiert mit Port ${port}`);
  }
}

// Main function
async function startDev() {
  try {
    console.log('🔍 Suche nach einem freien Port...');
    const port = await findAvailablePort();
    console.log(`✅ Port ${port} ist verfügbar!`);

    // Update .env.local
    updateEnvFile(port);

    // Clear cache before starting
    console.log('🧹 Lösche Cache für frische Entwicklung...');
    await clearNextCache();

    // Start the dev server
    console.log(`🚀 Starte Entwicklungsserver auf Port ${port}...`);
    console.log(`📱 Öffne http://localhost:${port} im Browser`);
    console.log('');

    const child = spawn('npx', ['next', 'dev', '--port', port.toString()], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PORT: port.toString(),
        FORCE_COLOR: '1',
      },
    });

    // Handle process termination
    process.on('SIGINT', () => {
      child.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      child.kill('SIGTERM');
      process.exit(0);
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

// Run the script
startDev();
