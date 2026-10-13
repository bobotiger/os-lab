function renderAddressTranslationPage(root) {
  const {contents, buildAccess, buildRelocation} = OSLabAddressTranslation;
  root.innerHTML = `<div class="page rr-page lde-page at-page" id="top">${wikiHeader('addressTranslation', [{href: '#demo', title: '检查与转换'}, {href: '#boundary', title: '越界拒绝'}, {href: '#relocation', title: '动态重定位'}, {href: '#limits', title: '连续分配的限制'}])}
    <main><section class="intro"><p class="eyebrow">内存虚拟化 / 实现机制</p><h1>地址转换 <span>Address Translation</span></h1><p class="lead">先检查虚拟地址范围，再用基址计算物理地址。</p><p class="definition">程序使用虚拟地址，物理地址标识实际内存位置。本例采用基址与界限机制。</p></section>
      <section class="rr-rules" id="demo" aria-labelledby="at-title"><p class="section-index">01 / 检查与转换</p><h2 id="at-title">先检查范围，再生成物理地址</h2>
        <p class="at-section-lead">进程 A 的完整地址空间连续放置，每次访问一个示意单位。虚拟范围为 0–15，物理内存为 0–63，其中 0–7 保留给 OS。</p>
        <div id="at-access-mount"><div id="at-demo">
        <div class="rr-toolbar lde-toolbar"><div class="rr-transport" role="group" aria-label="演示控制"><button type="button" class="icon-button primary" id="at-play" aria-label="播放" title="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button><button type="button" class="icon-button" id="at-next" aria-label="下一阶段" title="下一阶段"><span aria-hidden="true">↦</span></button><button type="button" class="icon-button" id="at-reset" aria-label="重新开始" title="重新开始"><span aria-hidden="true">↺</span></button></div><label>观察过程<select id="at-scene"><option value="access">硬件检查与转换</option><option value="relocation">OS 搬移与动态重定位</option></select></label><label>播放速度<select id="at-speed"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label><p class="at-progress">阶段 <strong id="at-stage">1</strong> / <span id="at-total">4</span></p></div>
        <div class="at-settings"><label>虚拟地址 VA<input id="at-address" type="number" min="0" max="20" step="1" value="6" inputmode="numeric"></label><label>基址 base · 物理起点<select id="at-base"><option value="24">24 · 占据 24–39</option><option value="40">40 · 占据 40–55</option></select></label></div><p id="at-input-error" class="at-input-error" role="alert" hidden></p>
        <div id="at-content"><ol class="at-steps" id="at-steps" aria-label="转换阶段"></ol>
          <div class="lde-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="at-label"></p><h3 id="at-event-title"></h3><p id="at-event-text"></p></div>
          <div class="at-registers"><div><span>base · 物理起点</span><strong id="at-reg-base">24</strong></div><div><span>bounds · 空间长度</span><strong>16</strong></div><div><span>当前控制</span><strong id="at-mode">用户态</strong></div><div><span>进程 A</span><strong id="at-process">访问路径</strong></div></div>
          <div class="at-workbench"><section class="at-program" aria-labelledby="at-program-title"><h3 id="at-program-title">程序的虚拟地址</h3><p class="at-subtitle">0–15 / 各区域用途</p><div class="at-virtual-grid" id="at-virtual"></div></section>
            <section class="at-hardware" aria-labelledby="at-hardware-title"><h3 id="at-hardware-title">硬件检查与转换</h3><dl class="at-computation"><div><dt>输入 · 虚拟地址</dt><dd id="at-va"></dd></div><div><dt>边界检查</dt><dd id="at-check"></dd></div><div><dt>转换计算</dt><dd id="at-sum"></dd></div><div><dt>输出 · 物理地址</dt><dd id="at-pa"></dd></div></dl><p class="at-status" id="at-status"></p></section>
            <section class="at-physical" aria-labelledby="at-physical-title"><h3 id="at-physical-title">物理内存</h3><p class="at-subtitle">0–63 / 区域归属；高亮表示转换目标</p><div class="at-physical-grid" id="at-physical"></div><div class="at-legend"><span class="at-legend-os">OS</span><span class="at-legend-a">A 的整段区域</span><span class="at-legend-copy" id="at-copy-legend" hidden>搬移中的副本</span><span>无归属区域</span></div></section></div>
          <input id="at-position" type="range" min="0" max="3" step="1" value="0" aria-label="演示阶段">
        </div></div></div>
        <p id="at-access-return" hidden><button type="button" class="at-case-button" data-at-scene="access">观察检查与转换</button></p>
        <p class="at-caption">每次访存由硬件检查与转换；base 和 bounds 由 OS 特权设置，用户程序不能任意修改。</p>
      </section>
      <section class="rr-rules at-section" id="boundary"><p class="section-index">02 / 越界拒绝</p><h2>为什么虚拟地址 16 会被拒绝？</h2><p class="at-section-lead">bounds = 16 表示长度，最后一个合法地址是 15。VA = 16 已越界，即使 24 + 16 = 40 落在物理内存范围内，硬件也不能执行这次转换与访问。</p><div class="at-case-actions"><button type="button" class="at-case-button" data-at-address="6">观察 VA = 6</button><button type="button" class="at-case-button" data-at-address="16">观察 VA = 16</button></div><p class="at-caption">越界触发保护异常，由 OS 决定后续处置；不是载入页面就能解决的缺页。</p></section>
      <section class="rr-rules at-section" id="relocation"><p class="section-index">03 / 动态重定位</p><h2>物理位置改变，程序的地址不必改变</h2><p class="at-section-lead">OS 将 A 的整段内容从 24–39 搬到 40–55。程序中的虚拟引用不变，改变的是转换时使用的物理起点。</p><div id="at-relocation-summary"><dl class="at-relocation-comparison"><div><dt>虚拟地址</dt><dd>6 <span>保持不变</span></dd></div><div><dt>搬移前 / 后的物理地址</dt><dd>30 <span aria-hidden="true">→</span> 46</dd></div><div><dt>搬移前 / 后的内容</dt><dd>buffer = 10 <span>保持不变</span></dd></div></dl><button type="button" class="at-case-button" data-at-scene="relocation">观察搬移过程</button></div><div id="at-relocation-mount"></div><p class="at-caption">只改 base 不会复制数据。A 在搬移期间暂停，复制完成后才更新 base 并恢复访问；搬移不是每次访存的步骤。</p></section>
      <section class="rr-rules at-section" id="limits"><p class="section-index">04 / 连续分配的限制</p><h2>整段连续放置，为什么仍会浪费或难以分配？</h2><dl class="at-limits"><div><dt>未使用区域也占物理空间</dt><dd>A 的整个 16 单位空间连续分配，包括未使用区域和堆、栈中尚无对象的位置。</dd></div><div><dt>总空闲足够，单块仍可能不足</dt><dd>分散的空闲块不能直接容纳一个连续区域。这种外部碎片会造成分配困难。</dd></div><div><dt>改变分配单位</dt><dd><a class="inline-link" href="segmentation.html">分段</a>分别映射各逻辑区域；<a class="inline-link" href="paging.html">分页</a>通过固定大小的页与页框映射，允许整段空间分散存放。</dd></div></dl></section>
      <section class="at-section at-further" aria-labelledby="at-further-title"><h2 id="at-further-title">进一步理解</h2><details><summary>通过界限检查，为什么对象访问仍可能不合法？</summary><p>base/bounds 检查进程的虚拟范围，不检查每个 C 对象的边界或生命周期。对象越界和释放后使用可能仍落在 0–15 内；通过整段检查不代表这种访问合法。</p></details><details><summary>一次访问多个单位时，怎样检查界限？</summary><p>本例每次访问一个单位。更宽的访问必须检查整个访问范围，而不只是起始地址。</p></details><details id="roles"><summary>硬件与 OS 分别负责什么？</summary><div class="at-roles"><article><h3>硬件</h3><ul><li>提供基址、界限寄存器与特权修改机制。</li><li>每次访存检查虚拟范围，转换合法地址。</li><li>越界时触发保护异常，进入内核。</li></ul></article><article><h3>OS</h3><ul><li>分配、回收连续物理区域并设置寄存器。</li><li>切换进程时保存、恢复各自的转换设置。</li><li>搬移内容，完成后更新基址。</li><li>处理保护异常并决定后续处置。</li></ul></article></div><p>切换到另一进程后必须使用它自己的设置，不能继续套用 A 的 base。</p></details><details><summary>物理图中的地址、内容和区域归属有什么区别？</summary><p>图中每格表示一个示意地址单位，不是页框。无归属表示该区域未分配给某个进程，不保证字节为零，也不允许 A 绕过界限访问。物理空间已分配不代表其中每个位置都存在有效的 C 对象。</p></details></section>
      ${wikiRelated('addressTranslation')}
    </main><footer><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer></div>`;
  let scene = 'access';
  let address = 6;
  let base = 24;
  let frames = buildAccess();
  let stage = 0;
  let timer = null;
  const playButton = root.querySelector('#at-play');
  const nextButton = root.querySelector('#at-next');
  const position = root.querySelector('#at-position');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const demonstration = root.querySelector('#at-demo');
  const cancelHighlights = () => root.querySelector('.at-workbench').getAnimations({subtree: true}).forEach(animation => animation.cancel());
  const paint = () => {
    const frame = frames[stage];
    cancelHighlights();
    if (scene === 'relocation') {
      root.querySelector('#at-address').value = frame.address;
      root.querySelector('#at-base').value = frame.base;
    }
    root.querySelector('#at-stage').textContent = stage + 1;
    root.querySelector('#at-reg-base').textContent = frame.base;
    root.querySelector('#at-mode').textContent = frame.mode === 'kernel' ? '内核态' : '用户态';
    root.querySelector('#at-process').textContent = frame.paused ? '暂停' : frame.fault ? '等待 OS 处置' : '访问路径';
    root.querySelector('#at-va').textContent = frame.paused ? 'A 已暂停，无用户访存' : frame.address;
    root.querySelector('#at-check').textContent = frame.checked === null ? '尚未检查' : `${0 <= frame.address && frame.address < 16 ? '0 ≤ ' + frame.address + ' < 16' : frame.address + ' 不在 0–15'} · ${frame.checked ? '通过' : '拒绝'}`;
    root.querySelector('#at-sum').textContent = frame.physicalAddress === null ? frame.checked === false ? '禁止转换' : '尚未生成' : `${frame.base} + ${frame.address} = ${frame.physicalAddress}`;
    root.querySelector('#at-pa').textContent = frame.physicalAddress === null ? '无' : frame.physicalAddress;
    root.querySelector('#at-status').textContent = frame.paused ? 'A 已暂停；操作系统正在搬移或更新内存区域' : frame.fault ? '保护异常，CPU 已转入内核处理' : frame.accessed ? `已访问目标位置，其内容或用途为：${frame.value}` : frame.physicalAddress !== null ? '物理地址已生成，目标位置尚未访问' : frame.checked === false ? '边界检查失败；目标内存未被访问' : '虚拟地址已提交，边界检查尚未完成';
    root.querySelector('#at-status').classList.toggle('at-rejected', frame.checked === false);
    root.querySelector('#at-copy-legend').hidden = !frame.physical.some(cell => cell.owner === 'copy');
    root.querySelector('#at-virtual').innerHTML = contents.map((content, index) => `<button type="button" class="at-virtual-cell" data-address="${index}" aria-label="虚拟地址 ${index}，${content}" aria-pressed="${frame.address === index}" ${scene === 'relocation' ? 'disabled' : ''}><strong>${index}</strong><span>${index < 2 ? '代码' : index < 4 ? '全局数据' : index < 8 ? '堆' : index < 12 ? '未使用' : '栈'}</span></button>`).join('');
    root.querySelector('#at-physical').innerHTML = frame.physical.map(cell => `<div class="at-physical-cell ${cell.owner === 'OS' ? 'at-os' : cell.owner === 'A' ? 'at-owned' : cell.owner === 'copy' ? 'at-copy' : ''}${cell.address === frame.physicalAddress ? ' at-target' : ''}" aria-label="物理地址 ${cell.address}，${cell.owner === 'copy' ? '临时副本' : cell.owner === 'A' ? 'A 的区域' : cell.owner === 'OS' ? 'OS 保留' : '无归属'}${cell.address === frame.physicalAddress ? '，转换目标' : ''}"><span>${cell.address}</span></div>`).join('');
    root.querySelector('#at-label').textContent = `阶段 ${stage + 1} / ${frame.label}`;
    root.querySelector('#at-event-title').textContent = frame.title;
    root.querySelector('#at-event-text').textContent = frame.text;
    root.querySelectorAll('[data-stage]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.stage) === stage)));
    position.value = stage;
    position.setAttribute('aria-valuetext', `阶段 ${stage + 1}，${frame.label}`);
    playButton.disabled = frame.complete;
    nextButton.disabled = frame.complete;
    if (!motion.matches) root.querySelector('#at-status').animate([{opacity: .5}, {opacity: 1}], {duration: 180});
  };
  const pause = () => { clearInterval(timer); timer = null; playButton.setAttribute('aria-pressed', 'false'); playButton.setAttribute('aria-label', '播放'); playButton.title = '播放'; playButton.firstElementChild.textContent = '▶'; };
  const rebuild = () => {
    pause(); stage = 0;
    frames = scene === 'relocation' ? buildRelocation() : buildAccess(address, base);
    root.querySelector('#at-total').textContent = frames.length;
    root.querySelector('#at-steps').style.setProperty('--at-step-count', frames.length);
    position.max = frames.length - 1;
    root.querySelector('#at-content').hidden = false;
    root.querySelector('#at-input-error').hidden = true;
    root.querySelector('#at-steps').innerHTML = frames.map((frame, index) => `<li><button type="button" data-stage="${index}" aria-pressed="false"><span>${index + 1}</span>${frame.label}</button></li>`).join('');
    paint();
  };
  const advance = () => { stage = Math.min(stage + 1, frames.length - 1); if (frames[stage].complete) pause(); paint(); };
  const play = () => { if (frames[stage].complete) return; playButton.setAttribute('aria-pressed', 'true'); playButton.setAttribute('aria-label', '暂停'); playButton.title = '暂停'; playButton.firstElementChild.textContent = 'Ⅱ'; timer = setInterval(advance, Number(root.querySelector('#at-speed').value)); };
  const readAddress = () => {
    pause();
    const raw = root.querySelector('#at-address').value.trim();
    const value = Number(raw);
    if (!raw || !Number.isInteger(value) || value < 0 || value > 20) {
      cancelHighlights();
      root.querySelector('#at-content').hidden = true;
      root.querySelector('#at-input-error').hidden = false;
      root.querySelector('#at-input-error').textContent = '演示输入须为 0–20 的整数。16–20 可用于观察界限拒绝；空值、小数等不作为一次有效的地址请求。';
      root.querySelector('#at-stage').textContent = '未开始';
      playButton.disabled = true; nextButton.disabled = true;
      return;
    }
    address = value;
    rebuild();
  };
  playButton.addEventListener('click', () => timer === null ? play() : pause());
  nextButton.addEventListener('click', () => { pause(); advance(); });
  root.querySelector('#at-reset').addEventListener('click', () => scene === 'access' ? readAddress() : rebuild());
  root.querySelector('#at-address').addEventListener('input', readAddress);
  root.querySelector('#at-base').addEventListener('change', event => { base = Number(event.target.value); readAddress(); });
  const switchScene = value => {
    const focused = document.activeElement;
    scene = value;
    root.querySelector('#at-scene').value = scene;
    root.querySelector(scene === 'access' ? '#at-access-mount' : '#at-relocation-mount').append(demonstration);
    root.querySelector('#at-access-return').hidden = scene === 'access';
    root.querySelector('#at-relocation-summary').hidden = scene === 'relocation';
    root.querySelector('#at-address').disabled = scene === 'relocation';
    root.querySelector('#at-base').disabled = scene === 'relocation';
    if (scene === 'access') {
      root.querySelector('#at-address').value = address;
      root.querySelector('#at-base').value = base;
    }
    scene === 'relocation' ? rebuild() : readAddress();
    if (demonstration.contains(focused)) focused.focus({preventScroll: true});
  };
  root.querySelector('#at-scene').addEventListener('change', event => {
    switchScene(event.target.value);
    root.querySelector(scene === 'access' ? '#demo' : '#relocation').scrollIntoView({block: 'start'});
  });
  root.querySelectorAll('[data-at-scene], [data-at-address]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.atAddress !== undefined) {
      address = Number(button.dataset.atAddress);
      base = 24;
    }
    switchScene(button.dataset.atScene || 'access');
    root.querySelector(scene === 'access' ? '#demo' : '#relocation').scrollIntoView({block: 'start'});
    playButton.focus({preventScroll: true});
  }));
  root.querySelectorAll('a[href="#demo"], a[href="#relocation"]').forEach(link => link.addEventListener('click', () => {
    switchScene(link.getAttribute('href') === '#demo' ? 'access' : 'relocation');
  }));
  root.querySelector('#at-speed').addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
  root.querySelector('#at-steps').addEventListener('click', event => { const button = event.target.closest('[data-stage]'); if (button) { pause(); stage = Number(button.dataset.stage); paint(); } });
  root.querySelector('#at-virtual').addEventListener('click', event => { const button = event.target.closest('[data-address]'); if (button && scene === 'access') { address = Number(button.dataset.address); root.querySelector('#at-address').value = address; rebuild(); root.querySelector(`[data-address="${address}"]`).focus({preventScroll: true}); } });
  position.addEventListener('input', event => { pause(); stage = Number(event.target.value); paint(); });
  motion.addEventListener('change', event => { if (event.matches) cancelHighlights(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  rebuild();
}

renderAddressTranslationPage(document.getElementById('root'));
