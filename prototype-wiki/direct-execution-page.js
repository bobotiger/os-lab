function renderDirectExecutionPage(root) {
  const {buildScenario} = OSLabDirectExecution;
  root.innerHTML = `<div class="page rr-page lde-page" id="top">
    ${wikiHeader('directExecution', [{href: '#demo', title: '执行过程'}, {href: '#rules', title: '区分两种切换'}, {href: '#entry', title: '入口规则'}])}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">CPU 虚拟化 / 机制</p>
        <h1 id="page-title">受限直接执行 <span>Limited Direct Execution</span></h1>
        <p class="lead">进程共享 CPU，既需要直接执行的效率，也需要 OS 能限制权限、重新取得控制权。</p>
        <p class="definition">普通指令在用户态直接执行，权限受硬件限制；通过受控入口进入内核态后，操作系统才能执行必要的特权操作。</p>
      </section>
      <section class="lde-demo" id="demo" aria-labelledby="demo-title">
        <div class="section-heading"><div><h2 id="demo-title">三种进入内核的原因</h2></div></div>
        <div class="lde-scenarios" role="group" aria-label="机制场景">
          <button type="button" data-scenario="syscall" aria-pressed="true"><strong>1 · 系统调用</strong><span>A 主动请求服务</span></button>
          <button type="button" data-scenario="timer" aria-pressed="false"><strong>2 · 计时器中断</strong><span>A 持续计算，不主动让出 CPU</span></button>
          <button type="button" data-scenario="protection" aria-pressed="false"><strong>3 · 保护异常</strong><span>A 尝试越权操作</span></button>
        </div>
        <p class="lde-scene-note" id="lde-scene-note"></p>
        <p class="lde-conditions">单核；起初 A 运行、B 就绪。阶段表示事件顺序，不表示耗时。</p>
        <div class="rr-toolbar lde-toolbar">
          <div class="rr-transport" role="group" aria-label="演示控制">
            <button type="button" class="icon-button primary" id="lde-play" title="播放" aria-label="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button>
            <button type="button" class="icon-button" id="lde-step" title="下一阶段" aria-label="下一阶段"><span aria-hidden="true">↦</span></button>
            <button type="button" class="icon-button" id="lde-reset" title="重新开始" aria-label="重新开始"><span aria-hidden="true">↺</span></button>
          </div>
          <label id="lde-decision-control">中断后选择<select id="lde-decision"><option value="switch">切换到 B</option><option value="continue">继续 A</option></select></label>
          <label>播放速度<select id="lde-speed"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label>
          <p class="lde-progress">阶段 <strong id="lde-stage-index">1</strong> / <span id="lde-stage-total">5</span></p>
        </div>
        <div class="lde-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="lde-actor"></p><h3 id="lde-event-title"></h3><p id="lde-event-text"></p></div>
        <div class="lde-diagram-scroll" tabindex="0" role="region" aria-label="用户态与内核态执行泳道"><div class="lde-diagram" id="lde-diagram"></div></div>
        <input id="lde-position" type="range" min="0" max="6" step="1" value="0" aria-label="演示阶段">
        <dl class="lde-cpu-status"><div><dt>CPU 正在执行</dt><dd id="lde-executing"></dd></div><div><dt>CPU 权限模式</dt><dd id="lde-mode"></dd></div><div><dt>所属进程</dt><dd id="lde-context"></dd></div><div id="lde-timer-status"><dt>计时器</dt><dd id="lde-timer"></dd></div></dl>
        <dl class="lde-process-states"><div><dt>进程 A</dt><dd id="lde-state-a"></dd></div><div><dt>进程 B</dt><dd id="lde-state-b"></dd></div><div><dt>进程切换次数</dt><dd id="lde-switches"></dd></div></dl>
        <div class="cpu-context-transfer" id="lde-context-transfer" aria-label="现场保存与恢复的位置"></div>
        <details class="lde-reference" id="lde-saved-context"><summary>现场保存的完整记录与硬件分工</summary>
          <p>现场是继续执行所需的状态，包括执行位置、寄存器和栈等。进入内核时保留用户现场；切换进程时，OS 还要保存和恢复内核执行上下文。</p>
          <p>B 已有合法的用户现场和内核上下文，因此可以被恢复执行。</p>
          <table class="lde-save-table"><thead><tr><th scope="col">进程</th><th scope="col">进入内核的用户现场</th><th scope="col">OS 切换的内核上下文</th></tr></thead><tbody><tr><th scope="row">A</th><td id="lde-user-a"></td><td id="lde-kernel-a"></td></tr><tr><th scope="row">B</th><td id="lde-user-b"></td><td id="lde-kernel-b"></td></tr></tbody></table><p class="lde-caption">入口保存返回位置、原权限模式等必要状态；其他寄存器可能由入口软件保存。具体指令、栈布局及硬件与软件的分工依体系结构而定。</p>
        </details>
      </section>
      <section class="rr-rules" id="rules" aria-labelledby="rules-title"><div class="section-heading"><div><h2 id="rules-title">进入内核时，未必换了进程</h2></div></div>
        <div class="lde-comparison">
          <div><h3>权限模式改变</h3><p class="lde-change"><span>A · 用户态</span><span aria-hidden="true">→</span><span>A · 内核态</span></p><p>CPU 已进入内核，仍在 A 的进程上下文中。</p></div>
          <div><h3>当前进程改变</h3><p class="lde-change"><span>A · 内核态</span><span aria-hidden="true">→</span><span>B · 内核态</span></p><p>OS 保存 A、恢复 B，然后才能返回 B 的用户程序。</p></div>
        </div>
        <p class="lde-next-topic">计时器使 OS 能重新获得控制权；接下来选谁运行，由<a class="inline-link" href="cpu-scheduling.html">调度策略</a>决定。</p>
      </section>
      <section class="lde-entry-section" id="entry" aria-labelledby="entry-title"><div class="section-heading"><div><h2 id="entry-title">入口规则与机制边界</h2></div></div>
        <details class="lde-reference"><summary>系统调用、中断和异常，分别由什么触发？</summary>
          <table class="lde-entry-table"><caption>入口组织与向量编号随体系结构变化。</caption><thead><tr><th scope="col">事件</th><th scope="col">触发来源</th><th scope="col">受控目标</th></tr></thead><tbody><tr><th scope="row">系统调用</th><td>程序的专用请求指令</td><td>系统调用入口</td></tr><tr><th scope="row">计时器中断</th><td>计时器硬件，异步触发</td><td>计时器处理入口</td></tr><tr><th scope="row">保护异常</th><td>当前指令的权限检查，同步触发</td><td>异常处理入口</td></tr></tbody></table>
        </details>
        <details class="lde-reference"><summary>为什么不能用普通函数调用获得内核权限？</summary><p>普通函数调用只改变程序内的执行位置，不自动提高权限。内核先以足够权限配置陷阱／中断入口和计时器，再允许用户程序运行。CPU 按硬件规则和入口配置进入内核，用户程序不能任意指定内核入口地址。</p><p>普通指令直接执行时，权限检查和内存保护仍然有效。</p></details>
        <details class="lde-reference"><summary>进入内核，是否意味着进程阻塞或退出？</summary><p>用户态、内核态表示 CPU 权限；运行、就绪、阻塞表示进程的运行条件。查询型系统调用可以不阻塞，等待 I/O 的调用则可能使进程阻塞。</p><p>保护异常发生后，违规操作未完成。内核是否终止进程、报告错误或采取其他处理，取决于系统与异常类型；进入内核本身不等于进程已退出。</p></details>
      </section>
      ${wikiRelated('directExecution')}
    </main><footer class="site-footer"><span>OSLab / CPU 虚拟化</span><a href="#top">回到页首 ↑</a></footer>
  </div>`;
  const contextTransfer = root.querySelector('#lde-context-transfer');
  root.querySelector('.lde-diagram-scroll').after(contextTransfer);
  const statusReference = document.createElement('details');
  statusReference.className = 'lde-reference';
  statusReference.innerHTML = '<summary>CPU 状态、进程状态与切换次数</summary>';
  root.querySelector('.lde-cpu-status').before(statusReference);
  statusReference.append(root.querySelector('.lde-cpu-status'), root.querySelector('.lde-process-states'));
  let scenario = 'syscall';
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
    root.querySelector('#lde-scene-note').textContent = {
      syscall: 'A 发起一次查询请求；处理无需等待 I/O，也不引起进程切换。',
      timer: '计时器在 A 持续计算时触发中断。OS 可以继续 A，也可以切换到已就绪的 B。',
      protection: 'A 尝试执行仅内核态允许的操作；异常处理开始后，后续处置尚未发生。',
    }[scenario];
    root.querySelector('#lde-stage-total').textContent = frames.length;
    root.querySelector('#lde-decision-control').hidden = scenario !== 'timer';
    root.querySelector('#lde-timer-status').hidden = scenario !== 'timer';
    root.querySelector('.lde-cpu-status').classList.toggle('lde-with-timer', scenario === 'timer');
    root.querySelectorAll('[data-scenario]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scenario === scenario)));
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
    const changedProcess = scenario === 'timer' && decision === 'switch' && stage >= 5;
    const entering = snapshot.owner === 'kernel' && frames[stage - 1]?.owner === 'user';
    const switching = changedProcess && stage === 5;
    const returning = snapshot.owner === 'user' && stage >= 4;
    const userSaved = frames.slice(0, stage + 1).some(frame => frame.owner === 'kernel');
    const transfer = entering ? 'A 用户现场 → A 的保存区；CPU 转入内核入口' : switching ? '保存 A 的内核上下文 → 恢复 B 的内核上下文' : returning ? `${snapshot.context} 的用户现场 → CPU，继续用户程序` : snapshot.owner === 'kernel' ? 'CPU 正在执行内核代码，用户现场留在保存区' : 'CPU 直接执行 A 的用户指令';
    contextTransfer.innerHTML = `<p class="cpu-transfer-action">${transfer}</p><div class="cpu-context-layout cpu-lde-context"><div class="cpu-saved ${entering || switching ? 'is-transferring' : ''}"><h3>A 的保存区</h3><span>用户现场：PC、寄存器、用户栈指针</span><strong>${returning && snapshot.context === 'A' ? '已恢复到 CPU' : userSaved ? '已保存 A 的用户现场' : '尚未进入内核'}</strong><span>内核上下文：内核执行位置、栈指针等</span><strong>${changedProcess ? '已保存，可供以后恢复' : '尚未因切换而保存'}</strong></div><div class="cpu-registers process-${snapshot.context.toLowerCase()}"><span>CPU 当前执行</span><strong>${snapshot.context} · ${snapshot.owner === 'user' ? '用户程序' : '内核代码'}</strong><span>${snapshot.owner === 'kernel' ? `使用 ${snapshot.context} 的内核执行上下文` : `使用 ${snapshot.context} 的用户执行现场`}</span></div><div class="cpu-saved ${switching || returning && snapshot.context === 'B' ? 'is-transferring' : ''}"><h3>B 的保存区</h3><span>用户现场：PC、寄存器、用户栈指针</span><strong>${returning && snapshot.context === 'B' ? '已恢复到 CPU' : '预先保存，等待恢复'}</strong><span>内核上下文：内核执行位置、栈指针等</span><strong>${changedProcess ? '切换时已恢复' : '预先保存，等待恢复'}</strong></div></div><p class="cpu-caption">${switching ? '进程已从 A 换成 B，但 CPU 仍在内核态；下一阶段才返回 B 的用户代码。' : entering ? '硬件与入口代码共同保留返回所需状态；此时仍属于 A，尚未切换到 B。' : '用户现场用于回到用户程序；内核上下文用于在内核中暂停、恢复一个进程的执行。'}</p>`;
    root.querySelector('#lde-stage-index').textContent = stage + 1;
    root.querySelector('#lde-executing').textContent = snapshot.owner === 'user' ? `${snapshot.context} 的用户代码` : '内核代码';
    root.querySelector('#lde-mode').textContent = snapshot.mode;
    root.querySelector('#lde-context').textContent = snapshot.context;
    root.querySelector('#lde-timer').textContent = snapshot.timer;
    root.querySelector('#lde-actor').textContent = `阶段 ${stage + 1} · ${snapshot.actor}`;
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
    const halfButton = root.querySelector(`[data-stage="${stage}"]`).offsetWidth / 2;
    if (current - halfButton < scroll.scrollLeft + 84 || current + halfButton > scroll.scrollLeft + scroll.clientWidth) scroll.scrollLeft = Math.max(0, current - (scroll.clientWidth + 84) / 2);
    if (stage === 0) scroll.scrollLeft = 0;
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
  root.querySelectorAll('[data-scenario]').forEach(button => button.addEventListener('click', () => {
    if (scenario === button.dataset.scenario) return;
    scenario = button.dataset.scenario;
    rebuild();
  }));
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
