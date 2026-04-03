const https = require('https');
const http = require('http');
const AdmZip = require('adm-zip');

const zipUrl = 'https://v0-project-files.s3.us-east-1.amazonaws.com/d65e1aec-61e7-47ff-bbde-6b4cd3d94b07/shopsphere.zip';

async function fetchBuffer(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function main() {
    console.log('Downloading zip file...');
    const buffer = await fetchBuffer(zipUrl);
    console.log(`Downloaded ${buffer.length} bytes\n`);
    
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    
    // Get specific files
    const targetFiles = [
        'frontend/public/index.html',
        'backend/db/schema.sql'
    ];
    
    for (const entry of entries) {
        if (targetFiles.includes(entry.entryName)) {
            console.log(`\n=== ${entry.entryName} ===\n`);
            console.log(entry.getData().toString('utf8'));
        }
    }
}

main().catch(console.error);
