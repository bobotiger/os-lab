function renderSegmentationPage(root) {
  const {segments, operations, buildAccess} = OSLabSegmentation;
  const presets = {heap: [20, 'read'], heapBounds: [22, 'read'], codeWrite: [4, 'write'], stack: [60, 'read'], stackBounds: [55, 'read'], unmapped: [32, 'read']};
  const virtualRegions = [
    {start: 0, end: 7, owner: 0, name: '代码段'}, {start: 8, end: 15, owner: null, name: '超过代码段长'},
    {start: 16, end: 21, owner: 1, name: '堆段'}, {start: 22, end: 31, owner: null, name: '超过堆段长'},
    {start: 32, end: 47, owner: null, name: '未配置的段槽'}, {start: 48, end: 55, owner: null, name: '超过栈段长'},
    {start: 56, end: 63, owner: 3, name: '栈段 · 向下增长'},
  ];
  root.innerHTML = `<div class="page rr-page lde-page sg-page" id="top">${wikiHeader('segmentation', [{href: '#why', title: '从整段到分段'}, {href: '#demo', title: '段内转换'}, {href: '#stack', title: '向下增长的栈'}, {href: '#tradeoffs', title: '保护、共享与碎片'}])}
    <main><section class="intro"><p class="eyebrow">内存虚拟化 / 实现机制</p><h1>分段 <span>Segmentation</span></h1><p class="lead">代码、堆和栈分别对应物理区域，不必为它们之间未使用的地址预留物理空间。</p><p class="definition">段是按代码、堆或栈等用途划分的地址区域。每个段有独立的 base（物理基准位置）、bounds（可访问长度）和读写等权限。硬件先从虚拟地址确定段号，再检查段内偏移和操作权限，最后计算物理地址。不同段可以分开放置，但每个段内部仍需连续。</p><p class="model-note">进程 A 的虚拟范围与物理范围均为 0–63，物理 0–7 保留给 OS。地址和段长采用示意单位，每次访问一个单位；更宽的访问需检查整个范围。三个粗粒度段使用高 2 位选段、低 4 位编码偏移；具体分段编码随体系结构变化。</p></section>
      <section class="rr-rules" id="why"><p class="section-index">01 / ONE REGION → LOGICAL SEGMENTS</p><h2>未使用的地址，也需要占用物理内存吗？</h2>
        <div class="sg-layout-source"><h3>先区分地址范围与实际存储内容</h3><p>程序用虚拟地址定位指令和数据，操作系统与硬件把这些地址对应到物理内存位置。代码存放指令，堆存放动态申请的对象，栈存放函数调用所需的信息；它们各占据一段地址，段与段之间有些地址暂未使用。有地址编号，不等于已有内容需要存放。</p><p>本例的虚拟地址为 0–63，共 64 单位。代码占 8、堆占 6、栈占 8，合计 22 单位；其余 42 单位的地址范围不属于这三个段。因此，64 是地址范围的大小，不是代码、堆和栈的总大小。</p><div class="sg-whole-space" aria-label="虚拟地址范围：代码 8，未使用 8，堆 6，未使用 34，栈 8，共 64 单位"><span class="sg-code">代码<strong>8</strong></span><span>未使用<strong>8</strong></span><span class="sg-heap">堆<strong>6</strong></span><span>未使用<strong>34</strong></span><span class="sg-stack">栈<strong>8</strong></span></div><div class="sg-address-ends"><span>虚拟地址 0</span><span>虚拟地址 63</span></div></div>
        <div class="sg-comparison"><article><h3>整个范围连续存放：未使用的地址也占空间</h3><p class="sg-allocation-label">物理分配需求：一块连续的 64 单位</p><div class="sg-whole-space" aria-label="单一连续区域的物理空间需求：代码 8、未使用 8、堆 6、未使用 34、栈 8，必须一起连续放置"><span class="sg-code">代码<strong>8</strong></span><span>未使用<strong>8</strong></span><span class="sg-heap">堆<strong>6</strong></span><span>未使用<strong>34</strong></span><span class="sg-stack">栈<strong>8</strong></span></div><p class="sg-allocation-total">需要 <strong>64</strong> 单位 = 三个区域 22 + 中间未使用区域 42</p><p>一组 base／bounds 覆盖整个 0–63 范围，所有地址加上同一个 base 得到物理地址。为了保留代码、堆和栈之间的地址间隔，需要一块连续的 64 单位物理区域，即使中间 42 单位暂未存放内容。</p></article>
          <article><h3>各段分别存放：只为有效段范围分配空间</h3><p class="sg-allocation-label">物理分配需求：三块各自连续的区域</p><div class="sg-separated-space" aria-label="各段的物理空间需求：代码 8、堆 6、栈 8，各段分别连续放置，共 22 单位"><span class="sg-code">代码<strong>8</strong></span><span class="sg-heap">堆<strong>6</strong></span><span class="sg-stack">栈<strong>8</strong></span></div><p class="sg-allocation-total">需要 <strong>22</strong> 单位 = 代码 8 + 堆 6 + 栈 8</p><p>采用分段时，操作系统分别为代码、堆和栈安排物理空间，再配置各段自己的 base／bounds。三个段不必相邻，也不必保留虚拟地址中的间隔；段外未使用的地址无需对应物理空间。</p></article></div>
        <p class="sg-comparison-conclusion">省下的 42 单位，来自不再为段外未使用的地址准备物理空间，而不是压缩代码或数据。程序的虚拟布局不变，每个段内部仍必须连续。</p>
      </section>
      <section class="rr-rules sg-section" id="demo" aria-labelledby="sg-title"><div class="section-heading"><div><p class="section-index">02 / SELECT · CHECK · TRANSLATE</p><h2 id="sg-title">根据虚拟地址确定段，再检查界限与权限</h2></div><p class="sg-progress">阶段 <strong id="sg-stage">1</strong> / <span id="sg-total">6</span></p></div>
        <div class="rr-toolbar lde-toolbar"><div class="rr-transport" role="group" aria-label="演示控制"><button type="button" class="icon-button primary" id="sg-play" aria-label="播放" title="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button><button type="button" class="icon-button" id="sg-next" aria-label="下一阶段" title="下一阶段"><span aria-hidden="true">↦</span></button><button type="button" class="icon-button" id="sg-reset" aria-label="重新开始" title="重新开始"><span aria-hidden="true">↺</span></button></div><label>访问场景<select id="sg-scene"><option value="heap">堆内读取 · VA 20</option><option value="heapBounds">堆段越界 · VA 22</option><option value="codeWrite">代码段写入 · VA 4</option><option value="stack">栈内读取 · VA 60</option><option value="stackBounds">栈段越界 · VA 55</option><option value="unmapped">未配置段槽 · VA 32</option><option value="custom">自选地址与操作</option></select></label><label>播放速度<select id="sg-speed"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label></div>
        <div class="sg-settings"><label>虚拟地址 VA<input id="sg-address" type="number" min="0" max="63" step="1" value="20" inputmode="numeric"></label><label>访问类型<select id="sg-operation"><option value="read">读取</option><option value="write">写入</option><option value="execute">取指</option></select></label><p>每段有独立长度与权限；不是整个 0–63 都能访问。</p></div><p id="sg-input-error" class="sg-error" role="alert" hidden></p>
        <div id="sg-content"><ol class="sg-steps" id="sg-steps" aria-label="分段转换阶段"></ol><div class="sg-request"><span>请求 <strong id="sg-request"></strong></span><span>当前控制 <strong id="sg-mode"></strong></span></div>
          <div class="sg-workbench"><section class="sg-program" aria-labelledby="sg-program-title"><h3 id="sg-program-title">程序的虚拟空间</h3><p class="sg-subtitle">虚拟范围 0–63 / 逻辑区域</p><div id="sg-virtual"></div><p class="sg-caption">灰色地址没有有效段内位置。段内仍有独立的 C 对象边界与生命周期；硬件段检查不替代这些规则。</p></section>
            <section class="sg-hardware" aria-labelledby="sg-hardware-title"><h3 id="sg-hardware-title">A 的段寄存器</h3><p class="sg-subtitle">由 OS 设置 / 每个段各一组</p><table class="sg-table"><caption class="sr-only">进程 A 的段基址、长度、方向和权限</caption><thead><tr><th scope="col">段</th><th scope="col">base</th><th scope="col">长度</th><th scope="col">方向</th><th scope="col">权限</th></tr></thead><tbody id="sg-table-body"></tbody></table><p class="sg-caption">栈 base=56 是物理上边界，不在栈内。槽 2 未配置。</p><dl class="sg-calculation"><div><dt>段内偏移</dt><dd id="sg-offset"></dd></div><div><dt>界限检查</dt><dd id="sg-bounds"></dd></div><div><dt>操作权限</dt><dd id="sg-permission"></dd></div><div><dt>物理地址</dt><dd id="sg-pa"></dd></div></dl><p class="sg-status" id="sg-status"></p></section>
            <section class="sg-physical" aria-labelledby="sg-physical-title"><h3 id="sg-physical-title">独立放置的物理段</h3><p class="sg-subtitle">物理范围 0–63 / 区域归属</p><div class="sg-physical-grid" id="sg-physical"></div><div class="sg-legend"><span class="sg-key-code">代码 8–15</span><span class="sg-key-heap">堆 24–29</span><span class="sg-key-stack">栈 48–55</span><span class="sg-key-os">OS 0–7</span><span>其余无归属</span></div><p class="sg-caption">各段内部连续，整个地址空间不必连续。格子是地址单位，不是页框；无归属不表示内存字节已清零。</p></section></div>
          <div class="lde-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="sg-label"></p><h3 id="sg-event-title"></h3><p id="sg-event-text"></p></div><input id="sg-position" type="range" min="0" max="5" step="1" value="0" aria-label="演示阶段">
          <details class="sg-encoding"><summary>本例的段选择编码</summary><p>6 位地址的高 2 位选择段：00 为代码、01 为堆、10 未配置、11 为栈；低 4 位给出 0–15 的原始值。代码与堆使用正偏移；向下增长的栈将低位值减 16，解释为 −16 至 −1。当前编码：<strong id="sg-binary"></strong>。选择区间宽度不等于段长；每个段的实际长度仍由 bounds 决定，这与固定大小分页不同。</p></details>
        </div>
      </section>
      <section class="rr-rules sg-section" id="stack"><p class="section-index">03 / A STACK GROWS DOWN</p><h2>向下增长的栈段使用上边界基址与负偏移</h2><div class="sg-stack-explanation"><div><p class="sg-subtitle">虚拟栈 · 上边界 64</p><div class="sg-stack-strip"><span>56–63 · 当前栈段</span><strong>VA 60</strong></div><p>60 − 64 = <strong>−4</strong></p></div><div><p class="sg-subtitle">物理栈 · 上边界 56</p><div class="sg-stack-strip"><span>48–55 · 连续分配</span><strong>PA 52</strong></div><p>56 + (−4) = <strong>52</strong></p></div></div><p class="sg-section-lead">当前段长为 8，允许的负偏移为 −8 至 −1。VA=55 的偏移为 −9，因此拒绝。物理 56 是不包含在栈内的上边界，不是可访问的栈位置；方向信息决定如何解释偏移。</p><p class="sg-caption">向下增长不意味着无界增长。当前栈段长度固定为 8；增长超出段长时，能否扩展以及如何寻找连续空间取决于 OS 和可用资源。向下增长是一种约定，并非所有体系结构的唯一方向。</p></section>
      <section class="rr-rules sg-section" id="tradeoffs"><p class="section-index">04 / PROTECTION · SHARING · FRAGMENTATION</p><h2>分段的访问保护、共享映射与连续分配要求</h2><div class="sg-responsibilities"><article><h3>硬件与 OS 分工</h3><p>硬件识别段、解释方向、检查界限与权限并转换地址，失败时进入异常处理。OS 分配与回收各段、设置保护，并在进程切换时保存和恢复相应寄存器状态。用户态不能任意修改这些设置。</p><p>段大小不同，属于变长连续分配。少量代码／堆／栈描述符是粗粒度分段；更细粒度的方案需要更多描述符和管理，不等于给每次 malloc 都配一个段。</p></article><article><h3>只读代码可以共享</h3><div class="sg-sharing" aria-label="A 与 B 的只读代码段记录指向同一份物理代码"><span>A 代码段 · base 8</span><span class="sg-shared-code">同一份物理代码 8–15</span><span>B 代码段 · base 8</span></div><p>OS 可以让两个进程的只读代码段记录指向同一物理副本，同时保留各自的映射与保护。共享取决于映射是否指向同一物理副本，而不是两个虚拟地址的数值是否相同。</p></article></div>
        <div class="sg-fragmentation"><h3>总空闲足够，不代表能放下一个段</h3><p class="sg-subtitle">另一种 24 单位物理区域布局 / 每块 4 单位</p><div class="sg-fragment-strip" aria-label="占用 4、空闲 4、占用 4、空闲 4、占用 4、空闲 4"><span>占用<strong>4</strong></span><span class="sg-free">空闲<strong>4</strong></span><span>占用<strong>4</strong></span><span class="sg-free">空闲<strong>4</strong></span><span>占用<strong>4</strong></span><span class="sg-free">空闲<strong>4</strong></span></div><p>总空闲 <strong>12</strong>，最大连续空闲 <strong>4</strong>；新段需要连续 <strong>6</strong>，仍找不到合适位置。这是物理内存中空闲块不连续造成的外部碎片，与段外未使用的虚拟地址不同。</p><p class="sg-caption">紧凑整理可搬移已有段，但需要复制内容、更新映射并协调访问，有实际成本；分配策略也不能保证消除外部碎片。段内预留未用空间仍可能浪费，分段不保证完全没有浪费。</p></div><div class="rr-tradeoff"><h3>逻辑区域与固定大小的页</h3><p>分段按逻辑区域划分，每个段大小可不同；<a class="inline-link" href="paging.html">分页</a>按固定大小划分，使整个段不再必须装入一个连续区域。两者也可组合：先确定段，再通过页表转换段内地址。</p></div>
      </section>${wikiRelated('segmentation')}
    </main><footer><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer></div>`;
  let frames = [];
  let stage = 0;
  let timer = null;
  const playButton = root.querySelector('#sg-play');
  const nextButton = root.querySelector('#sg-next');
  const position = root.querySelector('#sg-position');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const cancelHighlights = () => root.querySelector('.sg-workbench').getAnimations({subtree: true}).forEach(animation => animation.cancel());
  const pause = () => {
    clearInterval(timer); timer = null;
    playButton.setAttribute('aria-pressed', 'false'); playButton.setAttribute('aria-label', '播放'); playButton.title = '播放'; playButton.firstElementChild.textContent = '▶';
  };
  const paint = () => {
    const frame = frames[stage];
    const segment = segments.find(entry => entry.id === frame.segmentID);
    cancelHighlights();
    root.querySelector('#sg-stage').textContent = stage + 1;
    root.querySelector('#sg-request').textContent = `${operations[frame.operation]} VA ${frame.address}`;
    root.querySelector('#sg-mode').textContent = frame.mode === 'kernel' ? '内核态 · 异常处置' : '用户态';
    root.querySelector('#sg-virtual').innerHTML = virtualRegions.map(region => `<div class="sg-virtual-row ${region.owner === null ? 'sg-gap' : 'sg-segment-' + region.owner}${frame.address >= region.start && frame.address <= region.end ? ' sg-active' : ''}"><span>${region.start}–${region.end}</span><strong>${region.name}</strong>${frame.address >= region.start && frame.address <= region.end ? `<small>VA ${frame.address}</small>` : ''}</div>`).join('');
    root.querySelector('#sg-table-body').innerHTML = segments.map(entry => `<tr${entry.id === frame.segmentID ? ' class="sg-selected" aria-current="true"' : ''}><th scope="row">${entry.name}</th><td>${entry.base}</td><td>${entry.bounds}</td><td>${entry.direction === 1 ? '向上' : '向下'}</td><td>${entry.permissions.map(permission => operations[permission]).join(' / ')}</td></tr>`).join('');
    root.querySelector('#sg-offset').textContent = frame.offset === null ? frame.segmentID === 2 ? '未配置段，无法解释' : '尚未计算' : `${frame.address} − ${segment.direction === -1 ? 64 : segment.id * 16} = ${frame.offset}`;
    root.querySelector('#sg-bounds').textContent = frame.boundsOK === null ? frame.segmentID === 2 ? '没有有效段' : '尚未检查' : `${segment.direction === 1 ? '0 ≤ offset < ' + segment.bounds : '−' + segment.bounds + ' ≤ offset < 0'} · ${frame.boundsOK ? '通过' : '拒绝'}`;
    root.querySelector('#sg-permission').textContent = frame.permissionsOK === null ? '尚未检查' : `${operations[frame.operation]} · ${frame.permissionsOK ? '允许' : '拒绝'}`;
    root.querySelector('#sg-pa').textContent = frame.physicalAddress === null ? '无' : `${segment.base} ${frame.offset < 0 ? '− ' + Math.abs(frame.offset) : '+ ' + frame.offset} = ${frame.physicalAddress}`;
    root.querySelector('#sg-status').textContent = frame.fault ? '保护异常；未执行本次访问' : frame.checked === false ? '检查失败；禁止生成可用物理地址' : frame.accessed ? frame.result : frame.physicalAddress !== null ? '物理地址已生成，目标访问尚未完成' : frame.checked ? '界限与权限检查通过，物理地址尚未生成' : frame.segmentID === null ? '虚拟地址已提交，段号尚未确定' : '段号已确定，界限与权限尚未检查';
    root.querySelector('#sg-status').classList.toggle('sg-rejected', frame.checked === false);
    root.querySelector('#sg-physical').innerHTML = frame.physical.map(cell => `<div class="sg-physical-cell ${cell.owner === 'OS' ? 'sg-os' : cell.owner === null ? '' : 'sg-segment-' + cell.owner}${cell.address === frame.physicalAddress ? ' sg-target' : ''}" aria-label="物理地址 ${cell.address}，${cell.owner === 'OS' ? 'OS 保留' : cell.owner === null ? '无归属' : segments.find(entry => entry.id === cell.owner).name + '段'}${cell.address === frame.physicalAddress ? '，转换目标' : ''}">${cell.address}</div>`).join('');
    root.querySelector('#sg-label').textContent = `阶段 ${stage + 1} / ${frame.label}`;
    root.querySelector('#sg-event-title').textContent = frame.title;
    root.querySelector('#sg-event-text').textContent = frame.text;
    root.querySelector('#sg-binary').textContent = `${frame.address.toString(2).padStart(6, '0').slice(0, 2)} | ${frame.address.toString(2).padStart(6, '0').slice(2)}`;
    root.querySelectorAll('[data-sg-stage]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.sgStage) === stage)));
    position.value = stage;
    position.setAttribute('aria-valuetext', `阶段 ${stage + 1}，${frame.label}`);
    playButton.disabled = frame.complete; nextButton.disabled = frame.complete;
    if (!motion.matches) root.querySelector('#sg-status').animate([{opacity: .5}, {opacity: 1}], {duration: 180});
  };
  const rebuild = () => {
    pause(); cancelHighlights(); stage = 0;
    const raw = root.querySelector('#sg-address').value.trim();
    const address = Number(raw);
    if (!raw || !Number.isInteger(address) || address < 0 || address > 63) {
      root.querySelector('#sg-content').hidden = true;
      root.querySelector('#sg-input-error').hidden = false;
      root.querySelector('#sg-input-error').textContent = '请输入 0–63 的整数虚拟地址。空值、小数或范围外的数字不作为一次硬件地址请求。';
      root.querySelector('#sg-stage').textContent = '未开始';
      root.querySelector('#sg-total').textContent = '未开始';
      playButton.disabled = true; nextButton.disabled = true;
      return;
    }
    frames = buildAccess(address, root.querySelector('#sg-operation').value);
    root.querySelector('#sg-content').hidden = false;
    root.querySelector('#sg-input-error').hidden = true;
    root.querySelector('#sg-total').textContent = frames.length;
    position.max = frames.length - 1;
    root.querySelector('#sg-steps').innerHTML = frames.map((frame, index) => `<li><button type="button" data-sg-stage="${index}" aria-pressed="false"><span>${index + 1}</span>${frame.label}</button></li>`).join('');
    paint();
  };
  const advance = () => { stage = Math.min(stage + 1, frames.length - 1); if (frames[stage].complete) pause(); paint(); };
  const play = () => {
    if (frames[stage].complete) return;
    playButton.setAttribute('aria-pressed', 'true'); playButton.setAttribute('aria-label', '暂停'); playButton.title = '暂停'; playButton.firstElementChild.textContent = 'Ⅱ';
    timer = setInterval(advance, Number(root.querySelector('#sg-speed').value));
  };
  playButton.addEventListener('click', () => timer === null ? play() : pause());
  nextButton.addEventListener('click', () => { pause(); advance(); });
  root.querySelector('#sg-reset').addEventListener('click', rebuild);
  root.querySelector('#sg-scene').addEventListener('change', event => {
    const preset = presets[event.target.value];
    if (preset) { root.querySelector('#sg-address').value = preset[0]; root.querySelector('#sg-operation').value = preset[1]; }
    rebuild();
  });
  const editRequest = () => { root.querySelector('#sg-scene').value = 'custom'; rebuild(); };
  root.querySelector('#sg-address').addEventListener('input', editRequest);
  root.querySelector('#sg-operation').addEventListener('change', editRequest);
  root.querySelector('#sg-speed').addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
  root.querySelector('#sg-steps').addEventListener('click', event => { const button = event.target.closest('[data-sg-stage]'); if (button) { pause(); stage = Number(button.dataset.sgStage); paint(); } });
  position.addEventListener('input', event => { pause(); stage = Number(event.target.value); paint(); });
  motion.addEventListener('change', event => { if (event.matches) cancelHighlights(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  rebuild();
}

renderSegmentationPage(document.getElementById('root'));