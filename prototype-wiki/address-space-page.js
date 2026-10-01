function renderAddressSpacePage(root) {
  const {regions, scenes, buildScenario, inspect} = OSLabAddressSpace;
  root.innerHTML = `<div class="page rr-page lde-page as-page" id="top">
    ${wikiHeader('addressSpaces', [{href: '#demo', title: '程序的视角'}, {href: '#lifetimes', title: '区域与生命周期'}, {href: '#abstraction', title: '抽象与实现'}])}
    <main>
      <section class="intro" aria-labelledby="page-title"><p class="eyebrow">内存虚拟化 / 起点</p><h1 id="page-title">地址空间 <span>Address Spaces</span></h1><p class="lead">程序看到自己的内存，不是整台机器的内存。</p><p class="definition">地址空间是进程可使用的地址及其对应内存区域的抽象。程序用虚拟地址引用指令和数据；OS 与硬件协作解释这些地址、提供映射与访问保护，让不同进程拥有各自的内存视角。</p><p class="model-note">示意地址为 0–15，不代表真实字节或平台布局。代码、全局数据、堆、留白、栈的位置固定，只表达用途；真实地址空间还可能有共享库、文件映射、保护页等，布局也可能随机化。本例只讨论普通私有数据，无真实指令、分配器、页表、物理页分配或回收。</p></section>
      <section class="lde-demo" id="demo" aria-labelledby="demo-title"><div class="section-heading"><div><p class="section-index">01 / SAME ADDRESS · PRIVATE CONTENTS</p><h2 id="demo-title">同一个地址值，两个私有对象</h2></div><p>阶段 <strong id="as-stage-index">1</strong> / <span id="as-stage-total">5</span></p></div>
        <div class="rr-toolbar lde-toolbar"><div class="rr-transport" role="group" aria-label="演示控制"><button type="button" class="icon-button primary" id="as-play" aria-label="播放" title="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button><button type="button" class="icon-button" id="as-step" aria-label="下一阶段" title="下一阶段"><span aria-hidden="true">↦</span></button><button type="button" class="icon-button" id="as-reset" aria-label="重新开始" title="重新开始"><span aria-hidden="true">↺</span></button></div><label>观察场景<select id="as-scene">${Object.entries(scenes).map(([id, scene]) => `<option value="${id}">${scene.title}</option>`).join('')}</select></label><label>区域<select id="as-region">${regions.map(region => `<option value="${region.id}">${region.title}</option>`).join('')}</select></label><label>播放速度<select id="as-speed"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label></div>
        <p class="lde-scene-note" id="as-scene-note"></p>
        <div class="as-inspect-controls"><div class="as-process-switch" role="group" aria-label="查看进程"><button type="button" data-focus="A" aria-pressed="true">进程 A</button><button type="button" data-focus="B" aria-pressed="false">进程 B</button></div><label for="as-address">虚拟地址 <strong id="as-address-number">6</strong></label><input id="as-address" type="range" min="0" max="15" step="1" value="6" aria-label="查看虚拟地址"></div>
        <div class="as-board"><div class="as-spaces" id="as-spaces"></div><section class="as-physical" aria-labelledby="as-physical-title"><h3 id="as-physical-title">物理侧的私有内容</h3><p>不同位置 / 非按比例，不标物理地址</p><div class="as-physical-grid" id="as-physical-grid"></div><p class="as-physical-caption">示意块不是物理页框，不表示区域连续或整段驻留。对象结束后仍保留框的位置；底层页是否存在、共享或回收未展开。</p></section></div>
        <dl class="as-readout"><div><dt>所属进程</dt><dd id="as-read-process"></dd></div><div><dt>虚拟地址</dt><dd id="as-read-address"></dd></div><div><dt>当前内容 / 用途</dt><dd id="as-read-content"></dd></div><div><dt>物理侧说明</dt><dd id="as-read-location"></dd></div></dl><p class="as-region-explanation" id="as-region-explanation"></p>
        <input id="as-position" type="range" min="0" max="4" step="1" value="0" aria-label="演示阶段">
        <div class="lde-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="as-event-label"></p><h3 id="as-event-title"></h3><p id="as-event-text"></p></div>
        <div class="as-lifecycle-ledger" id="as-lifecycle-ledger"></div>
      </section>
      <section class="lde-entry-section" id="lifetimes" aria-labelledby="lifetimes-title"><div class="section-heading"><div><p class="section-index">02 / DIFFERENT LIFETIMES</p><h2 id="lifetimes-title">用途不同，生命周期也不同</h2></div></div><dl class="concepts rr-concepts"><div><dt>代码与静态数据</dt><dd>代码描述要执行的指令，静态／全局数据具有静态存储期。真实布局会进一步区分不同权限与数据类型；它们不是每次函数调用都重新分配的同一类对象。</dd></div><div><dt>堆对象</dt><dd>动态对象可以在一个函数中分配，再由其他代码持有引用。函数返回不自动释放它；free 结束对象生命周期，不保证清零或立即归还 OS 物理页。</dd></div><div><dt>栈与调用帧</dt><dd>本例用调用帧表示函数调用中的局部数据，返回时该帧失效。真实编译器可能用寄存器、内联或优化消除对象，不能把所有局部变量都当作必然存在的栈格子。</dd></div></dl><div class="rr-tradeoff"><h3>空白区域不是可以随意访问的内存</h3><p>未使用的虚拟范围不代表已有相同大小的物理内存，也不保证存在有效映射。释放对象后，底层页可能仍可访问，但继续使用该对象的旧指针并不合法；对象生命周期、页映射与硬件权限是不同层次的问题。</p></div></section>
      <section class="rr-rules" id="abstraction" aria-labelledby="abstraction-title"><div class="section-heading"><div><p class="section-index">03 / ABSTRACTION BEFORE MAPPING</p><h2 id="abstraction-title">自己的视角，受保护的访问</h2></div></div><div class="as-goals"><div><h3>透明性</h3><p>程序主要使用虚拟地址，无需管理对象的物理摆放位置。虚拟地址看起来连续，不要求物理内存连续。</p></div><div><h3>保护与隔离</h3><p>普通进程不能凭一个地址数字任意访问其他进程或内核。隔离依赖映射、权限与受控操作；共享内存是显式建立的另一种关系，不在本例中。</p></div><div><h3>高效实现</h3><p>OS 与硬件协作实现地址解释与保护，而不是逐条用软件解释所有内存操作。具体映射机制可以不同；后续<a class="inline-link" href="paging.html">分页地址转换</a>再展示一种实现。</p></div></div><div class="rr-tradeoff"><h3>地址空间大小不等于实际物理占用</h3><p>一个进程可能拥有很大的虚拟地址范围，但只映射或驻留其中一部分。本页先解释“程序看到什么”，不把逻辑布局当作实际内存统计，也不展示交换、共享代码映射或真实堆栈增长规则。</p></div></section>
      ${wikiRelated('addressSpaces')}
    </main><footer class="site-footer"><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer>
  </div>`;
  let scene = 'isolation';
  let snapshots = buildScenario(scene);
  let stage = 0;
  let focus = 'A';
  let address = 6;
  let timer = null;
  const playButton = root.querySelector('#as-play');
  const stepButton = root.querySelector('#as-step');
  const position = root.querySelector('#as-position');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cancelHighlights = () => root.querySelector('.as-board').getAnimations({subtree: true}).forEach(animation => animation.cancel());
  const prepare = () => {
    root.querySelector('#demo-title').textContent = {isolation: '同一个地址值，两个私有对象', layout: '从代码到栈，程序看到自己的布局', lifetime: '函数返回，不等于堆对象释放'}[scene];
    root.querySelector('#as-scene-note').textContent = scenes[scene].text;
    root.querySelector('#as-stage-total').textContent = snapshots.length;
    position.max = snapshots.length - 1;
  };
  const paint = () => {
    const snapshot = snapshots[stage];
    const selected = inspect(snapshot, focus, address);
    const region = regions.find(region => region.id === selected.region);
    root.querySelector('#as-stage-index').textContent = stage + 1;
    root.querySelector('#as-spaces').innerHTML = snapshot.processes.map(process => `<section class="as-space as-process-${process.id}" aria-labelledby="as-space-${process.id}-title"><h3 id="as-space-${process.id}-title">进程 ${process.id}<span>虚拟地址 0–15</span></h3><div class="as-memory-map">${regions.map(region => `<div class="as-region as-${region.id}"><h4>${region.title}<span>${region.start}–${region.end}</span></h4><div class="as-cells">${Array.from({length: region.end - region.start + 1}, (_, offset) => {
      const cellAddress = region.start + offset;
      const cell = inspect(snapshot, process.id, cellAddress);
      const content = region.id === 'code' ? '程序指令' : region.id === 'data' ? `全局 = ${cell.value}` : cell.active ? cell.content : region.id === 'unused' ? '未描述映射' : '无活对象 / 帧';
      return `<button type="button" class="as-cell${address === cellAddress && focus !== process.id ? ' as-peer-address' : ''}" data-process="${process.id}" data-address="${cellAddress}" aria-label="进程 ${process.id}，虚拟地址 ${cellAddress}，${content}" aria-pressed="${focus === process.id && address === cellAddress}"><span>${cellAddress}</span><span>${content}</span></button>`;
    }).join('')}</div></div>`).join('')}</div></section>`).join('');
    root.querySelector('#as-physical-grid').innerHTML = [['B', 'heap'], [null, null], ['A', 'stack'], ['A', 'heap'], ['B', 'data'], ['A', 'data'], [null, null], ['B', 'stack']].map(([id, regionId]) => {
      if (!id) return '<div class="as-physical-other">其他内容<br>未展开</div>';
      const process = snapshot.processes.find(process => process.id === id);
      const content = regionId === 'heap' ? process.objects.length ? process.objects.map(object => `${object.id} = ${object.value}`).join(' / ') : '无活对象，物理页状态未知' : regionId === 'stack' ? process.frames.map(frame => frame.id).join(' / ') : `全局数据 = ${process.globals[2]}`;
      return `<div class="as-physical-block as-owner-${id}${focus === id && selected.active && selected.region === regionId ? ' as-physical-selected' : ''}" data-store="${id}-${regionId}"><strong>${id} 的${{heap: '堆对象', stack: '调用帧', data: '全局数据'}[regionId]}</strong><span>${content}</span></div>`;
    }).join('');
    root.querySelector('#as-read-process').textContent = focus;
    root.querySelector('#as-read-address').textContent = address;
    root.querySelector('#as-read-content').textContent = selected.content;
    root.querySelector('#as-read-location').textContent = selected.location;
    root.querySelector('#as-region-explanation').textContent = region.text;
    root.querySelector('#as-region').value = selected.region;
    root.querySelector('#as-address').value = address;
    root.querySelector('#as-address-number').textContent = address;
    root.querySelectorAll('[data-focus]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.focus === focus)));
    root.querySelector('#as-event-label').textContent = `阶段 ${stage + 1} / ${snapshot.label}`;
    root.querySelector('#as-event-title').textContent = snapshot.title;
    root.querySelector('#as-event-text').textContent = snapshot.text;
    root.querySelector('#as-lifecycle-ledger').innerHTML = snapshot.processes.map(process => `<section><h3>进程 ${process.id} 的活对象与调用帧</h3><dl><div><dt>堆对象</dt><dd>${process.objects.length ? process.objects.map(object => `${object.id} @ ${object.address}`).join('、') : '无活对象'}</dd></div><div><dt>调用帧</dt><dd>${process.frames.map(frame => frame.id).join(' → ')}<span>（调用顺序）</span></dd></div></dl></section>`).join('');
    position.value = stage;
    position.setAttribute('aria-valuetext', `阶段 ${stage + 1}，${snapshot.label}`);
    playButton.disabled = snapshot.complete;
    stepButton.disabled = snapshot.complete;
    cancelHighlights();
    if (!motionPreference.matches) root.querySelector('.as-cell[aria-pressed="true"]').animate([{opacity: .45}, {opacity: 1}], {duration: 200});
  };
  const pause = () => { clearInterval(timer); timer = null; playButton.setAttribute('aria-pressed', 'false'); playButton.setAttribute('aria-label', '播放'); playButton.title = '播放'; playButton.firstElementChild.textContent = '▶'; };
  const seek = value => { stage = value; focus = snapshots[stage].focus; address = snapshots[stage].address; paint(); };
  const advance = () => { const next = Math.min(stage + 1, snapshots.length - 1); if (snapshots[next].complete) pause(); seek(next); };
  const play = () => { if (snapshots[stage].complete) return; playButton.setAttribute('aria-pressed', 'true'); playButton.setAttribute('aria-label', '暂停'); playButton.title = '暂停'; playButton.firstElementChild.textContent = 'Ⅱ'; timer = setInterval(advance, Number(root.querySelector('#as-speed').value)); };
  playButton.addEventListener('click', () => timer === null ? play() : pause());
  stepButton.addEventListener('click', () => { pause(); advance(); });
  root.querySelector('#as-reset').addEventListener('click', () => { pause(); seek(0); });
  root.querySelector('#as-scene').addEventListener('change', event => { pause(); scene = event.target.value; snapshots = buildScenario(scene); prepare(); seek(0); });
  root.querySelector('#as-speed').addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
  root.querySelector('#as-region').addEventListener('change', event => { pause(); const region = regions.find(region => region.id === event.target.value); address = region.id === 'heap' ? 6 : region.id === 'stack' ? 14 : region.start; paint(); });
  root.querySelector('#as-address').addEventListener('input', event => { pause(); address = Number(event.target.value); paint(); });
  root.querySelectorAll('[data-focus]').forEach(button => button.addEventListener('click', () => { pause(); focus = button.dataset.focus; paint(); }));
  root.querySelector('#as-spaces').addEventListener('click', event => { const button = event.target.closest('[data-address]'); if (button) { pause(); focus = button.dataset.process; address = Number(button.dataset.address); paint(); root.querySelector(`[data-process="${focus}"][data-address="${address}"]`).focus({preventScroll: true}); } });
  position.addEventListener('input', event => { pause(); seek(Number(event.target.value)); });
  motionPreference.addEventListener('change', event => { if (event.matches) cancelHighlights(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  prepare();
  paint();
}

renderAddressSpacePage(document.getElementById('root'));