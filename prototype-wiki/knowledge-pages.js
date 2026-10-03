const WIKI_PAGES = Object.freeze({
  process: {title: '进程', english: 'Process', theme: 'CPU 虚拟化', href: 'index.html', description: '程序的一次执行，以及就绪、运行与阻塞的区别。', related: [{id: 'processApi', reason: '创建、等待与退出接口改变进程的状态和资源。'}, {id: 'directExecution', reason: '进程切换需要保存并恢复各自的执行现场。'}, {id: 'addressSpaces', reason: '各进程通过自己的地址空间解释虚拟地址。'}, {id: 'roundRobin', reason: '时间片耗尽使运行进程重新进入就绪队列。'}]},
  processApi: {title: '进程 API', english: 'Process API', theme: 'CPU 虚拟化', href: 'process-api.html', description: 'fork 创建进程，exec 替换程序，wait 收集退出状态；中间的准备阶段让 Shell 可以重定向输入输出。', related: [{id: 'process', reason: '进程身份与运行状态不同于它执行的程序映像。'}, {id: 'addressSpaces', reason: 'fork 后父子各有自己的地址空间，exec 替换程序映像。'}, {id: 'directExecution', reason: '系统调用通过受控入口进入内核处理。'}]},
  directExecution: {title: '受限直接执行', english: 'Limited Direct Execution', theme: 'CPU 虚拟化', href: 'limited-direct-execution.html', description: '程序直接运行，受控入口使 OS 接管；进入内核与切换进程是两个不同步骤。', related: [{id: 'process', reason: '转入内核态与改变当前运行进程是不同的变化。'}, {id: 'processApi', reason: '进程接口借助系统调用请求内核服务。'}, {id: 'roundRobin', reason: '计时器中断使 OS 能在时间片耗尽后重新调度。'}, {id: 'addressTranslation', reason: '硬件界限检查可以拒绝越界访问并触发异常。'}]},
  fcfs: {title: '先来先服务', english: 'FCFS', theme: 'CPU 虚拟化', href: 'fcfs.html', description: '按就绪顺序获得 CPU，当前进程不会因时间片而被抢占。', related: [{id: 'process', reason: '调度只从已具备运行条件的就绪进程中选择。'}, {id: 'sjf', reason: '同为非抢占调度，SJF 改为比较 CPU 段时长。'}, {id: 'roundRobin', reason: '时间片轮转通过抢占限制一次连续运行的时长。'}]},
  sjf: {title: '最短任务优先', english: 'SJF', theme: 'CPU 虚拟化', href: 'sjf.html', description: '从就绪进程中选择下一段 CPU 时长最短者，运行后不主动抢占。', related: [{id: 'fcfs', reason: '比较按入队顺序与按 CPU 段时长选择的等待结果。'}, {id: 'srtf', reason: 'SRTF 在剩余 CPU 时间更短时允许抢占。'}, {id: 'process', reason: '短任务尚未进入就绪状态时，不能参与选择。'}]},
  srtf: {title: '最短剩余时间优先', english: 'SRTF', theme: 'CPU 虚拟化', href: 'srtf.html', description: '抢占式 SJF：候选剩余时间严格更短时抢占，原运行者回到就绪并保留进度。', related: [{id: 'sjf', reason: 'SJF 不抢占，SRTF 会重新比较运行者与就绪者。'}, {id: 'mlfq', reason: 'MLFQ 根据使用历史调整优先级，不预知总时长。'}, {id: 'process', reason: '被抢占的进程回到就绪状态并保留执行进度。'}]},
  roundRobin: {title: '时间片轮转', english: 'Round Robin', theme: 'CPU 虚拟化', href: 'round-robin.html', description: '就绪进程按顺序获得 CPU，时间片耗尽后回到队尾。', related: [{id: 'fcfs', reason: 'FCFS 不按时间片抢占，轮转调度会重新入队。'}, {id: 'directExecution', reason: '计时器中断提供时间片结束时的内核入口。'}, {id: 'mlfq', reason: '多级反馈队列在同一优先级内使用轮转调度。'}, {id: 'shares', reason: '比例份额调度依据权重分配 CPU，而非只按队列轮转。'}]},
  mlfq: {title: '多级反馈队列', english: 'MLFQ', theme: 'CPU 虚拟化', href: 'mlfq.html', description: '用已观察到的 CPU 使用量调整层级：高层优先、同层轮转，累计配额耗尽后降级。', related: [{id: 'roundRobin', reason: '同层进程按时间片轮转，跨层按优先级选择。'}, {id: 'srtf', reason: 'SRTF 比较已知剩余时长，MLFQ 使用已观察到的用量。'}, {id: 'process', reason: 'I/O 阻塞与等待 CPU 的就绪状态需要分别处理。'}, {id: 'shares', reason: '目标 CPU 份额与反馈优先级是不同的分配依据。'}]},
  shares: {title: '比例份额调度', english: 'Proportional Share', theme: 'CPU 虚拟化', href: 'proportional-share.html', description: '同一组权重，对照彩票的随机分配与 Stride 的确定性份额追赶。', related: [{id: 'roundRobin', reason: '普通轮转按队列顺序分配时间片，不依据进程权重。'}, {id: 'mlfq', reason: '反馈调度调整优先级，比例份额调度确定目标份额。'}, {id: 'multiprocessor', reason: '多核还需决定任务放置，不能只比较单核份额。'}]},
  multiprocessor: {title: '多处理器调度', english: 'Multiprocessor Scheduling', theme: 'CPU 虚拟化', href: 'multiprocessor.html', description: '两个 CPU 如何分配任务：共享队列、每核队列、负载均衡与缓存亲和性的入门对照。', related: [{id: 'process', reason: '多个 CPU 可以同时执行不同的就绪进程。'}, {id: 'fcfs', reason: '本例每个 CPU 按 FCFS 执行已分配的任务。'}, {id: 'shares', reason: 'CPU 时间份额与任务在各核上的放置需要分别考虑。'}]},
  addressSpaces: {title: '地址空间', english: 'Address Spaces', theme: '内存虚拟化', href: 'address-spaces.html', description: '程序的私有内存视角：相同虚拟地址、不同内容，以及代码、全局数据、堆与栈的用途。', related: [{id: 'process', reason: '虚拟地址需要结合所属进程才能解释。'}, {id: 'memoryApi', reason: '分配与释放改变堆对象的生命周期。'}, {id: 'addressTranslation', reason: '地址转换把进程的虚拟地址映射到物理位置。'}, {id: 'paging', reason: '分页允许各虚拟页使用不连续的物理页框。'}]},
  memoryApi: {title: '内存 API', english: 'Memory API', theme: '内存虚拟化', href: 'memory-api.html', description: 'malloc、free 的正确使用，大小与初始化、常见错误，以及 calloc／realloc 的关键区别。', related: [{id: 'addressSpaces', reason: '函数调用帧与动态堆对象具有不同的生命周期。'}, {id: 'freeSpace', reason: '分配器从空闲块中选择空间，释放后可以合并。'}, {id: 'addressTranslation', reason: '地址范围检查不能替代对象边界与生命周期检查。'}]},
  addressTranslation: {title: '地址转换', english: 'Address Translation', theme: '内存虚拟化', href: 'address-translation.html', description: '基址与界限：先检查虚拟范围，再生成物理地址；动态重定位与硬件、OS 的职责。', related: [{id: 'addressSpaces', reason: '程序使用虚拟地址，物理位置由映射确定。'}, {id: 'segmentation', reason: '分段为不同区域分别配置基址、界限与权限。'}, {id: 'paging', reason: '分页通过页表映射，不要求整段物理内存连续。'}, {id: 'memoryApi', reason: '整段界限检查不保证每个 C 对象访问都合法。'}]},
  segmentation: {title: '分段', english: 'Segmentation', theme: '内存虚拟化', href: 'segmentation.html', description: '代码、堆和栈各自的基址、长度与权限，段内转换、向下增长的栈及外部碎片。', related: [{id: 'addressTranslation', reason: '分段把一组基址与界限扩展为各段独立的设置。'}, {id: 'addressSpaces', reason: '代码、堆与栈是虚拟地址空间中用途不同的区域。'}, {id: 'freeSpace', reason: '各段需要连续空间，可能受到外部碎片限制。'}, {id: 'paging', reason: '固定大小页框避免为每个段寻找完整连续块。'}]},
  freeSpace: {title: '空闲空间管理', english: 'Free-Space Management', theme: '内存虚拟化', href: 'free-space.html', description: '总空闲不等于连续可用：空闲列表、相邻合并、拆分，以及 First Fit／Best Fit／Worst Fit 的选择。', related: [{id: 'memoryApi', reason: 'malloc 请求连续虚拟地址范围，free 结束对象生命周期。'}, {id: 'segmentation', reason: '段的连续物理分配也会受到空闲块分布限制。'}, {id: 'paging', reason: '按页框分配物理内存与寻找变长连续块不同。'}]},
  paging: {title: '分页基础与地址转换', english: 'Paging', theme: '内存虚拟化', href: 'paging.html', description: '固定大小的页与页框、内部浪费、页表成本，以及页号与偏移的转换。', related: [{id: 'segmentation', reason: '分段按区域连续分配，分页按固定大小页框分配。'}, {id: 'tlb', reason: '缓存页号映射可以减少重复查页表的次数。'}, {id: 'smallTables', reason: '多级页表组织稀疏映射，减少下级表的存储。'}, {id: 'pageFault', reason: '目标页不在物理内存时，需要先准备页面再重试。'}]},
  tlb: {title: 'TLB 与快速地址转换', english: 'TLBs', theme: '内存虚拟化', href: 'tlb.html', description: '缓存地址转换：命中、未命中、查页表与填入；缓存替换不等于页面置换。', related: [{id: 'paging', reason: 'TLB 缓存页号到页框号的映射，页内偏移保持不变。'}, {id: 'smallTables', reason: 'TLB 未命中后，多级页表可能需要逐级读取。'}, {id: 'pageFault', reason: 'TLB 未命中不等于目标页不在物理内存。'}, {id: 'replacement', reason: '淘汰 TLB 映射与淘汰物理内存中的页面不同。'}]},
  smallTables: {title: '多级页表的组织与空间成本', navTitle: '多级页表', english: 'Smaller Tables', theme: '内存虚拟化', href: 'small-page-tables.html', description: '稀疏地址空间如何省去下级表，以及目录、下级表与偏移的逐级转换。', related: [{id: 'paging', reason: '多级结构仍记录虚拟页到物理页框的映射。'}, {id: 'tlb', reason: '映射缓存命中时，可以省去逐级读取页表。'}, {id: 'addressSpaces', reason: '虚拟地址分布稀疏时，可以省去没有映射的下级表。'}, {id: 'pageFault', reason: '缺少映射与页面暂未驻留不是同一个条件。'}]},
  pageFault: {title: '缺页与按需分页', english: 'Page Fault', theme: '内存虚拟化', href: 'page-fault.html', description: '页面尚未驻留时，暂停访问、载入页面，再重试原来的指令。', related: [{id: 'paging', reason: '缺页处理完成后，页表映射用于重试原访问。'}, {id: 'process', reason: '等待页面 I/O 的进程先阻塞，完成后回到就绪。'}, {id: 'replacement', reason: '没有空闲页框时，需要先选择淘汰页面。'}, {id: 'tlb', reason: '转换缓存未命中可能只需查表，并不需要页面 I/O。'}]},
  replacement: {title: '页面置换策略', english: 'Page Replacement', theme: '内存虚拟化', href: 'replacement.html', description: '内存已满时如何选择淘汰页面：OPT、FIFO、LRU、Clock，及局部性、脏页写回与抖动。', related: [{id: 'pageFault', reason: '置换为尚未驻留的目标页提供可用页框。'}, {id: 'paging', reason: '淘汰与载入改变页框占用及对应的页表映射。'}, {id: 'tlb', reason: '物理页面置换与地址转换缓存替换需要区分。'}]},
});

