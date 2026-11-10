# OSLab 操作系统知识演示

OSLab 是面向操作系统课程的知识演示与参考实践网站，内容涵盖进程、CPU 调度、内存机制与并发。页面通过交互演示、示例命令、参考输出与机制说明，帮助学习者观察操作系统中的关键过程。

使用时，在浏览器中直接打开 `index.html`，无需启动服务器。

## 综合练习

[操作系统习题](exercises.html) 提供 43 道题和可展开的参考解答，分为进程与线程、处理机调度、同步与死锁、内存管理、文件与 I/O。从左侧“综合练习”栏目进入，先选分类，再从题目目录选择单题阅读；窄屏使用下拉菜单选题。正文上下均可切换本分类的上一题／下一题，切回分类时保留本次访问的选题位置及解答展开状态。支持题目链接直达、浏览器前进／后退和离线打开，打印仅包含当前题目及其解答。题目及解答直接保存在 HTML 中，交互由 exercises.js 管理，局部样式为 exercises.css；禁用 JavaScript 时按分类连续显示全文。

习题导航定向检查：从项目根目录运行 `node maintenance/prototype-wiki/scripts/check-exercises.mjs`，使用现有 Playwright 浏览器（必要时按下文配置 `PLAYWRIGHT_BROWSERS_PATH`）。覆盖 43 题在五种宽度下的单题显示、分类／目录／下拉选题、翻页边界、历史记录、锚点直达、键盘展开及打印恢复；截图保存在 `.tmp/exercises/`。

## 字体与站点边界

本目录的页面统一加载 [typography.css](typography.css)。正文、标题、导航和一般控件使用同一组本机中文字体，代码和终端输出使用等宽字体，并沿用同一组中文回退。新增页面及局部样式时沿用这两种字体设置。浏览器根据系统已安装字体选择字形，离线打开时也采用同一规则。

`heading-typography.js` 负责中文标题断行，页面字体由 CSS 决定。旧作业记录与 PDF 导出仍有历史实现和测试，当前参考实践页的资源以各自 HTML 入口为准。

内存虚拟化的十个知识页在页面专用样式之后加载 [memory-reading.css](memory-reading.css)，沿用 CPU 与并发栏目的阅读层级：桌面页标题 44px、小节标题 26px、正文 16px、补充说明 14px；窄屏相应调整标题和导语，正文保持 16px。入口的 `memory-reading` 类限定这些规则的作用范围；页首、段距和展开说明由此统一，机制图的空间关系与状态颜色仍由各页维护。

Wiki 的 GitHub Pages 工作流仅发布 `prototype-wiki/`。课件从 [course-slides](../course-slides/README.md) 的入口独立打开与打包，使用课件目录内的样式、播放器和字体。

## 并发栏目

[Linux 并发验证实验](linux-concurrency-labs.html)接在“事件驱动并发”之后，提供互斥锁抢座、条件变量队列、信号量资源池、事件驱动四项实验。页面按已确认的 Word 任务书转换，保留 21 项配置参数、每项实验的操作任务、提交材料和输出说明。学生在自己的 Ubuntu 中修改配置、切换已有实现，无需修改源码；网站不运行程序或收集提交。

各实验提供独立 ZIP（源码、配置、运行脚本、使用说明），页首另有完整学生包下载，不单独提供 Word 任务书下载链接。下载资源位于 `downloads/linux-concurrency/`，会随 Wiki 发布目录一同提供；参考答案不放入网站或学生包。维护时，在工作区根目录用已有的、包含 python-docx 的 Python 运行 `maintenance/prototype-wiki/scripts/build-linux-concurrency-labs.py`，同步网页正文和下载资源。只改网页时可传入 `--page-only`。该脚本读取 `docs/teaching-artifacts/linux-concurrency-labs/adjustable/` 与 `delivery/参数说明版/Linux 并发机制验证实验任务书 对照实验说明.docx`，不要改用同目录中旧的同名任务书。

页面定向检查：`npx --no-install vitest run maintenance/prototype-wiki/tests/linux-concurrency-labs-page.test.js maintenance/prototype-wiki/tests/knowledge-navigation.test.js --exclude '**/.tmp/**'`。检查覆盖目录跳转、命令复制、实际下载、21 项参数与各实验任务的完整呈现，以及 320、390、760、1001、1440 px 的布局。2026-11-07 已在 WSL Ubuntu 22.04 中检查浏览器实际下载的 ZIP：四个独立包通过 12 组默认／修改配置后的对照运行；完整学生包通过 29 组运行与 4 组非法参数拒绝检查。截图和运行记录位于 `.tmp/concurrency-linux-web/`。

