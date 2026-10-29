const WIKI_PAGES = Object.freeze({
  process: {title: '进程', english: 'Process', theme: 'CPU 虚拟化', href: 'index.html', description: '程序的一次执行，以及就绪、运行与阻塞的区别。', related: [{id: 'processApi', reason: '创建、等待与退出接口改变进程的状态和资源。'}, {id: 'directExecution', reason: '进程切换需要保存并恢复各自的执行现场。'}, {id: 'addressSpaces', reason: '各进程通过自己的地址空间解释虚拟地址。'}, {id: 'roundRobin', reason: '时间片耗尽使运行进程重新进入就绪队列。'}]},
  processApi: {title: '进程 API', english: 'Process API', theme: 'CPU 虚拟化', href: 'process-api.html', description: 'fork 创建进程，exec 替换程序，wait 收集退出状态；中间的准备阶段让 Shell 可以重定向输入输出。', related: [{id: 'process', reason: '进程身份与运行状态不同于它执行的程序映像。'}, {id: 'addressSpaces', reason: 'fork 后父子各有自己的地址空间，exec 替换程序映像。'}, {id: 'directExecution', reason: '系统调用通过受控入口进入内核处理。'}]},
  directExecution: {title: '受限直接执行', english: 'Limited Direct Execution', theme: 'CPU 虚拟化', href: 'limited-direct-execution.html', description: '程序直接运行，受控入口使 OS 接管；进入内核与切换进程是两个不同步骤。', related: [{id: 'process', reason: '转入内核态与改变当前运行进程是不同的变化。'}, {id: 'processApi', reason: '进程接口借助系统调用请求内核服务。'}, {id: 'roundRobin', reason: '计时器中断使 OS 能在时间片耗尽后重新调度。'}, {id: 'addressTranslation', reason: '硬件界限检查可以拒绝越界访问并触发异常。'}]},
  schedulingBasics: {title: 'CPU 调度基础', english: 'CPU Scheduling', theme: 'CPU 虚拟化', href: 'cpu-scheduling.html', description: '比较先来先服务、最短任务优先、最短剩余时间优先与时间片轮转。', related: [{id: 'process', reason: '调度从就绪进程中选择当前运行者。'}, {id: 'directExecution', reason: '计时器中断为抢占提供受控入口。'}, {id: 'mlfq', reason: '多级反馈队列根据已观察到的CPU使用调整优先级。'}]},
  fcfs: {title: '先来先服务', english: 'FCFS', theme: 'CPU 虚拟化', href: 'fcfs.html', description: '按就绪顺序获得 CPU，当前进程不会因时间片而被抢占。', related: [{id: 'process', reason: '调度只从已具备运行条件的就绪进程中选择。'}, {id: 'sjf', reason: '同为非抢占调度，SJF 改为比较 CPU 段时长。'}, {id: 'roundRobin', reason: '时间片轮转通过抢占限制一次连续运行的时长。'}]},
  sjf: {title: '最短任务优先', english: 'SJF', theme: 'CPU 虚拟化', href: 'sjf.html', description: '从就绪进程中选择下一段 CPU 时长最短者，运行后不主动抢占。', related: [{id: 'fcfs', reason: '比较按入队顺序与按 CPU 段时长选择的等待结果。'}, {id: 'srtf', reason: 'SRTF 在剩余 CPU 时间更短时允许抢占。'}, {id: 'process', reason: '短任务尚未进入就绪状态时，不能参与选择。'}]},
  srtf: {title: '最短剩余时间优先', english: 'SRTF', theme: 'CPU 虚拟化', href: 'srtf.html', description: '抢占式 SJF：候选剩余时间严格更短时抢占，原运行者回到就绪并保留进度。', related: [{id: 'sjf', reason: 'SJF 不抢占，SRTF 会重新比较运行者与就绪者。'}, {id: 'mlfq', reason: 'MLFQ 根据使用历史调整优先级，不预知总时长。'}, {id: 'process', reason: '被抢占的进程回到就绪状态并保留执行进度。'}]},
  roundRobin: {title: '时间片轮转', english: 'Round Robin', theme: 'CPU 虚拟化', href: 'round-robin.html', description: '就绪进程按顺序获得 CPU，时间片耗尽后回到队尾。', related: [{id: 'fcfs', reason: 'FCFS 不按时间片抢占，轮转调度会重新入队。'}, {id: 'directExecution', reason: '计时器中断提供时间片结束时的内核入口。'}, {id: 'mlfq', reason: '多级反馈队列在同一优先级内使用轮转调度。'}, {id: 'shares', reason: '比例份额调度依据权重分配 CPU，而非只按队列轮转。'}]},
  mlfq: {title: '多级反馈队列', english: 'MLFQ', theme: 'CPU 虚拟化', href: 'mlfq.html', description: '用已观察到的 CPU 使用量调整层级：高层优先、同层轮转，累计配额耗尽后降级。', related: [{id: 'roundRobin', reason: '同层进程按时间片轮转，跨层按优先级选择。'}, {id: 'srtf', reason: 'SRTF 比较已知剩余时长，MLFQ 使用已观察到的用量。'}, {id: 'process', reason: 'I/O 阻塞与等待 CPU 的就绪状态需要分别处理。'}, {id: 'shares', reason: '目标 CPU 份额与反馈优先级是不同的分配依据。'}]},
  shares: {title: '比例份额调度', english: 'Proportional Share', theme: 'CPU 虚拟化', href: 'proportional-share.html', description: '使用同一组权重，比较彩票调度的随机抽签与 Stride 按 pass 值选择进程的结果。', related: [{id: 'roundRobin', reason: '普通轮转按队列顺序分配时间片，不依据进程权重。'}, {id: 'mlfq', reason: '反馈调度调整优先级，比例份额调度确定目标份额。'}, {id: 'multiprocessor', reason: '多核还需决定任务放置，不能只比较单核份额。'}]},
  multiprocessor: {title: '多处理器调度', english: 'Multiprocessor Scheduling', theme: 'CPU 虚拟化', href: 'multiprocessor.html', description: '两个 CPU 如何分配任务：共享队列、每核队列、负载均衡与缓存亲和性的入门对照。', related: [{id: 'process', reason: '多个 CPU 可以同时执行不同的就绪进程。'}, {id: 'fcfs', reason: '本例每个 CPU 按 FCFS 执行已分配的任务。'}, {id: 'shares', reason: 'CPU 时间份额与任务在各核上的放置需要分别考虑。'}, {id: 'aiComputing', reason: '拓展：不同类型的处理器怎样支持 AI，系统又如何组织和约束这些能力。'}]},
  aiComputing: {title: 'AI 时代的计算与操作系统', navTitle: 'AI 计算与操作系统', english: 'AI Computing & Operating Systems', theme: 'CPU 虚拟化', href: 'ai-computing.html', description: '从 CPU、GPU、NPU 与 TPU 的分工，探索任务的本地与云端执行，以及有依据的 AI 操作系统设计。', related: [{id: 'multiprocessor', reason: '任务放置从多个同类 CPU 延伸到不同类型的计算设备。'}, {id: 'directExecution', reason: '程序与代理的执行都需要可靠的控制权和权限边界。'}, {id: 'schedulingBasics', reason: '资源分配仍要考虑响应、效率与公平。'}]},
  cpuExperiments: {title: 'CPU 虚拟化实验', english: 'CPU Virtualization Experiments', theme: 'CPU 虚拟化', href: 'cpu-virtualization-experiments.html', description: '在 Ubuntu 中观察 CPU 共享、进程状态、fork 后的变量变化、程序替换与进程回收，以及系统调用的参数与结果。', related: [{id: 'process', reason: '进程状态区分等待 CPU、等待数据与正在执行。'}, {id: 'schedulingBasics', reason: '调度决定就绪进程获得 CPU 的顺序。'}, {id: 'processApi', reason: 'fork 创建子进程，exec 替换程序，waitpid 收集退出状态。'}]},
  addressSpaces: {title: '地址空间', english: 'Address Spaces', theme: '内存虚拟化', href: 'address-spaces.html', description: '进程的虚拟地址、私有与共享映射，以及代码、全局数据、堆与栈的用途。', related: [{id: 'process', reason: '虚拟地址需要结合所属进程才能解释。'}, {id: 'memoryApi', reason: '分配与释放改变堆对象的生命周期。'}, {id: 'addressTranslation', reason: '地址转换把进程的虚拟地址映射到物理位置。'}, {id: 'paging', reason: '分页允许各虚拟页使用不连续的物理页框。'}]},
  memoryApi: {title: '内存 API', english: 'Memory API', theme: '内存虚拟化', href: 'memory-api.html', description: 'malloc、free 的正确使用，大小与初始化、常见错误，以及 calloc／realloc 的关键区别。', related: [{id: 'addressSpaces', reason: '函数调用帧与动态堆对象具有不同的生命周期。'}, {id: 'freeSpace', reason: '分配器从空闲块中选择空间，释放后可以合并。'}, {id: 'addressTranslation', reason: '地址范围检查不能替代对象边界与生命周期检查。'}]},
  addressTranslation: {title: '地址转换', english: 'Address Translation', theme: '内存虚拟化', href: 'address-translation.html', description: '基址与界限：先检查虚拟范围，再生成物理地址；动态重定位与硬件、OS 的职责。', related: [{id: 'addressSpaces', reason: '程序使用虚拟地址，物理位置由映射确定。'}, {id: 'segmentation', reason: '分段为不同区域分别配置基址、界限与权限。'}, {id: 'paging', reason: '分页通过页表映射，不要求整段物理内存连续。'}, {id: 'memoryApi', reason: '整段界限检查不保证每个 C 对象访问都合法。'}]},
  segmentation: {title: '分段', english: 'Segmentation', theme: '内存虚拟化', href: 'segmentation.html', description: '代码、堆和栈的独立布局、段内范围与权限检查，以及向下增长栈的地址转换。', related: [{id: 'addressTranslation', reason: '分段把一组基址与界限扩展为各段独立的设置。'}, {id: 'addressSpaces', reason: '代码、堆与栈是虚拟地址空间中用途不同的区域。'}, {id: 'freeSpace', reason: '各段需要连续空间，可能受到外部碎片限制。'}, {id: 'paging', reason: '固定大小页框避免为每个段寻找完整连续块。'}]},
  freeSpace: {title: '空闲空间管理', english: 'Free-Space Management', theme: '内存虚拟化', href: 'free-space.html', description: '总空闲不等于连续可用：空闲列表、相邻合并、拆分，以及 First Fit／Best Fit／Worst Fit 的选择。', related: [{id: 'memoryApi', reason: 'malloc 请求连续虚拟地址范围，free 结束对象生命周期。'}, {id: 'segmentation', reason: '段的连续物理分配也会受到空闲块分布限制。'}, {id: 'paging', reason: '按页框分配物理内存与寻找变长连续块不同。'}]},
  paging: {title: '分页基础', english: 'Paging', theme: '内存虚拟化', href: 'paging.html', description: '页与页框的分配、页表与访问保护，以及线性页表的空间和访存代价。', related: [{id: 'segmentation', reason: '分段按区域连续分配，分页按固定大小页框分配。'}, {id: 'tlb', reason: '缓存页号映射可以减少重复查页表的次数。'}, {id: 'smallTables', reason: '多级页表可省去整组没有映射的下级表，减少页表占用。'}, {id: 'pageFault', reason: '目标页不在物理内存时，需要先准备页面再重试。'}]},
  tlb: {title: 'TLB（地址转换缓存，快表）', navTitle: 'TLB（快表）', english: 'TLB', theme: '内存虚拟化', href: 'tlb.html', description: '地址转换缓存的命中与缺失处理、局部性和覆盖范围，以及进程切换中的失效与 ASID。', related: [{id: 'paging', reason: 'TLB 缓存页号到页框号的映射，页内偏移保持不变。'}, {id: 'smallTables', reason: 'TLB 未命中后，多级页表可能需要逐级读取。'}, {id: 'pageFault', reason: 'TLB 未命中不等于目标页不在物理内存。'}, {id: 'replacement', reason: '淘汰 TLB 映射与淘汰物理内存中的页面不同。'}]},
  smallTables: {title: '多级页表', navTitle: '多级页表', english: 'Multilevel Page Tables', theme: '内存虚拟化', href: 'small-page-tables.html', description: '映射分布与表页占用、逐级地址转换，以及继续分层的条件和访存代价。', related: [{id: 'paging', reason: '多级结构仍记录虚拟页到物理页框的映射。'}, {id: 'tlb', reason: '映射缓存命中时，可以省去逐级读取页表。'}, {id: 'addressSpaces', reason: '虚拟地址分布稀疏时，可以省去没有映射的下级表。'}, {id: 'pageFault', reason: '缺少映射与页面暂未驻留不是同一个条件。'}]},
  pageFault: {title: '缺页与按需分页', english: 'Page Fault', theme: '内存虚拟化', href: 'page-fault.html', description: '页面驻留与后备存储、缺页后的阻塞和原指令重试，以及空闲页框与后台回收。', related: [{id: 'paging', reason: '缺页处理完成后，页表映射用于重试原访问。'}, {id: 'process', reason: '等待页面 I/O 的进程先阻塞，完成后回到就绪。'}, {id: 'replacement', reason: '没有空闲页框时，需要先选择淘汰页面。'}, {id: 'tlb', reason: '转换缓存未命中可能只需查表，并不需要页面 I/O。'}]},
  replacement: {title: '页面置换策略', english: 'Page Replacement', theme: '内存虚拟化', href: 'replacement.html', description: '内存已满时如何选择淘汰页面：OPT、FIFO、LRU、Clock，及局部性、脏页写回与抖动。', related: [{id: 'pageFault', reason: '置换为尚未驻留的目标页提供可用页框。'}, {id: 'paging', reason: '淘汰与载入改变页框占用及对应的页表映射。'}, {id: 'tlb', reason: '物理页面置换与地址转换缓存替换需要区分。'}]},
  threads: {title: '线程与并发', english: 'Threads & Concurrency', theme: '并发', href: 'threads.html', description: '线程共享的资源、各自的执行上下文，以及执行交错造成的共享更新丢失。', related: [{id: 'locks', reason: '锁使相关线程互斥地执行共享数据的更新。'}, {id: 'process', reason: '线程在进程资源中执行，也会经历就绪、运行与阻塞。'}, {id: 'addressSpaces', reason: '同一进程的线程共享地址空间，各自使用的栈也位于其中。'}, {id: 'schedulingBasics', reason: '调度分配 CPU 时间，不自动保证共享操作的正确次序。'}]},
  locks: {title: '锁与互斥', english: 'Locks', theme: '并发', href: 'locks.html', description: '临界区、原子操作、自旋与阻塞，以及锁的正确性、公平性和性能。', related: [{id: 'threads', reason: '共享变量的读取、计算与写回可能发生冲突交错。'}, {id: 'schedulingBasics', reason: '自旋线程仍可参与调度，阻塞线程需要被唤醒后才重新就绪。'}, {id: 'multiprocessor', reason: '持锁线程能否在另一核心上继续运行，会影响自旋的代价。'}]},
  concurrentStructures: {title: '并发数据结构', english: 'Concurrent Data Structures', theme: '并发', href: 'concurrent-structures.html', description: '锁的保护范围、哈希桶的独立访问，以及近似计数的争用与精确性取舍。', related: [{id: 'locks', reason: '数据结构的临界区需要正确的互斥保护。'}, {id: 'conditionVariables', reason: '获得锁之后，也可能还需要等待队列非空或出现空位。'}, {id: 'multiprocessor', reason: '多个 CPU 可能同时访问集中维护的共享状态。'}]},
  conditionVariables: {title: '条件变量', english: 'Condition Variables', theme: '并发', href: 'condition-variables.html', description: '共享条件、释放锁并等待、通知与重新获锁，以及循环检查条件的原因。', related: [{id: 'locks', reason: '检查条件与修改共享状态都需要遵守互斥保护规则。'}, {id: 'semaphores', reason: '信号量保留资源许可，条件变量通知本身不累计。'}, {id: 'concurrentStructures', reason: '正确的队列修改与等待队列可用是不同的问题。'}]},
  semaphores: {title: '信号量', english: 'Semaphores', theme: '并发', href: 'semaphores.html', description: '信号量的计数与初值，以及有界队列中取得许可、修改数据和归还许可的次序。', related: [{id: 'conditionVariables', reason: '比较等待共享条件与取得资源许可的使用方式。'}, {id: 'locks', reason: '许可控制可进行的操作数量，队列修改仍需互斥保护。'}, {id: 'threads', reason: '执行次序约束与线程的运行、就绪、阻塞状态有关。'}]},
  concurrencyBugs: {title: '并发错误', english: 'Concurrency Bugs', theme: '并发', href: 'concurrency-bugs.html', description: '原子性违反、顺序违反，以及同步范围与执行次序的修正。', related: [{id: 'locks', reason: '每次访问加锁不等于保护了完整的逻辑操作。'}, {id: 'conditionVariables', reason: '检查完成条件并等待，可以保证初始化与使用的次序。'}, {id: 'deadlock', reason: '同步方案还需要避免线程相互等待，无法继续。'}]},
  deadlock: {title: '死锁', english: 'Deadlock', theme: '并发', href: 'deadlock.html', description: '锁的获取次序、资源依赖、四个必要条件与处理取舍。', related: [{id: 'locks', reason: '获取锁可能等待，等待期间还需要考察持有的资源。'}, {id: 'semaphores', reason: '持锁等待空位可能阻止消费者释放空位。'}, {id: 'concurrencyBugs', reason: '保证数据正确与保证线程能够继续，需要分别检查。'}]},
  events: {title: '基于事件的并发', english: 'Event-based Concurrency', theme: '并发', href: 'events.html', description: '事件循环、异步 I/O、后续状态管理，以及长计算对响应的影响。', related: [{id: 'threads', reason: '并发不要求同时执行，多个请求也可以在单线程内交错推进。'}, {id: 'conditionVariables', reason: '线程等待与返回事件循环是不同的协作方式。'}, {id: 'pageFault', reason: '页面调入等隐式阻塞也可能拖住事件循环。'}]},
  concurrencyExperiments: {title: '并发参考实践', english: 'Concurrency Practice', theme: '并发', href: 'concurrency-experiments.html', description: '用可下载脚本复现更新丢失、锁的相互等待和事件循环的响应差异。', related: [{id: 'threads', reason: '追踪每个线程读取、计算和写回的次序。'}, {id: 'conditionVariables', reason: '观察被通知后重新检查共享条件的必要性。'}, {id: 'semaphores', reason: '比较许可预留与实际队列内容的变化。'}, {id: 'events', reason: '用同一工作量比较等待与请求响应。'}]},
});
const WIKI_SCHEDULING_POLICIES = Object.freeze(['fcfs', 'sjf', 'srtf', 'roundRobin']);
const WIKI_TOPIC_STATE_KEY = 'oslab.knowledge-nav.expanded.v1';
function wikiTopicState() {
  try {
    const state = JSON.parse(localStorage.getItem(WIKI_TOPIC_STATE_KEY));
    return state && typeof state === 'object' && !Array.isArray(state) ? state : {};
  } catch { return {}; }
}
function wikiHref(pageId) {
  return WIKI_SCHEDULING_POLICIES.includes(pageId) ? `cpu-scheduling.html#${pageId}` : WIKI_PAGES[pageId].href;
}

