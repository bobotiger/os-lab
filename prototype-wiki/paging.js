const PAGING_TABLE = [{page: 0, frame: 5}, {page: 1, frame: 3}, {page: 2, frame: 6}, {page: 3, frame: 1}];
const PAGING_SIZE = OSLabSimulation.PAGE_SIZE;
const PAGING_ALLOCATION = {
  pageTables: new Map([['A', PAGING_TABLE]]),
  frameTable: Array.from({length: OSLabSimulation.FRAME_COUNT}, (_, frame) => {
    const entry = PAGING_TABLE.find(row => row.frame === frame);
    return {frame, processId: entry ? 'A' : null, page: entry?.page ?? null};
  }),
};
const PAGING_MAX = PAGING_TABLE.length * PAGING_SIZE - 1;
const pagingBits = (value, width) => value.toString(2).padStart(width, '0');

function pagingAllocationDiagram() {
  const free = [0, 2, 4, 7];
  const frames = allocated => Array.from({length: 8}, (_, frame) => {
    const chosen = allocated && (frame === 0 || frame === 2);
    const state = chosen ? 'pg-allocated' : free.includes(frame) ? 'pg-free' : 'pg-occupied';
    return `<div class="pg-alloc-frame ${state}"><span>框 ${frame}</span><strong>${chosen ? `页 ${frame === 0 ? 0 : 1}` : free.includes(frame) ? '空闲' : '已占用'}</strong><div class="pg-four">${Array.from({length: 4}, (_, offset) => `<span${chosen && frame === 2 && offset >= 2 ? ' class="pg-waste"' : ''}></span>`).join('')}</div><small>${chosen ? frame === 0 ? '使用 4 单位' : '使用 2 · 余 2' : '4 单位'}</small></div>`;
  }).join('');
  return `<p class="pt-copy">先看一个长度为 6 单位、需要单独存放的区域。下面的物理内存总共 32 单位，空闲位置彼此分开。每个大格是一个 4 单位页框，内部四个小格表示容量。</p>
    <figure class="pg-allocation"><figcaption><strong>连续分配：没有足够大的连续空闲块</strong><span>空闲框 0、2、4、7，共 16 单位；最大连续空闲块只有 4。</span></figcaption><div class="pg-alloc-band">${frames(false)}</div><p class="pg-allocation-result pg-cannot">需要连续 6 单位 &gt; 最大连续块 4 单位 · 无法满足这次连续分配</p></figure>
    <div class="pg-region"><span>把区域分成两页</span><div><strong>页 0</strong><span>4 单位内容</span></div><div><strong>页 1</strong><span>2 单位内容 + 2 单位空余</span></div></div>
    <figure class="pg-allocation"><figcaption><strong>按页分配：分别使用框 0 和框 2</strong><span>页 0 → 框 0，页 1 → 框 2；页在虚拟空间中相邻，物理页框不必相邻。</span></figcaption><div class="pg-alloc-band">${frames(true)}</div><p class="pg-allocation-result">分配 2 × 4 = 8 单位；内容使用 6，末页内部空余 <strong>2 单位</strong>。</p></figure>
    <p class="pt-caption">绿色为本区域占用，斜纹为末页内部空余；空余仍属于已分配的页框，不是空闲页框。这是一个独立的 6 单位区域；A 的四页映射采用另一组布局。实际堆布局可以在同页放多个对象，不能对每个 malloc 都单独取整。</p>`;
}

