#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

async function clearNextCache() {
  console.log('🧹 Clearing Next.js cache...');
  
  const cachePaths = [
    path.join(projectRoot, '.next'),
    path.join(projectRoot, 'node_modules/.cache'),
    path.join(projectRoot, '.turbo'),
  ];
  
  for (const cachePath of cachePaths) {
    try {
      await fs.rm(cachePath, { recursive: true, force: true });
      console.log(`✅ Cleared: ${path.relative(projectRoot, cachePath)}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.log(`⚠️  Could not clear ${cachePath}: ${error.message}`);
      }
    }
  }
  
  console.log('✨ Cache clearing complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  clearNextCache().catch(console.error);
}

export default clearNextCache;