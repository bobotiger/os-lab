const FAULT_ADDRESS = 10;
const FAULT_PAGE = Math.floor(FAULT_ADDRESS / OSLabSimulation.PAGE_SIZE);
const FAULT_OFFSET = FAULT_ADDRESS % OSLabSimulation.PAGE_SIZE;
const FAULT_FRAME = Array.from({length: OSLabSimulation.DEMAND_FRAME_COUNT}, (_, frame) => frame).find(frame => !OSLabSimulation.demandPagingScene.some(entry => entry.frame === frame));
const FAULT_STAGES = [
  {label: '发起访问', state: '运行', mode: '用户态', title: '访问虚拟地址 10', text: '地址 10 属于页 2，页内偏移为 2。此时只是发起访问，尚未读取到目标数据。'},
  {label: '检查页表', state: '运行', mode: '用户态', title: '页 2 的驻留位是 0', text: '驻留位记录页面当前是否在物理内存中。页 2 属于 A，且允许本次访问，但驻留位为 0，没有可用页框号，因此地址转换不能直接完成。'},
  {label: '缺页异常', state: '运行', mode: '内核态', title: '硬件触发异常，进入内核处理', text: '缺页由这次内存访问触发，不是普通程序主动发起的系统调用。目标访问尚未完成，操作系统检查地址合法性并准备载入页面。'},
  {label: '等待载入', state: '阻塞', mode: '等待 I/O', title: 'A 等待磁盘读取，让出 CPU', text: '操作系统使用空闲页框 1，发起页 2 的磁盘读取。A 因等待 I/O 而阻塞；CPU 可运行其他就绪进程，不必空等磁盘。'},
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

function faultDemandDiagram() {
  const scene = OSLabSimulation.demandPagingScene;
  return `<p class="pt-copy">拥有一个虚拟页，不等于它的数据此刻已在物理内存。A 有五个虚拟页，而本例物理内存只有四个页框；按需分页先保留地址空间，只在需要时准备相应页面。</p><figure class="pf-demand"><figcaption><strong>A 的虚拟地址空间 · 页 2 起初未驻留</strong><span>驻留位描述当前是否在内存，不决定地址是否合法。</span></figcaption><div class="pf-page-strip">${scene.map(entry => `<div class="${entry.resident ? 'pf-resident' : 'pf-nonresident'}${entry.page === FAULT_PAGE ? ' pf-target' : ''}"><strong>页 ${entry.page}</strong><span>VA ${entry.page * 4}–${entry.page * 4 + 3}</span><small>${entry.resident ? `已驻留 · 框 ${entry.frame}` : '尚未驻留'}</small></div>`).join('')}</div><p class="pf-demand-total">起初 ${scene.filter(entry => entry.resident).length} 页驻留；框 ${FAULT_FRAME} 空闲。访问 VA ${FAULT_ADDRESS} 时，页 ${FAULT_PAGE} 才需要载入；其他未访问的页不因这次访问自动载入。</p></figure>
    <div class="pf-trigger"><strong>请求 VA 10 · 页 2 / 偏移 2</strong><span>地址属于 A、访问被允许</span><span>但驻留位为 0</span><p>硬件无法完成这次访问，触发缺页异常。OS 再检查地址空间与访问权限，不能仅凭驻留位为 0 就决定读磁盘。</p></div>
    <div class="pf-decisions"><section><h3>已驻留，且本次访问被允许</h3><p>按现有映射完成地址转换，再访问数据；不因本次访问进入载入流程。</p></section><section><h3>合法非驻留，已有磁盘副本</h3><p>找到空闲页框，读取页 2，建立映射，等 A 重新获得 CPU 后重试。</p></section><section><h3>地址不合法，或本次访问不被允许</h3><p>不能套用“载入就能修好”的流程；由 OS 按相应的错误或保护异常规则处理。</p></section></div><p class="pt-caption">页表中驻留与权限信息的具体编码随体系结构变化。匿名页首次访问可能按需提供零页；写时复制等也可能触发故障处理。并非所有缺页都需要磁盘读取；页 2 的载入需要读取它已有的磁盘副本。</p>`;
}

function renderPageFaultPage(root) {
  root.innerHTML = `<div class="page fault-page" id="top">
    ${wikiHeader('pageFault', [{href: '#why', title: '为何按需'}, {href: '#demo', title: '缺页流程'}, {href: '#rules', title: '关键区别'}])}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">内存虚拟化 / 按需载入</p>
        <h1 id="page-title">缺页与按需分页 <span>Page Fault</span></h1>
        <p class="lead">访问被允许但目标页不在物理内存时，先准备页面，再重试原指令。</p>
        <p class="definition">驻留表示页面当前已存放在物理内存中。<a class="inline-link" href="${WIKI_PAGES.paging.href}">分页地址转换</a>需要可用的页框映射；本例目标页合法且允许访问，却尚未驻留，因此硬件触发缺页异常。操作系统准备好页面后，进程重新获得 CPU，再重试原指令。按需分页使页面在需要时才占用物理页框。</p>
        <p class="pt-copy"><a class="inline-link" href="tlb.html">TLB</a> 缓存地址转换，<a class="inline-link" href="small-page-tables.html">多级页表</a>组织映射并可减少稀疏地址空间的页表存储，按需分页负责在访问需要时准备尚未驻留的页面。TLB 未命中可以查表后直接访问，不一定触发缺页；未映射或不允许访问的地址，也不能一概载入后重试。</p>
        <p class="model-note">A 有 5 个虚拟页，物理内存有 4 个页框，页大小为 4 个示意地址单位。页 2 属于 A，且本次访问被允许。未驻留时，它已有磁盘副本，框 1 空闲；驻留对照中，它起初就在框 1。执行阶段表示事件顺序，不表示实际耗时。</p>
      </section>
      <section class="rr-rules" id="why"><p class="section-index">01 / RESIDENCY IS NOT VALIDITY</p><h2>地址合法性、访问权限与页面驻留是不同条件</h2>${faultDemandDiagram()}</section>
      <section class="paging-demo pt-section" id="demo" aria-labelledby="demo-title">
        <div class="section-heading"><div><p class="section-index">02 / DEMAND PAGING</p><h2 id="demo-title">同一次访问，暂停后怎样继续？</h2></div><p>进程 A / 固定访问</p></div>
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
        <div class="pf-execution"><div><span>本次访问 · VA 10 始终不变</span><strong id="fault-access-state"></strong><small id="fault-retry-note"></small></div><div><span>CPU 与 A</span><strong id="fault-process-state"></strong><small id="fault-process-mode"></small><small id="fault-cpu-note"></small></div><div><span>页 2 与映射</span><strong id="fault-page-state"></strong><small id="fault-page-note"></small></div></div>
        <div class="fault-map">
          <svg class="pf-route" aria-hidden="true"></svg>
          <div class="pf-table-node"><h3>A 的页表</h3><p class="map-subtitle">驻留位 0 = 尚不在内存</p><table class="paging-table fault-table"><thead><tr><th scope="col">页号</th><th scope="col">驻留位</th><th scope="col">页框号</th></tr></thead><tbody>${OSLabSimulation.demandPagingScene.map(entry => `<tr data-fault-page="${entry.page}"><th scope="row">${entry.page}</th><td class="fault-resident"></td><td class="fault-mapping"></td></tr>`).join('')}</tbody></table><p class="pf-table-status" id="fault-table-status"></p></div>
          <div class="fault-storage"><h3>磁盘副本</h3><p class="map-subtitle">页 2 的后备内容</p><div class="fault-storage-page"><span>页 ${FAULT_PAGE}</span><small>已有内容</small></div><p class="fault-transfer" id="fault-transfer"></p><p class="fault-storage-note">载入是复制，不会删除这份磁盘内容。</p></div>
          <div class="pf-memory-node"><h3>物理内存</h3><p class="map-subtitle">页 2 的目标位置是框 1</p><div class="fault-frames">${Array.from({length: OSLabSimulation.DEMAND_FRAME_COUNT}, (_, frame) => `<div class="fault-frame" data-fault-frame="${frame}"><p>框 ${frame} <span>${frame * OSLabSimulation.PAGE_SIZE}–${(frame + 1) * OSLabSimulation.PAGE_SIZE - 1}</span></p><strong></strong><span class="fault-frame-note"></span><div class="pf-frame-units">${Array.from({length: OSLabSimulation.PAGE_SIZE}, (_, offset) => `<span data-fault-address="${frame * OSLabSimulation.PAGE_SIZE + offset}">${frame * OSLabSimulation.PAGE_SIZE + offset}</span>`).join('')}</div></div>`).join('')}</div><p class="pf-address-result" id="fault-address-result"></p></div>
        </div>
        <p class="pt-caption">橙色实线：正在复制；橙色虚线：本例已完成的复制，不是再次读磁盘。蓝色路径：已建立的页表映射。移动标记只示意复制方向，不代表实际延迟；蓝线不表示搬动数据。</p>
        <div class="fault-observation"><div><span>缺页次数</span><strong id="fault-count"></strong></div><div><span>本次磁盘读取</span><strong id="fault-io"></strong></div></div>
        <div class="paging-event fault-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="fault-event-stage"></p><h3 id="fault-event-title"></h3><p id="fault-event-text"></p></div>
      </section>
      <section class="paging-rules" id="rules" aria-labelledby="rules-title">
        <div class="section-heading"><div><p class="section-index">03 / THE DISTINCTION</p><h2 id="rules-title">缺页，不等于地址错误</h2></div></div>
        <dl class="concepts rr-concepts">
          <div><dt>合法但尚未驻留</dt><dd>页 2 属于 A 的地址空间，本次访问也被允许，只是数据还不在内存。非法地址或权限错误不能按这里的“载入后重试”流程处理。</dd></div>
          <div><dt>载入完成，先回到就绪</dt><dd>等待读取时 A 阻塞；读取完成后回到<a class="inline-link" href="${WIKI_PAGES.process.href}">就绪状态</a>，还要等待 CPU。就绪与运行不是一回事。</dd></div>
          <div><dt>缺页，不一定需要置换</dt><dd>本例有空闲页框，可以直接装入，不必淘汰已有页面。只有找不到可用页框时，才可能需要回收或置换；缺页次数也不等于页面置换次数。</dd></div>
        </dl>
        <div class="pf-consequences"><section><h3>为什么要重试，而不是跳过？</h3><p>首次访问没有取得目标数据，原指令不能按成功访问继续。OS 保存恢复执行所需的信息；页面准备好且 A 再次获得 CPU 后，从引发异常的指令重试。访问始终指向 VA 10，改变的是页 2 的驻留状态与映射。</p></section><section><h3>按需载入节省什么，又付出什么？</h3><p>未访问的页面不必全部提前载入，能推迟占用页框和读取后备内容。但首次使用非驻留页会增加异常处理、可能的 I/O 与等待调度；若频繁缺页，程序就会反复等待。具体代价取决于页面来源、存储设备与调度等待，不能由阶段数量推算。</p></section></div>
        <p class="pt-copy">一次 TLB 未命中只是没找到缓存转换；一次页表遍历只是寻找映射；本例的缺页则需要准备页面并暂停未完成的访问。三者不能互相等同，载入完成也不意味着这次访问已经完成。</p>
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
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  stageList.after(root.querySelector('.fault-event'));
  const stages = () => scenario === 'fault' ? FAULT_STAGES : FAULT_HIT_STAGES;
  const cancel = () => root.querySelector('.fault-map').getAnimations({subtree: true}).forEach(animation => animation.cancel());
  const drawPaths = (animate = false) => {
    const diagram = root.querySelector('.fault-map');
    const svg = diagram.querySelector('.pf-route');
    const snapshot = pageFaultFrame(scenario, stage);
    const bounds = diagram.getBoundingClientRect();
    const vertical = getComputedStyle(diagram).gridTemplateColumns.split(' ').length === 1;
    const connections = [];
    const destination = diagram.querySelector(`[data-fault-frame="${FAULT_FRAME}"]`).getBoundingClientRect();
    const connect = (source, name, color) => {
      const start = source.getBoundingClientRect();
      const reverse = !vertical && start.left > destination.left;
      const sourceX = (reverse ? start.left - 3 : start.right + 3) - bounds.left;
      const sourceY = start.top - bounds.top + start.height / 2;
      const targetX = (vertical || reverse ? destination.right + 3 : destination.left - 5) - bounds.left;
      const targetY = destination.top - bounds.top + destination.height / 2;
      const middleX = vertical ? bounds.width - (name === 'mapping' ? 14 : 5) : (sourceX + targetX) / 2;
      const path = `M ${sourceX} ${sourceY} L ${middleX} ${sourceY} L ${middleX} ${targetY} L ${targetX} ${targetY}`;
      connections.push({name, color, path});
    };
    if (scenario === 'fault' && stage >= 3) connect(diagram.querySelector('.fault-storage-page'), 'copy', '#965520');
    if (snapshot.resident && stage >= 1) connect(diagram.querySelector(`[data-fault-page="${FAULT_PAGE}"]`), 'mapping', '#385974');
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    svg.innerHTML = connections.map(connection => `<defs><marker id="pf-arrow-${connection.name}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z" fill="${connection.color}"/></marker></defs><path data-pf-path="${connection.name}" d="${connection.path}" fill="none" stroke="${connection.color}" stroke-width="2"${connection.name === 'copy' && !snapshot.loading ? ' stroke-dasharray="4 4"' : ''} marker-end="url(#pf-arrow-${connection.name})"/>`).join('');
    const copy = connections.find(connection => connection.name === 'copy');
    if (animate && snapshot.loading && !motion.matches && copy) {
      const token = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      token.setAttribute('r', '4');
      token.setAttribute('fill', copy.color);
      token.style.offsetPath = `path('${copy.path}')`;
      svg.append(token);
      const animation = token.animate([{offsetDistance: '0%'}, {offsetDistance: '100%'}], {duration: 600, easing: 'ease-in-out'});
      animation.onfinish = animation.oncancel = () => token.remove();
    }
  };
  const paint = () => {
    cancel();
    const snapshot = pageFaultFrame(scenario, stage);
    root.querySelectorAll('[data-fault-page]').forEach(row => {
      const entry = snapshot.pages.find(page => page.page === Number(row.dataset.faultPage));
      row.querySelector('.fault-resident').textContent = entry.resident ? '1' : '0';
      row.querySelector('.fault-mapping').textContent = entry.frame ?? '—';
      row.classList.toggle('active', stage >= 1 && entry.page === FAULT_PAGE);
      row.classList.toggle('pf-missing', stage >= 1 && entry.page === FAULT_PAGE && !entry.resident);
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
    root.querySelector('#fault-access-state').textContent = snapshot.complete ? scenario === 'fault' ? '同一次访问 · 重试完成' : '同一次访问 · 直接完成' : scenario === 'fault' && stage === 5 ? '重试原指令 · 仍访问 VA 10' : '访问尚未完成';
    root.querySelector('#fault-retry-note').textContent = snapshot.complete ? scenario === 'fault' ? '目标数据访问完成；重试没有再次触发缺页。' : '目标数据访问完成；本次没有触发缺页。' : scenario === 'fault' && stage >= 2 ? '首次没有读到目标数据，不能跳过这条指令。' : '先检查映射，尚未读到目标数据。';
    root.querySelector('#fault-cpu-note').textContent = snapshot.loading ? 'A 阻塞，CPU 可运行其他就绪进程，不必空等磁盘。' : snapshot.state === '就绪' ? 'I/O 已完成，A 仍需等待重新获得 CPU。' : snapshot.mode === '内核态' ? '正在处理异常，不是 A 主动调用载入接口。' : scenario === 'fault' && stage >= 5 ? 'A 已再次获得 CPU，恢复原指令的访问。' : 'A 正在执行这次访问。';
    root.querySelector('#fault-page-state').textContent = snapshot.resident ? '驻留位 1 · 页 2 → 框 1' : snapshot.loading ? '框 1 已预留 · 仍未驻留' : '驻留位 0 · 没有可用映射';
    root.querySelector('#fault-page-note').textContent = snapshot.complete ? '本次访问已完成；页 2 继续驻留在框 1。' : snapshot.loading ? '读取期间不把预留框当成可访问的驻留页面。' : snapshot.resident ? '页面已准备好，不等于进程已运行或访问已完成。' : '合法且有后备副本；不是非法地址。';
    root.querySelector('#fault-table-status').textContent = stage === 0 ? '尚未检查本次表项。' : snapshot.resident ? '映射可用；驻留位为 1，页框号为 1。' : snapshot.loading ? 'I/O 未完成，表项仍为 0 / —。' : '没有可用页框号，不能完成这次地址转换。';
    root.querySelectorAll('[data-fault-address]').forEach(node => node.classList.toggle('pf-address-selected', snapshot.complete && Number(node.dataset.faultAddress) === snapshot.translation.physicalAddress));
    root.querySelector('#fault-address-result').textContent = snapshot.complete ? '框起点 4 + 本次偏移 2 = PA 6 · 目标访问完成' : snapshot.resident ? '映射已准备；本次目标数据尚未访问。' : '没有可用于本次访问的物理地址。';
    root.querySelector('#fault-event-stage').textContent = `${String(stage).padStart(2, '0')} / ${snapshot.label}`;
    root.querySelector('#fault-event-title').textContent = snapshot.title;
    root.querySelector('#fault-event-text').textContent = snapshot.text;
    playButton.disabled = snapshot.complete;
    stepButton.disabled = snapshot.complete;
    drawPaths(true);
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
  window.addEventListener('resize', () => drawPaths());
  motion.addEventListener('change', event => { if (event.matches) cancel(); });
  reset();
}

renderPageFaultPage(document.getElementById('root'));