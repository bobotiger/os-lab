const FAULT_ADDRESS = 10;
const FAULT_PAGE = Math.floor(FAULT_ADDRESS / OSLabSimulation.PAGE_SIZE);
const FAULT_OFFSET = FAULT_ADDRESS % OSLabSimulation.PAGE_SIZE;
const FAULT_FRAME = Array.from({length: OSLabSimulation.DEMAND_FRAME_COUNT}, (_, frame) => frame).find(frame => !OSLabSimulation.demandPagingScene.some(entry => entry.frame === frame));
const FAULT_STAGES = [
  {label: '发起访问', state: '运行', mode: '用户态', title: '访问虚拟地址 10', text: '地址 10 属于页 2，页内偏移为 2。此时只是发起访问，尚未读取到目标数据。'},
  {label: '检查页表', state: '运行', mode: '用户态', title: '页 2 的驻留位是 0', text: '这是已分配且允许访问的虚拟页，但尚未装入物理内存。没有可用于此次访问的页框号，地址转换不能直接完成。'},
  {label: '缺页异常', state: '运行', mode: '内核态', title: '硬件触发异常，进入内核处理', text: '缺页由这次内存访问触发，不是普通程序主动发起的系统调用。目标访问尚未完成，操作系统检查地址合法性并准备载入页面。'},
  {label: '等待载入', state: '阻塞', mode: '等待 I/O', title: 'A 等待磁盘读取，让出 CPU', text: '操作系统使用空闲页框 1，发起页 2 的磁盘读取。本例需要 I/O，A 因等待而阻塞；CPU 可运行其他就绪进程，此处不展开调度。'},
  {label: '更新页表', state: '就绪', mode: '等待调度', title: '页 2 进入框 1，驻留位变为 1', text: '磁盘读取完成，操作系统建立页 2 → 框 1 的映射，并使 A 回到就绪状态。页面已经在内存，不代表 A 已经获得 CPU。'},
  {label: '重新调度', state: '运行', mode: '用户态', title: 'A 再次获得 CPU，重试同一条指令', text: '从引发缺页的指令继续，仍然访问虚拟地址 10，而不是跳过这次访问。页号和偏移都没有改变。'},
  {label: '访问完成', state: '运行', mode: '用户态', title: '重试成功，物理地址是 6', text: '现在页 2 已驻留在框 1。物理地址 = 1 × 4 + 2 = 6，这次重试不会再次触发缺页。'},
];
const FAULT_HIT_STAGES = [
  {label: '发起访问', state: '运行', mode: '用户态', title: '同样访问虚拟地址 10', text: '对照场景中，页 2 起初已驻留在框 1。访问的仍是页 2、偏移 2。'},
  {label: '检查页表', state: '运行', mode: '用户态', title: '驻留位为 1，直接找到框 1', text: '这次映射已经可用，无须磁盘读取，也不会因这次访问而进入缺页处理。'},
  {label: '访问完成', state: '运行', mode: '用户态', title: '直接访问物理地址 6', text: '物理地址 = 1 × 4 + 2 = 6。进程没有因这次访问阻塞，缺页次数为 0。'},
];

function pageFaultFrame(scenario, stage) {
  const stages = scenario === 'fault' ? FAULT_STAGES : FAULT_HIT_STAGES;
  const resident = scenario === 'hit' || stage >= 4;
  const pages = OSLabSimulation.demandPagingScene.map(entry => entry.page === FAULT_PAGE ? {...entry, resident, frame: resident ? FAULT_FRAME : null} : {...entry});
  const allocation = {
    pageTables: new Map([['A', pages.filter(entry => entry.resident).map(entry => ({page: entry.page, frame: entry.frame}))]]),
    frameTable: Array.from({length: OSLabSimulation.DEMAND_FRAME_COUNT}, (_, frame) => {
      const entry = pages.find(page => page.frame === frame);
      return {frame, processId: entry ? 'A' : null, page: entry?.page ?? null};
    }),
  };
  const complete = stage === stages.length - 1;
  return {pages, allocation, resident, complete, faultCount: scenario === 'fault' && stage >= 2 ? 1 : 0, loading: scenario === 'fault' && stage === 3, translation: complete ? OSLabSimulation.translateAddress('A', FAULT_ADDRESS, allocation) : null, ...stages[stage]};
}