function renderPagingPage(root) {
  root.innerHTML = `<div class="page paging-page" id="top">
    ${wikiHeader('paging', [{href: '#why', title: '固定大小'}, {href: '#demo', title: '地址转换'}, {href: '#rules', title: '分页规则'}, {href: '#cost', title: '页表成本'}])}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">${WIKI_PAGES.paging.theme} / 地址空间</p>
        <h1 id="page-title">分页基础与地址转换 <span>Paging</span></h1>
        <p class="lead">页表记录虚拟页与物理页框的映射；地址转换保留页内偏移。</p>
        <p class="definition">页是虚拟地址空间中固定大小的区域，页框是物理内存中相同大小的区域。页表记录<a class="inline-link" href="${WIKI_PAGES.process.href}">进程</a>的虚拟页号与物理页框号之间的映射。页内偏移表示地址在这一页中的位置；转换只改变页号对应的区域，不改变这个位置。</p>
        <p class="model-note">进程 A 使用固定的单级页表，拥有 4 个虚拟页，物理内存有 8 个页框。页大小为 4 个示意地址单位，不对应真实字节；所有页均已驻留，映射与访问权限有效。</p>
      </section>
      <section class="rr-rules" id="why"><p class="section-index">01 / FIXED-SIZE UNITS</p><h2>连续物理内存分配与按页分配的空间需求</h2>${pagingAllocationDiagram()}<div class="pt-notes"><article><h3>页和页框，大小相同但位置不同</h3><p>页是虚拟空间中的单位，页框是物理内存中的单位。分页让每个页独立映射，不要求相邻虚拟页占据相邻物理页框。</p></article><article><h3>固定大小页框对物理内存分配的影响</h3><p>普通固定大小的页可使用任意空闲页框，不必把分散的框拼成一整段。大页或需要连续物理区域的特殊请求仍需满足相应的连续性要求。</p></article><article><h3>页级映射不替代对象分配</h3><p>一个页内可包含多个对象。malloc 仍需管理不同大小的对象；虚拟堆中的空闲区间仍可能被活对象隔开，因此页框分配不能替代对象分配。</p></article></div></section>
      <section class="paging-demo pt-section" id="demo" aria-labelledby="demo-title">
        <div class="section-heading"><div><p class="section-index">02 / ADDRESS TRANSLATION</p><h2 id="demo-title">页号映射与页内偏移共同确定物理地址</h2></div><p>页大小 ${PAGING_SIZE} / 示意单位</p></div>
        <div class="paging-toolbar">
          <div class="rr-transport" role="group" aria-label="转换演示控制">
            <button type="button" class="icon-button primary" id="paging-play" aria-label="播放" title="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button>
            <button type="button" class="icon-button" id="paging-step" aria-label="下一步" title="下一步"><span aria-hidden="true">↦</span></button>
            <button type="button" class="icon-button" id="paging-reset" aria-label="重新演示" title="重新演示"><span aria-hidden="true">↺</span></button>
          </div>
          <label class="address-control" for="paging-address">虚拟地址<input id="paging-address" type="number" min="0" max="${PAGING_MAX}" step="1" value="6" aria-describedby="paging-error"><span>0–${PAGING_MAX}</span></label>
          <input id="paging-address-range" type="range" min="0" max="${PAGING_MAX}" step="1" value="6" aria-label="虚拟地址滑块">
        </div>
        <p class="paging-error" id="paging-error" aria-live="polite"></p>
        <div class="paging-stages" role="group" aria-label="转换阶段">${['虚拟地址', '拆分页号与偏移', '查页表', '得到物理地址'].map((title, index) => `<button type="button" data-stage="${index}" aria-pressed="${index === 0}"><span>${String(index).padStart(2, '0')}</span>${title}</button>`).join('')}</div>
        <div class="paging-visual">
          <div class="paging-addresses">
            <div class="address-block"><p class="address-label">虚拟地址 <span>Virtual address</span></p><div class="address-value" id="paging-virtual"></div><div class="address-bits" id="paging-virtual-bits"></div></div>
            <span class="address-arrow" aria-hidden="true">→</span>
            <div class="address-block"><p class="address-label">物理地址 <span>Physical address</span></p><div class="address-value" id="paging-physical"></div><div class="address-bits" id="paging-physical-bits"></div></div>
          </div>
          <dl class="pg-calculation" id="paging-calculation"></dl>
          <div class="paging-map">
            <svg class="pg-route" aria-hidden="true"></svg>
            <div class="virtual-pages"><h3>A 的虚拟页</h3><p class="map-subtitle">每页四个位置 · 虚拟地址连续</p>${PAGING_TABLE.map(entry => `<div class="virtual-page" data-page="${entry.page}"><strong>页 ${entry.page}</strong><span>VA ${entry.page * PAGING_SIZE}–${(entry.page + 1) * PAGING_SIZE - 1}</span><div class="pg-virtual-units">${Array.from({length: PAGING_SIZE}, (_, offset) => `<span data-virtual-address="${entry.page * PAGING_SIZE + offset}">${entry.page * PAGING_SIZE + offset}</span>`).join('')}</div></div>`).join('')}</div>
            <div class="page-table-block"><h3>A 的页表</h3><p class="map-subtitle">固定预设映射</p><table class="paging-table"><thead><tr><th scope="col">页号</th><th scope="col">页框号</th></tr></thead><tbody>${PAGING_TABLE.map(entry => `<tr data-table-page="${entry.page}"><th scope="row">${entry.page}</th><td>${entry.frame}</td></tr>`).join('')}</tbody></table></div>
            <div class="physical-frames"><h3>物理页框</h3><p class="map-subtitle">每框四个位置 · 显示物理地址</p>${PAGING_ALLOCATION.frameTable.map(slot => `<div class="physical-frame" data-frame="${slot.frame}"><span>框 ${slot.frame}<small>${slot.page === null ? '未使用' : `A · 页 ${slot.page}`}</small></span>${Array.from({length: PAGING_SIZE}, (_, offset) => `<span class="frame-unit" data-address="${slot.frame * PAGING_SIZE + offset}">${slot.frame * PAGING_SIZE + offset}</span>`).join('')}</div>`).join('')}</div>
          </div>
          <p class="pt-caption">连线表示本次查到的映射：页号定位表项，表项给出页框号。橙色位置保留同一偏移；移动标记不表示搬动页面，也不表示实际延迟。</p>
        </div>
        <div class="paging-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="paging-event-stage"></p><h3 id="paging-event-title"></h3><p id="paging-event-text"></p></div>
      </section>
      <section class="paging-rules" id="rules" aria-labelledby="rules-title">
        <div class="section-heading"><div><p class="section-index">03 / THE RULE</p><h2 id="rules-title">虚拟页映射到物理页框，页内偏移保持不变</h2></div></div>
        <p class="paging-formula">物理地址 = 页框号 × 页大小 + 页内偏移</p>
        <dl class="concepts rr-concepts">
          <div><dt>先拆成页号与偏移</dt><dd>页号是虚拟地址除以页大小的整数商，偏移是余数。本例页大小为 4，二进制地址的低 2 位表示偏移。</dd></div>
          <div><dt>虚拟连续，物理可不连续</dt><dd>页 0、1、2、3 分别映射到框 5、3、6、1。连续的虚拟页不必占据连续的物理页框。</dd></div>
          <div><dt>页表属于地址空间</dt><dd>不同进程的相同虚拟地址可以映射到不同的物理地址。地址转换必须使用所属地址空间的页表，而不是把虚拟地址数字视为全局物理位置。</dd></div>
        </dl>
      </section>
      <section class="rr-rules pt-section" id="cost"><p class="section-index">04 / TWO NEW COSTS</p><h2>页表映射的属性、存储空间与查表开销</h2><div class="pt-notes"><article><h3>页表不仅有页框号</h3><p>页表项通常还包含有效性、权限、驻留或其他状态信息，具体格式随架构变化。页框号说明数据在哪里，其他属性决定映射能否用于本次访问。</p></article><article><h3>每次查表的访问成本</h3><p>页表通常位于内存。无 TLB、无其他缓存的单级路径，先读一次表项，再访问一次目标数据。<a class="inline-link" href="tlb.html">TLB</a> 缓存转换，减少重复查表；次数减少不等于耗时按同样比例减少。</p></article><article><h3>大地址空间的页表存储</h3><p>若采用 32 位地址、4 KiB 页，就有 2²⁰ 个虚拟页；每项 4 字节时，线性页表需要 4 MiB，即使许多地址未使用。<a class="inline-link" href="small-page-tables.html">多级页表</a>可省去部分下级表。这组计算使用实际字节单位，页大小为 4 KiB。</p></article></div><p class="pt-copy">转换缓存、页表组织与页面驻留，分别处理地址转换开销、页表存储空间和目标页面是否在物理内存中的问题，不能相互替代。</p></section>
      ${wikiRelated('paging')}
    </main><footer><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer>
  </div>`;

  let address = 6;
  let stage = 0;
  let valid = true;
  let timer = null;
  const input = root.querySelector('#paging-address');
  const range = root.querySelector('#paging-address-range');
  const playButton = root.querySelector('#paging-play');
  const stepButton = root.querySelector('#paging-step');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  root.querySelector('.paging-stages').after(root.querySelector('.paging-event'));
  const bitGroup = (value, width, type, label) => `<div class="bit-group ${type}"><div>${pagingBits(value, width).split('').map(bit => `<span class="bit">${bit}</span>`).join('')}</div><span>${label}</span></div>`;

  const cancel = () => root.querySelector('.paging-map').getAnimations({subtree: true}).forEach(animation => animation.cancel());
  const drawMapping = (animate = false) => {
    const diagram = root.querySelector('.paging-map');
    const svg = diagram.querySelector('.pg-route');
    svg.replaceChildren();
    if (!valid || stage < 2) return;
    const bounds = diagram.getBoundingClientRect();
    const vertical = getComputedStyle(diagram).gridTemplateColumns.split(' ').length === 1;
    const connections = [];
    const connect = (source, target, name, color) => {
      const start = source.getBoundingClientRect();
      const end = target.getBoundingClientRect();
      const sourceX = start.right - bounds.left + 3;
      const sourceY = start.top - bounds.top + start.height / 2;
      const targetX = (vertical ? end.right + 3 : end.left - 5) - bounds.left;
      const targetY = end.top - bounds.top + end.height / 2;
      const middleX = vertical ? bounds.width - 5 : (sourceX + targetX) / 2;
      connections.push({name, color, path: `M ${sourceX} ${sourceY} L ${middleX} ${sourceY} L ${middleX} ${targetY} L ${targetX} ${targetY}`});
    };
    connect(diagram.querySelector('.virtual-page.active'), diagram.querySelector('.paging-table tr.active'), 'page', '#126756');
    connect(diagram.querySelector('.paging-table tr.active'), diagram.querySelector('.physical-frame.active'), 'frame', '#385974');
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    svg.innerHTML = connections.map(connection => `<defs><marker id="pg-arrow-${connection.name}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z" fill="${connection.color}"/></marker></defs><path data-pg-path="${connection.name}" d="${connection.path}" fill="none" stroke="${connection.color}" stroke-width="2" marker-end="url(#pg-arrow-${connection.name})"/>`).join('');
    if (animate && stage === 2 && !motion.matches) connections.forEach((connection, index) => {
      const token = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      token.setAttribute('r', '4');
      token.setAttribute('fill', connection.color);
      token.style.offsetPath = `path('${connection.path}')`;
      svg.append(token);
      const animation = token.animate([{offsetDistance: '0%'}, {offsetDistance: '100%'}], {duration: 350, delay: index * 350, fill: 'backwards', easing: 'ease-in-out'});
      animation.onfinish = animation.oncancel = () => token.remove();
    });
  };
  const paint = () => {
    cancel();
    const visual = root.querySelector('.paging-visual');
    visual.classList.toggle('invalid', !valid);
    visual.setAttribute('aria-hidden', String(!valid));
    playButton.disabled = !valid || stage === 3;
    stepButton.disabled = !valid || stage === 3;
    root.querySelectorAll('[data-stage]').forEach(button => {
      button.setAttribute('aria-pressed', String(valid && Number(button.dataset.stage) === stage));
      button.disabled = !valid;
    });
    if (!valid) {
      drawMapping();
      root.querySelector('#paging-event-stage').textContent = '虚拟地址 / 输入无效';
      root.querySelector('#paging-event-title').textContent = '地址尚未转换';
      root.querySelector('#paging-event-text').textContent = `有效输入为 0–${PAGING_MAX} 的整数地址。越过地址空间边界不等同于合法页面尚未驻留，不能通过载入页面自动修复。`;
      return;
    }
    const result = OSLabSimulation.translateAddress('A', address, PAGING_ALLOCATION, PAGING_SIZE);
    const descriptions = [
      {title: `进程请求访问虚拟地址 ${address}`, text: `这个地址位于 A 的虚拟地址空间，不是物理内存位置。页表决定它最终映射到哪里。`},
      {title: `页号 ${result.pageNumber}，页内偏移 ${result.offset}`, text: `${address} ÷ ${PAGING_SIZE} 的整数商为 ${result.pageNumber}，余数为 ${result.offset}。高 2 位选择虚拟页，低 2 位选择页内位置。`},
      {title: `页 ${result.pageNumber} 映射到框 ${result.frameNumber}`, text: `查 A 的页表，找到页号 ${result.pageNumber} 对应的页框号 ${result.frameNumber}。位置换了，但偏移 ${result.offset} 不需要改变。`},
      {title: `物理地址是 ${result.physicalAddress}`, text: `${result.frameNumber} × ${PAGING_SIZE} + ${result.offset} = ${result.physicalAddress}。从框 ${result.frameNumber} 的起始地址 ${result.frameNumber * PAGING_SIZE} 前进 ${result.offset} 个单位，得到最终位置。地址转换已完成，目标数据尚未读取。`},
    ];
    root.querySelector('#paging-virtual').textContent = address;
    root.querySelector('#paging-physical').textContent = stage === 3 ? result.physicalAddress : '—';
    root.querySelector('#paging-virtual-bits').innerHTML = bitGroup(result.pageNumber, 2, stage >= 1 ? 'page-bits' : '', stage >= 1 ? `页号 ${result.pageNumber}` : '高 2 位') + bitGroup(result.offset, 2, stage >= 1 ? 'offset-bits' : '', stage >= 1 ? `偏移 ${result.offset}` : '低 2 位');
    root.querySelector('#paging-physical-bits').innerHTML = stage >= 2 ? bitGroup(result.frameNumber, 3, 'page-bits', `页框 ${result.frameNumber}`) + bitGroup(result.offset, 2, stage === 3 ? 'offset-bits' : '', stage === 3 ? `偏移 ${result.offset}` : '偏移不变') : '<p class="pending-address">等待页表映射</p>';
    root.querySelectorAll('[data-page]').forEach(node => node.classList.toggle('active', stage >= 1 && Number(node.dataset.page) === result.pageNumber));
    root.querySelectorAll('[data-virtual-address]').forEach(node => node.classList.toggle('pg-offset-selected', stage >= 1 && Number(node.dataset.virtualAddress) === address));
    root.querySelectorAll('[data-table-page]').forEach(node => node.classList.toggle('active', stage >= 2 && Number(node.dataset.tablePage) === result.pageNumber));
    root.querySelectorAll('[data-frame]').forEach(node => node.classList.toggle('active', stage >= 2 && Number(node.dataset.frame) === result.frameNumber));
    root.querySelectorAll('[data-address]').forEach(node => node.classList.toggle('active', stage === 3 && Number(node.dataset.address) === result.physicalAddress));
    root.querySelector('#paging-calculation').innerHTML = `<div><dt>① 用页大小拆开</dt><dd>${stage >= 1 ? `${address} = ${result.pageNumber} × ${PAGING_SIZE} + ${result.offset}` : '页号与偏移尚未拆分'}</dd></div><div><dt>② 用页号查表</dt><dd>${stage >= 2 ? `页 ${result.pageNumber} → 框 ${result.frameNumber}` : '页框号尚未取得'}</dd></div><div><dt>③ 保留偏移合成</dt><dd>${stage === 3 ? `${result.frameNumber * PAGING_SIZE} + ${result.offset} = ${result.physicalAddress}` : stage === 2 ? `框起点 ${result.frameNumber * PAGING_SIZE} · 偏移 ${result.offset}` : '物理地址尚未生成'}</dd></div>`;
    root.querySelector('#paging-event-stage').textContent = `${String(stage).padStart(2, '0')} / ${['虚拟地址', '拆分地址', '页表映射', '物理地址'][stage]}`;
    root.querySelector('#paging-event-title').textContent = descriptions[stage].title;
    root.querySelector('#paging-event-text').textContent = descriptions[stage].text;
    drawMapping(true);
  };
  const pause = () => {
    clearInterval(timer);
    timer = null;
    playButton.setAttribute('aria-pressed', 'false');
    playButton.setAttribute('aria-label', '播放');
    playButton.title = '播放';
    playButton.firstElementChild.textContent = '▶';
  };
  const next = () => {
    stage = Math.min(3, stage + 1);
    if (stage === 3) pause();
    paint();
  };
  playButton.addEventListener('click', () => {
    if (timer !== null) { pause(); return; }
    playButton.setAttribute('aria-pressed', 'true');
    playButton.setAttribute('aria-label', '暂停');
    playButton.title = '暂停';
    playButton.firstElementChild.textContent = 'Ⅱ';
    timer = setInterval(next, 1400);
  });
  stepButton.addEventListener('click', () => { pause(); next(); });
  root.querySelectorAll('[data-stage]').forEach(button => button.addEventListener('click', () => { pause(); stage = Number(button.dataset.stage); paint(); }));
  const changeAddress = value => {
    pause();
    stage = 0;
    valid = value !== '' && Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= PAGING_MAX;
    root.querySelector('#paging-error').textContent = valid ? '' : `请输入 0–${PAGING_MAX} 的整数地址。`;
    input.setAttribute('aria-invalid', String(!valid));
    if (valid) {
      address = Number(value);
      input.value = address;
      range.value = address;
    }
    paint();
  };
  input.addEventListener('input', event => changeAddress(event.target.value));
  range.addEventListener('input', event => changeAddress(event.target.value));
  root.querySelector('#paging-reset').addEventListener('click', () => changeAddress(valid ? String(address) : '6'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  window.addEventListener('resize', () => drawMapping());
  motion.addEventListener('change', event => { if (event.matches) cancel(); });
  paint();
}

renderPagingPage(document.getElementById('root'));