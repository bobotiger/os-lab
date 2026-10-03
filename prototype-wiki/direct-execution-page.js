function renderDirectExecutionPage(root) {
  const {scenarios, buildScenario} = OSLabDirectExecution;
  root.innerHTML = `<div class="page rr-page lde-page" id="top">
    ${wikiHeader('directExecution', [{href: '#demo', title: '控制权流转'}, {href: '#entry', title: '受控入口'}, {href: '#rules', title: '关键区别'}])}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">CPU 虚拟化 / 机制</p>
        <h1 id="page-title">受限直接执行 <span>Limited Direct Execution</span></h1>
        <p class="lead">用户态指令直接执行，进入内核的条件由硬件与 OS 限定。</p>
        <p class="definition">用户态是程序权限受限制的执行模式，内核态允许操作系统执行必要的特权操作。程序的普通指令直接在 CPU 上执行，硬件检查权限。程序请求系统服务、指令触发异常或计时器产生中断时，CPU 通过预设入口转入内核；操作系统处理事件后，再决定返回原进程还是切换进程。</p>
        <p class="model-note">单核，A 正在运行，B 已就绪且预存了合法的用户及内核现场。阶段表示控制转移的顺序，不表示指令数或耗时；具体入口指令、寄存器、栈布局与中断处理依赖体系结构。</p>
      </section>
      <section class="lde-demo" id="demo" aria-labelledby="demo-title">
        <div class="section-heading"><div><p class="section-index">01 / CONTROL TRANSFER</p><h2 id="demo-title">内核入口、现场保存与进程切换</h2></div><p>阶段 <strong id="lde-stage-index">1</strong> / <span id="lde-stage-total">7</span></p></div>
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
          <section aria-labelledby="lde-process-title"><h3 id="lde-process-title">进程状态</h3><dl class="lde-process-states"><div><dt>A</dt><dd id="lde-state-a"></dd></div><div><dt>B</dt><dd id="lde-state-b"></dd></div><div><dt>进程间切换</dt><dd id="lde-switches"></dd></div></dl><p class="lde-caption">CPU 进入内核态后，仍可以保留 A 的进程上下文。执行模式改变，不代表已经换成另一个进程。</p></section>
          <section aria-labelledby="lde-save-title"><h3 id="lde-save-title">现场保存与恢复</h3><table class="lde-save-table"><thead><tr><th scope="col">进程</th><th scope="col">进入内核的用户现场</th><th scope="col">OS 切换的内核上下文</th></tr></thead><tbody><tr><th scope="row">A</th><td id="lde-user-a"></td><td id="lde-kernel-a"></td></tr><tr><th scope="row">B</th><td id="lde-user-b"></td><td id="lde-kernel-b"></td></tr></tbody></table><p class="lde-caption">入口通常涉及返回位置、原权限模式等必要状态；OS 与入口软件还可能保存其他寄存器。完整切换涉及寄存器和栈等上下文，具体分工依架构而定。</p></section>
        </div>
      </section>
      <section class="lde-entry-section" id="entry" aria-labelledby="entry-title"><div class="section-heading"><div><p class="section-index">02 / CONTROLLED ENTRY</p><h2 id="entry-title">入口由内核配置，不能任意跳入</h2></div></div>
        <div class="lde-entry-layout"><table class="lde-entry-table"><caption>三类内核入口及触发来源；入口组织与向量编号随体系结构变化。</caption><thead><tr><th scope="col">事件</th><th scope="col">触发来源</th><th scope="col">受控目标</th></tr></thead><tbody><tr data-entry="syscall"><th scope="row">系统调用</th><td>程序的专用请求指令</td><td>系统调用入口</td></tr><tr data-entry="timer"><th scope="row">计时器中断</th><td>计时器硬件</td><td>计时器处理入口</td></tr><tr data-entry="protection"><th scope="row">保护异常</th><td>当前指令的权限检查</td><td>异常处理入口</td></tr></tbody></table><div class="lde-entry-note"><h3>启动时建立保护边界</h3><p>内核以足够权限配置陷阱／中断入口和计时器，然后才允许用户程序运行。具体可进入哪些入口、怎样提高权限，由硬件和内核配置共同限定。</p><p id="lde-entry-current">此刻尚未进入内核。</p></div></div>
      </section>
      <section class="rr-rules" id="rules" aria-labelledby="rules-title"><div class="section-heading"><div><p class="section-index">03 / MECHANISM VS POLICY</p><h2 id="rules-title">用户态与内核态切换，不等于进程切换</h2></div></div>
        <dl class="concepts rr-concepts"><div><dt>普通调用与受控内核入口</dt><dd>普通函数调用只改变程序内的执行位置，不自动获得内核权限。系统调用通过专用入口请求操作系统服务；CPU 按入口配置改变权限并进入内核，而不是任意跳转到内核地址。</dd></div><div><dt>中断入口与上下文切换</dt><dd>计时器中断使 CPU 先执行内核处理代码。调度器随后决定继续 A，还是保存 A 的现场并恢复 B 的现场；硬件不会仅因中断发生就自动选择另一个进程。</dd></div><div><dt>执行模式与进程状态</dt><dd>用户态和内核态表示 CPU 的权限模式；运行、就绪和阻塞表示进程的运行条件。本例的查询型系统调用不需要等待事件，处理后可以返回 A。需要等待 I/O 的系统调用则可能使进程阻塞。</dd></div></dl>
        <div class="rr-tradeoff"><h3>计时器中断机制与调度策略的分工</h3><p>计时器可在进程持续计算时触发中断，使 CPU 转入内核执行中断处理代码，不依赖进程主动让出 CPU。是否切换到 B 由调度策略决定，不是每次中断都必须切换。<a class="inline-link" href="round-robin.html">轮转</a>和<a class="inline-link" href="mlfq.html">MLFQ</a>规定进程选择及调度时机，受限直接执行提供权限受限的执行、内核入口和现场恢复机制。</p></div>
        <div class="rr-tradeoff"><h3>直接，不等于不受限制</h3><p>普通用户指令直接执行，权限检查和内存保护仍然存在。违规特权操作、合法系统调用和异步中断是不同入口原因。保护异常使内核接管违规操作，后续是否终止进程取决于系统与异常类型；进入内核本身不等于进程已经退出。</p></div>
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
    root.querySelector('#demo-title').textContent = {
      timer: '计时器中断后，由 OS 决定是否切换进程',
      syscall: '请求 OS 服务，处理后返回 A',
      protection: '越权操作被拒绝，进入内核异常处理',
    }[scenario];
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