function wikiHeader(pageId, sections) {
  const current = WIKI_PAGES[pageId];
  const themes = [...new Set(Object.values(WIKI_PAGES).map(page => page.theme))];
  const compact = window.matchMedia('(max-width: 1000px)').matches;
  document.title = `${current.title} ${current.english} · OSLab`;
  return `<dialog class="wiki-sidebar" id="wiki-menu" aria-label="知识目录" role="${compact ? 'dialog' : 'complementary'}"${compact ? '' : ' open'}>
    <div class="sidebar-heading"><a class="brand" href="${WIKI_PAGES.process.href}">OS<span>Lab</span><span class="brand-caption">操作系统知识页</span></a><button type="button" class="menu-close icon-button" aria-label="关闭目录" title="关闭目录"><span aria-hidden="true">×</span></button></div>
    <nav class="knowledge-nav" aria-label="知识点导航">${themes.map(theme => `<details class="knowledge-topic" open><summary>${theme}</summary><div class="topic-pages">${Object.entries(WIKI_PAGES).filter(([, page]) => page.theme === theme).map(([id, page]) => `<a href="${page.href}" title="${page.title}" aria-label="${page.title}"${id === pageId ? ' aria-current="page"' : ''}>${page.navTitle ?? page.title}</a>`).join('')}</div></details>`).join('')}</nav>
  </dialog>
  <header class="site-header">
    <div class="header-location"><button type="button" class="menu-open icon-button" aria-label="打开知识目录" title="打开知识目录" aria-controls="wiki-menu" aria-expanded="false"><span aria-hidden="true">☰</span></button><a class="brand mobile-brand" href="${WIKI_PAGES.process.href}">OS<span>Lab</span></a><p class="article-location"><span>${current.theme}</span><span aria-hidden="true">/</span>${current.title}</p></div>
    <nav aria-label="页内导航">${sections.map(section => `<a href="${section.href}">${section.title}</a>`).join('')}</nav>
  </header>`;
}

function setupWikiNavigation() {
  const panel = document.querySelector('#wiki-menu');
  const opener = document.querySelector('.menu-open');
  const closer = panel.querySelector('.menu-close');
  const compact = window.matchMedia('(max-width: 1000px)');
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
  compact.addEventListener('change', () => {
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
  });
}

document.addEventListener('DOMContentLoaded', setupWikiNavigation);

function wikiRelated(pageId) {
  return `<section class="knowledge-related" aria-labelledby="knowledge-related-title"><h2 id="knowledge-related-title">相关知识</h2>${WIKI_PAGES[pageId].related.slice(0, 4).map(({id, reason}) => {
    const page = WIKI_PAGES[id];
    return `<a class="knowledge-link" href="${page.href}"><div><h3>${page.title}</h3><p>${reason}</p></div><span aria-hidden="true">↗</span></a>`;
  }).join('')}</section>`;
}