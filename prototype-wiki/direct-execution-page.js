function renderDirectExecutionPage(root) {
  const {scenarios, buildScenario} = OSLabDirectExecution;
  root.innerHTML = `<div class="page rr-page lde-page" id="top">
    ${wikiHeader('directExecution', [{href: '#demo', title: '控制权流转'}, {href: '#entry', title: '受控入口'}, {href: '#rules', title: '关键区别'}])}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">CPU 虚拟化 / 机制</p>
        <h1 id="page-title">受限直接执行 <span>Limited Direct Execution</span></h1>
        <p class="lead">把 CPU 交给程序，也能受控地收回来。</p>
        <p class="definition">程序的大部分普通指令直接在 CPU 上执行；硬件限制用户态权限，并通过预设入口进入内核。系统调用、异常和计时器中断，使操作系统在需要时获得控制权，再决定如何返回或调度。</p>
        <p class="model-note">单核，A 正在运行，B 已就绪且预存了合法的用户及内核现场。阶段不是指令数或耗时；具体入口指令、寄存器、栈布局与中断处理依赖体系结构。省略嵌套中断、并发及真实调度算法。</p>
      </section>
      <section class="lde-demo" id="demo" aria-labelledby="demo-title">
        <div class="section-heading"><div><p class="section-index">01 / CONTROL TRANSFER</p><h2 id="demo-title">进入内核，然后决定是否换人</h2></div><p>阶段 <strong id="lde-stage-index">1</strong> / <span id="lde-stage-total">7</span></p></div>
        <div class="rr-toolbar lde-toolbar">
          <div class="rr-transport" role="group" aria-label="演示控制">
            <button type="button" class="icon-button primary" id="lde-play" title="播放" aria-label="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button>
            <button type="button" class="icon-button" id="lde-step" title="下一阶段" aria-label="下一阶段"><span aria-hidden="true">↦</span></button>
            <button type="button" class="icon-button" id="lde-reset" title="重新开始" aria-label="重新开始"><span aria-hidden="true">↺</span></button>
          </div>
          <label>机制场景<select id="lde-scenario">${Object.entries(scenarios).map(([id, scene]) => `<option value="${id}">${scene.title}</option>`).join('')}</select></label>
          <label id="lde-decision-control">中断后选择<select id="lde-decision"><option value="switch">切换到 B</option><option value="continue">继续 A</option></select></label>
          <label>播放速度<select id="lde-speed"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label>
        </div>
        <p class="lde-scene-note" id="lde-scene-note"></p>
        <dl class="lde-cpu-status"><div><dt>CPU 正在执行</dt><dd id="lde-executing"></dd></div><div><dt>硬件模式</dt><dd id="lde-mode"></dd></div><div><dt>当前进程上下文</dt><dd id="lde-context"></dd></div><div><dt>计时器</dt><dd id="lde-timer"></dd></div></dl>
        <div class="lde-diagram-scroll" tabindex="0" role="region" aria-label="用户态与内核态执行泳道"><div class="lde-diagram" id="lde-diagram"></div></div>
        <input id="lde-position" type="range" min="0" max="6" step="1" value="0" aria-label="演示阶段">
        <div class="lde-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="lde-actor"></p><h3 id="lde-event-title"></h3><p id="lde-event-text"></p></div>
        <div class="lde-context-detail">
          <section aria-labelledby="lde-process-title"><h3 id="lde-process-title">进程状态</h3><dl class="lde-process-states"><div><dt>A</dt><dd id="lde-state-a"></dd></div><div><dt>B</dt><dd id="lde-state-b"></dd></div><div><dt>进程间切换</dt><dd id="lde-switches"></dd></div></dl><p class="lde-caption">进入内核仍可以在 A 的上下文中执行；内核不是这里的第三个用户进程。</p></section>
          <section aria-labelledby="lde-save-title"><h3 id="lde-save-title">现场保存与恢复</h3><table class="lde-save-table"><thead><tr><th scope="col">进程</th><th scope="col">进入内核的用户现场</th><th scope="col">OS 切换的内核上下文</th></tr></thead><tbody><tr><th scope="row">A</th><td id="lde-user-a"></td><td id="lde-kernel-a"></td></tr><tr><th scope="row">B</th><td id="lde-user-b"></td><td id="lde-kernel-b"></td></tr></tbody></table><p class="lde-caption">入口通常涉及返回位置、原权限模式等必要状态；OS 与入口软件还可能保存其他寄存器。完整切换涉及寄存器和栈等上下文，具体分工依架构而定。</p></section>
        </div>
      </section>
      <section class="lde-entry-section" id="entry" aria-labelledby="entry-title"><div class="section-heading"><div><p class="section-index">02 / CONTROLLED ENTRY</p><h2 id="entry-title">入口由内核配置，不能任意跳入</h2></div></div>
        <div class="lde-entry-layout"><table class="lde-entry-table"><caption>简化入口表：表示三类合法内核处理路径，不代表真实向量编号或所有架构使用同一张表。</caption><thead><tr><th scope="col">事件</th><th scope="col">触发来源</th><th scope="col">受控目标</th></tr></thead><tbody><tr data-entry="syscall"><th scope="row">系统调用</th><td>程序的专用请求指令</td><td>系统调用入口</td></tr><tr data-entry="timer"><th scope="row">计时器中断</th><td>计时器硬件</td><td>计时器处理入口</td></tr><tr data-entry="protection"><th scope="row">保护异常</th><td>当前指令的权限检查</td><td>异常处理入口</td></tr></tbody></table><div class="lde-entry-note"><h3>启动时建立保护边界</h3><p>内核以足够权限配置陷阱／中断入口和计时器，然后才允许用户程序运行。具体可进入哪些入口、怎样提高权限，由硬件和内核配置共同限定。</p><p id="lde-entry-current">此刻尚未进入内核。</p></div></div>
      </section>
      <section class="rr-rules" id="rules" aria-labelledby="rules-title"><div class="section-heading"><div><p class="section-index">03 / MECHANISM VS POLICY</p><h2 id="rules-title">切换模式，不一定切换进程</h2></div></div>
        <dl class="concepts rr-concepts"><div><dt>普通调用与 trap 不同</dt><dd>普通函数调用改变程序内的控制流，不自动获得内核权限。系统调用通过专用受控入口请求 OS 服务；不是任意跳转到内核地址。</dd></div><div><dt>中断入口与上下文切换不同</dt><dd>计时器中断先让内核重新获得控制权，硬件不会自动决定下一位进程。OS 可以继续 A，也可以保存 A 并恢复 B；两条路径都需要正确的返回现场。</dd></div><div><dt>执行模式与进程状态不同</dt><dd>用户态／内核态描述 CPU 的权限模式；运行／就绪／阻塞描述进程状态。本例的查询型系统调用不阻塞，但其他系统调用可能等待 I/O 或导致调度。</dd></div></dl>
        <div class="rr-tradeoff"><h3>机制保证能接管，策略决定交给谁</h3><p>如果只依靠程序主动让出 CPU，持续计算的程序可能一直占用处理器。计时器提供不依赖这种自愿配合的接管机制；这里的“切换到 B”是固定教学选择，不代表每次计时器中断都必须切换。<a class="inline-link" href="round-robin.html">轮转</a>和<a class="inline-link" href="mlfq.html">MLFQ</a>讨论选谁以及何时选择，受限直接执行讨论如何安全执行、进入内核和恢复。</p></div>
        <div class="rr-tradeoff"><h3>直接，不等于不受限制</h3><p>普通用户指令直接执行，权限检查和内存保护仍然存在。违规特权操作、合法系统调用和异步中断是不同入口原因；本页保护异常场景停在内核接管之后，不假定所有异常都必须终止程序，也不把演示结束解释为进程完成。</p></div>
      </section>
      ${wikiRelated('directExecution')}
    </main><footer class="site-footer"><span>OSLab / CPU 虚拟化</span><a href="#top">回到页首 ↑</a></footer>
  </div>`;
  let scenario = 'timer';
  let decision = 'switch';
  let frames = buildScenario(scenario, decision);
  let stage = 0;
  let timer = null;
  const playButton = root.querySelector('#lde-play');
  const stepButton = root.querySelector('#lde-step');
  const position = root.querySelector('#lde-position');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cancelHighlights = () => root.querySelector('#lde-diagram').getAnimations({subtree: true}).forEach(animation => animation.cancel());
  const prepare = () => {
    root.querySelector('#lde-scene-note').textContent = scenarios[scenario].description;
    root.querySelector('#lde-stage-total').textContent = frames.length;
    root.querySelector('#lde-decision-control').hidden = scenario !== 'timer';
    position.max = frames.length - 1;
    const width = 84 + frames.length * 116;
    const points = frames.map((frame, index) => `${84 + (index + .5) * 116},${frame.owner === 'user' ? 50 : 150}`).join(' ');
    root.querySelector('#lde-diagram').style.minWidth = `${width}px`;
    root.querySelector('#lde-diagram').style.setProperty('--lde-stages', frames.length);
    root.querySelector('#lde-diagram').innerHTML = `<div class="lde-phase-numbers"><span>执行顺序 →</span>${frames.map((frame, index) => `<span>${String(index + 1).padStart(2, '0')}</span>`).join('')}</div><svg class="lde-path" viewBox="0 0 ${width} 200" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}" class="lde-planned-path"></polyline><polyline id="lde-executed-path" points=""></polyline></svg>${['user', 'kernel'].map(owner => `<div class="lde-lane lde-${owner}"><h3>${owner === 'user' ? '用户态' : '内核态'}<span>${owner === 'user' ? '程序代码' : 'OS 代码'}</span></h3>${frames.map((frame, index) => frame.owner === owner ? `<button type="button" class="lde-stage-button" data-stage="${index}" aria-label="阶段 ${index + 1}：${frame.label}" title="${frame.title}" aria-pressed="false"><span>${frame.owner === 'user' ? frame.context : '内核'}${frame.owner === 'kernel' ? ` · ${frame.context}` : ''}</span><strong>${frame.label}</strong></button>` : '<span class="lde-empty-step" aria-hidden="true"></span>').join('')}</div>`).join('')}`;
  };
  const syncPaths = () => {
    const diagram = root.querySelector('#lde-diagram');
    const width = diagram.clientWidth;
    const column = (width - 84) / frames.length;
    const points = frames.map((frame, index) => `${84 + (index + .5) * column},${frame.owner === 'user' ? 50 : 150}`);
    diagram.querySelector('svg').setAttribute('viewBox', `0 0 ${width} 200`);
    diagram.querySelector('.lde-planned-path').setAttribute('points', points.join(' '));
    diagram.querySelector('#lde-executed-path').setAttribute('points', points.slice(0, stage + 1).join(' '));
    return 84 + (stage + .5) * column;
  };
  const paint = () => {
    const snapshot = frames[stage];
    root.querySelector('#lde-stage-index').textContent = stage + 1;
    root.querySelector('#lde-executing').textContent = snapshot.owner === 'user' ? `${snapshot.context} 的用户代码` : '内核代码';
    root.querySelector('#lde-mode').textContent = snapshot.mode;
    root.querySelector('#lde-context').textContent = snapshot.context;
    root.querySelector('#lde-timer').textContent = snapshot.timer;
    root.querySelector('#lde-actor').textContent = `阶段 ${stage + 1} / 本步负责：${snapshot.actor}`;
    root.querySelector('#lde-event-title').textContent = snapshot.title;
    root.querySelector('#lde-event-text').textContent = snapshot.text;
    for (const id of ['A', 'B']) {
      root.querySelector(`#lde-state-${id.toLowerCase()}`).textContent = snapshot.states[id];
      root.querySelector(`#lde-user-${id.toLowerCase()}`).textContent = snapshot[`user${id}`];
      root.querySelector(`#lde-kernel-${id.toLowerCase()}`).textContent = snapshot[`kernel${id}`];
    }
    root.querySelector('#lde-switches').textContent = snapshot.switches;
    root.querySelectorAll('[data-stage]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.stage) === stage)));
    const scroll = root.querySelector('.lde-diagram-scroll');
    const current = syncPaths();
    if (current < scroll.scrollLeft || current > scroll.scrollLeft + scroll.clientWidth) scroll.scrollLeft = Math.max(0, current - scroll.clientWidth / 2);
    if (stage === 0) scroll.scrollLeft = 0;
    root.querySelectorAll('[data-entry]').forEach(row => row.classList.toggle('active', row.dataset.entry === snapshot.entry));
    root.querySelector('#lde-entry-current').textContent = snapshot.entry ? `当前路径：${{timer: '计时器中断', syscall: '系统调用', protection: '保护异常'}[snapshot.entry]}。入口配置不是用户程序提供的跳转地址。` : '此刻尚未进入内核，或已返回用户程序。';
    position.value = stage;
    position.setAttribute('aria-valuetext', `阶段 ${stage + 1}，${snapshot.label}，${snapshot.mode}，进程上下文 ${snapshot.context}`);
    playButton.disabled = snapshot.complete;
    stepButton.disabled = snapshot.complete;
    cancelHighlights();
    if (!motionPreference.matches) root.querySelector(`[data-stage="${stage}"]`).animate([{opacity: .45}, {opacity: 1}], {duration: 220});
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
    stage = Math.min(stage + 1, frames.length - 1);
    if (frames[stage].complete) pause();
    paint();
  };
  const play = () => {
    if (frames[stage].complete) return;
    playButton.setAttribute('aria-pressed', 'true');
    playButton.setAttribute('aria-label', '暂停');
    playButton.title = '暂停';
    playButton.firstElementChild.textContent = 'Ⅱ';
    timer = setInterval(advance, Number(root.querySelector('#lde-speed').value));
  };
  const rebuild = () => { pause(); stage = 0; frames = buildScenario(scenario, decision); prepare(); paint(); };
  playButton.addEventListener('click', () => timer === null ? play() : pause());
  stepButton.addEventListener('click', () => { pause(); advance(); });
  root.querySelector('#lde-reset').addEventListener('click', () => { pause(); stage = 0; paint(); });
  root.querySelector('#lde-scenario').addEventListener('change', event => { scenario = event.target.value; rebuild(); });
  root.querySelector('#lde-decision').addEventListener('change', event => { decision = event.target.value; rebuild(); });
  root.querySelector('#lde-diagram').addEventListener('click', event => {
    const button = event.target.closest('[data-stage]');
    if (button) { pause(); stage = Number(button.dataset.stage); paint(); }
  });
  position.addEventListener('input', event => { pause(); stage = Number(event.target.value); paint(); });
  root.querySelector('#lde-speed').addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  window.addEventListener('resize', syncPaths);
  motionPreference.addEventListener('change', event => { if (event.matches) cancelHighlights(); });
  prepare();
  paint();
}

renderDirectExecutionPage(document.getElementById('root'));