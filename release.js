import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import mime from 'mime';
import { Octokit } from 'octokit';

const __dirname = path.parse(import.meta.url.slice(os.platform() === 'win32' ? 8 : 7)).dir;
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  request: {
    fetch,
  },
});

function getRelease() {
  return octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
    owner: 'ggchivalrous',
    repo: 'yiyin',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
}

function updateReleaseAsset(releaseId, filePath, name) {
  console.log('上传文件:', name);
  const type = mime.getType(filePath);
  return new Promise((r) => {
    exec(
      ` curl -L \
      -X POST \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer ${process.env.GITHUB_TOKEN}" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      -H "Content-Type: ${type}" \
      "https://uploads.github.com/repos/ggchivalrous/yiyin/releases/${releaseId}/assets?name=${name}" \
      --data-binary "@${filePath}"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`执行错误: ${error}`);
          return r();
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        return r();
      },
    );
  });
}

async function start() {
  const release = await getRelease();
  const releaseId = release.data.id;
  const files = fs.readdirSync(path.join(__dirname, 'dist'));

  console.log('Release=%s Tag=%s', release.data.name, release.data.tag_name);
  console.log('文件列表:', files);

  for (const file of files) {
    const filePath = path.join(__dirname, 'dist', file);
    const state = fs.statSync(filePath);

    if (!state.isFile() || file.endsWith('.blockmap') || file.endsWith('.yml')) {
      continue;
    }

    await updateReleaseAsset(releaseId, filePath, file);
  }
}

start().then().catch(console.log);