function wikiHeader(pageId, sections) {
  const current = WIKI_PAGES[pageId];
  const themes = [...new Set(Object.values(WIKI_PAGES).map(page => page.theme))];
  const topicState = wikiTopicState();
  const compact = window.matchMedia('(max-width: 1000px)').matches;
  document.title = `${current.title} ${current.english} · OSLab`;
  return `<dialog class="wiki-sidebar" id="wiki-menu" aria-label="知识目录" role="${compact ? 'dialog' : 'complementary'}"${compact ? '' : ' open'}>
    <div class="sidebar-heading"><a class="brand" href="${WIKI_PAGES.process.href}">OS<span>Lab</span><span class="brand-caption">操作系统知识页</span></a><button type="button" class="menu-close icon-button" aria-label="关闭目录" title="关闭目录"><span aria-hidden="true">×</span></button></div>
    <nav class="knowledge-nav" aria-label="知识点导航">${themes.map(theme => `<details class="knowledge-topic" data-topic="${theme}"${topicState[theme] === true ? ' open' : ''}><summary>${theme}</summary><div class="topic-pages">${Object.entries(WIKI_PAGES).filter(([id, page]) => page.theme === theme && !WIKI_SCHEDULING_POLICIES.includes(id)).map(([id, page]) => `<a href="${wikiHref(id)}" title="${page.title}" aria-label="${page.title}"${id === (WIKI_SCHEDULING_POLICIES.includes(pageId) ? 'schedulingBasics' : pageId) ? ' aria-current="page"' : ''}>${page.navTitle ?? page.title}</a>`).join('')}</div></details>`).join('')}</nav>
  </dialog>
  <header class="site-header">
    <div class="header-location"><button type="button" class="menu-open icon-button" aria-label="打开知识目录" title="打开知识目录" aria-controls="wiki-menu" aria-expanded="false"><span aria-hidden="true">☰</span></button><a class="brand mobile-brand" href="${WIKI_PAGES.process.href}">OS<span>Lab</span></a><p class="article-location"><span>${current.theme}</span><span aria-hidden="true">/</span>${current.title}</p></div>
    <nav aria-label="页内导航">${sections.map(section => `<a href="${section.href}">${section.title}</a>`).join('')}</nav>
  </header>`;
}

