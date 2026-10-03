function renderAddressTranslationPage(root) {
  const {contents, buildAccess, buildRelocation} = OSLabAddressTranslation;
  root.innerHTML = `<div class="page rr-page lde-page at-page" id="top">${wikiHeader('addressTranslation', [{href: '#demo', title: '检查与转换'}, {href: '#relocation', title: '动态重定位'}, {href: '#roles', title: '硬件与 OS'}, {href: '#limits', title: '机制的限制'}])}
    <main><section class="intro"><p class="eyebrow">内存虚拟化 / 实现机制</p><h1>地址转换 <span>Address Translation</span></h1><p class="lead">先检查虚拟地址范围，再用基址计算物理地址。</p><p class="definition">虚拟地址是程序使用的地址，物理地址标识实际内存位置。本例用两个寄存器完成转换：base（基址）记录进程这段内存的物理起点，bounds（界限）记录虚拟范围的长度。只有地址满足 0 ≤ VA &lt; bounds，硬件才计算 base + VA；操作系统以特权设置这些寄存器，用户程序不能任意修改。</p><p class="model-note">进程 A 的虚拟范围为 0–15，长度 16；物理范围为 0–63，0–7 保留给 OS。地址采用示意单位，每次访问一个单位，完整地址空间连续放置。更宽的访问必须检查整个访问范围，而不只是起始地址。</p></section>
      <section class="rr-rules" id="demo" aria-labelledby="at-title"><div class="section-heading"><div><p class="section-index">01 / CHECK BEFORE TRANSLATE</p><h2 id="at-title">虚拟地址 → 边界检查 → 物理地址</h2></div><p class="at-progress">阶段 <strong id="at-stage">1</strong> / <span id="at-total">4</span></p></div>
        <div class="rr-toolbar lde-toolbar"><div class="rr-transport" role="group" aria-label="演示控制"><button type="button" class="icon-button primary" id="at-play" aria-label="播放" title="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button><button type="button" class="icon-button" id="at-next" aria-label="下一阶段" title="下一阶段"><span aria-hidden="true">↦</span></button><button type="button" class="icon-button" id="at-reset" aria-label="重新开始" title="重新开始"><span aria-hidden="true">↺</span></button></div><label>观察过程<select id="at-scene"><option value="access">硬件检查与转换</option><option value="relocation">OS 搬移与动态重定位</option></select></label><label>播放速度<select id="at-speed"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label></div>
        <div class="at-settings"><label>虚拟地址 VA<input id="at-address" type="number" min="0" max="20" step="1" value="6" inputmode="numeric"></label><label>物理起点 base<select id="at-base"><option value="24">24 · 占据 24–39</option><option value="40">40 · 占据 40–55</option></select></label><p>bounds = <strong>16</strong> · 合法虚拟地址 <strong>0–15</strong></p></div><p id="at-input-error" class="at-input-error" role="alert" hidden></p>
        <div id="at-content"><ol class="at-steps" id="at-steps" aria-label="转换阶段"></ol>
          <div class="at-registers"><div><span>base · 物理起点</span><strong id="at-reg-base">24</strong></div><div><span>bounds · 空间长度</span><strong>16</strong></div><div><span>当前控制</span><strong id="at-mode">用户态</strong></div><div><span>进程 A</span><strong id="at-process">访问路径</strong></div></div>
          <div class="at-workbench"><section class="at-program" aria-labelledby="at-program-title"><h3 id="at-program-title">程序视角</h3><p class="at-subtitle">虚拟地址 0–15 / 内容用途</p><div class="at-virtual-grid" id="at-virtual"></div><p class="at-caption">程序引用虚拟地址，不需要把指针改写成物理位置。未使用的地址和段内尚无对象的位置仍属于这段物理分配；base/bounds 不检测每个 C 对象是否存在或已释放。</p></section>
            <section class="at-hardware" aria-labelledby="at-hardware-title"><h3 id="at-hardware-title">硬件检查与转换</h3><dl class="at-computation"><div><dt>输入 · 虚拟地址</dt><dd id="at-va"></dd></div><div><dt>边界检查</dt><dd id="at-check"></dd></div><div><dt>转换计算</dt><dd id="at-sum"></dd></div><div><dt>输出 · 物理地址</dt><dd id="at-pa"></dd></div></dl><p class="at-status" id="at-status"></p></section>
            <section class="at-physical" aria-labelledby="at-physical-title"><h3 id="at-physical-title">物理内存</h3><p class="at-subtitle">物理地址 0–63 / 区域归属</p><div class="at-physical-grid" id="at-physical"></div><div class="at-legend"><span class="at-legend-os">OS</span><span class="at-legend-a">A 的整段区域</span><span class="at-legend-copy">搬移中的副本</span><span>无归属区域</span></div><p class="at-caption">高亮格子是已转换的位置；不是页框。无归属不保证底层字节为零，也不表示可以由 A 随意访问。</p></section></div>
          <div class="lde-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="at-label"></p><h3 id="at-event-title"></h3><p id="at-event-text"></p></div><input id="at-position" type="range" min="0" max="3" step="1" value="0" aria-label="演示阶段">
        </div><div class="rr-tradeoff"><h3>地址界限检查不等于 C 对象边界与生命周期检查</h3><p>VA=16 即使加上 base=24 得到机器范围内的 40，也必须先拒绝访问：它已不在 A 的虚拟范围内。反过来，仍在 0–15 内的对象越界或释放后使用，不一定越过整段界限；C 对象的使用规则仍需遵守。这里的保护异常不是缺页处理。</p></div>
      </section>
      <section class="rr-rules at-section" id="relocation"><p class="section-index">02 / SAME VIRTUAL ADDRESS · NEW LOCATION</p><h2>物理位置改变，程序的地址不必改变</h2><p class="at-section-lead">A 的虚拟地址 6 原来对应物理 30。搬到物理 40–55 后，仍访问虚拟地址 6，但对应物理 46，内容仍为 buffer = 10。main 保存的虚拟引用仍为 6。</p><ol class="at-relocation-order"><li><strong>暂停进程</strong><span>保存必要状态，确认目标连续空间足够大。</span></li><li><strong>复制内容</strong><span>复制原区域内容，期间 A 保持暂停。</span></li><li><strong>更新寄存器</strong><span>复制完成后由 OS 更新 base，再释放原区域。</span></li><li><strong>恢复运行</strong><span>恢复 A；之后访存使用新的物理起点。</span></li></ol><p class="at-caption">只改 base 不会自动复制数据。搬移需要复制内容，并确保复制与更新期间没有访问使用正在变化的区域；它发生在重新安排物理位置时，而不是每次访存时。</p></section>
      <section class="rr-rules at-section" id="roles"><p class="section-index">03 / HARDWARE AND OS</p><h2>每次访存由硬件处理，设置与管理由 OS 控制</h2><div class="at-roles"><article><h3>硬件</h3><ul><li>为访存提供界限检查与地址转换。</li><li>提供基址与界限寄存器及特权修改机制。</li><li>拒绝不满足边界条件的访问，触发异常入口。</li></ul></article><article><h3>OS</h3><ul><li>分配与回收合适的连续物理区域。</li><li>创建进程时设置映射与保护状态。</li><li>切换进程时保存、恢复相应寄存器状态。</li><li>处理保护异常，决定后续处置。</li></ul></article></div><p class="at-caption">另一个进程运行时，必须使用它自己的转换与保护设置，不能继续套用 A 的 base。用户态程序不能任意改 base 或 bounds 来绕过隔离。</p></section>
      <section class="rr-rules at-section" id="limits"><p class="section-index">04 / THE COST OF ONE CONTIGUOUS REGION</p><h2>要求物理内存连续分配，会带来哪些限制？</h2><dl class="at-limits"><div><dt>整段连续</dt><dd>A 的 16 单位空间必须连续放在物理内存中。未使用的地址范围，以及堆和栈中尚无对象的位置，也占据这段物理分配；已经分配物理空间不等于每个位置都有 C 对象。</dd></div><div><dt>空闲总量足够，连续区域仍可能不足</dt><dd>即使总空闲空间足够，也可能找不到足够大的连续空闲区域；这是外部碎片带来的分配困难。</dd></div><div><dt>分段与分页的不同取舍</dt><dd>分段可分别处理不同逻辑区域；分页把空间分为固定大小的页，不要求整个地址空间连续放置。<a class="inline-link" href="paging.html">分页地址转换</a>通过页表映射页号，并保留页内偏移。</dd></div></dl></section>
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
  root.querySelector('#at-scene').addEventListener('change', event => {
    scene = event.target.value;
    root.querySelector('#at-address').disabled = scene === 'relocation';
    root.querySelector('#at-base').disabled = scene === 'relocation';
    if (scene === 'access') {
      root.querySelector('#at-address').value = address;
      root.querySelector('#at-base').value = base;
    }
    scene === 'relocation' ? rebuild() : readAddress();
  });
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