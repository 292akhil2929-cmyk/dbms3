import { createReadStream } from 'fs';
import { join } from 'path';
import unzipper from 'unzipper';

const projectDir = '/vercel/share/v0-project';

console.log('Listing contents of shopsphere.zip...\n');

const directory = await unzipper.Open.file(join(projectDir, 'shopsphere.zip'));

for (const file of directory.files) {
  console.log(file.path, file.type, file.uncompressedSize);
}
