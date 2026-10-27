# OSLab 操作系统知识演示

OSLab 是面向操作系统课程的知识演示与参考实践网站，内容涵盖进程、CPU 调度和内存机制。页面通过交互演示、示例命令、参考输出与机制说明，帮助学习者观察操作系统中的关键过程。

使用时，在浏览器中直接打开 `index.html`，无需启动服务器。

## 进程 API 页浏览器检查

在项目根目录运行 `npm run check:process-api`，或运行 `node scripts/check-process-api.mjs`。脚本复用项目已有的 Playwright 和已安装的 Chromium，直接打开本地 `process-api.html`，无需启动服务器，也不会下载浏览器或安装工具。

检查桌面 1440×1000、手机 390×844 和窄屏 320×740，覆盖 fork、exec、Shell 三场景的全部阶段、前进与回退、自动播放、暂停、变速、场景与滑块中断、键盘步进，以及参考内容展开。检查进程状态、输入输出目标、当前阶段按钮遮挡、下拉框高度和页面横向溢出。

每次运行会在项目 `.tmp/process-api-check-<随机后缀>/` 中创建独立目录，保存各视口的场景截图及 `report.json`。记录包括检查结果、运行异常、控制台错误／警告、请求失败和资源响应状态；发生检查失败或日志问题时返回非零退出码。截图用于人工检查，脚本不做图片像素比对。

若浏览器已安装但没有被发现，可在当前终端设置 `PLAYWRIGHT_BROWSERS_PATH` 指向现有浏览器目录后重试，例如 PowerShell：

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = 'C:\现有浏览器目录\ms-playwright'
npm run check:process-api
```

手机检查属于 Chromium 视口与触控模拟，不代表真机、Safari、屏幕阅读器或学生试用验证。现有页面回归还覆盖 760、1000、1001px 等断点，可按需运行 `tests/process-api-page.test.js` 的定向测试。
