function renderAddressSpacePage(root) {
  const {regions, scenes, buildScenario, inspect} = OSLabAddressSpace;
  root.innerHTML = `<div class="page rr-page lde-page as-page" id="top">
    ${wikiHeader('addressSpaces', [{href: '#why', title: '为什么需要'}, {href: '#demo', title: '程序的视角'}, {href: '#isolation', title: '同址与隔离'}, {href: '#abstraction', title: '虚拟化的目标'}])}
    <main>
      <section class="intro" aria-labelledby="page-title"><p class="eyebrow">内存虚拟化 / 起点</p><h1 id="page-title">地址空间 <span>Address Spaces</span></h1><p class="lead">进程使用自己的虚拟地址空间，通过映射访问物理内存。</p><p class="definition">虚拟地址是程序引用指令和数据时使用的地址，物理地址则标识内存中的实际位置。地址空间描述进程的虚拟地址及各区域的用途。操作系统为各进程管理地址映射和访问权限，硬件依据这些设置处理访问，因此相同的虚拟地址可以对应不同进程的不同内容。</p><p class="model-note">示例采用 0–15 的虚拟地址范围和固定区域布局，地址单位不对应真实字节。A、B 的对象为普通私有对象。实际地址空间还可能有共享库、文件映射和保护页等，布局也可能随机化。</p></section>
      <section class="rr-rules as-why" id="why" aria-labelledby="why-title"><p class="section-index">01 / WHY A PRIVATE VIEW?</p><h2 id="why-title">多程序共存时的地址映射与内存隔离</h2><p>从一次运行一个程序，到多道程序和分时运行，多个程序需要同时留在内存中。如果它们直接使用整台机器的物理位置，程序就要适应不同的摆放位置，还可能误改其他程序的数据。</p><p><strong>各进程的虚拟地址由各自的映射解释。</strong>程序以虚拟地址引用指令和数据，OS 与硬件负责把访问对应到实际位置，并检查权限；程序无需根据其他进程的位置自行修改其虚拟地址。</p></section>
      <section class="lde-demo" id="demo" aria-labelledby="demo-title"><div class="section-heading"><div><p class="section-index">02 / ONE PROGRAM · ONE VIEW</p><h2 id="demo-title">进程的虚拟地址布局与对象生命周期</h2></div><p>阶段 <strong id="as-stage-index">1</strong> / <span id="as-stage-total">5</span></p></div>
        <div class="rr-toolbar lde-toolbar"><div class="rr-transport" role="group" aria-label="演示控制"><button type="button" class="icon-button primary" id="as-play" aria-label="播放" title="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button><button type="button" class="icon-button" id="as-step" aria-label="下一阶段" title="下一阶段"><span aria-hidden="true">↦</span></button><button type="button" class="icon-button" id="as-reset" aria-label="重新开始" title="重新开始"><span aria-hidden="true">↺</span></button></div><label>观察场景<select id="as-scene"><option value="lifetime">一个程序的运行过程</option><option value="layout">各区域的用途</option></select></label><label>区域<select id="as-region">${regions.map(region => `<option value="${region.id}">${region.title}</option>`).join('')}</select></label><label>播放速度<select id="as-speed"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label></div>
        <p class="lde-scene-note" id="as-scene-note"></p>
        <ol class="as-story-steps" id="as-story-steps" aria-label="运行阶段"></ol>
        <div class="as-board"><div class="as-spaces" id="as-spaces"></div><aside class="as-story-aside"><div class="lde-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="as-event-label"></p><h3 id="as-event-title"></h3><p id="as-event-text"></p></div><div class="as-code-observation"><h3>当前动作 · 伪代码</h3><pre id="as-code"></pre></div><div class="as-reference-observation" id="as-reference-observation"></div><div class="as-lifecycle-ledger" id="as-lifecycle-ledger"></div></aside></div>
        <dl class="as-readout"><div><dt>查看虚拟地址</dt><dd id="as-read-address"></dd></div><div><dt>该位置的内容 / 用途</dt><dd id="as-read-content"></dd></div></dl><p class="as-region-explanation" id="as-region-explanation"></p>
        <input id="as-position" type="range" min="0" max="4" step="1" value="0" aria-label="演示阶段">
        <p class="as-boundary">堆保存动态分配的对象；栈上的调用帧保存一次函数调用所需的局部信息。函数返回会结束相应调用帧，但不会自动释放另行分配的堆对象。代码、数据、堆和栈都属于同一个进程的虚拟地址空间；地址连续不要求对应的物理位置连续。未使用的地址范围不保证已经建立映射或允许访问。</p>
      </section>
      <section class="rr-rules as-isolation-section" id="isolation" aria-labelledby="isolation-title"><p class="section-index">03 / SAME NUMBER · DIFFERENT SPACES</p><h2 id="isolation-title">A、B 都使用地址 6，会覆盖彼此吗？</h2><p>不会仅因地址数字相同就覆盖彼此。一次访问还要结合所属进程及其映射来解释；A、B 的两个对象各自私有，不共享存储。</p><div class="as-isolation-pair" id="as-isolation-pair"></div><div class="as-isolation-actions"><button type="button" class="as-write-button" id="as-isolation-write">将 A 的值写为 99</button><button type="button" class="icon-button" id="as-isolation-reset" aria-label="重置隔离对比" title="重置隔离对比"><span aria-hidden="true">↺</span></button></div><p class="as-isolation-result" id="as-isolation-result" aria-live="polite"></p><p class="as-boundary">隔离来自 OS 与硬件的映射和保护，而不是两个变量恰好名字不同。共享存储需要显式建立共享映射；<a class="inline-link" href="paging.html">分页地址转换</a>说明虚拟地址如何对应到物理位置。</p></section>
      <section class="rr-rules" id="abstraction" aria-labelledby="abstraction-title"><div class="section-heading"><div><p class="section-index">04 / GOALS OF VIRTUALIZATION</p><h2 id="abstraction-title">地址空间虚拟化的透明性、保护与效率</h2></div></div><div class="as-goals"><div><h3>透明性</h3><p>程序主要使用虚拟地址，无需管理对象的物理摆放位置。虚拟地址看起来连续，不要求物理内存连续。</p></div><div><h3>保护与隔离</h3><p>普通进程不能凭一个地址数字任意访问其他进程或内核。隔离依赖映射、权限与受控操作；共享内存需要显式建立共享关系。</p></div><div><h3>效率</h3><p>虚拟化既要减少访问时的时间开销，也要避免管理映射占用过多空间。OS 与硬件协作，不是逐条用软件解释所有内存操作；分页是一种实现方式。</p></div></div><div class="rr-tradeoff"><h3>地址空间大小不等于实际物理占用</h3><p>一个进程可能拥有很大的虚拟地址范围，但只映射或驻留其中一部分。逻辑布局描述地址的用途，实际物理占用还取决于映射、驻留和共享关系。</p></div></section>
      ${wikiRelated('addressSpaces')}
    </main><footer class="site-footer"><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer>
  </div>`;
  let scene = 'lifetime';
  let snapshots = buildScenario(scene);
  let stage = 0;
  let focus = 'A';
  let address = 14;
  let timer = null;
  const playButton = root.querySelector('#as-play');
  const stepButton = root.querySelector('#as-step');
  const position = root.querySelector('#as-position');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cancelHighlights = () => root.querySelector('.as-board').getAnimations({subtree: true}).forEach(animation => animation.cancel());
  const prepare = () => {
    root.querySelector('#demo-title').textContent = scene === 'layout' ? '代码、数据、堆与栈的用途' : '函数调用、堆对象分配与释放';
    root.querySelector('#as-scene-note').textContent = scene === 'layout' ? scenes.layout.text : 'main 调用 work，由 work 分配对象并把引用写入 main.saved；work 返回后，main 最后释放对象。所有内存变化只属于进程 A。';
    root.querySelector('#as-stage-total').textContent = snapshots.length;
    position.max = snapshots.length - 1;
    root.querySelector('#as-story-steps').innerHTML = snapshots.map((snapshot, index) => `<li><button type="button" data-stage="${index}" aria-pressed="false"><span>${index + 1}</span>${snapshot.label}</button></li>`).join('');
  };
  const paint = () => {
    const snapshot = snapshots[stage];
    const selected = inspect(snapshot, focus, address);
    const region = regions.find(region => region.id === selected.region);
    root.querySelector('#as-stage-index').textContent = stage + 1;
    root.querySelector('#as-spaces').innerHTML = snapshot.processes.filter(process => process.id === 'A').map(process => `<section class="as-space as-process-${process.id}" aria-labelledby="as-space-${process.id}-title"><h3 id="as-space-${process.id}-title">进程 A 的地址空间<span>虚拟地址 0–15 / 示意单位</span></h3><div class="as-memory-map">${regions.map(region => `<div class="as-region as-${region.id}"><h4>${region.title}<span>${region.start}–${region.end}</span></h4><div class="as-cells">${Array.from({length: region.end - region.start + 1}, (_, offset) => {
      const cellAddress = region.start + offset;
      const cell = inspect(snapshot, process.id, cellAddress);
      const content = region.id === 'code' ? '程序指令' : cell.active ? cell.content : process.released.includes(cellAddress) ? 'buffer 已释放' : region.id === 'unused' ? '未描述映射' : region.id === 'heap' ? '无已分配对象' : '无活动调用帧';
      return `<button type="button" class="as-cell${address === cellAddress && focus !== process.id ? ' as-peer-address' : ''}" data-process="${process.id}" data-address="${cellAddress}" aria-label="进程 ${process.id}，虚拟地址 ${cellAddress}，${content}" aria-pressed="${focus === process.id && address === cellAddress}"><span>${cellAddress}</span><span>${content}</span></button>`;
    }).join('')}</div></div>`).join('')}</div></section>`).join('');
    const process = snapshot.processes[0];
    const reference = process.references[0];
    root.querySelector('#as-reference-observation').hidden = scene !== 'lifetime';
    root.querySelector('#as-reference-observation').innerHTML = reference ? `<h3>main 保存的引用</h3><div class="as-reference-flow"><strong>saved = ${reference.address === null ? 'NULL' : reference.address}</strong><span aria-hidden="true">→</span><span>${reference.address === null ? '未指向对象' : '堆对象 buffer = 10'}</span></div><p>saved 在 main 的调用帧中，保存的是对象的虚拟地址，不是对象本身。</p>` : '';
    root.querySelector('#as-code').textContent = scene === 'lifetime' ? ['main: saved = NULL;', 'main: 调用 work，传入 saved 的位置', 'work: buffer = malloc(对象大小);\nbuffer 的值 = 10;\nmain.saved = buffer 的地址;', 'work: return;', 'main: free(saved);\nsaved = NULL;'][stage] : ['代码：执行指令', '全局数据：counter = 1; flag = true;', '动态对象：buffer = 10;', '未使用范围：不推断有效映射', '栈：main 的调用帧'][stage];
    root.querySelector('#as-read-address').textContent = address;
    root.querySelector('#as-read-content').textContent = selected.content;
    root.querySelector('#as-region-explanation').textContent = region.text;
    root.querySelector('#as-region').value = selected.region;
    root.querySelectorAll('[data-stage]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.stage) === stage)));
    root.querySelector('#as-event-label').textContent = `阶段 ${stage + 1} / ${snapshot.label}`;
    root.querySelector('#as-event-title').textContent = snapshot.title;
    root.querySelector('#as-event-text').textContent = snapshot.text;
    root.querySelector('#as-lifecycle-ledger').innerHTML = `<section><h3>当前堆对象与调用帧</h3><dl><div><dt>堆对象</dt><dd>${process.objects.length ? 'buffer @ 6' : '无活对象'}</dd></div><div><dt>调用帧</dt><dd>${process.frames.map(frame => frame.id).join(' → ')}<span>（调用顺序）</span></dd></div></dl></section>`;
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
  root.querySelector('#as-story-steps').addEventListener('click', event => { const button = event.target.closest('[data-stage]'); if (button) { pause(); seek(Number(button.dataset.stage)); } });
  root.querySelector('#as-spaces').addEventListener('click', event => { const button = event.target.closest('[data-address]'); if (button) { pause(); focus = button.dataset.process; address = Number(button.dataset.address); paint(); root.querySelector(`[data-process="${focus}"][data-address="${address}"]`).focus({preventScroll: true}); } });
  position.addEventListener('input', event => { pause(); seek(Number(event.target.value)); });
  motionPreference.addEventListener('change', event => { if (event.matches) cancelHighlights(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  const isolationSnapshots = buildScenario('isolation');
  const paintIsolation = written => {
    const snapshot = isolationSnapshots[written ? 2 : 0];
    root.querySelector('#as-isolation-pair').innerHTML = snapshot.processes.map(process => `<div class="as-isolation-process as-owner-${process.id}"><h3>进程 ${process.id}</h3><p>虚拟地址 <strong>6</strong><span aria-hidden="true"> → </span><span>${process.id} 的私有对象</span></p><p class="as-isolation-value">值 <strong>${process.objects[0].value}</strong></p></div>`).join('');
    root.querySelector('#as-isolation-write').disabled = written;
    root.querySelector('#as-isolation-result').textContent = written ? 'A：10 → 99；B：仍为 20。同一个地址值不表示同一个内存对象，修改 A 不影响 B 的普通私有数据。' : 'A 的地址 6 对应值 10，B 的地址 6 对应值 20。地址数字相同，但各自的私有内容不同。';
  };
  root.querySelector('#as-isolation-write').addEventListener('click', () => { pause(); paintIsolation(true); });
  root.querySelector('#as-isolation-reset').addEventListener('click', () => { pause(); paintIsolation(false); });
  prepare();
  paint();
  paintIsolation(false);
}

renderAddressSpacePage(document.getElementById('root'));