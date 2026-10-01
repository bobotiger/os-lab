function renderMlfqPage(root) {
  const {levels, scenarios, buildRun} = OSLabMlfq;
  root.innerHTML = `<div class="page rr-page mlfq-page" id="top">
    ${wikiHeader('mlfq', [{href: '#demo', title: '反馈队列'}, {href: '#rules', title: '调度规则'}, {href: '#knowledge-related-title', title: '相关知识'}])}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">CPU 虚拟化 / 调度</p>
        <h1 id="page-title">多级反馈队列 <span>MLFQ</span></h1>
        <p class="lead">不预知任务长短，让使用行为改变优先级。</p>
        <p class="definition">MLFQ（Multi-Level Feedback Queue）先给新进程较高优先级，再根据累计 CPU 使用量调整所在队列。优先选择最高的非空队列；同层采用<a class="inline-link" href="round-robin.html">时间片轮转</a>。与<a class="inline-link" href="srtf.html">SRTF</a>不同，调度选择不比较任务总长或剩余长度。</p>
        <p class="model-note">教学变体：单核、零切换开销、三个固定队列；Q0 最高，Q2 最低。片长为 1 / 2 / 4，本层配额为 2 / 4 / 8 个示意时间单位。I/O 固定延迟且可并行，无设备争用；不同操作系统的反馈规则和参数并不相同。</p>
      </section>
      <section class="mlfq-demo" id="demo" aria-labelledby="demo-title">
        <div class="section-heading"><div><p class="section-index">01 / FEEDBACK QUEUES</p><h2 id="demo-title">先看层级，再看队首</h2></div><p class="rr-clock">当前时刻 <strong id="mlfq-time">0</strong> / <span id="mlfq-total"></span></p></div>
        <div class="rr-toolbar mlfq-toolbar">
          <div class="rr-transport" role="group" aria-label="播放控制">
            <button type="button" class="icon-button primary" id="mlfq-play" title="播放" aria-label="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button>
            <button type="button" class="icon-button" id="mlfq-step" title="前进一个时间单位" aria-label="前进一个时间单位"><span aria-hidden="true">↦</span></button>
            <button type="button" class="icon-button" id="mlfq-reset" title="重新开始" aria-label="重新开始"><span aria-hidden="true">↺</span></button>
          </div>
          <label class="mlfq-scene">行为场景<select id="mlfq-scenario">${Object.entries(scenarios).map(([id, scene]) => `<option value="${id}">${scene.title}</option>`).join('')}</select></label>
          <label class="mlfq-boost"><input type="checkbox" id="mlfq-boost">每 12 单位整体提升</label>
          <label class="speed-control" for="mlfq-speed">播放速度<select id="mlfq-speed"><option value="1400">慢速</option><option value="900" selected>正常</option><option value="450">快速</option></select></label>
        </div>
        <p class="mlfq-scene-note" id="mlfq-scene-note"></p>
        <div class="mlfq-stage" role="group" aria-label="三级就绪队列与 CPU">
          <div class="mlfq-queues"><p class="mlfq-column-label">就绪队列 <span>高 → 低 · 队首 → 队尾</span></p>${levels.map((level, index) => `<section class="mlfq-level level-${index}" id="mlfq-level-${index}" aria-label="${level.name} 就绪队列"><div class="mlfq-level-heading"><h3>${level.name}<span>${['高', '中', '低'][index]}优先级</span></h3><p>片长 ${level.quantum} <span>/</span> 配额 ${level.allotment}</p></div><div class="mlfq-queue" id="mlfq-queue-${index}"></div></section>`).join('')}</div>
          <div class="mlfq-cpu"><h3 class="mlfq-column-label">CPU <span id="mlfq-cpu-level"></span></h3><div id="mlfq-running"></div>
            <div class="mlfq-meter"><p>本次时间片 <strong id="mlfq-slice-text"></strong></p><progress id="mlfq-slice" max="1" value="0" aria-label="本次时间片使用量"></progress></div>
            <div class="mlfq-meter"><p>本层累计配额 <strong id="mlfq-budget-text"></strong></p><progress id="mlfq-budget" max="2" value="0" aria-label="本层累计 CPU 使用量"></progress></div>
            <p class="mlfq-next-rule" id="mlfq-next-rule"></p>
            <div class="mlfq-availability"><h3>尚不可运行</h3><div id="mlfq-unavailable"></div></div>
          </div>
        </div>
        <div class="mlfq-timeline-heading"><h3>CPU 执行时间轴</h3><p><span class="level-key level-0">Q0</span><span class="level-key level-1">Q1</span><span class="level-key level-2">Q2</span><span>单位：示意时间</span></p></div>
        <div class="mlfq-chart-scroll" tabindex="0" role="region" aria-label="CPU 时间轴"><div class="mlfq-chart"><div class="rr-timeline" id="mlfq-timeline" role="img" aria-label="尚未执行"></div><div class="mlfq-ticks" id="mlfq-ticks"></div></div></div>
        <input id="mlfq-position" type="range" min="0" max="24" step="1" value="0" aria-label="演示时刻">
        <label class="mlfq-checkpoint">关键事件<select id="mlfq-checkpoint"></select></label>
        <div class="mlfq-event" aria-live="polite"><p class="detail-kicker" id="mlfq-event-time"></p><h3 id="mlfq-event-title"></h3><ul id="mlfq-event-details"></ul></div>
        <div class="rr-summary"><span>下一次提升 <strong id="mlfq-next-boost"></strong></span><span>A 累计就绪等待 <strong id="mlfq-wait"></strong></span><span>已完成 <strong id="mlfq-completed"></strong></span></div>
        <div class="mlfq-ledger-scroll" tabindex="0" role="region" aria-label="进程状态表"><table class="mlfq-ledger"><caption>本层用量只累计 CPU 时间；I/O 等待不计入就绪等待。完成者不再参与调度。</caption><thead><tr><th scope="col">进程</th><th scope="col">状态</th><th scope="col">层级</th><th scope="col">本层用量</th><th scope="col">已用 CPU</th><th scope="col">就绪等待</th></tr></thead><tbody id="mlfq-ledger"></tbody></table></div>
        <div class="mlfq-comparison" id="mlfq-comparison" hidden><h3>提升带来新的服务机会</h3><p>高层新任务从 t=4 陆续到达后，A 再次获得 CPU 的时刻：</p><dl><div><dt>不提升</dt><dd id="mlfq-without-boost"></dd></div><div><dt>每 12 单位提升</dt><dd id="mlfq-with-boost"></dd></div></dl><p>两次完整运行的 CPU 需求相同。新任务数量有限，关闭提升时 A 也最终完成；提前再次运行，不等于一定更早完成。</p></div>
      </section>
      <section class="rr-rules" id="rules" aria-labelledby="rules-title">
        <div class="section-heading"><div><p class="section-index">02 / THE RULE</p><h2 id="rules-title">片长负责轮换，配额负责降级</h2></div></div>
        <dl class="concepts rr-concepts">
          <div><dt>先比较层级，同层再轮转</dt><dd>新进程进入 Q0。只要更高层有就绪进程，就抢占低层运行者；本变体把被抢占者放回原层队首，保留片长使用量和累计配额。</dd></div>
          <div><dt>时间片结束，不必立即降级</dt><dd>Q0 片长为 1、累计配额为 2。第一次用完时间片，回 Q0 队尾；累计用满 2，才进入 Q1 并清零计数。Q2 不再下降，配额耗尽后仍在 Q2 轮转。</dd></div>
          <div><dt>让出 CPU，不清空本层历史</dt><dd>I/O 阻塞会结束本次时间片，但保留本层累计用量；I/O 完成后回原层队尾。若恰好用满配额，本模型先降级再阻塞，不能通过频繁 I/O 一直重置配额。</dd></div>
        </dl>
        <div class="rr-tradeoff"><h3>为什么还需要整体提升？</h3><p>高层任务持续到来时，低层长任务可能长期没有机会。开启提升后，每 12 个单位把已到达且未完成的进程恢复到 Q0，并清零两种计数；阻塞者仍须等 I/O 完成。当前运行者继续运行，就绪者按原 Q0、Q1、Q2 的队列顺序合并。提升让旧任务重新获得高优先级，也让调度器重新观察行为，但不是对所有工作负载的等待时间保证。</p></div>
        <div class="rr-tradeoff"><h3>MLFQ 没有神奇地知道谁是短任务</h3><p>示例的 CPU 段长度用于决定何时完成或阻塞，不参与队列选择。较少使用 CPU 的任务倾向于较长时间留在高层；持续消耗 CPU 的任务逐步降到低层，用更长的时间片运行。MLFQ 是一组可配置的策略，不是唯一固定的算法；这里把配额累计、I/O 返回和提升顺序明确为一种教学实现。</p><p class="mlfq-boundary-note">同一时刻：先处理上一单位的完成、配额或时间片结束，再接收到达与 I/O 完成，随后处理整体提升，最后进行高层抢占与派发。最终完成优先于配额耗尽。</p></div>
      </section>
      ${wikiRelated('mlfq')}
    </main><footer class="site-footer"><span>OSLab / CPU 虚拟化</span><a href="#top">回到页首 ↑</a></footer>
  </div>`;
  let sceneId = 'feedback';
  let run = buildRun(sceneId);
  let time = 0;
  let timer = null;
  const playButton = root.querySelector('#mlfq-play');
  const stepButton = root.querySelector('#mlfq-step');
  const position = root.querySelector('#mlfq-position');
  const boostControl = root.querySelector('#mlfq-boost');
  const checkpoint = root.querySelector('#mlfq-checkpoint');
  const statusNames = {new: '未到达', ready: '就绪', running: '运行', blocked: '阻塞', done: '完成'};
  const token = process => `<div class="mlfq-token level-${process.level}" data-process="${process.id}"><strong>${process.id}</strong><span>本层 ${process.levelUsed} / ${levels[process.level].allotment}</span></div>`;
  const eventTitle = event => ({
    arrive: `${event.id} 到达 Q0`, wake: `${event.id} I/O 完成`, boost: '未完成进程整体提升到 Q0',
    preempt: `${event.id} 被高层任务抢占`, dispatch: `Q${event.level} 派发 ${event.id}`,
    finish: `${event.id} 完成`, block: `${event.id} 等待 I/O`,
    demote: `${event.id} 从 Q${event.from} 降到 Q${event.level}`, renew: `${event.id} 在 Q2 重新轮转`,
    rotate: `${event.id} 时间片耗尽，留在 Q${event.level}`,
  })[event.type];
  const describeEvent = event => {
    const level = levels[event.level];
    switch (event.type) {
      case 'arrive': return `${event.id} 进入最高层 Q0 的队尾；不按总长或剩余时长排序。`;
      case 'wake': return `${event.id} I/O 完成，回到 Q${event.level} 队尾；本层已用 ${event.used} / ${level.allotment}，开始新的时间片。`;
      case 'boost': return `${event.ids.join('、')} 恢复 Q0，时间片和本层配额清零；阻塞状态不变，已完成者不再进入队列。`;
      case 'preempt': return `更高层有就绪任务，${event.id} 返回 Q${event.level} 队首；时间片 ${event.slice} / ${level.quantum}、本层配额 ${event.used} / ${level.allotment} 均保留。`;
      case 'dispatch': return `选最高非空队列 Q${event.level} 的队首 ${event.id}；本层片长 ${level.quantum}，累计配额 ${level.allotment}。`;
      case 'finish': return `${event.id} 的最后一个 CPU 段完成，退出调度；即使配额同时用满，也不再降级或排队。`;
      case 'block': return `${event.id} 阻塞至 t=${event.wakeAt}，本次时间片结束；保留 Q${event.level} 及本层用量 ${event.used} / ${level.allotment}，不是就绪等待。`;
      case 'demote': return `${event.id} 用满 Q${event.from} 的 ${levels[event.from].allotment} 个 CPU 配额，降到 Q${event.level}；新层的两种计数归零。`;
      case 'renew': return `${event.id} 用满最低层 Q2 的配额，不再降级；重置计数，回 Q2 队尾。`;
      case 'rotate': return `${event.id} 用完时间片，回 Q${event.level} 队尾；本层累计 ${event.used} / ${level.allotment}，未满配额，不降级。`;
    }
  };
  const prepareRun = () => {
    root.querySelector('#mlfq-total').textContent = run.duration;
    root.querySelector('#mlfq-scene-note').textContent = scenarios[sceneId].description;
    position.max = run.duration;
    root.querySelector('#mlfq-ticks').innerHTML = Array.from({length: Math.floor(run.duration / 4) + 1}, (_, index) => index * 4).filter(tick => tick < run.duration).concat(run.duration).map(tick => `<span style="left:${tick / run.duration * 100}%">${tick}</span>`).join('');
    checkpoint.innerHTML = run.snapshots.filter(frame => frame.events.some(event => event.type !== 'dispatch')).map(frame => `<option value="${frame.time}">t=${frame.time} · ${frame.events.filter(event => event.type !== 'dispatch').map(eventTitle).join('；')}</option>`).join('');
    root.querySelector('#mlfq-comparison').hidden = sceneId !== 'boost';
    if (sceneId === 'boost') {
      for (const enabled of [false, true]) {
        const nextA = buildRun(sceneId, enabled).timeline.find(segment => segment.id === 'A' && segment.start >= 4).start;
        root.querySelector(enabled ? '#mlfq-with-boost' : '#mlfq-without-boost').textContent = `t = ${nextA}`;
      }
    }
  };
  const paint = () => {
    const previousPositions = new Map(Array.from(root.querySelectorAll('.mlfq-token'), node => [node.dataset.process, {lane: node.parentElement.id, rect: node.getBoundingClientRect()}]));
    const frame = run.snapshots[time];
    const active = frame.processes.find(process => process.id === frame.running);
    root.querySelector('#mlfq-time').textContent = time;
    frame.queues.forEach((queue, index) => {
      root.querySelector(`#mlfq-queue-${index}`).innerHTML = queue.length ? queue.map(id => token(frame.processes.find(process => process.id === id))).join('') : '<p class="lane-empty">队列为空</p>';
      root.querySelector(`#mlfq-level-${index}`).classList.toggle('selected', active?.level === index);
    });
    root.querySelector('#mlfq-running').innerHTML = active ? token(active) : `<p class="lane-empty">${time === run.duration ? '全部完成，CPU 空闲' : 'CPU 空闲，等待可运行进程'}</p>`;
    root.querySelector('#mlfq-cpu-level').textContent = active ? `来自 Q${active.level}` : '空闲';
    for (const [id, used, max] of [['slice', active?.sliceUsed, active ? levels[active.level].quantum : 1], ['budget', active?.levelUsed, active ? levels[active.level].allotment : 1]]) {
      root.querySelector(`#mlfq-${id}`).max = max;
      root.querySelector(`#mlfq-${id}`).value = used ?? 0;
      root.querySelector(`#mlfq-${id}-text`).textContent = active ? `${used} / ${max}` : '—';
    }
    root.querySelector('#mlfq-next-rule').textContent = active ? `用满片长 → Q${active.level} 队尾；用满累计配额 → ${active.level < 2 ? `降到 Q${active.level + 1}` : '在 Q2 重新轮转'}。` : '没有可派发的运行者。';
    const unavailable = frame.processes.filter(process => ['new', 'blocked'].includes(process.status));
    root.querySelector('#mlfq-unavailable').innerHTML = unavailable.length ? unavailable.map(process => `<p>${process.id} · ${process.status === 'new' ? `t=${process.arrival} 到达` : `I/O 至 t=${process.wakeAt}，返回 Q${process.level}`}</p>`).join('') : '<p>无未到达或阻塞进程</p>';
    const segments = run.timeline.filter(segment => segment.start < time).map(segment => ({...segment, end: Math.min(segment.end, time)}));
    root.querySelector('#mlfq-timeline').innerHTML = segments.map(segment => `<div class="timeline-segment level-${segment.level ?? 'idle'}" style="left:${segment.start / run.duration * 100}%;width:${(segment.end - segment.start) / run.duration * 100}%" title="${segment.id ?? '空闲'} · ${segment.id ? `Q${segment.level}` : 'CPU'} · ${segment.start}–${segment.end}"><span>${segment.id ?? '·'}</span></div>`).join('') + `<span class="timeline-cursor" style="left:${time / run.duration * 100}%"></span>`;
    root.querySelector('#mlfq-timeline').setAttribute('aria-label', segments.length ? segments.map(segment => `${segment.id ?? '空闲'}${segment.id ? ` 在 Q${segment.level}` : ''} 从 ${segment.start} 到 ${segment.end}`).join('；') : '尚未执行');
    const chartScroll = root.querySelector('.mlfq-chart-scroll');
    const cursorOffset = time / run.duration * root.querySelector('.mlfq-chart').clientWidth;
    if (cursorOffset < chartScroll.scrollLeft || cursorOffset > chartScroll.scrollLeft + chartScroll.clientWidth) {
      chartScroll.scrollLeft = Math.max(0, cursorOffset - chartScroll.clientWidth / 2);
    }
    position.value = time;
    position.setAttribute('aria-valuetext', `时刻 ${time}，${active ? `${active.id} 在 Q${active.level} 运行` : time === run.duration ? '全部完成' : 'CPU 空闲'}`);
    checkpoint.value = [...checkpoint.options].findLast(option => Number(option.value) <= time).value;
    const priority = ['boost', 'preempt', 'demote', 'renew', 'block', 'wake', 'rotate', 'finish', 'dispatch', 'arrive'];
    const important = [...frame.events].sort((left, right) => priority.indexOf(left.type) - priority.indexOf(right.type))[0];
    root.querySelector('#mlfq-event-time').textContent = `t = ${time} / 调度原因`;
    root.querySelector('#mlfq-event-title').textContent = time === run.duration ? '所有进程完成，CPU 需求没有因降级增加' : important ? eventTitle(important) : active ? `${active.id} 在 Q${active.level} 继续运行` : '等待 I/O 完成或新进程到达';
    root.querySelector('#mlfq-event-details').innerHTML = frame.events.length ? frame.events.map(event => `<li>${describeEvent(event)}</li>`).join('') : `<li>${active ? `高层没有就绪候选；${active.id} 本次时间片已用 ${active.sliceUsed} / ${levels[active.level].quantum}，本层配额已用 ${active.levelUsed} / ${levels[active.level].allotment}。` : '阻塞者不能被派发，CPU 不为阻塞者计入执行时间。'}</li>`;
    root.querySelector('#mlfq-next-boost').textContent = run.boostEnabled && time < run.duration ? `t=${(Math.floor(time / 12) + 1) * 12}` : run.boostEnabled ? '—' : '关闭';
    root.querySelector('#mlfq-wait').textContent = frame.processes.find(process => process.id === 'A').waiting;
    root.querySelector('#mlfq-completed').textContent = `${frame.processes.filter(process => process.status === 'done').length} / ${frame.processes.length}`;
    root.querySelector('#mlfq-ledger').innerHTML = frame.processes.map(process => `<tr${process.id === frame.running ? ' class="active"' : ''}><th scope="row">${process.id}</th><td>${statusNames[process.status]}</td><td>${['new', 'done'].includes(process.status) ? '—' : `Q${process.level}`}</td><td>${['new', 'done'].includes(process.status) ? '—' : `${process.levelUsed} / ${levels[process.level].allotment}`}</td><td>${process.executed}</td><td>${process.waiting}</td></tr>`).join('');
    playButton.disabled = time === run.duration;
    stepButton.disabled = time === run.duration;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.querySelectorAll('.mlfq-token').forEach(node => {
        const previous = previousPositions.get(node.dataset.process);
        if (!previous || previous.lane === node.parentElement.id) return;
        const current = node.getBoundingClientRect();
        node.animate([{transform: `translate(${previous.rect.left - current.left}px, ${previous.rect.top - current.top}px)`, opacity: .65}, {transform: 'translate(0, 0)', opacity: 1}], {duration: 320, easing: 'cubic-bezier(.2,.7,.3,1)'});
      });
    }
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
    time = Math.min(time + 1, run.duration);
    if (time === run.duration) pause();
    paint();
  };
  const play = () => {
    if (time === run.duration) return;
    playButton.setAttribute('aria-pressed', 'true');
    playButton.setAttribute('aria-label', '暂停');
    playButton.title = '暂停';
    playButton.firstElementChild.textContent = 'Ⅱ';
    timer = setInterval(advance, Number(root.querySelector('#mlfq-speed').value));
  };
  const rebuild = () => {
    pause();
    run = buildRun(sceneId, boostControl.checked);
    time = 0;
    prepareRun();
    paint();
  };
  playButton.addEventListener('click', () => timer === null ? play() : pause());
  stepButton.addEventListener('click', () => { pause(); advance(); });
  root.querySelector('#mlfq-reset').addEventListener('click', () => { pause(); time = 0; paint(); });
  root.querySelector('#mlfq-scenario').addEventListener('change', event => {
    sceneId = event.target.value;
    boostControl.checked = scenarios[sceneId].boost;
    rebuild();
  });
  boostControl.addEventListener('change', rebuild);
  position.addEventListener('input', event => { pause(); time = Number(event.target.value); paint(); });
  checkpoint.addEventListener('change', event => { pause(); time = Number(event.target.value); paint(); });
  root.querySelector('#mlfq-speed').addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  prepareRun();
  paint();
}

renderMlfqPage(document.getElementById('root'));