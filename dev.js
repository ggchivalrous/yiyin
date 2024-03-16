import fs from 'fs';
import os from 'os';
import path from 'path';

const __dirname = path.parse(import.meta.url.slice(os.platform() === 'win32' ? 8 : 7)).dir;

async function start() {
  const files = fs.readdirSync(path.join(__dirname, 'dist'));
  const toPath = path.join(__dirname, 'upload-dist');
  console.log('文件列表:', files);

  for (const file of files) {
    const filePath = path.join(__dirname, 'dist', file);
    const state = fs.statSync(filePath);

    if (!state.isFile() || file.endsWith('.blockmap') || file.endsWith('.yml')) {
      continue;
    }

    fs.copyFileSync(filePath, path.join(toPath, file));
  }
}

start().then().catch(console.log);