入口新增 [现代 CPU 的工作原理](cpu-foundations.html)，作为线程与并发之前的硬件基础。正文按“电路与状态、指令与程序、速度与等待、并行与性能”分组，桌面端使用随滚动保留的页内目录，窄屏可展开目录定位内容；目录可直接打开 RISC-V 示例与页末资料。包含二进制与字符／灰度的联动、一位全加器、寄存器采样与波形、求和循环与结果保存、等待时间换算、分支预测的两种结果，以及主频与 IPC 的完成时间对比，并说明核心、线程、缓存、位宽和功耗。页面支持直接以 `file://` 打开；机制依据见页末资料，时间示例不代表本机测量。

此页定向检查：`npx --no-install vitest run maintenance/prototype-wiki/tests/cpu-foundations-page.test.js maintenance/prototype-wiki/tests/cpu-foundations-visuals.test.js maintenance/prototype-wiki/tests/knowledge-navigation.test.js`。

第一阶段包含 `threads.html`（线程与并发）和 `locks.html`（锁与互斥），通过左侧“并发”目录进入。默认连续呈现线程等待和共享更新；预设、手动安排执行及逐操作回查仍可展开使用。分阶段范围、来源和教学模型见 [实施记录](../maintenance/prototype-wiki/docs/design/concurrency-site-plan.md)。

定向检查：`npx --no-install vitest run maintenance/prototype-wiki/tests/concurrency-model.test.js maintenance/prototype-wiki/tests/concurrency-page.test.js`。使用现有 Vitest、Playwright 与 Chromium，无需安装依赖。浏览器截图位于 `.tmp/concurrency-stage1/`。

第二阶段新增 `concurrent-structures.html`（并发数据结构）、`condition-variables.html`（条件变量）和 `semaphores.html`（信号量）。围绕哈希桶、共享计数器和有限任务队列，比较锁的粒度、条件等待与资源许可；支持场景对照、连续播放和拖动回看。三页接在“锁与互斥”之后。

第二阶段定向检查：`npx --no-install vitest run maintenance/prototype-wiki/tests/concurrency-stage2-model.test.js maintenance/prototype-wiki/tests/concurrency-stage2-page.test.js`。截图位于 `.tmp/concurrency-stage2/`。

“信号量”之后依次是 `concurrency-bugs.html`（并发错误）、`deadlock.html`（死锁）、`events.html`（事件驱动并发）和 `linux-concurrency-labs.html`（Linux 并发验证实验）。

第三阶段定向检查：`npx --no-install vitest run maintenance/prototype-wiki/tests/concurrency-stage3-model.test.js maintenance/prototype-wiki/tests/concurrency-stage3-page.test.js`，需要现有 Python 3、Vitest、Playwright 与 Chromium。截图位于 `.tmp/concurrency-stage3/`。

2026-11-03 内容复审覆盖 CPU 页之外的九页：线程页按资源、创建与等待、共享更新递进；锁页先解释完整临界区，再解释原子获取；数据结构页先明确保护范围，再进入近似计数拓展。条件变量与信号量的核心代码直接放在演示前；顺序错误演示显示初始化、等待和重新检查对应的代码。死锁处理与等待关系对照，事件页展示请求的待续状态，参考实践区分 Python 与 C 的运行条件。各页末尾可展开对应的 OSTEP／POSIX 资料。

复审验证运行原有并发模型、页面、阅读、步骤布局、因果和历史布局的十个定向测试文件，共 175 项通过；新增的顺序错误检查覆盖 wait 返回、重新检查、回退及初始化先完成的情况。页面检查覆盖 1440、1001、760、390、320 px，另核对 390×740 的队列演示布局；截图和本轮检查记录位于 `.tmp/concurrency-review-20261103/`。

此前减少事件数量仍需要读者从文字卡片拼接因果，因此默认演示改为物体位置、持锁范围和失败动作共同表达原因。并发错误页默认使用一个连续动画舞台：唯一的任务从队列移到 A，B 的旧检查记录保留在原处，失败时同时呈现空队列、任务去向和过期判断；修正方案用持锁范围与入口阻挡表现完整临界区。初始化案例区分写入、通知和读取，读取后共享配置仍保留原值。`concurrency-bugs-scenes.js` 选择真实模型状态，`concurrency-bugs-movie.js` 负责物体移动和播放；动画进入视口后自动播放一次，结局保留，支持暂停、拖动回看和直接对照修正。减少动态效果时不随进入视口自动播放，并用即时状态切换代替平滑移动。执行次序与逐操作过程保留在详细视图。专项回归 `npx --no-install vitest run maintenance/prototype-wiki/tests/concurrency-bug-scenes.test.js maintenance/prototype-wiki/tests/concurrency-bug-observation.test.js` 核对独立状态预期、物体轨迹和完成时机、读取副本、暂停与中断，以及 6 种视口下的全部 8 组场景。

