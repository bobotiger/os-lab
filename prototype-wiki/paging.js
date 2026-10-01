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

function renderPagingPage(root) {
  root.innerHTML = `<div class="page paging-page" id="top">
    ${wikiHeader('paging', [{href: '#demo', title: '地址转换'}, {href: '#rules', title: '分页规则'}, {href: '#knowledge-related-title', title: '相关知识'}])}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">${WIKI_PAGES.paging.theme} / 地址空间</p>
        <h1 id="page-title">分页地址转换 <span>Paging</span></h1>
        <p class="lead">页号找到新的位置，偏移仍指向同一个位置。</p>
        <p class="definition"><a class="inline-link" href="${WIKI_PAGES.process.href}">进程</a>使用虚拟地址。分页把地址空间切成等大的页，通过页表找到对应物理页框，再保留页内偏移，得到物理地址。</p>
        <p class="model-note">教学模型：单个进程 A 的固定页表，4 个虚拟页、8 个物理页框；页大小为 4 个示意地址单位，不代表真实字节。所有页均已映射，不演示 TLB、多级页表、缺页或访问保护。</p>
      </section>
      <section class="paging-demo" id="demo" aria-labelledby="demo-title">
        <div class="section-heading"><div><p class="section-index">01 / ADDRESS TRANSLATION</p><h2 id="demo-title">把地址拆开，再拼回去</h2></div><p>页大小 ${PAGING_SIZE} / 示意单位</p></div>
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
          <div class="paging-map">
            <div class="virtual-pages"><h3>A 的虚拟页</h3><p class="map-subtitle">逻辑地址连续排列</p>${PAGING_TABLE.map(entry => `<div class="virtual-page" data-page="${entry.page}"><strong>页 ${entry.page}</strong><span>${entry.page * PAGING_SIZE}–${(entry.page + 1) * PAGING_SIZE - 1}</span></div>`).join('')}</div>
            <div class="page-table-block"><h3>A 的页表</h3><p class="map-subtitle">固定预设映射</p><table class="paging-table"><thead><tr><th scope="col">页号</th><th scope="col">页框号</th></tr></thead><tbody>${PAGING_TABLE.map(entry => `<tr data-table-page="${entry.page}"><th scope="row">${entry.page}</th><td>${entry.frame}</td></tr>`).join('')}</tbody></table></div>
            <div class="physical-frames"><h3>物理页框</h3><p class="map-subtitle">每框包含 ${PAGING_SIZE} 个地址单位</p>${PAGING_ALLOCATION.frameTable.map(slot => `<div class="physical-frame" data-frame="${slot.frame}"><span>框 ${slot.frame}<small>${slot.page === null ? '未使用' : `A · 页 ${slot.page}`}</small></span>${Array.from({length: PAGING_SIZE}, (_, offset) => `<span class="frame-unit" data-address="${slot.frame * PAGING_SIZE + offset}">${slot.frame * PAGING_SIZE + offset}</span>`).join('')}</div>`).join('')}</div>
          </div>
        </div>
        <div class="paging-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="paging-event-stage"></p><h3 id="paging-event-title"></h3><p id="paging-event-text"></p></div>
      </section>
      <section class="paging-rules" id="rules" aria-labelledby="rules-title">
        <div class="section-heading"><div><p class="section-index">02 / THE RULE</p><h2 id="rules-title">位置改变，页内偏移不变</h2></div></div>
        <p class="paging-formula">物理地址 = 页框号 × 页大小 + 页内偏移</p>
        <dl class="concepts rr-concepts">
          <div><dt>先拆成页号与偏移</dt><dd>页号是虚拟地址除以页大小的整数商，偏移是余数。本例页大小为 4，二进制地址的低 2 位表示偏移。</dd></div>
          <div><dt>虚拟连续，物理可不连续</dt><dd>页 0、1、2、3 分别映射到框 5、3、6、1。连续的虚拟页不必占据连续的物理页框。</dd></div>
          <div><dt>页表属于地址空间</dt><dd>不同进程的相同虚拟地址可以映射到不同的物理地址。本页仅展示 A 的固定页表，不与调度页共享进程状态。</dd></div>
        </dl>
      </section>
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
  const bitGroup = (value, width, type, label) => `<div class="bit-group ${type}"><div>${pagingBits(value, width).split('').map(bit => `<span class="bit">${bit}</span>`).join('')}</div><span>${label}</span></div>`;

  const paint = () => {
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
      root.querySelector('#paging-event-stage').textContent = '虚拟地址 / 输入无效';
      root.querySelector('#paging-event-title').textContent = '地址尚未转换';
      root.querySelector('#paging-event-text').textContent = `这个示例的虚拟地址范围是 0–${PAGING_MAX}，且必须是整数。越界不等同于缺页，本页不演示缺页处理。`;
      return;
    }
    const result = OSLabSimulation.translateAddress('A', address, PAGING_ALLOCATION, PAGING_SIZE);
    const descriptions = [
      {title: `进程请求访问虚拟地址 ${address}`, text: `这个地址位于 A 的虚拟地址空间，不是物理内存位置。页表决定它最终映射到哪里。`},
      {title: `页号 ${result.pageNumber}，页内偏移 ${result.offset}`, text: `${address} ÷ ${PAGING_SIZE} 的整数商为 ${result.pageNumber}，余数为 ${result.offset}。高 2 位选择虚拟页，低 2 位选择页内位置。`},
      {title: `页 ${result.pageNumber} 映射到框 ${result.frameNumber}`, text: `查 A 的页表，找到页号 ${result.pageNumber} 对应的页框号 ${result.frameNumber}。位置换了，但偏移 ${result.offset} 不需要改变。`},
      {title: `物理地址是 ${result.physicalAddress}`, text: `${result.frameNumber} × ${PAGING_SIZE} + ${result.offset} = ${result.physicalAddress}。从框 ${result.frameNumber} 的起始地址 ${result.frameNumber * PAGING_SIZE} 前进 ${result.offset} 个单位，得到最终位置。`},
    ];
    root.querySelector('#paging-virtual').textContent = address;
    root.querySelector('#paging-physical').textContent = stage === 3 ? result.physicalAddress : '—';
    root.querySelector('#paging-virtual-bits').innerHTML = bitGroup(result.pageNumber, 2, stage >= 1 ? 'page-bits' : '', stage >= 1 ? `页号 ${result.pageNumber}` : '高 2 位') + bitGroup(result.offset, 2, stage >= 1 ? 'offset-bits' : '', stage >= 1 ? `偏移 ${result.offset}` : '低 2 位');
    root.querySelector('#paging-physical-bits').innerHTML = stage >= 2 ? bitGroup(result.frameNumber, 3, 'page-bits', `页框 ${result.frameNumber}`) + bitGroup(result.offset, 2, stage === 3 ? 'offset-bits' : '', stage === 3 ? `偏移 ${result.offset}` : '偏移不变') : '<p class="pending-address">等待页表映射</p>';
    root.querySelectorAll('[data-page]').forEach(node => node.classList.toggle('active', stage >= 1 && Number(node.dataset.page) === result.pageNumber));
    root.querySelectorAll('[data-table-page]').forEach(node => node.classList.toggle('active', stage >= 2 && Number(node.dataset.tablePage) === result.pageNumber));
    root.querySelectorAll('[data-frame]').forEach(node => node.classList.toggle('active', stage >= 2 && Number(node.dataset.frame) === result.frameNumber));
    root.querySelectorAll('[data-address]').forEach(node => node.classList.toggle('active', stage === 3 && Number(node.dataset.address) === result.physicalAddress));
    root.querySelector('#paging-event-stage').textContent = `${String(stage).padStart(2, '0')} / ${['虚拟地址', '拆分地址', '页表映射', '物理地址'][stage]}`;
    root.querySelector('#paging-event-title').textContent = descriptions[stage].title;
    root.querySelector('#paging-event-text').textContent = descriptions[stage].text;
    if (stage > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const highlight = stage === 1 ? root.querySelector('.virtual-page.active') : stage === 2 ? root.querySelector('.paging-table tr.active') : root.querySelector('.frame-unit.active');
      highlight.animate([{opacity: .35}, {opacity: 1}], {duration: 380});
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
  paint();
}

renderPagingPage(document.getElementById('root'));