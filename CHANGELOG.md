# Changelog


## v1.7.0

[compare changes](https://github.com/ggchivalrous/yiyin/compare/v1.5.9...v1.7.0)

### 🚀 Enhancements

- 优化超长图白边问题 ([2b67c66](https://github.com/ggchivalrous/yiyin/commit/2b67c66))
- 添加背景模糊程度设置 ([5eebc4b](https://github.com/ggchivalrous/yiyin/commit/5eebc4b))
- 支持生成结果实时预览 ([0ebf176](https://github.com/ggchivalrous/yiyin/commit/0ebf176))
- 修复预览区域位置，修改默认窗口高度 ([88e9cc7](https://github.com/ggchivalrous/yiyin/commit/88e9cc7))

### 🩹 Fixes

- **ci:** 更新 node 版本，禁用 npm 缓存 ([64183d9](https://github.com/ggchivalrous/yiyin/commit/64183d9))
- 快速切换开关时多个预览图同时生成 ([8c60ace](https://github.com/ggchivalrous/yiyin/commit/8c60ace))
- 快速切换开关时多个预览图同时生成" ([c63c6cb](https://github.com/ggchivalrous/yiyin/commit/c63c6cb))
- 修复快速切换开关时多个预览图同时生成 ([4b0aece](https://github.com/ggchivalrous/yiyin/commit/4b0aece))

### 💅 Refactors

- 引入 eslint-config，格式化项目代码 ([cf001c0](https://github.com/ggchivalrous/yiyin/commit/cf001c0))
- 重构 CI 工作流 ([5e5fe92](https://github.com/ggchivalrous/yiyin/commit/5e5fe92))

### 🏡 Chore

- 移除electron make配置 ([e483336](https://github.com/ggchivalrous/yiyin/commit/e483336))
- 添加版本控制配置文件 ([49242af](https://github.com/ggchivalrous/yiyin/commit/49242af))
- **release:** V1.6.0 ([1696fb9](https://github.com/ggchivalrous/yiyin/commit/1696fb9))

### ❤️ Contributors

- 云中君 <yunzhongjun@gitea.com>
- Luminary ([@fengyec2](https://github.com/fengyec2))

## v1.6.0

[compare changes](https://github.com/ggchivalrous/yiyin/compare/v1.4.4...v1.6.0)

### 🚀 Enhancements

- 添加路径配置文件 feat: 添加logo列表返回 chore: 修改logo文件名称 ([d087940](https://github.com/ggchivalrous/yiyin/commit/d087940))
- 添加模版字段配置，背景宽高比切换 style: 页面布局整体优化 ([6dccaa7](https://github.com/ggchivalrous/yiyin/commit/6dccaa7))
- 参数设置功能实现 ([537590d](https://github.com/ggchivalrous/yiyin/commit/537590d))
- **mask/app:** 修改图片字体高度计算公式，统一文字对齐基线 fix: 修复参数设置保存失败问题 ([f54fb99](https://github.com/ggchivalrous/yiyin/commit/f54fb99))
- **def-temps): 添加默认文本模板，文本模板功能支持 feat: 添加更多相机信息 feat(mask.svelte:** 优化文本生成处理 ([8915f2c](https://github.com/ggchivalrous/yiyin/commit/8915f2c))
- 参数拆分成相机参数、自定义参数，添加自定义参数处理 ([2e65f07](https://github.com/ggchivalrous/yiyin/commit/2e65f07))
- **const): 添加默认文本模版 feat(temp): 添加模板参数替换函数 chore: 输出图片添加原始DPI信息，优化部分逻辑 feat(field-select:** 添加变量参数选择组件 ([ad60db2](https://github.com/ggchivalrous/yiyin/commit/ad60db2))
- 添加全局异常日志采集 feat: 添加快速输出水印开关 feat: 添加支持文件拖拽输出水印 ([e8a9c96](https://github.com/ggchivalrous/yiyin/commit/e8a9c96))
- 配置文件添加版本信息，添加需要重置配置的版本 ([fe46905](https://github.com/ggchivalrous/yiyin/commit/fe46905))
- **exiftool:** 添加相机参数读取模块 feat: 添加exiftool安装脚本 ([c9558ba](https://github.com/ggchivalrous/yiyin/commit/c9558ba))
- 图片处理异步化，处理添加支持指定并发数 feat(queue): 添加队列模块 feat(image-tool): 重构图片处理工具 feat(exif-tool): 添加相机信息工具类，添加exittool工具调用实现多种图片的相机信息读取 feat(exif-format): 添加相机信息字段内容处理类 chore: 删除无用代码 ([dc431b4](https://github.com/ggchivalrous/yiyin/commit/dc431b4))
- 优化主图上下边界间隔计算公式 feat: 添加图片处理异常消息推送、图片处理进度推送 feat(queue)： 添加手动运行支持 feat: 页面添加图片处理进度、状态显示，限制文件选择类型 feat(text-tool): 优化文字默认margin计算 ([67dbcf7](https://github.com/ggchivalrous/yiyin/commit/67dbcf7))
- 添加字体加载 ([d8d4a30](https://github.com/ggchivalrous/yiyin/commit/d8d4a30))
- 添加非法文件名称格式化 fix: 修复logo图片加载异常导致图片处理异常 ([ae5e18c](https://github.com/ggchivalrous/yiyin/commit/ae5e18c))
- 添加清空已选图片按钮，页面布局修改 ([cb26e8f](https://github.com/ggchivalrous/yiyin/commit/cb26e8f))
- 添加内置字体，字体选择支持清空 fix: 修复字体会重复导入问题 ([fbcd480](https://github.com/ggchivalrous/yiyin/commit/fbcd480))
- 添加常见问题解答 ([243407d](https://github.com/ggchivalrous/yiyin/commit/243407d))
- 修改exiftool工具执行函数 ([ba1ac13](https://github.com/ggchivalrous/yiyin/commit/ba1ac13))
- 修改构建方式 ([8b3ac5d](https://github.com/ggchivalrous/yiyin/commit/8b3ac5d))
- 修改exiftool安装脚本 ([f83f232](https://github.com/ggchivalrous/yiyin/commit/f83f232))
- 添加相机参数空值判断 ([99b00fd](https://github.com/ggchivalrous/yiyin/commit/99b00fd))
- 添加主图占比、文本间距调整配置 ([0f0cc2a](https://github.com/ggchivalrous/yiyin/commit/0f0cc2a))
- 添加纯色背景色选择、文字颜色选择、文字大小写转换 ([a8b30b6](https://github.com/ggchivalrous/yiyin/commit/a8b30b6))
- 添加使用图片内容时，图片的垂直对齐方式 ([573e609](https://github.com/ggchivalrous/yiyin/commit/573e609))
- 添加路径拼接接口，字体文件路径拼接方式修改 ([503f24d](https://github.com/ggchivalrous/yiyin/commit/503f24d))
- 添加window下字体路径符合格式化 ([430fac8](https://github.com/ggchivalrous/yiyin/commit/430fac8))
- 添加缩小窗口异常判断 ([70db779](https://github.com/ggchivalrous/yiyin/commit/70db779))
- 路径获取添加异常处理 ([eaa02a3](https://github.com/ggchivalrous/yiyin/commit/eaa02a3))
- 添加图片质量指定 refactor: 路径获取移到path模块 ([fee0257](https://github.com/ggchivalrous/yiyin/commit/fee0257))
- 添加最小上下边距设置 ([b3fe8cf](https://github.com/ggchivalrous/yiyin/commit/b3fe8cf))
- 优化超长图白边问题 ([2b67c66](https://github.com/ggchivalrous/yiyin/commit/2b67c66))
- 添加背景模糊程度设置 ([5eebc4b](https://github.com/ggchivalrous/yiyin/commit/5eebc4b))

### 🩹 Fixes

- 修复自定义参数持久化失败 chore: 优化自定义参数项显示样式 ([9909bda](https://github.com/ggchivalrous/yiyin/commit/9909bda))
- 修复action脚本文件上传失败问题 ([f048f34](https://github.com/ggchivalrous/yiyin/commit/f048f34))
- 修复action脚本文件上传失败问题 ([d8aec25](https://github.com/ggchivalrous/yiyin/commit/d8aec25))
- 修复action脚本文件上传失败问题 ([5045cf3](https://github.com/ggchivalrous/yiyin/commit/5045cf3))
- 修复action脚本文件上传失败问题 ([79c738c](https://github.com/ggchivalrous/yiyin/commit/79c738c))
- 修复相机信息格式异常导致水印输出失败 feat(image-tool): 添加水印处理进度事件 ([1a8253e](https://github.com/ggchivalrous/yiyin/commit/1a8253e))
- 修复window exif工具名称使用错误导致window构建失败 ([94c2283](https://github.com/ggchivalrous/yiyin/commit/94c2283))
- 修复exiftool工具打包后使用路径错误 ([45ad6f7](https://github.com/ggchivalrous/yiyin/commit/45ad6f7))
- 修复等效焦距不存在时，参数显示异常 fix: 修复上传字体后，字体选择异常 ([131683f](https://github.com/ggchivalrous/yiyin/commit/131683f))
- 修复光圈显示错误 fix: 修复字体删除界面不更新、不能删除内置字体 ([6afe1b8](https://github.com/ggchivalrous/yiyin/commit/6afe1b8))
- 修复参数字体设置无效 fix: 修复非强制使用情况下，自定义信息覆盖原信息 chore: 校准图片Logo和文字对齐基线 ([58a2768](https://github.com/ggchivalrous/yiyin/commit/58a2768))
- 修复误删输出图片 ([cb4c369](https://github.com/ggchivalrous/yiyin/commit/cb4c369))
- 修复主图不居中问题 feat: 修改圆角可设置范围 chore: 软件图标更换 ([f1f3921](https://github.com/ggchivalrous/yiyin/commit/f1f3921))
- 修复window下图标显示异常、指引icon显示异常 ([9c2beb1](https://github.com/ggchivalrous/yiyin/commit/9c2beb1))
- 修复window下图标显示异常 ([ee1dcb9](https://github.com/ggchivalrous/yiyin/commit/ee1dcb9))
- 修复模板文本存在不同高度的图片时，图片对齐异常 ([6ef2209](https://github.com/ggchivalrous/yiyin/commit/6ef2209))
- 修复超长图片输出异常 fix: 修复时间多8小时问题 ([553c4cc](https://github.com/ggchivalrous/yiyin/commit/553c4cc))
- 修复拍摄日期时分秒错误 ([b0c8bf6](https://github.com/ggchivalrous/yiyin/commit/b0c8bf6))
- 修复部分图片出现左右白边问题 ([9b6afc9](https://github.com/ggchivalrous/yiyin/commit/9b6afc9))

### 💅 Refactors

- 引入 eslint-config，格式化项目代码 ([cf001c0](https://github.com/ggchivalrous/yiyin/commit/cf001c0))

### 📖 Documentation

- 添加macos软件损坏解决提示 ([ec535e0](https://github.com/ggchivalrous/yiyin/commit/ec535e0))

### 📦 Build

- 构建脚本修改 ([181d77d](https://github.com/ggchivalrous/yiyin/commit/181d77d))

### 🏡 Chore

- 锁定electron版本 ([0475fa2](https://github.com/ggchivalrous/yiyin/commit/0475fa2))
- 公共函数提取，移除无用代码 ([e4dc6fe](https://github.com/ggchivalrous/yiyin/commit/e4dc6fe))
- 修改文本模板字体大小默认值，移除文本默认间距 feat: 文字位置计算逻辑修改 ([1d99f4d](https://github.com/ggchivalrous/yiyin/commit/1d99f4d))
- 添加dev构建action ([a089fd9](https://github.com/ggchivalrous/yiyin/commit/a089fd9))
- 修改dev构建脚本实用的代码分支 ([abe8782](https://github.com/ggchivalrous/yiyin/commit/abe8782))
- 修改dev构建脚本实用的代码分支 ([c4d7645](https://github.com/ggchivalrous/yiyin/commit/c4d7645))
- 添加dev构建action ([59986ed](https://github.com/ggchivalrous/yiyin/commit/59986ed))
- 修改dev构建脚本下载文件目录 ([e3fcb82](https://github.com/ggchivalrous/yiyin/commit/e3fcb82))
- 修改dev构建脚本 ([156bd1e](https://github.com/ggchivalrous/yiyin/commit/156bd1e))
- 优化dev构建脚本 ([83f12bb](https://github.com/ggchivalrous/yiyin/commit/83f12bb))
- 优化dev构建脚本 ([774e3e7](https://github.com/ggchivalrous/yiyin/commit/774e3e7))
- 修改错误采集日志格式 ([e401f53](https://github.com/ggchivalrous/yiyin/commit/e401f53))
- 崩溃日志记录添加文件夹存在判断 ([a67fcdf](https://github.com/ggchivalrous/yiyin/commit/a67fcdf))
- 修改action构建脚本名称，构建上传文件类型限制 ([bb2a430](https://github.com/ggchivalrous/yiyin/commit/bb2a430))
- 感谢页样式优化、添加支付宝二维码 ([151f288](https://github.com/ggchivalrous/yiyin/commit/151f288))
- 移除mask页面打包 ([9b95431](https://github.com/ggchivalrous/yiyin/commit/9b95431))
- 修改window下exiftool工具名称 ([0e34c79](https://github.com/ggchivalrous/yiyin/commit/0e34c79))
- 提示文案修改 ([2a3e4af](https://github.com/ggchivalrous/yiyin/commit/2a3e4af))
- 添加指引图标 ([3456115](https://github.com/ggchivalrous/yiyin/commit/3456115))
- 图标更换 ([4627c6e](https://github.com/ggchivalrous/yiyin/commit/4627c6e))
- 指引图标使用方式修改 ([2af1bff](https://github.com/ggchivalrous/yiyin/commit/2af1bff))
- 移除调试代码 ([4e95d90](https://github.com/ggchivalrous/yiyin/commit/4e95d90))
- 图标更换 ([d88c293](https://github.com/ggchivalrous/yiyin/commit/d88c293))
- 图标更换 ([8bf1364](https://github.com/ggchivalrous/yiyin/commit/8bf1364))
- 修改aciton mac脚本 ([96f853f](https://github.com/ggchivalrous/yiyin/commit/96f853f))
- 修改aciton mac脚本 ([4863f1b](https://github.com/ggchivalrous/yiyin/commit/4863f1b))
- 移除electron make配置 ([e483336](https://github.com/ggchivalrous/yiyin/commit/e483336))
- 添加版本控制配置文件 ([49242af](https://github.com/ggchivalrous/yiyin/commit/49242af))

### 🎨 Styles

- 格式样式文件 feat: 字体文件名称添加格式化处理 ([423d66d](https://github.com/ggchivalrous/yiyin/commit/423d66d))

### ❤️ Contributors

- 云中君 <yunzhongjun@gitea.com>

