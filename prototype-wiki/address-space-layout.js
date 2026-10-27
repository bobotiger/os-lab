(function () {
  'use strict';

  globalThis.renderAddressSpaceLayout = function (host, M) {
    const layoutSnapshots = M.buildScenario('layout');
    const lifetime = M.buildScenario('lifetime');
    const regions = M.regions;
    const visualRegions = [...regions];
    const labels = ['程序开始', '调用函数', '分配对象', '函数返回', '释放对象', '清空引用'];
    const titles = ['main 开始运行', '调用 work，增加一个栈帧', '分配 buffer，保存对象地址', 'work 返回，buffer 仍然存在', '释放 buffer，旧引用失效', '将 saved 设为 NULL'];
    const actions = [
      'main: saved = NULL;',
      'main: 调用 work，传入 saved 的位置',
      'work: 分配 buffer，初始化为 10\nmain.saved = buffer 的地址;',
      'work: return;',
      'main: free(saved);',
      'main: saved = NULL;',
    ];
    const insights = [
      'saved 是 main 栈帧中的指针变量，当前保存 NULL。堆中尚无 buffer 对象。',
      'work 的栈帧保存 local = 7；main 的栈帧仍然存在。',
      'saved 自身位于栈地址 14，保存堆对象的地址 6；buffer 的值为 10。',
      '返回结束 work 的栈帧及其局部数据。main 仍持有 buffer 的地址，堆对象继续存在。',
      'free 结束对象的生命周期，却不自动清空 saved。旧引用不能继续用于访问，物理页也不保证立即回收。',
      '这次赋值只清空 saved。buffer 已在上一步释放，其他引用也不会随之自动清空。',
    ];
    const descriptions = {
      code: '存放程序执行的指令，例如 main 和 work 函数的代码。',
      data: '存放全局变量及静态存储期的数据，生命周期与单次函数调用不同。',
      heap: '存放动态分配的对象。buffer 不因分配它的函数返回而自动释放。',
      unused: '当前未用于代码、数据、堆对象或调用帧。未使用的虚拟范围不等于已占用同样大小的物理内存，也不保证允许访问。',
      stack: '调用帧保存本次调用的局部数据。main 调用 work 时，两个调用帧同时存在。',
    };
    const examples = {
      code: '<div class="as-layout-code"><span>main</span><i aria-hidden="true">调用 →</i><span>work</span></div>',
      data: '<dl class="as-layout-values"><div><dt>counter</dt><dd>1</dd></div><div><dt>flag</dt><dd>true</dd></div></dl>',
      heap: '<div class="as-layout-heap"><span>buffer · 虚拟地址 6</span><strong>10</strong><small>对象的值</small></div><div class="as-layout-growth" data-growth="heap"><b aria-hidden="true">↓</b><span>本例：堆向较高虚拟地址增长</span></div><p class="as-layout-mini-note">分配对象不一定新增物理内存。</p>',
      unused: '<div class="as-layout-empty"><strong>8 — 11</strong><span>未使用的虚拟地址范围</span></div>',
      stack: '<div class="as-layout-frames"><div><span>work · 地址 12–13</span><strong>local = 7</strong></div><div><span>main · 地址 14–15</span><strong>saved = 6</strong></div></div><div class="as-layout-growth" data-growth="stack"><b aria-hidden="true">↑</b><span>本例：栈向较低虚拟地址增长</span></div><p class="as-layout-mini-note">调用函数不一定新增物理内存。</p>',
    };
    let scene = 'layout', regionIndex = 0, stage = 0, showReference = false, timer = null;
    host.classList.add('as-layout-module');
    host.innerHTML = `
      <div class="as-layout-switch" role="tablist" aria-label="进程内部的布局">
        <button type="button" role="tab" id="as-layout-tab" data-layout-view="layout" aria-controls="as-layout-view" aria-selected="true">区域用途</button>
        <button type="button" role="tab" id="as-lifetime-tab" data-layout-view="lifetime" aria-controls="as-lifetime-view" aria-selected="false" tabindex="-1">运行中的变化</button>
      </div>
      <section id="as-layout-view" role="tabpanel" aria-labelledby="as-layout-tab">
        <header class="as-layout-heading"><h2>同一地址空间，容纳不同用途的内容</h2><p>代码、数据、堆与栈共同组成进程的内存视图。</p></header>
        <div class="as-layout-workbench">
          <figure id="as-layout-picture" class="as-layout-map-figure">
            <figcaption>进程 A <span>虚拟地址 0–15</span></figcaption>
            <div class="as-region-map" aria-label="地址空间中的区域">
              ${visualRegions.map(region => `<div class="as-map-region" data-map-region="${region.id}" style="grid-row:span ${region.end-region.start+1}"><span class="as-map-edge as-map-high" aria-hidden="true">${region.start}</span><button type="button" data-region="${region.id}" aria-label="${region.title}，虚拟地址 ${region.start} 至 ${region.end}" aria-pressed="false" tabindex="-1"><span>${region.title}</span></button>${region.id === 'stack' ? '<button type="button" id="as-saved-location" aria-label="查看 saved 变量与堆对象的位置" aria-pressed="false">saved <span>地址 14 · 保存 6</span></button>' : ''}<span class="as-map-edge as-map-low" aria-hidden="true">${region.end}</span></div>`).join('')}
            </div>
          </figure>
          <aside class="as-layout-focus" aria-live="polite">
            <p id="as-region-range" class="as-layout-range"></p><h3 id="as-region-title"></h3><p id="as-region-description"></p><div id="as-region-picture"></div>
          </aside>
        </div>
        <p class="as-layout-boundary">地址编号不对应真实字节；区域范围与排列是示例，实际布局随程序及运行环境变化。</p>
      </section>
      <section id="as-lifetime-view" role="tabpanel" aria-labelledby="as-lifetime-tab" hidden>
        <header class="as-layout-heading"><h2>函数返回，与对象释放是两件事</h2><p>跟随 main 和 work，观察栈帧、指针变量与堆对象各自的变化。</p></header>
        <ol id="as-story-steps" class="as-story-steps" aria-label="运行阶段">${labels.map((label, index) => `<li><button type="button" data-stage="${index}" aria-pressed="false" tabindex="-1"><span>${index + 1}</span>${label}</button></li>`).join('')}</ol>
        <div class="as-lifetime-workbench">
          <div id="as-reference-observation" class="as-life-figure"></div>
          <div class="as-life-explanation"><p class="as-life-progress">阶段 <span id="as-stage-index">1</span> / 6</p><h3 id="as-event-title"></h3><pre id="as-code" aria-label="当前动作的伪代码"></pre><p id="as-lifecycle-insight"></p></div>
          <div class="as-playback" role="group" aria-label="运行演示控制">
            <button type="button" id="as-play" aria-label="播放" aria-pressed="false"><span aria-hidden="true">▶</span><span data-play-label>播放</span></button>
            <button type="button" id="as-prev" aria-label="上一阶段" title="上一阶段">←</button><button type="button" id="as-step" aria-label="下一阶段" title="下一阶段">→</button><button type="button" id="as-reset" aria-label="重新开始" title="重新开始">↺</button>
            <select id="as-speed" aria-label="播放速度"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select>
          </div>
        </div>
        <p class="as-layout-boundary">栈与堆为局部示意，间距不按地址比例绘制；地址编号不对应真实字节。</p>
        <p class="as-layout-announcement" id="as-layout-announcement" aria-live="polite" aria-atomic="true"></p>
      </section>`;
    const $ = selector => host.querySelector(selector);
    const $$ = selector => [...host.querySelectorAll(selector)];

    function pointerPicture(snapshot) {
      const process = snapshot.processes[0], saved = process.references[0], object = process.objects[0];
      return `<div class="as-reference-detail" aria-label="saved 的变量地址为 ${saved.slot}，保存对象地址 ${saved.address}，对象的值为 ${object.value}"><div class="as-pointer-variable"><span>栈 · 指针变量 saved</span><dl><div><dt>变量自身的地址</dt><dd>${saved.slot}</dd></div><div><dt>保存的对象地址</dt><dd>${saved.address}</dd></div></dl></div><div class="as-pointer-link" aria-hidden="true"><svg viewBox="0 0 24 34"><path d="M12 0 V30 M7 25 L12 30 L17 25"/></svg></div><div class="as-pointer-object"><span>堆 · buffer</span><dl><div><dt>对象的地址</dt><dd>${object.address}</dd></div><div><dt>对象的值</dt><dd>${object.value}</dd></div></dl></div></div>`;
    }
    function paintLayout() {
      const region = regions[regionIndex];
      $$('[data-region]').forEach(button => {
        const selected = button.dataset.region === region.id;
        button.setAttribute('aria-pressed', String(selected)); button.tabIndex = selected ? 0 : -1;
        button.dataset.related = String(showReference && ['stack', 'heap'].includes(button.dataset.region));
      });
      $('#as-saved-location').setAttribute('aria-pressed', String(showReference));
      $('#as-region-title').textContent = showReference ? '变量的地址，不是它保存的地址' : region.title;
      $('#as-region-range').textContent = showReference ? '栈地址 14 → 堆地址 6' : `虚拟地址 ${region.start}–${region.end}`;
      $('#as-region-description').textContent = showReference ? 'saved 自身在栈中，保存 buffer 的地址。沿这个地址访问，才会取得对象中的值 10。' : descriptions[region.id];
      $('#as-region-picture').innerHTML = showReference ? pointerPicture(layoutSnapshots[regionIndex]) : examples[region.id];
    }
    function drawLifetime() {
      const snapshot = lifetime[stage], process = snapshot.processes[0], saved = process.references[0];
      const work = process.frames.find(frame => frame.id === 'work'), object = process.objects[0];
      const released = process.released.length > 0, stale = saved.address !== null && released;
      const reference = stale ? 'stale' : object && saved.address !== null ? 'live' : 'null';
      const frameState = work ? 'live' : stage > 1 ? 'returned' : 'absent';
      const objectState = object ? 'live' : released ? 'released' : 'absent';
      $('#as-reference-observation').innerHTML = `
        <div class="as-life-caption">进程 A <span>栈与堆的局部视图</span></div>
        <div class="as-life-objects" data-reference="${reference}">
          <div class="as-life-stack" data-visual-region="stack"><h4>栈 · 调用帧</h4>
            <div class="as-life-main" data-frame="main" data-current="${[0, 2, 5].includes(stage)}"><div class="as-life-object-name"><strong>main</strong><small>14–15</small></div><span class="as-life-address">saved 的地址：14</span><strong class="as-life-value" data-saved-value>saved = ${saved.address === null ? 'NULL' : saved.address}</strong><span class="as-life-object-state">${stale ? '旧引用已失效' : saved.address === null ? '未指向对象' : '指向 buffer'}</span></div>
            <div class="as-life-work" data-frame-state="${frameState}" data-current="${[1, 3].includes(stage)}"><div class="as-life-object-name"><strong>work</strong><small>12–13</small></div><span>${work ? 'local = ' + work.local : stage > 1 ? '调用帧已结束' : '尚未调用'}</span></div>
          </div>
          <div class="as-reference-connector" data-reference="${reference}" role="img" aria-label="${reference === 'live' ? 'saved 指向地址 6 的 buffer 对象' : stale ? '旧引用失效，不能访问已释放的对象' : 'saved 为空，没有对象引用'}">${reference === 'null' ? '' : `<svg viewBox="0 0 48 24" aria-hidden="true"><path d="M0 12 H43"/>${stale ? '<path class="as-reference-cross" d="M34 6 L46 18 M34 18 L46 6"/>' : '<path class="as-reference-head" d="M36 6 L43 12 L36 18"/>'}</svg>`}</div>
          <div class="as-life-heap" data-visual-region="heap"><h4>堆 · 动态对象</h4><div class="as-life-buffer" data-object-state="${objectState}" data-current="${[2, 4].includes(stage)}"><div class="as-life-object-name"><strong>buffer</strong></div><span class="as-life-address">对象地址：6</span><strong class="as-life-value">${object ? object.value : released ? '已释放' : '—'}</strong><span class="as-life-object-state">${object ? '对象的值' : released ? '生命周期已结束' : '尚未分配对象'}</span></div></div>
        </div>`;
      $('#as-event-title').textContent = titles[stage]; $('#as-stage-index').textContent = stage + 1;
      $('#as-code').textContent = actions[stage]; $('#as-lifecycle-insight').textContent = insights[stage];
      $('#as-prev').disabled = stage === 0; $('#as-step').disabled = stage === lifetime.length - 1;
      $$('button[data-stage]').forEach(button => { const selected = Number(button.dataset.stage) === stage; button.setAttribute('aria-pressed', String(selected)); button.tabIndex = selected ? 0 : -1; });
      $('#as-lifetime-view').dataset.stage = stage; updatePlayback();
    }
    function updatePlayback() {
      const playing = timer !== null, label = playing ? '暂停' : stage === lifetime.length - 1 ? '重播' : '播放';
      $('#as-play').setAttribute('aria-pressed', String(playing)); $('#as-play').setAttribute('aria-label', label === '重播' ? '重新播放' : label); $('#as-play').title = label;
      $('#as-play').firstElementChild.textContent = playing ? 'Ⅱ' : stage === lifetime.length - 1 ? '↻' : '▶'; $('[data-play-label]').textContent = label;
    }
    function pause() { clearInterval(timer); timer = null; updatePlayback(); }
    function seek(next, announce = true) { stage = Math.max(0, Math.min(lifetime.length - 1, next)); drawLifetime(); if (announce) $('#as-layout-announcement').textContent = `阶段 ${stage + 1}：${titles[stage]}。${insights[stage]}`; }
    function advance() { if (stage < lifetime.length - 1) seek(stage + 1); if (stage === lifetime.length - 1) pause(); }
    function play() { if (stage === lifetime.length - 1) seek(0); timer = setInterval(advance, Number($('#as-speed').value)); updatePlayback(); }
    function select(name) {
      if (!['layout', 'lifetime'].includes(name)) return;
      pause(); scene = name; host.dataset.scene = scene;
      $$('[data-layout-view]').forEach(button => { const selected = button.dataset.layoutView === scene; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; });
      $('#as-layout-view').hidden = scene !== 'layout'; $('#as-lifetime-view').hidden = scene !== 'lifetime';
      if (scene === 'layout') paintLayout(); else drawLifetime();
    }
    host.addEventListener('click', event => {
      const tab = event.target.closest('[data-layout-view]'); if (tab) select(tab.dataset.layoutView);
      if (event.target.closest('#as-saved-location')) { showReference = true; regionIndex = regions.findIndex(region => region.id === 'stack'); paintLayout(); return; }
      const region = event.target.closest('[data-region]'); if (region) { showReference = false; regionIndex = regions.findIndex(item => item.id === region.dataset.region); paintLayout(); }
      const step = event.target.closest('button[data-stage]'); if (step) { pause(); seek(Number(step.dataset.stage)); }
    });
    $('.as-layout-switch').addEventListener('keydown', event => {
      if (!event.target.closest('[data-layout-view]') || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); select(event.key === 'Home' ? 'layout' : event.key === 'End' ? 'lifetime' : scene === 'layout' ? 'lifetime' : 'layout'); $(`[data-layout-view="${scene}"]`).focus({preventScroll: true});
    });
    $('.as-region-map').addEventListener('keydown', event => {
      const target = event.target.closest('[data-region]'); if (!target || !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const position = visualRegions.findIndex(item => item.id === target.dataset.region);
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? visualRegions.length - 1 : Math.max(0, Math.min(visualRegions.length - 1, position + (event.key === 'ArrowUp' ? -1 : 1)));
      regionIndex = regions.findIndex(region => region.id === visualRegions[index].id); showReference = false; paintLayout(); $(`[data-region="${visualRegions[index].id}"]`).focus({preventScroll: true});
    });
    $('#as-story-steps').addEventListener('keydown', event => {
      if (!event.target.closest('button[data-stage]') || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); pause(); seek(event.key === 'Home' ? 0 : event.key === 'End' ? lifetime.length - 1 : stage + (event.key === 'ArrowRight' ? 1 : -1)); $(`button[data-stage="${stage}"]`).focus({preventScroll: true});
    });
    $('#as-play').addEventListener('click', () => timer === null ? play() : pause());
    $('#as-prev').addEventListener('click', () => { pause(); seek(stage - 1); }); $('#as-step').addEventListener('click', () => { pause(); advance(); }); $('#as-reset').addEventListener('click', () => { pause(); seek(0); });
    $('#as-speed').addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }); window.addEventListener('pagehide', pause);
    drawLifetime(); select('layout'); return {pause, select};
  };
})();