let wikiNavigationCleanup;
function setupWikiNavigation() {
  wikiNavigationCleanup?.();
  const panel = document.querySelector('#wiki-menu');
  const opener = document.querySelector('.menu-open');
  const closer = panel.querySelector('.menu-close');
  const compact = window.matchMedia('(max-width: 1000px)');
  const saveTopicState = event => {
    const selected = event.target.closest('.knowledge-topic > summary')?.parentElement;
    if (!selected || event.defaultPrevented) return;
    // Save the user's choice before the native toggle, so immediate navigation cannot lose it.
    const state = Object.fromEntries([...panel.querySelectorAll('.knowledge-topic')].map(topic => [topic.dataset.topic, topic === selected ? !topic.open : topic.open]));
    try { localStorage.setItem(WIKI_TOPIC_STATE_KEY, JSON.stringify(state)); } catch {}
  };
  const restoreTopicState = event => {
    if (!event.persisted) return;
    const state = wikiTopicState();
    panel.querySelectorAll('.knowledge-topic').forEach(topic => { topic.open = state[topic.dataset.topic] === true; });
  };
  panel.addEventListener('click', saveTopicState);
  window.addEventListener('pageshow', restoreTopicState);
  const closeMenu = () => {
    if (!compact.matches || !panel.open) return;
    panel.close();
    document.body.classList.remove('menu-is-open');
    opener.setAttribute('aria-expanded', 'false');
  };
  opener.addEventListener('click', () => {
    panel.showModal();
    document.body.classList.add('menu-is-open');
    opener.setAttribute('aria-expanded', 'true');
    closer.focus();
  });
  closer.addEventListener('click', closeMenu);
  panel.addEventListener('keydown', event => {
    if (compact.matches && event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }
  });
  panel.addEventListener('close', () => {
    document.body.classList.remove('menu-is-open');
    opener.setAttribute('aria-expanded', 'false');
  });
  panel.addEventListener('click', event => {
    if (event.target.closest('a')) { closeMenu(); return; }
    if (event.target !== panel) return;
    const bounds = panel.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu();
  });
  const onCompactChange = () => {
    const previousFocus = document.activeElement;
    panel.close();
    panel.setAttribute('role', compact.matches ? 'dialog' : 'complementary');
    if (!compact.matches) {
      panel.show();
      if (previousFocus !== opener && previousFocus !== closer) previousFocus.focus({preventScroll: true});
    } else if (panel.contains(previousFocus)) {
      opener.focus({preventScroll: true});
    }
    document.body.classList.remove('menu-is-open');
    opener.setAttribute('aria-expanded', 'false');
  };
  compact.addEventListener('change', onCompactChange);
  wikiNavigationCleanup = () => {
    compact.removeEventListener('change', onCompactChange);
    panel.removeEventListener('click', saveTopicState);
    window.removeEventListener('pageshow', restoreTopicState);
  };
}

