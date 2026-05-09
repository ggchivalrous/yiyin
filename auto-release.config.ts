import { defineConfig } from '@ggcv/auto-release'

export default defineConfig({
  // 也可以直接指定文件，默认是 package.json 等
  files: ['package.json'],
  // 开启 commit, tag, push 等功能 (push 如果没有 remote 会报错，但在本工具流程中会捕获)
  commit: true,
  tag: true,
  push: true,
  // 打印 commits
  printCommits: true,
  // 启用 GitHub Release 自动同步 (需要 GITHUB_TOKEN)
  github: true,
})
