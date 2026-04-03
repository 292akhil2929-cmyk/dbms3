import AdmZip from 'adm-zip';
import https from 'https';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, readFileSync } from 'fs';

const zipUrl = 'https://v0chat-agent-data-prod.s3.us-east-1.amazonaws.com/vm-binary/aoYwMs4uMAw/8fac138db28367e8aea85b6eeadff269a856533b1c0d9165d027e451089a5c23.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA52KF4VHQDTZ5RDMT%2F20260403%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260403T085027Z&X-Amz-Expires=3600&X-Amz-Signature=aad60c29eef287059c5faf58c20701b1823ce66ce49d61c85c6e4e888c1aa7a7&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject';

console.log('Downloading zip file...');

// Download the zip file
const downloadZip = () => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    https.get(zipUrl, (res) => {
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
};

const zipBuffer = await downloadZip();
console.log(`Downloaded ${zipBuffer.length} bytes`);

// Save to temp and extract
const tempZip = join(tmpdir(), 'shopsphere.zip');
writeFileSync(tempZip, zipBuffer);

const zip = new AdmZip(tempZip);
const entries = zip.getEntries();

console.log('\n=== ZIP CONTENTS ===\n');

// Group files by whether they're in a subdirectory
const fileContents = {};

for (const entry of entries) {
  if (!entry.isDirectory) {
    // Remove the leading directory if all files are in a single folder
    let filePath = entry.entryName;
    // Check if path starts with "shopsphere/" and strip it
    if (filePath.startsWith('shopsphere/')) {
      filePath = filePath.substring('shopsphere/'.length);
    }
    
    console.log(`File: ${filePath}`);
    
    // Get content for text files
    const ext = filePath.split('.').pop().toLowerCase();
    const textExtensions = ['js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'md', 'txt', 'env', 'gitignore', 'mjs', 'cjs'];
    
    if (textExtensions.includes(ext) || filePath.includes('.env') || filePath === '.gitignore') {
      try {
        const content = entry.getData().toString('utf8');
        fileContents[filePath] = content;
      } catch (e) {
        console.log(`  (binary or encoding error)`);
      }
    }
  }
}

console.log('\n=== FILE CONTENTS ===\n');

for (const [path, content] of Object.entries(fileContents)) {
  console.log(`\n--- ${path} ---`);
  console.log(content.substring(0, 5000)); // Limit output
  if (content.length > 5000) {
    console.log(`... (truncated, total ${content.length} chars)`);
  }
}