function renderPageFaultPage(root) {
  root.innerHTML = `<div class="page fault-page" id="top">
    ${wikiHeader('pageFault', [{href: '#demo', title: '缺页流程'}, {href: '#rules', title: '关键区别'}, {href: '#knowledge-related-title', title: '相关知识'}])}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">内存虚拟化 / 按需载入</p>
        <h1 id="page-title">缺页与按需分页 <span>Page Fault</span></h1>
        <p class="lead">页面不在内存，先载入，再重试。</p>
        <p class="definition"><a class="inline-link" href="${WIKI_PAGES.paging.href}">分页地址转换</a>需要可用的页表映射。按需分页不必提前装入全部页面：本例访问一个合法、尚未驻留的页，由缺页处理把它载入内存。</p>
        <p class="model-note">教学模型：A 有 5 个虚拟页、4 个物理页框，页大小为 4 个示意地址单位。未驻留场景中，页 2 有磁盘副本、框 1 空闲；已驻留场景中，页 2 起初就在框 1。示意阶段不代表耗时；省略 TLB、权限细节、并发和页面置换，并非所有真实缺页都需要磁盘 I/O。</p>
      </section>
      <section class="paging-demo" id="demo" aria-labelledby="demo-title">
        <div class="section-heading"><div><p class="section-index">01 / DEMAND PAGING</p><h2 id="demo-title">同一个地址，两条访问路径</h2></div><p>进程 A / 固定访问</p></div>
        <div class="fault-toolbar">
          <div class="rr-transport" role="group" aria-label="缺页演示控制">
            <button type="button" class="icon-button primary" id="fault-play" aria-label="播放" title="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button>
            <button type="button" class="icon-button" id="fault-step" aria-label="下一步" title="下一步"><span aria-hidden="true">↦</span></button>
            <button type="button" class="icon-button" id="fault-reset" aria-label="重新开始" title="重新开始"><span aria-hidden="true">↺</span></button>
          </div>
          <fieldset class="fault-scenarios"><legend>页 2 的初始状态</legend><div><label><input type="radio" name="fault-scenario" value="fault" checked><span>页未驻留</span></label><label><input type="radio" name="fault-scenario" value="hit"><span>页已驻留</span></label></div></fieldset>
        </div>
        <dl class="fault-request"><div><dt>虚拟地址</dt><dd>${FAULT_ADDRESS}</dd></div><div><dt>页号</dt><dd>${FAULT_PAGE}</dd></div><div><dt>页内偏移</dt><dd>${FAULT_OFFSET}</dd></div><div><dt>物理地址</dt><dd id="fault-physical">—</dd></div></dl>
        <div class="paging-stages fault-stages" id="fault-stages" role="group" aria-label="访问阶段"></div>
        <div class="fault-map">
          <div><h3>A 的页表</h3><p class="map-subtitle">驻留位 0 = 尚不在内存</p><table class="paging-table fault-table"><thead><tr><th scope="col">页号</th><th scope="col">驻留位</th><th scope="col">页框号</th></tr></thead><tbody>${OSLabSimulation.demandPagingScene.map(entry => `<tr data-fault-page="${entry.page}"><th scope="row">${entry.page}</th><td class="fault-resident"></td><td class="fault-mapping"></td></tr>`).join('')}</tbody></table></div>
          <div><h3>物理内存</h3><p class="map-subtitle">页 2 的目标位置是框 1</p><div class="fault-frames">${Array.from({length: OSLabSimulation.DEMAND_FRAME_COUNT}, (_, frame) => `<div class="fault-frame" data-fault-frame="${frame}"><p>框 ${frame} <span>${frame * OSLabSimulation.PAGE_SIZE}–${(frame + 1) * OSLabSimulation.PAGE_SIZE - 1}</span></p><strong></strong><span class="fault-frame-note"></span></div>`).join('')}</div></div>
          <div class="fault-storage"><h3>磁盘副本</h3><p class="map-subtitle">只展示目标页</p><div class="fault-storage-page"><span>页 ${FAULT_PAGE}</span><small>已有内容</small></div><p class="fault-transfer" id="fault-transfer"></p><p class="fault-storage-note">载入是复制，不会删除这份磁盘内容。</p></div>
        </div>
        <div class="fault-observation"><div><span>A 的状态</span><strong id="fault-process-state"></strong><small id="fault-process-mode"></small></div><div><span>缺页次数</span><strong id="fault-count"></strong></div><div><span>本次磁盘读取</span><strong id="fault-io"></strong></div></div>
        <div class="paging-event fault-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="fault-event-stage"></p><h3 id="fault-event-title"></h3><p id="fault-event-text"></p></div>
      </section>
      <section class="paging-rules" id="rules" aria-labelledby="rules-title">
        <div class="section-heading"><div><p class="section-index">02 / THE DISTINCTION</p><h2 id="rules-title">缺页，不等于地址错误</h2></div></div>
        <dl class="concepts rr-concepts">
          <div><dt>合法但尚未驻留</dt><dd>页 2 属于 A 的地址空间，本次访问也被允许，只是数据还不在内存。非法地址或权限错误不能按这里的“载入后重试”流程处理。</dd></div>
          <div><dt>载入完成，先回到就绪</dt><dd>等待读取时 A 阻塞；读取完成后回到<a class="inline-link" href="${WIKI_PAGES.process.href}">就绪状态</a>，还要等待 CPU。就绪与运行不是一回事。</dd></div>
          <div><dt>缺页，不一定需要置换</dt><dd>本例有空闲页框，可以直接装入，不必淘汰已有页面。只有找不到可用页框时，才可能需要回收或置换；缺页次数也不等于页面置换次数。</dd></div>
        </dl>
      </section>
      ${wikiRelated('pageFault')}
    </main><footer><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer>
  </div>`;
  let scenario = 'fault';
  let stage = 0;
  let timer = null;
  const playButton = root.querySelector('#fault-play');
  const stepButton = root.querySelector('#fault-step');
  const stageList = root.querySelector('#fault-stages');
  const stages = () => scenario === 'fault' ? FAULT_STAGES : FAULT_HIT_STAGES;
  const paint = () => {
    const snapshot = pageFaultFrame(scenario, stage);
    root.querySelectorAll('[data-fault-page]').forEach(row => {
      const entry = snapshot.pages.find(page => page.page === Number(row.dataset.faultPage));
      row.querySelector('.fault-resident').textContent = entry.resident ? '1' : '0';
      row.querySelector('.fault-mapping').textContent = entry.frame ?? '—';
      row.classList.toggle('active', stage >= 1 && entry.page === FAULT_PAGE);
    });
    root.querySelectorAll('[data-fault-frame]').forEach(node => {
      const slot = snapshot.allocation.frameTable[Number(node.dataset.faultFrame)];
      node.querySelector('strong').textContent = slot.frame === FAULT_FRAME && snapshot.loading ? '预留 · 页 2' : slot.page === null ? '空闲' : `A · 页 ${slot.page}`;
      node.querySelector('.fault-frame-note').textContent = slot.frame === FAULT_FRAME && snapshot.loading ? '正在读取页 2' : slot.frame === FAULT_FRAME && snapshot.complete ? '访问地址 6' : slot.page === null ? '尚无映射' : '已驻留';
      node.classList.toggle('active', slot.frame === FAULT_FRAME && snapshot.resident);
      node.classList.toggle('loading', slot.frame === FAULT_FRAME && snapshot.loading);
    });
    stageList.querySelectorAll('[data-fault-stage]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.faultStage) === stage)));
    root.querySelector('#fault-physical').textContent = snapshot.translation?.physicalAddress ?? '—';
    root.querySelector('#fault-process-state').textContent = snapshot.state;
    root.querySelector('#fault-process-mode').textContent = snapshot.mode;
    root.querySelector('#fault-count').textContent = snapshot.faultCount;
    root.querySelector('#fault-io').textContent = scenario === 'hit' || stage < 3 ? '未发起' : stage === 3 ? '读取中' : '已完成';
    root.querySelector('#fault-transfer').textContent = snapshot.loading ? '页 2 → 框 1 / 读取中' : scenario === 'fault' && stage >= 4 ? '页 2 → 框 1 / 已复制' : scenario === 'hit' ? '本次访问无须读取' : '尚未发起读取';
    root.querySelector('#fault-event-stage').textContent = `${String(stage).padStart(2, '0')} / ${snapshot.label}`;
    root.querySelector('#fault-event-title').textContent = snapshot.title;
    root.querySelector('#fault-event-text').textContent = snapshot.text;
    playButton.disabled = snapshot.complete;
    stepButton.disabled = snapshot.complete;
    if (scenario === 'fault' && stage === 4 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const destination = root.querySelector(`[data-fault-frame="${FAULT_FRAME}"] strong`);
      const sourceBounds = root.querySelector('.fault-storage-page').getBoundingClientRect();
      const destinationBounds = destination.getBoundingClientRect();
      destination.animate([{transform: `translate(${sourceBounds.left + sourceBounds.width / 2 - destinationBounds.left - destinationBounds.width / 2}px, ${sourceBounds.top + sourceBounds.height / 2 - destinationBounds.top - destinationBounds.height / 2}px)`, opacity: .2}, {transform: 'translate(0, 0)', opacity: 1}], {duration: 600, easing: 'ease-out'});
    }
  };
  const pause = () => {
    clearInterval(timer);
    timer = null;
    playButton.setAttribute('aria-pressed', 'false');
    playButton.setAttribute('aria-label', '播放');
    playButton.title = '播放';
    playButton.firstElementChild.textContent = '▶';
  };
  const advance = () => {
    stage = Math.min(stage + 1, stages().length - 1);
    if (stage === stages().length - 1) pause();
    paint();
  };
  const reset = () => {
    pause();
    stage = 0;
    stageList.style.setProperty('--stage-count', stages().length);
    stageList.innerHTML = stages().map((entry, index) => `<button type="button" data-fault-stage="${index}" aria-pressed="${index === 0}"><span>${String(index).padStart(2, '0')}</span>${entry.label}</button>`).join('');
    paint();
  };
  playButton.addEventListener('click', () => {
    if (timer !== null) { pause(); return; }
    playButton.setAttribute('aria-pressed', 'true');
    playButton.setAttribute('aria-label', '暂停');
    playButton.title = '暂停';
    playButton.firstElementChild.textContent = 'Ⅱ';
    timer = setInterval(advance, 1400);
  });
  stepButton.addEventListener('click', () => { pause(); advance(); });
  root.querySelector('#fault-reset').addEventListener('click', reset);
  stageList.addEventListener('click', event => {
    const button = event.target.closest('[data-fault-stage]');
    if (!button) return;
    pause();
    stage = Number(button.dataset.faultStage);
    paint();
  });
  root.querySelectorAll('[name="fault-scenario"]').forEach(input => input.addEventListener('change', () => { scenario = input.value; reset(); }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  reset();
}

renderPageFaultPage(document.getElementById('root'));