import { defineConfig } from '@ggcv/auto-release'

export default defineConfig({
  // 需要同步版本号的文件
  files: ['package.json'],
  // 本地完成：改版本号 + 更新 CHANGELOG + commit + 打 tag + push
  // CI（build-release.yml）监听 tag push，负责构建 + 创建 GitHub Release
  // 发版流程：yarn release → 自动 commit/tag/push → CI 自动构建发版
  commit: true,
  tag: true,
  push: true,
  printCommits: true,
  // 跳过交互式确认（脚本/CI 友好）
  confirm: false,
  // GitHub Release 由 CI 创建，本地不创建
  github: false,
})
