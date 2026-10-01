const WIKI_PAGES = Object.freeze({
  process: {title: '进程', english: 'Process', theme: 'CPU 虚拟化', href: 'index.html', description: '程序的一次执行，以及就绪、运行与阻塞的区别。', related: ['processApi', 'directExecution', 'fcfs', 'sjf', 'srtf', 'roundRobin', 'mlfq', 'shares', 'multiprocessor', 'addressSpaces', 'paging', 'pageFault']},
  processApi: {title: '进程 API', english: 'Process API', theme: 'CPU 虚拟化', href: 'process-api.html', description: 'fork 创建进程，exec 替换程序，wait 收集退出状态；中间的准备阶段让 Shell 可以重定向输入输出。', related: ['process', 'directExecution', 'paging']},
  directExecution: {title: '受限直接执行', english: 'Limited Direct Execution', theme: 'CPU 虚拟化', href: 'limited-direct-execution.html', description: '程序直接运行，受控入口使 OS 接管；进入内核与切换进程是两个不同步骤。', related: ['processApi', 'process', 'roundRobin', 'mlfq']},
  fcfs: {title: '先来先服务', english: 'FCFS', theme: 'CPU 虚拟化', href: 'fcfs.html', description: '按就绪顺序获得 CPU，当前进程不会因时间片而被抢占。', related: ['process', 'sjf', 'roundRobin']},
  sjf: {title: '最短任务优先', english: 'SJF', theme: 'CPU 虚拟化', href: 'sjf.html', description: '从就绪进程中选择下一段 CPU 时长最短者，运行后不主动抢占。', related: ['srtf', 'fcfs', 'process']},
  srtf: {title: '最短剩余时间优先', english: 'SRTF', theme: 'CPU 虚拟化', href: 'srtf.html', description: '抢占式 SJF：候选剩余时间严格更短时抢占，原运行者回到就绪并保留进度。', related: ['sjf', 'mlfq', 'process']},
  roundRobin: {title: '时间片轮转', english: 'Round Robin', theme: 'CPU 虚拟化', href: 'round-robin.html', description: '就绪进程按顺序获得 CPU，时间片耗尽后回到队尾。', related: ['multiprocessor', 'directExecution', 'mlfq', 'shares', 'process', 'fcfs']},
  mlfq: {title: '多级反馈队列', english: 'MLFQ', theme: 'CPU 虚拟化', href: 'mlfq.html', description: '用已观察到的 CPU 使用量调整层级：高层优先、同层轮转，累计配额耗尽后降级。', related: ['directExecution', 'shares', 'roundRobin', 'srtf', 'process']},
  shares: {title: '比例份额调度', english: 'Proportional Share', theme: 'CPU 虚拟化', href: 'proportional-share.html', description: '同一组权重，对照彩票的随机分配与 Stride 的确定性份额追赶。', related: ['multiprocessor', 'roundRobin', 'mlfq', 'process']},
  multiprocessor: {title: '多处理器调度', english: 'Multiprocessor Scheduling', theme: 'CPU 虚拟化', href: 'multiprocessor.html', description: '两个 CPU 如何分配任务：共享队列、每核队列、负载均衡与缓存亲和性的入门对照。', related: ['roundRobin', 'shares', 'process']},
  addressSpaces: {title: '地址空间', english: 'Address Spaces', theme: '内存虚拟化', href: 'address-spaces.html', description: '程序的私有内存视角：相同虚拟地址、不同内容，以及代码、全局数据、堆与栈的用途。', related: ['paging', 'pageFault', 'process']},
  paging: {title: '分页地址转换', english: 'Paging', theme: '内存虚拟化', href: 'paging.html', description: '拆分虚拟地址，查页表，把页框号与不变的偏移拼成物理地址。', related: ['addressSpaces', 'pageFault', 'process', 'processApi']},
  pageFault: {title: '缺页与按需分页', english: 'Page Fault', theme: '内存虚拟化', href: 'page-fault.html', description: '页面尚未驻留时，暂停访问、载入页面，再重试原来的指令。', related: ['addressSpaces', 'paging', 'process']},
});

function wikiHeader(pageId, sections) {
  const current = WIKI_PAGES[pageId];
  const themes = [...new Set(Object.values(WIKI_PAGES).map(page => page.theme))];
  const compact = window.matchMedia('(max-width: 1000px)').matches;
  document.title = `${current.title} ${current.english} · OSLab`;
  return `<dialog class="wiki-sidebar" id="wiki-menu" aria-label="知识目录" role="${compact ? 'dialog' : 'complementary'}"${compact ? '' : ' open'}>
    <div class="sidebar-heading"><a class="brand" href="${WIKI_PAGES.process.href}">OS<span>Lab</span><span class="brand-caption">操作系统知识页</span></a><button type="button" class="menu-close icon-button" aria-label="关闭目录" title="关闭目录"><span aria-hidden="true">×</span></button></div>
    <nav class="knowledge-nav" aria-label="知识点导航">${themes.map(theme => `<details class="knowledge-topic" open><summary>${theme}</summary><div class="topic-pages">${Object.entries(WIKI_PAGES).filter(([, page]) => page.theme === theme).map(([id, page]) => `<a href="${page.href}"${id === pageId ? ' aria-current="page"' : ''}>${page.title}</a>`).join('')}</div></details>`).join('')}</nav>
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
  return `<section class="knowledge-related" aria-labelledby="knowledge-related-title"><h2 id="knowledge-related-title">相关知识</h2>${WIKI_PAGES[pageId].related.map(id => {
    const page = WIKI_PAGES[id];
    return `<a class="knowledge-link" href="${page.href}"><div><h3>${page.title} <span>${page.english}</span></h3><p>${page.description}</p></div><span aria-hidden="true">↗</span></a>`;
  }).join('')}</section>`;
}