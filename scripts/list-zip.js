import AdmZip from 'adm-zip';
import { readdirSync, existsSync } from 'fs';

// Try to find the zip file
const possiblePaths = [
  '/vercel/share/v0-project/shopsphere.zip',
  './shopsphere.zip',
  '../shopsphere.zip',
  process.cwd() + '/shopsphere.zip'
];

console.log('Current working directory:', process.cwd());
console.log('Directory contents:', readdirSync(process.cwd()));

let zipPath = null;
for (const p of possiblePaths) {
  console.log('Checking path:', p, 'exists:', existsSync(p));
  if (existsSync(p)) {
    zipPath = p;
    break;
  }
}

if (!zipPath) {
  console.log('Could not find shopsphere.zip');
  process.exit(1);
}

console.log('\nUsing zip path:', zipPath);

try {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  
  console.log('\nZip contents (' + entries.length + ' entries):\n');
  
  for (const entry of entries) {
    if (!entry.isDirectory) {
      console.log(entry.entryName);
    }
  }
} catch (err) {
  console.error('Error:', err.message);
}
