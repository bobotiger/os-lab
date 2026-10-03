function renderMultiprocessorPage(root) {
  const {scenes, buildRun} = OSLabMultiprocessor;
  root.innerHTML = `<div class="page rr-page lde-page mp-page" id="top">
    ${wikiHeader('multiprocessor', [{href: '#demo', title: '双核观察'}, {href: '#tradeoffs', title: '调度取舍'}, {href: '#boundaries', title: '概念边界'}])}
    <main>
      <section class="intro" aria-labelledby="page-title"><p class="eyebrow">CPU 虚拟化 / 多处理器入门</p><h1 id="page-title">多处理器调度 <span>Multiprocessor Scheduling</span></h1><p class="lead">调度既选择运行任务，也选择执行它的 CPU。</p><p class="definition">多个 CPU 可以同时执行不同任务。共享队列保存所有待运行任务，多个 CPU 取任务时需要协调；每核队列分别保存本核任务，可能出现一个核空闲、另一个核仍有排队任务的情况。负载均衡通过调整任务分布减少这种差异，但迁移也可能影响对原核缓存数据的复用。</p><p class="model-note">两个同速 CPU，独立 CPU 型任务，无 I/O，各核采用非抢占 FCFS。工作量使用示意时间单位，切换与迁移开销取零。给定 CPU 需求不意味着调度器能预知未来；运行关联也不等于缓存命中率。</p></section>
      <section class="lde-demo" id="demo" aria-labelledby="demo-title">
        <div class="section-heading"><div><p class="section-index">01 / TWO CPUS · ONE WORKLOAD</p><h2 id="demo-title">每核就绪队列的负载差异与任务迁移</h2></div><p><span id="mp-position-label">t</span> = <strong id="mp-time">0</strong></p></div>
        <div class="rr-toolbar lde-toolbar mp-toolbar"><div class="rr-transport" role="group" aria-label="演示控制"><button type="button" class="icon-button primary" id="mp-play" aria-label="播放" title="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button><button type="button" class="icon-button" id="mp-step" aria-label="下一步" title="下一步"><span aria-hidden="true">↦</span></button><button type="button" class="icon-button" id="mp-reset" aria-label="重新开始" title="重新开始"><span aria-hidden="true">↺</span></button></div><label>观察场景<select id="mp-scene">${Object.entries(scenes).map(([id, scene]) => `<option value="${id}">${scene.title}</option>`).join('')}</select></label><label class="mp-toggle" id="mp-balance-control"><input type="checkbox" id="mp-balance" checked>空闲核迁移排队任务</label><label id="mp-target-control" hidden>重新派发到<select id="mp-target"><option value="0">CPU 0：原核</option><option value="1">CPU 1：新核</option></select></label><label>播放速度<select id="mp-speed"><option value="1200">慢速</option><option value="700" selected>正常</option><option value="250">快速</option></select></label></div>
        <p class="lde-scene-note" id="mp-scene-note"></p>
        <div class="mp-workload" id="mp-workload"></div>
        <div class="mp-shared-queue" id="mp-shared-queue" hidden><h3>全局就绪队列 <span>队首 → 队尾</span></h3><div id="mp-shared-tasks"></div><p>队列操作须协调：本例按 CPU 编号顺序领取，不是任意同时取走同一任务。</p><div class="mp-distribution" aria-hidden="true">↓ 领取到 CPU 0 <span>领取到 CPU 1 ↓</span></div></div>
        <div class="mp-board" id="mp-board"></div>
        <p class="lde-caption">条长表示该核已执行工作占本例总工作量的比例，不是 CPU 利用率；两个核的条形使用同一个总量作为满刻度。</p>
        <dl class="mp-summary"><div><dt>完成任务</dt><dd id="mp-completed"></dd></div><div><dt>任务迁移</dt><dd id="mp-migrations"></dd></div><div><dt>CPU 0 / CPU 1 本例累计执行</dt><dd id="mp-busy"></dd></div><div><dt id="mp-reference-label">不迁移的完成时刻</dt><dd id="mp-reference"></dd></div></dl>
        <div id="mp-timeline-section"><div class="mp-timeline-heading"><h3>同刻度的两行执行记录</h3><p>带任务编号的格子为已执行工作；空白为后续时段。</p></div><div class="mp-timeline-scroll" tabindex="0" role="region" aria-label="两个 CPU 的执行时间轴"><div id="mp-timeline"></div></div></div>
        <input id="mp-position" type="range" min="0" max="10" step="1" value="0" aria-label="演示位置">
        <div class="lde-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="mp-event-label"></p><h3 id="mp-event-title"></h3><p id="mp-event-text"></p></div>
        <table class="mp-ledger"><caption>本例工作量与剩余量；任务不能同时占用两个 CPU。</caption><thead><tr><th scope="col">任务</th><th scope="col">本例 CPU 需求</th><th scope="col">剩余</th><th scope="col">当前归属</th></tr></thead><tbody id="mp-ledger-body"></tbody></table>
      </section>
      <section class="lde-entry-section" id="tradeoffs" aria-labelledby="tradeoffs-title"><div class="section-heading"><div><p class="section-index">02 / BALANCE & LOCALITY</p><h2 id="tradeoffs-title">队列组织，负载均衡，缓存亲和性</h2></div></div><dl class="concepts rr-concepts"><div><dt>共享队列：从同一处领取</dt><dd>空闲 CPU 能从全局队列取工作，任务分配较直观。但共享调度数据需要同步，多个 CPU 可能竞争同一入口。锁争用会增加派发开销，共享队列并不保证在所有系统中更快。</dd></div><div><dt>每核队列：本地调度，另做均衡</dt><dd>每个 CPU 从自己的队列选任务，但可能出现一边空闲、一边排队。本例空闲核每次从另一队尾取一个未运行任务，不抢占运行者。这是一种工作窃取方式；实际系统也可能周期性推送或使用其他迁移条件。</dd></div><div><dt>缓存亲和性：倾向保留原核</dt><dd>同一任务再次在原 CPU 上运行，可能复用缓存中的指令和数据。迁移可能改善忙闲不均，却可能增加重新预热的代价。亲和性是一种偏好，不等于硬性绑定；缓存不会保证永久保留任务数据。</dd></div></dl><div class="rr-tradeoff"><h3>任务个数不能直接代表 CPU 工作量</h3><p>一个长任务的工作量可能超过多个短任务。给定需求为 A=8、B=4、C=4、D=2；实际调度通常根据观察、估计和资源约束做决定。在这组任务中，迁移使全部任务完成的时刻提前，但不能推导出迁移越多越好。</p></div></section>
      <section class="rr-rules" id="boundaries" aria-labelledby="boundaries-title"><div class="section-heading"><div><p class="section-index">03 / WHAT CHANGES WITH MORE CPUS</p><h2 id="boundaries-title">多处理器的任务放置与调度同步</h2></div></div><div class="mp-boundaries"><div><h3>队列组织 ≠ 优先级策略</h3><p>共享队列与每核队列描述任务放在哪里；FCFS、轮转或优先级策略描述从候选中选谁。队列组织可以搭配不同的选择策略，二者不是互相排斥的同一类算法。</p></div><div><h3>缓存一致性 ≠ 调度同步</h3><p>缓存一致性处理多个缓存对共享内存数据的副本关系；调度同步保证共享队列等结构被正确修改。硬件提供一致性机制，不代表调度数据无需锁或其他同步。</p></div><div><h3>两个 CPU ≠ 任意程序都快一倍</h3><p>本例各任务互相独立，能同时推进。现实程序可能有串行部分、依赖、同步或内存带宽限制；多 CPU 不是自动获得固定倍数加速的保证。</p></div><div><h3>运行关联不等于缓存命中</h3><p>A 已在 CPU 0 执行过，剩余 CPU 工作量为 2。选择新核后可能需要缓存预热，这部分代价不属于给定的 CPU 工作量。运行关联不保证缓存内容仍驻留，阶段数也不能用于比较实际性能；迁移不意味着数据必须从旧核缓存复制过去。</p></div></div></section>
      ${wikiRelated('multiprocessor')}
    </main><footer class="site-footer"><span>OSLab / CPU 虚拟化</span><a href="#top">回到页首 ↑</a></footer>
  </div>`;
  let scene = 'queues';
  let balance = true;
  let target = 0;
  let run = buildRun(scene, balance, target);
  let position = 0;
  let timer = null;
  const slider = root.querySelector('#mp-position');
  const playButton = root.querySelector('#mp-play');
  const stepButton = root.querySelector('#mp-step');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const chip = id => `<span class="mp-task mp-task-${id}">${id}</span>`;
  const queueView = queue => queue.length ? queue.map(chip).join('<span class="mp-queue-arrow" aria-hidden="true">→</span>') : '<span class="mp-empty">无等待任务</span>';
  const titles = {queues: '每核就绪队列的负载差异与任务迁移', shared: '共享队列：协调领取，不重复派发', affinity: '同一个任务，留在原核还是迁移？'};
  const prepare = () => {
    root.querySelector('#demo-title').textContent = titles[scene];
    root.querySelector('#mp-scene-note').textContent = scenes[scene].text;
    root.querySelector('#mp-balance-control').hidden = scene !== 'queues';
    root.querySelector('#mp-target-control').hidden = scene !== 'affinity';
    root.querySelector('#mp-shared-queue').hidden = scene !== 'shared';
    root.querySelector('#mp-timeline-section').hidden = scene === 'affinity';
    root.querySelector('#mp-position-label').textContent = scene === 'affinity' ? '阶段' : 't';
    root.querySelector('#mp-workload').innerHTML = `<span>固定工作量</span>${run.snapshots[0].tasks.map(task => `<span>${chip(task.id)} ${task.burst} 单位${scene === 'affinity' ? '剩余示意工作' : ''}</span>`).join('')}`;
    slider.max = run.duration;
  };
  const paint = () => {
    const snapshot = run.snapshots[position];
    const complete = position === run.duration;
    const totalWork = snapshot.tasks.reduce((total, task) => total + task.burst, 0);
    root.querySelector('#mp-time').textContent = scene === 'affinity' ? position + 1 : snapshot.time;
    root.querySelector('#mp-shared-tasks').innerHTML = queueView(snapshot.shared);
    root.querySelector('#mp-board').innerHTML = [0, 1].map(cpu => {
      const id = snapshot.cpus[cpu];
      const task = snapshot.tasks.find(task => task.id === id);
      return `<section class="mp-cpu" aria-labelledby="mp-cpu-${cpu}-title"><div class="mp-cpu-heading"><h3 id="mp-cpu-${cpu}-title">CPU ${cpu}</h3><span>${id ? '执行中' : '空闲'}</span></div><div class="mp-running">${id ? `${chip(id)}<div><strong>任务 ${id}</strong><span>剩余 ${task.remaining} / ${task.burst}</span></div>` : '<span class="mp-idle-icon" aria-hidden="true">○</span><div><strong>空闲</strong><span>当前没有任务占用此核</span></div>'}</div><div class="mp-work-meter" role="meter" aria-label="CPU ${cpu} 已执行工作占本例总工作量" aria-valuemin="0" aria-valuemax="${totalWork}" aria-valuenow="${snapshot.busy[cpu]}" aria-valuetext="${snapshot.busy[cpu]} / ${totalWork} 单位，不是 CPU 利用率"><span style="width:${snapshot.busy[cpu] / totalWork * 100}%"></span></div><p class="mp-used">已执行 ${snapshot.busy[cpu]} / 总工作量 ${totalWork} 单位</p>${scene !== 'shared' ? `<div class="mp-local-queue"><h4>本核就绪队列 <span>队首 → 队尾</span></h4><div>${queueView(snapshot.queues[cpu])}</div></div>` : '<p class="mp-global-link">↑ 从全局队列领取下一任务</p>'}${scene === 'affinity' ? `<div class="mp-cache"><h4>运行关联 / 缓存示意</h4><p>${snapshot.cache[cpu].length ? `${chip('A')} 曾在此核执行，可能复用缓存数据` : 'A 在此核尚无运行关联，可能需要预热'}</p></div>` : ''}</section>`;
    }).join('');
    root.querySelector('#mp-completed').textContent = `${snapshot.tasks.filter(task => !task.remaining).length} / ${snapshot.tasks.length}`;
    root.querySelector('#mp-migrations').textContent = snapshot.migrations;
    root.querySelector('#mp-busy').textContent = `${snapshot.busy[0]} / ${snapshot.busy[1]}`;
    root.querySelector('#mp-reference-label').textContent = scene === 'queues' ? '不迁移 / 当前完成时刻' : scene === 'shared' ? '本例完成时刻' : '派发目标';
    root.querySelector('#mp-reference').textContent = scene === 'queues' ? complete ? `16 / ${run.duration}` : '尚未完成' : scene === 'shared' ? complete ? run.duration : '尚未完成' : `CPU ${target}`;
    root.querySelector('#mp-event-label').textContent = scene === 'affinity' ? `阶段 ${position + 1} / ${run.duration + 1}` : `单位边界 t = ${snapshot.time}`;
    root.querySelector('#mp-event-title').textContent = scene === 'affinity' ? ['原核已有运行关联', target === 0 ? '继续在 CPU 0' : '迁移到 CPU 1', '在所选核继续执行', 'A 的两个 CPU 工作单位已完成'][position] : complete ? '所有任务完成' : snapshot.cpus.includes(null) && snapshot.tasks.some(task => task.remaining) ? '有 CPU 空闲，仍有任务未完成' : snapshot.migrations && scene === 'queues' ? '迁移排队任务，继续并行推进' : '两个 CPU 同时推进不同任务';
    root.querySelector('#mp-event-text').textContent = snapshot.events.join(' ');
    root.querySelector('#mp-ledger-body').innerHTML = snapshot.tasks.map(task => {
      const cpu = snapshot.cpus.indexOf(task.id);
      const queued = snapshot.queues.findIndex(queue => queue.includes(task.id));
      const owner = !task.remaining ? '已完成' : cpu >= 0 ? `CPU ${cpu} 执行` : scene === 'shared' ? '全局队列等待' : `CPU ${queued} 队列等待`;
      return `<tr><th scope="row">${chip(task.id)}</th><td>${task.burst}</td><td>${task.remaining}</td><td>${owner}</td></tr>`;
    }).join('');
    if (scene !== 'affinity') {
      const horizon = scene === 'queues' ? 16 : run.duration;
      root.querySelector('#mp-timeline').style.setProperty('--mp-ticks', horizon);
      root.querySelector('#mp-timeline').innerHTML = `<div class="mp-axis"><span>t →</span>${Array.from({length: horizon}, (_, time) => `<span>${time}</span>`).join('')}</div>${[0, 1].map(cpu => `<div class="mp-track"><strong>CPU ${cpu}</strong>${Array.from({length: horizon}, (_, time) => {
        const id = time < position ? run.timeline[time]?.cpus[cpu] : null;
        const past = time < position;
        return `<span class="mp-tick ${id ? `mp-task-${id}` : past ? 'mp-idle-tick' : ''}${time === position ? ' mp-current-tick' : ''}" title="[${time}, ${time + 1})：${past ? id || '空闲' : '后续时段'}">${past ? id || '·' : ''}</span>`;
      }).join('')}</div>`).join('')}`;
      const scroll = root.querySelector('.mp-timeline-scroll');
      const tickWidth = (root.querySelector('#mp-timeline').scrollWidth - 64) / horizon;
      const cursor = 64 + position * tickWidth;
      if (cursor > scroll.scrollLeft + scroll.clientWidth - 28) scroll.scrollLeft = Math.max(0, cursor - scroll.clientWidth / 2);
      if (position === 0) scroll.scrollLeft = 0;
    }
    slider.value = position;
    slider.setAttribute('aria-valuetext', scene === 'affinity' ? `阶段 ${position + 1}` : `时间 ${snapshot.time}`);
    playButton.disabled = complete;
    stepButton.disabled = complete;
    root.querySelector('#mp-board').getAnimations({subtree: true}).forEach(animation => animation.cancel());
    if (!motionPreference.matches) root.querySelectorAll('.mp-running .mp-task').forEach(token => token.animate([{opacity: .45}, {opacity: 1}], {duration: 180}));
  };
  const pause = () => { clearInterval(timer); timer = null; playButton.setAttribute('aria-pressed', 'false'); playButton.setAttribute('aria-label', '播放'); playButton.title = '播放'; playButton.firstElementChild.textContent = '▶'; };
  const advance = () => { position = Math.min(position + 1, run.duration); if (position === run.duration) pause(); paint(); };
  const play = () => { if (position === run.duration) return; playButton.setAttribute('aria-pressed', 'true'); playButton.setAttribute('aria-label', '暂停'); playButton.title = '暂停'; playButton.firstElementChild.textContent = 'Ⅱ'; timer = setInterval(advance, Number(root.querySelector('#mp-speed').value)); };
  const rebuild = () => { pause(); position = 0; run = buildRun(scene, balance, target); prepare(); paint(); };
  playButton.addEventListener('click', () => timer === null ? play() : pause());
  stepButton.addEventListener('click', () => { pause(); advance(); });
  root.querySelector('#mp-reset').addEventListener('click', () => { pause(); position = 0; paint(); });
  root.querySelector('#mp-scene').addEventListener('change', event => { scene = event.target.value; rebuild(); });
  root.querySelector('#mp-balance').addEventListener('change', event => { balance = event.target.checked; rebuild(); });
  root.querySelector('#mp-target').addEventListener('change', event => { target = Number(event.target.value); rebuild(); });
  root.querySelector('#mp-speed').addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
  slider.addEventListener('input', event => { pause(); position = Number(event.target.value); paint(); });
  motionPreference.addEventListener('change', event => { if (event.matches) root.querySelector('#mp-board').getAnimations({subtree: true}).forEach(animation => animation.cancel()); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  prepare();
  paint();
}

renderMultiprocessorPage(document.getElementById('root'));