### 并发动画的默认呈现

其余八个知识页沿用同一观察原则：动作必须有明确的对象、来源和目的地，结局保留关键前情，能够直接对照另一种条件。默认连续播放到结果，不需要按微小操作连续点击；暂停与回看可以停在移动中途。逐操作视图仅供查看代码、调度和完整记录。原有模型和场景继续保留。

| 页面 | 默认动画的观察重点 |
| --- | --- |
| 现代 CPU 的工作原理 | 上升沿把 D 复制到 Q；循环复用加法器并保留 sum；预测结果进入暂存区，确认后提交或丢弃。 |
| 线程与并发 | join 等待线程结束后读取结果；两个寄存器副本写回同一个 count，显出更新覆盖。 |
| 锁与互斥 | 原子获取把另一线程挡在保护范围外；同样的持锁工作，对照自旋与阻塞占用的 CPU 时间。 |
| 并发数据结构 | 整表锁与分桶锁的保护范围；本地更新分批合并，全局值和未合并值同时保留。 |
| 条件变量 | 实际任务移动，以及等待通知、等待获锁、重新获锁三个不同位置；保留 C2 已取走的任务。 |
| 信号量 | 圆片表示许可，方块表示任务；分别呈现预留、出入队和发布许可。 |
| 死锁 | 锁交到实际持有者手中，等待箭头连接持有者；统一获取次序后可以继续并归还锁。 |
| 基于事件的并发 | 同步展示两组的事件线程、B 的完成状态和相同的 I/O 进度；长计算对照保持相同工作量。 |

共 14 处新动画（计数器在两页共用）；CPU 的位输入、全加器、时间比例与主频／IPC 滑块继续采用直接操作、立即反馈。

实现按机制分为 `concurrency-movies-core.js`、`concurrency-movies-compare.js`、`concurrency-movies-queues.js` 和 `concurrency-movies-cpu.js`；`concurrency-movies.js` 统一进入视口播放一次、暂停、拖动、中断和减少动态效果。搬运到达之前保留旧状态，读取副本保留来源。场景切换取消旧播放；核心画面完整进入视口后才自动开始。仅回查视图展开时不自动播放主动画。

专项检查：`npx --no-install vitest run maintenance/prototype-wiki/tests/concurrency-movies.test.js`。覆盖独立算例、数据到达前后的状态、陈旧判断与等待关系、所有场景的移动锚点、1440／390／320 px 布局、进入视口播放及暂停回看。原有模型和逐操作回归继续运行，通过 `maintenance/prototype-wiki/tests/helpers/concurrency-references.js` 显式展开回查视图；实际关键画面另用浏览器审读。动画速度是观察节奏，不是硬件时钟或真实性能测量。

## 进程 API 页浏览器检查

在项目根目录运行 `npm run check:process-api`，或运行 `node maintenance/prototype-wiki/scripts/check-process-api.mjs`。脚本复用项目已有的 Playwright 和已安装的 Chromium，直接打开本地 `process-api.html`，无需启动服务器，也不会下载浏览器或安装工具。

检查桌面 1440×1000、手机 390×844 和窄屏 320×740，覆盖 fork、exec、Shell 三场景的全部阶段、前进与回退、自动播放、暂停、变速、场景与滑块中断、键盘步进，以及参考内容展开。检查进程状态、输入输出目标、当前阶段按钮遮挡、下拉框高度和页面横向溢出。

每次运行会在项目 `.tmp/process-api-check-<随机后缀>/` 中创建独立目录，保存各视口的场景截图及 `report.json`。记录包括检查结果、运行异常、控制台错误／警告、请求失败和资源响应状态；发生检查失败或日志问题时返回非零退出码。截图用于人工检查，脚本不做图片像素比对。

若浏览器已安装但没有被发现，可在当前终端设置 `PLAYWRIGHT_BROWSERS_PATH` 指向现有浏览器目录后重试，例如 PowerShell：

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = 'C:\现有浏览器目录\ms-playwright'
npm run check:process-api
```

手机检查属于 Chromium 视口与触控模拟，不代表真机、Safari、屏幕阅读器或学生试用验证。现有页面回归还覆盖 760、1000、1001px 等断点，可按需运行 `maintenance/prototype-wiki/tests/process-api-page.test.js` 的定向测试。
