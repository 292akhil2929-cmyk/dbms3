import { createReadStream, readdirSync, existsSync, cpSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import { pipeline } from 'stream/promises';
import { createUnzip } from 'zlib';
import { Extract } from 'unzipper';

const projectDir = '/vercel/share/v0-project';
const extractDir = join(projectDir, 'extracted');

// Create extraction directory
mkdirSync(extractDir, { recursive: true });

console.log('Extracting shopsphere.zip...');

// Use unzipper to extract
await pipeline(
  createReadStream(join(projectDir, 'shopsphere.zip')),
  Extract({ path: extractDir })
);

console.log('\nExtracted contents:');
const extracted = readdirSync(extractDir);
console.log(extracted);

// Check if there's a single directory inside (common zip structure)
if (extracted.length === 1) {
  const innerDir = join(extractDir, extracted[0]);
  console.log('\nInner directory contents:');
  const innerContents = readdirSync(innerDir);
  console.log(innerContents);
  
  // Copy contents to root
  console.log('\nCopying to root...');
  for (const item of innerContents) {
    const src = join(innerDir, item);
    const dest = join(projectDir, item);
    if (!existsSync(dest) || item === 'package.json') {
      cpSync(src, dest, { recursive: true });
      console.log(`Copied: ${item}`);
    }
  }
} else {
  // Copy all extracted contents to root
  console.log('\nCopying to root...');
  for (const item of extracted) {
    const src = join(extractDir, item);
    const dest = join(projectDir, item);
    if (!existsSync(dest) || item === 'package.json') {
      cpSync(src, dest, { recursive: true });
      console.log(`Copied: ${item}`);
    }
  }
}

// Cleanup
rmSync(extractDir, { recursive: true, force: true });
console.log('\nExtraction complete!');
