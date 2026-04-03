import { execSync } from 'child_process';
import { readdirSync, existsSync, cpSync, rmSync } from 'fs';
import { join } from 'path';

// Extract the zip file
console.log('Extracting shopsphere.zip...');
execSync('unzip -o shopsphere.zip -d extracted', { cwd: '/vercel/share/v0-project' });

// List extracted contents
console.log('\nExtracted contents:');
const extracted = readdirSync('/vercel/share/v0-project/extracted');
console.log(extracted);

// Check if there's a single directory inside
if (extracted.length === 1) {
  const innerDir = join('/vercel/share/v0-project/extracted', extracted[0]);
  console.log('\nInner directory contents:');
  console.log(readdirSync(innerDir));
  
  // Copy contents to root
  console.log('\nCopying to root...');
  const innerContents = readdirSync(innerDir);
  for (const item of innerContents) {
    const src = join(innerDir, item);
    const dest = join('/vercel/share/v0-project', item);
    if (!existsSync(dest)) {
      cpSync(src, dest, { recursive: true });
      console.log(`Copied: ${item}`);
    }
  }
}

// Cleanup
rmSync('/vercel/share/v0-project/extracted', { recursive: true, force: true });
console.log('\nExtraction complete!');
