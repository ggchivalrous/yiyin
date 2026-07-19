import { exec } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import process from 'node:process'
import mime from 'mime'
import { Octokit } from 'octokit'

const __dirname = path.parse(import.meta.url.slice(os.platform() === 'win32' ? 8 : 7)).dir
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  request: {
    fetch,
  },
})

// 仓库 owner/repo：优先用 GitHub Actions 注入的 GITHUB_REPOSITORY（fork 兼容），
// 否则回退到上游硬编码（向后兼容本地手跑）。
const [REPO_OWNER, REPO_NAME] = (process.env.GITHUB_REPOSITORY || 'ggchivalrous/yiyin').split('/')

// Release tag：CI 可通过 RELEASE_TAG 指定；为空则用 package.json 的版本号
function getReleaseTag() {
  if (process.env.RELEASE_TAG)
    return process.env.RELEASE_TAG
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'))
  return `v${pkg.version}`
}

// 查找指定 tag 的 release；不存在则创建（draft）
async function ensureRelease(tag) {
  const tagVersion = tag.replace(/^v/, '')
  console.log('查找 release:', tag, `(owner=${REPO_OWNER}, repo=${REPO_NAME})`)

  // 先尝试按 tag 获取
  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/releases/tags/{tag}', {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      tag,
      headers: { 'X-GitHub-Api-Version': '2022-11-28' },
    })
    console.log('找到已有 release:', data.name, 'id=', data.id)
    return data
  }
  catch (e) {
    if (e.status !== 404) throw e
  }

  // 不存在则创建 tag + draft release
  console.log('release 不存在，创建新 release (draft):', tag)
  const { data } = await octokit.request('POST /repos/{owner}/{repo}/releases', {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    tag_name: tag,
    name: `壹印 ${tag}`,
    body: `自动构建版本 ${tag}`,
    draft: true,
    prerelease: false,
    headers: { 'X-GitHub-Api-Version': '2022-11-28' },
  })
  console.log('已创建 release:', data.name, 'id=', data.id)
  return data
}

function updateReleaseAsset(releaseId, filePath, name) {
  console.log('上传文件:', name)
  const type = mime.getType(filePath)
  return new Promise((r) => {
    exec(
      ` curl -L \
      -X POST \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer ${process.env.GITHUB_TOKEN}" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      -H "Content-Type: ${type}" \
      "https://uploads.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${releaseId}/assets?name=${name}" \
      --data-binary "@${filePath}"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`执行错误: ${error}`)
          return r()
        }
        console.log(`stdout: ${stdout}`)
        console.error(`stderr: ${stderr}`)
        return r()
      },
    )
  })
}

async function start() {
  const tag = getReleaseTag()
  const release = await ensureRelease(tag)
  const releaseId = release.id
  const files = fs.readdirSync(path.join(__dirname, 'dist'))

  console.log('Release=%s Tag=%s id=%s', release.name, tag, releaseId)
  console.log('待上传文件列表:', files)

  // 上传所有平台产物（不再按当前 OS 过滤，CI 里每个 job 上传各自的）
  const uploadExts = ['.dmg', '.exe', '.msi', '.zip', '.apk', '.deb', '.rpm', '.AppImage']
  const toUpload = files.filter(i => uploadExts.some(ext => i.endsWith(ext)))

  if (!toUpload.length) {
    console.warn('未找到可上传的产物文件')
    return
  }

  for (const file of toUpload) {
    const filePath = path.join(__dirname, 'dist', file)
    await updateReleaseAsset(releaseId, filePath, file)
  }

  console.log('全部上传完成，发布 release (取消 draft)')
  await octokit.request('PATCH /repos/{owner}/{repo}/releases/{release_id}', {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    release_id: releaseId,
    draft: false,
    headers: { 'X-GitHub-Api-Version': '2022-11-28' },
  })
}

start().then().catch(console.log)