document.addEventListener('DOMContentLoaded', setupWikiNavigation);

function wikiRelated(pageId) {
  const next = {
    semaphores: {id: 'concurrencyBugs', reason: '掌握同步工具之后，检查它们是否保护了正确的逻辑范围，并建立了必要的先后关系。'},
    concurrencyBugs: {id: 'deadlock', reason: '数据操作正确还不够，资源的相互等待也可能使所有相关线程停住。'},
    deadlock: {id: 'events', reason: '在多线程协作之外，还可以用单个事件循环交错处理请求。下一页作为拓展，讨论这种组织方式的收益与限制。'},
    events: {id: 'concurrencyExperiments', reason: '用固定执行次序复现共享更新、资源等待和请求响应，再改变条件分析结果。'},
    locks: {id: 'concurrentStructures', reason: '锁保证互斥之后，还要判断保护范围是否让独立操作产生了不必要的等待。'},
    concurrentStructures: {id: 'conditionVariables', reason: '队列即使能被正确修改，空队列上的消费者仍需要等待任务到来。条件变量用于组织这种等待。'},
    conditionVariables: {id: 'semaphores', reason: '条件变量通知不累计；信号量通过保留可用许可，提供另一种协调资源与执行次序的方式。'},
    threads: {id: 'locks', reason: '执行交错会使共享更新丢失；锁用于协调临界区的访问，保证互斥。'},
    process: {id: 'processApi', reason: '进程需要先被创建，才能参与 CPU 共享；接着看程序怎样请求 OS 创建进程、替换程序和等待退出。'},
    processApi: {id: 'directExecution', reason: '进程接口通过系统调用请求内核服务；受限直接执行说明程序如何进入内核，以及 OS 如何重新取得 CPU 控制权。'},
    directExecution: {id: 'schedulingBasics', reason: 'OS 已能取得控制权并切换执行现场；调度策略决定接下来让哪个就绪进程运行。'},
    schedulingBasics: {id: 'mlfq', reason: 'SJF/SRTF 的示例已知 CPU 段时长；时长未知时，MLFQ 根据运行历史兼顾响应与任务推进。'},
    mlfq: {id: 'shares', reason: 'MLFQ 根据使用历史调整优先级；若目标是让进程按约定比例分享 CPU，就需要按权重分配。'},
    shares: {id: 'multiprocessor', reason: '按权重分配解决 CPU 时间份额；多个 CPU 同时工作时，还需决定任务放在哪个核上。'},
    multiprocessor: {id: 'cpuExperiments', reason: '从进程状态、内核控制到调度分配，再用 Linux 中的 PID、状态与时间记录对照这些机制。'},
  }[pageId];
  const continuation = next ? `<div class="cpu-next-topic"><p>${next.reason}</p><a href="${wikiHref(next.id)}">继续：${WIKI_PAGES[next.id].title}<span aria-hidden="true"> →</span></a></div>` : '';
  return `<section class="knowledge-related" aria-labelledby="knowledge-related-title">${continuation}<h2 id="knowledge-related-title">相关知识</h2>${WIKI_PAGES[pageId].related.slice(0, 4).filter(({id}) => id !== next?.id).map(({id, reason}) => {
    const page = WIKI_PAGES[id];
    return `<a class="knowledge-link" href="${wikiHref(id)}"><div><h3>${page.title}</h3><p>${reason}</p></div><span aria-hidden="true">↗</span></a>`;
  }).join('')}</section>`;
}



