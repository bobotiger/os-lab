const RR_PROCESSES = [{id: 'A', arrival: 0, burst: 5}, {id: 'B', arrival: 0, burst: 3}];
const RR_TOTAL = RR_PROCESSES.reduce((total, process) => total + process.burst, 0);

function makeSchedulingRun(quantum, kind, processes = RR_PROCESSES) {
  let run = OSLabSimulation.createRun({
    formatVersion: 1, rulesVersion: '1', name: `${kind} 调度示例`,
    machine: {cpus: 1, io: false, contextSwitchCost: 0},
    strategy: kind === 'RR' ? {kind, quantum} : {kind}, processes,
  });
  do {
    run = OSLabSimulation.advance(run);
  } while (!run.state.idle);
  return run;
}

function roundRobinFrame(run, time) {
  const boundary = run.events.findLast(event => event.time <= time).after;
  const elapsed = time - boundary.time;
  return {
    ...boundary,
    time,
    sliceUsed: boundary.sliceUsed + elapsed,
    processes: boundary.processes.map(process => ({
      ...process,
      remaining: process.remaining - (process.id === boundary.running ? elapsed : 0),
    })),
  };
}

function schedulingWait(run, process) {
  return run.timeline.findLast(segment => segment.id === process.id).end - process.arrival - process.burst;
}

function schedulingExplanation(run, frame, quantum) {
  if (run.config.strategy.kind === 'SRTF') {
    const arrival = run.config.processes.find(process => process.id === 'B').arrival;
    if (frame.time === RR_TOTAL) return {title: '两个进程完成，抢占没有增加 CPU 需求', text: `${run.config.processes.map(process => `${process.id} 累计就绪等待 ${schedulingWait(run, process)}`).join('，')}。等待也包含被抢占后重新排队的时间；被抢占不是阻塞，也不会丢失已执行的进度。`};
    if (frame.time === 0) return {title: arrival === 0 ? 'B 的剩余时间更短，先运行 B' : 'B 尚未到达，A 先运行', text: arrival === 0 ? 'A、B 同时就绪，剩余 CPU 时间分别为 5 和 3，因此选择 B。CPU 空闲时的并列候选按就绪入队顺序选择。' : `A 在 t=0 到达，B 在 t=${arrival} 到达。只考虑已就绪的进程，不为未来的短任务空等。`};
    if (arrival > 0 && frame.time === arrival) return arrival === 1
      ? {title: 'B 剩余 3 < A 剩余 4，发生抢占', text: 'B 到达后获得 CPU，A 从运行回到就绪。A 已执行的 1 个单位保留，剩余 4；没有时间片耗尽，也没有发生 I/O 阻塞。'}
      : {title: 'A、B 都剩余 3，A 继续运行', text: 'B 在 t=2 到达，此刻 A 还剩 3。候选没有严格短于运行者，本模型保留 A，不为相等的剩余时间额外切换。'};
    const completed = run.events.find(event => event.time === frame.time && event.type === '完成');
    if (completed) {
      const resumed = run.timeline.some(segment => segment.id === frame.running && segment.start < frame.time);
      const remaining = frame.processes.find(process => process.id === frame.running).remaining;
      return {title: `${completed.process} 完成，${frame.running} ${resumed ? '恢复运行' : '获得 CPU'}`, text: `${frame.running} 还剩 ${remaining} 个 CPU 时间单位。${resumed ? '先前执行的进度已经保留，继续未完成的部分，而不是从头开始。' : '现在它是唯一的就绪任务，不需要等待时间片。'}`};
    }
    const active = frame.processes.find(process => process.id === frame.running);
    const candidates = frame.queue.map(id => frame.processes.find(process => process.id === id));
    return {title: `${frame.running} 保持运行，剩余 ${active.remaining}`, text: candidates.length ? `就绪候选：${candidates.map(process => `${process.id} 剩余 ${process.remaining}`).join('，')}。没有候选严格短于当前运行者，因此不抢占；比较的是当前剩余时间，不是原始任务总长。` : '就绪队列为空，没有其他进程可抢占 CPU。SRTF 不依赖时间片轮换。'};
  }
  if (run.config.strategy.kind === 'SJF') {
    const laterArrival = run.config.processes.find(process => process.id === 'B').arrival === 1;
    if (frame.time === RR_TOTAL) return {title: laterArrival ? 'A 先运行，晚到的 B 等待到 t=5' : '短任务 B 先完成，A 随后完成', text: laterArrival ? 'B 在 t=1 到达，但不能抢占 A；等待 4 个时间单位后运行。A 的等待为 0，平均等待为 2。SJF 不会为尚未到达的短任务预留 CPU。' : 'B 在 [0,3) 运行，A 在 [3,8) 运行。B 的等待为 0，A 的等待为 3，平均等待为 1.5；改变顺序没有改变总 CPU 需求 8。'};
    if (frame.time === 0) return {title: laterArrival ? '只有 A 已就绪，先运行 A' : 'B 的 CPU 段更短，因此先运行 B', text: laterArrival ? 'A 在 t=0 到达，B 要到 t=1 才到达。SJF 只比较此刻已经就绪的进程，不会等待将来的短任务。' : 'A、B 同时到达，按 A、B 顺序入队；下一段 CPU 时长分别为 5 和 3。SJF 选择更短的 B，而不是直接取队首 A。'};
    if (laterArrival && frame.time === 1) return {title: '更短的 B 到达，A 不被抢占', text: 'B 的 CPU 段为 3，此刻 A 还剩 4。尽管 B 更短，非抢占 SJF 仍让 A 继续运行；抢占式的最短剩余时间优先是另一种策略。'};
    const completed = run.events.find(event => event.time === frame.time && event.type === '完成');
    if (completed) return {title: `${completed.process} 完成，${frame.running} 获得 CPU`, text: `只有在 CPU 可以重新分配时才选择下一位。现在就绪队列中仅剩 ${frame.running}，它将连续运行到完成。`};
    return {title: `${frame.running} 继续运行，不设时间片`, text: `${frame.running} 已获得 CPU，不会因为另一个进程更短而中途让出。${frame.queue.length ? `${frame.queue.join('、')} 保持就绪并等待，不是阻塞。` : '就绪队列为空。'}`};
  }
  if (run.config.strategy.kind === 'FCFS') {
    if (frame.time === RR_TOTAL) return {title: '先 A，后 B，两个进程都已完成', text: 'A 连续执行 5 个时间单位，B 随后执行 3 个。总耗时为 8，进程间只切换一次；切换少，并不意味着后来的任务等待得少。'};
    if (frame.time === 0) return {title: 'A 先入队，先获得 CPU', text: '两个进程同时到达，约定按 A、B 顺序入队。FCFS 取队首 A，不会因为 B 的任务更短而让 B 先运行。'};
    const completed = run.events.find(event => event.time === frame.time && event.type === '完成');
    if (completed) return {title: `${completed.process} 完成，${frame.running} 才获得 CPU`, text: 'A 没有被时间片打断，已经连续运行了 5 个时间单位。现在 A 退出，调度器取出队首 B；B 的等待终于结束。'};
    if (frame.running === 'A') return {title: 'A 继续运行，B 仍在等待', text: `A 已执行 ${frame.time}/5。FCFS 没有时间片，B 即使更短，也不能抢占正在运行的 A。B 当前已等待 ${frame.time} 个时间单位。`};
    return {title: 'B 继续运行，就绪队列已空', text: `B 已执行 ${frame.time - 5}/3。A 已完成；B 也将连续执行到任务结束，不需要轮流交出 CPU。`};
  }
  if (frame.time === RR_TOTAL) return {title: '两个进程都已完成', text: 'A 执行了 5 个时间单位，B 执行了 3 个。CPU 总需求仍是 8；改变时间片不会改变这个总量。'};
  if (frame.time === 0) return {title: 'A 先获得 CPU，B 在队列中等待', text: `两个进程同时就绪，按 A、B 顺序入队。调度器取队首 A，本轮最多执行 ${quantum} 个时间单位。`};
  const events = run.events.filter(event => event.time === frame.time);
  const completed = events.find(event => event.type === '完成');
  if (completed) return {title: `${completed.process} 完成，${frame.running} 获得 CPU`, text: `${completed.process} 已没有剩余任务，不再回到队列。${frame.running} 开始新的一轮；任务完成优先于时间片耗尽。`};
  const expired = events.find(event => event.type === '片满');
  if (expired) {
    if (expired.process === frame.running) return {title: `时间片耗尽，${frame.running} 仍继续运行`, text: '此时没有其他就绪进程。它回到队列后再次被选中，开启新时间片，但没有发生进程间切换。'};
    return {title: `${expired.process} 回到队尾，${frame.running} 获得 CPU`, text: `时间片已用完，但 ${expired.process} 的任务还没有完成，因此回到就绪队列末尾。调度器取出队首 ${frame.running}。`};
  }
  return {title: `${frame.running} 继续运行`, text: `本轮已用 ${frame.sliceUsed}/${quantum}，尚未触发时间片耗尽或任务完成。${frame.queue.length ? `${frame.queue.join('、')} 正在等待 CPU。` : '就绪队列为空。'}`};
}

function renderSchedulingPage(root, pageId) {
  const page = WIKI_PAGES[pageId];
  const isRoundRobin = pageId === 'roundRobin';
  const isShortestJob = pageId === 'sjf';
  const isShortestRemaining = pageId === 'srtf';
  const hasArrivalScenarios = isShortestJob || isShortestRemaining;
  const strategyKind = isRoundRobin ? 'RR' : isShortestJob ? 'SJF' : isShortestRemaining ? 'SRTF' : 'FCFS';
  root.innerHTML = `<div class="page rr-page" id="top">
    ${wikiHeader(pageId, [{href: '#demo', title: isRoundRobin ? '轮转演示' : isShortestRemaining ? '抢占演示' : isShortestJob ? '最短任务选择' : '排队演示'}, {href: '#rules', title: isRoundRobin ? '轮转规则' : '调度规则'}, {href: '#knowledge-related-title', title: '相关知识'}])}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">${page.theme} / 调度</p>
        <h1 id="page-title">${page.title} <span>${page.english}</span></h1>
        <p class="lead">${isRoundRobin ? '每次用一小段 CPU，没做完，就回到队尾。' : isShortestRemaining ? '还有更短的剩余任务，就先把 CPU 交给它。' : isShortestJob ? '就绪者中，短任务先运行；运行中，不抢占。' : '先来的先运行，后来的等它让出 CPU。'}</p>
        <p class="definition">${isRoundRobin ? `调度器按就绪队列顺序分配 CPU。时间片限制的是一次连续运行的时长，不是一个<a class="inline-link" href="${WIKI_PAGES.process.href}">进程</a>完成全部任务的时间。` : isShortestRemaining ? `SRTF（Shortest Remaining Time First）是抢占式的<a class="inline-link" href="${WIKI_PAGES.sjf.href}">SJF</a>。比较运行者与就绪候选当前 CPU 段的剩余时间，候选严格更短时抢占；原运行者回到就绪，保留已执行进度。` : isShortestJob ? `SJF（Shortest Job First）在 CPU 可以分配时，从已就绪的<a class="inline-link" href="${WIKI_PAGES.process.href}">进程</a>中选择下一段 CPU 时长最短的一个。获得 CPU 后不主动抢占，完成或阻塞时才重新选择。` : `FCFS（First Come, First Served）按就绪入队顺序选择<a class="inline-link" href="${WIKI_PAGES.process.href}">进程</a>，不主动抢占。当前进程执行完成或阻塞后，CPU 才交给下一个。`}</p>
        <p class="model-note">${isShortestRemaining ? '教学模型：单核、无 I/O、零切换开销；预先确切知道 CPU 段时长，A 为 5、B 为 3。A 在 t=0 到达，B 按场景到达。剩余时间相等时保留运行者；CPU 无运行者时，并列候选按入队顺序选择。这些是本模型的确定性规则，真实系统通常需估计时长。' : isShortestJob ? '教学模型：单核、无 I/O、忽略切换开销；预先确切知道下一段 CPU 时长，A 为 5、B 为 3。A 在 t=0 到达，B 的到达时刻由场景决定；同时到达时按 A、B 入队，时长并列时按入队顺序。真实系统通常需要估计 CPU 段时长。' : '教学模型：单核、两个进程同时到达、无 I/O、忽略切换开销。A 需要 5 个时间单位，B 需要 3 个；初始入队顺序为 A、B。'}</p>
      </section>
      <section class="rr-demo" id="demo" aria-labelledby="demo-title">
        <div class="section-heading"><div><p class="section-index">01 / ${isRoundRobin ? 'ROUND ROBIN' : isShortestRemaining ? 'SHORTEST REMAINING TIME' : isShortestJob ? 'SHORTEST JOB FIRST' : 'FIRST COME, FIRST SERVED'}</p><h2 id="demo-title">${isRoundRobin ? '同一颗 CPU，轮流使用' : isShortestRemaining ? '剩余更短，就换人' : isShortestJob ? '从就绪者中选最短' : 'A 在运行，B 就继续等待'}</h2></div><p class="rr-clock">当前时刻 <strong id="rr-time">0</strong> / 8</p></div>
        <div class="rr-toolbar">
          <div class="rr-transport" role="group" aria-label="播放控制">
            <button type="button" class="icon-button primary" id="rr-play" title="播放" aria-label="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button>
            <button type="button" class="icon-button" id="rr-step" title="前进一个时间单位" aria-label="前进一个时间单位"><span aria-hidden="true">↦</span></button>
            <button type="button" class="icon-button" id="rr-reset" title="重新开始" aria-label="重新开始"><span aria-hidden="true">↺</span></button>
          </div>
          ${isRoundRobin ? '<label class="quantum-control" for="rr-quantum"><span>时间片 <output id="rr-quantum-value" for="rr-quantum">2</output></span><input id="rr-quantum" type="range" min="1" max="5" step="1" value="2" aria-label="时间片"></label>' : `<p class="policy-note">${isShortestRemaining ? '可抢占' : '非抢占'} <span>/</span> 不设时间片</p>`}
          ${hasArrivalScenarios ? `<label class="sjf-scenario-control" for="sjf-scenario">到达场景<select id="sjf-scenario"><option value="together">同时到达</option><option value="later"${isShortestRemaining ? ' selected' : ''}>B 晚到（t=1）</option>${isShortestRemaining ? '<option value="equal">剩余相等（t=2）</option>' : ''}</select></label>` : ''}
          <label class="speed-control" for="rr-speed">播放速度<select id="rr-speed"><option value="1400">慢速</option><option value="900" selected>正常</option><option value="450">快速</option></select></label>
        </div>
        ${hasArrivalScenarios ? '<p class="sjf-arrival-note" id="sjf-arrival-note"></p>' : ''}
        <div class="rr-flow" aria-label="CPU与进程队列">
          <div class="rr-lane"><div class="lane-heading"><h3>就绪队列</h3><span>${isShortestRemaining ? '比较当前 CPU 段剩余' : isShortestJob ? '比较下一段 CPU 时长' : '队首 → 队尾'}</span></div><div id="rr-queue" class="lane-content"></div></div>
          <span class="flow-arrow" aria-hidden="true">→</span>
          <div class="rr-cpu"><div class="lane-heading"><h3>CPU</h3><span>运行</span></div><div id="rr-running" class="cpu-content"></div><div class="slice-readout"><span id="rr-slice-text"></span><progress id="rr-slice" max="2" value="0" aria-label="${isRoundRobin ? '当前时间片使用量' : '当前进程执行进度'}"></progress></div></div>
          <span class="flow-arrow" aria-hidden="true">→</span>
          <div class="rr-lane"><div class="lane-heading"><h3>已完成</h3><span>不再入队</span></div><div id="rr-completed" class="lane-content"></div></div>
        </div>
        <div class="rr-timeline-section">
          <div class="timeline-heading"><h3>CPU 执行时间轴</h3><div class="process-legend"><span class="process-a">A · 5</span><span class="process-b">B · 3</span><span>单位：示意时间</span></div></div>
          <div class="rr-timeline" role="img" aria-label="尚未执行" id="rr-timeline"></div>
          <div class="rr-ticks" aria-hidden="true">${Array.from({length: RR_TOTAL + 1}, (_, time) => `<span>${time}</span>`).join('')}</div>
          <input id="rr-position" class="position-slider" type="range" min="0" max="8" step="1" value="0" aria-label="演示时刻">
        </div>
        <div class="rr-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="rr-event-time">t = 0 / 当前事件</p><h3 id="rr-event-title"></h3><p id="rr-event-text"></p></div>
        <div class="rr-summary"><span>总 CPU 需求 <strong>8</strong></span><span>已执行 <strong id="rr-executed">0</strong></span><span>进程间切换 <strong id="rr-switches">0</strong></span>${hasArrivalScenarios ? '<span>平均等待 <strong id="sjf-wait">—</strong></span>' : ''}</div>
      </section>
      <section class="rr-rules" id="rules" aria-labelledby="rules-title">
        <div class="section-heading"><div><p class="section-index">02 / THE RULE</p><h2 id="rules-title">${isRoundRobin ? '时间片结束，不代表任务结束' : isShortestRemaining ? '更短才抢占，相等时继续' : isShortestJob ? '最短，是选择规则；不是抢占规则' : '先来先服务，不是最短任务优先'}</h2></div></div>
        <dl class="concepts rr-concepts">
          ${isRoundRobin ? `
          <div><dt>从队首取出</dt><dd>就绪进程按入队顺序等待。获得 CPU 的进程不再占据就绪队列的位置。</dd></div>
          <div><dt>未完成，回队尾</dt><dd>时间片耗尽且任务尚未完成，进程从运行回到就绪，而不是阻塞。</dd></div>
          <div><dt>已完成，直接退出</dt><dd>不必等时间片全部用完。如果任务恰好在片满时完成，也不会再入队。</dd></div>
          ` : isShortestRemaining ? `
          <div><dt>比较剩余，不是原始时长</dt><dd>A 原本需要 5，但执行 2 后只剩 3。B 此时到达也需要 3，不能只看“B 原本比 A 短”就决定抢占。</dd></div>
          <div><dt>抢占回到就绪，不是阻塞</dt><dd>运行者仍能继续执行，只是 CPU 暂时交给更短者。已执行的进度保留，恢复时继续剩下的部分。</dd></div>
          <div><dt>相等时保留当前运行者</dt><dd>本模型只在就绪候选严格更短时抢占。CPU 空闲时的候选并列，按就绪入队顺序处理；这与运行中的相等情况不同。</dd></div>
          ` : isShortestJob ? `
          <div><dt>只比较已经就绪的任务</dt><dd>尚未到达的进程不是候选者。CPU 空闲时只要已有就绪任务，就从其中选择，不为将来的短任务等待。</dd></div>
          <div><dt>比较下一段 CPU 时长</dt><dd>不是比较进程整个生命周期。本例没有 I/O，每个进程只有一段 CPU 任务；时长并列时按就绪入队顺序选择。</dd></div>
          <div><dt>选中后，不主动抢占</dt><dd>晚到的短任务要等待运行者让出 CPU。<a class="inline-link" href="${WIKI_PAGES.srtf.href}">SRTF</a> 会比较剩余 CPU 时间并在条件满足时抢占，本页的 SJF 不这样做。</dd></div>
          ` : `
          <div><dt>顺序由入队决定</dt><dd>先进入就绪队列的先获得 CPU。同时到达时需要约定顺序，本例按 A、B 排列，而不是比较任务长短。</dd></div>
          <div><dt>运行中不会被抢占</dt><dd>没有时间片。新的就绪进程不会打断当前运行者；当前进程完成或因 I/O 等原因阻塞时，才让出 CPU。</dd></div>
          <div><dt>短任务也可能久等</dt><dd>B 只需要 3 个时间单位，却必须先等 A 的 5 个时间单位。先来先服务简单，但并不保证等待时间最短。</dd></div>
          `}
        </dl>
        ${isRoundRobin ? '<div class="rr-tradeoff"><h3>时间片越小，就一定越好吗？</h3><p>较小的时间片让等待者更早轮到 CPU，但通常也带来更频繁的切换。这里忽略了切换开销，所以总耗时始终是 8；真实系统不能忽略这种成本。较大的时间片减少轮换，但可能让后面的进程等待更久。</p></div>' : isShortestRemaining ? `<div class="rr-tradeoff"><h3>短任务更早完成，运行者也要重新等待</h3><p>B 在 t=1 到达时，<a class="inline-link" href="${WIKI_PAGES.sjf.href}">非抢占 SJF</a>让 B 等到 t=5 才运行、t=8 完成；SRTF 让 B 在 t=1 立即运行、t=4 完成，但 A 被推迟到 t=8 完成。SRTF 的平均等待为 (3 + 0) ÷ 2 = 1.5，SJF 为 2。此比较仅针对 B 在 t=1 到达的场景。本例没有 I/O，累计等待 = 完成时刻 − 到达时刻 − CPU 需求；A 的首次响应是 0，但累计等待是 3。切换开销被省略，短任务持续到来仍可能使长任务饥饿。</p></div>` : isShortestJob ? `<div class="rr-tradeoff"><h3>平均等待减少，不代表每个任务都更快</h3><p>本例无 I/O，等待时间是首次运行时刻减去到达时刻。同时到达时，<a class="inline-link" href="${WIKI_PAGES.fcfs.href}">FCFS</a>的平均等待为 (0 + 5) ÷ 2 = 2.5，SJF 为 (0 + 3) ÷ 2 = 1.5；但 A 反而需要等待。这个比较仅针对同时到达的场景。若短任务持续到来，长任务可能长期得不到 CPU。</p></div>` : `<div class="rr-tradeoff"><h3>同一组进程，换成轮转会怎样？</h3><p>这里 B 在 t=5 才首次运行。相同入队顺序下，<a class="inline-link" href="${WIKI_PAGES.roundRobin.href}">时间片轮转</a>取 q=2 时，B 在 t=2 就能获得 CPU，但完成时刻是 t=7，FCFS 则是 t=8。这个例子展示等待与完成时刻的变化，不代表轮转在所有场景中都更好。</p></div>`}
      </section>
      ${wikiRelated(pageId)}
    </main><footer><span>OSLab / CPU 虚拟化</span><a href="#top">回到页首 ↑</a></footer>
  </div>`;

  let quantum = 2;
  let run = makeSchedulingRun(quantum, strategyKind, RR_PROCESSES.map(process => ({...process, arrival: isShortestRemaining && process.id === 'B' ? 1 : 0})));
  let time = 0;
  let timer = null;
  const playButton = root.querySelector('#rr-play');
  const stepButton = root.querySelector('#rr-step');
  const position = root.querySelector('#rr-position');
  const processToken = process => `<div class="process-token process-${process.id.toLowerCase()}" data-process="${process.id}"><strong>${process.id}</strong><span>剩余 ${process.remaining}</span></div>`;

  const paint = () => {
    const previousPositions = new Map(Array.from(root.querySelectorAll('.process-token'), token => [token.dataset.process, {lane: token.parentElement.id, rect: token.getBoundingClientRect()}]));
    const frame = roundRobinFrame(run, time);
    const explanation = schedulingExplanation(run, frame, quantum);
    const active = frame.processes.find(process => process.id === frame.running);
    root.querySelector('#rr-time').textContent = time;
    if (hasArrivalScenarios) {
      const arrival = run.config.processes.find(process => process.id === 'B').arrival;
      root.querySelector('#sjf-arrival-note').textContent = `A 在 t=0 到达；B 在 t=${arrival} 到达。${time < arrival ? 'B 尚未到达，不在就绪队列中。' : arrival === 0 ? '两者同时到达，入队顺序为 A、B。' : isShortestRemaining ? 'B 已到达，按当前剩余时间比较。' : 'B 已到达，本例不会抢占运行者。'}`;
      const averageWait = run.config.processes.reduce((total, process) => total + schedulingWait(run, process), 0) / run.config.processes.length;
      root.querySelector('#sjf-wait').textContent = time === RR_TOTAL ? averageWait : '—';
    }
    root.querySelector('#rr-queue').innerHTML = frame.queue.length ? frame.queue.map(id => processToken(frame.processes.find(process => process.id === id))).join('') : '<p class="lane-empty">暂无等待进程</p>';
    root.querySelector('#rr-running').innerHTML = active ? processToken(active) : '<p class="lane-empty">任务已全部完成</p>';
    const completed = frame.processes.filter(process => process.status === '完成');
    root.querySelector('#rr-completed').innerHTML = completed.length ? completed.map(processToken).join('') : '<p class="lane-empty">暂无完成进程</p>';
    const slice = root.querySelector('#rr-slice');
    slice.max = isRoundRobin ? quantum : active?.burst ?? 1;
    slice.value = active ? isRoundRobin ? frame.sliceUsed : active.burst - active.remaining : 0;
    root.querySelector('#rr-slice-text').textContent = active ? isRoundRobin ? `本轮 ${frame.sliceUsed} / ${quantum}` : `已执行 ${active.burst - active.remaining} / ${active.burst}` : 'CPU 已空闲';
    const segments = run.timeline.filter(segment => segment.start < time).map(segment => ({...segment, end: Math.min(segment.end, time)}));
    root.querySelector('#rr-timeline').innerHTML = segments.map(segment => `<div class="timeline-segment process-${segment.id.toLowerCase()}" style="left:${segment.start / RR_TOTAL * 100}%;width:${(segment.end - segment.start) / RR_TOTAL * 100}%"><span>${segment.id}</span></div>`).join('') + `<span class="timeline-cursor" style="left:${time / RR_TOTAL * 100}%"></span>`;
    root.querySelector('#rr-timeline').setAttribute('aria-label', segments.length ? segments.map(segment => `${segment.id} 从 ${segment.start} 到 ${segment.end}`).join('；') : '尚未执行');
    position.value = time;
    position.setAttribute('aria-valuetext', `时刻 ${time}，${frame.running ? `${frame.running} 正在运行` : '全部完成'}`);
    root.querySelector('#rr-event-time').textContent = `t = ${time} / 当前事件`;
    root.querySelector('#rr-event-title').textContent = explanation.title;
    root.querySelector('#rr-event-text').textContent = explanation.text;
    root.querySelector('#rr-executed').textContent = time;
    root.querySelector('#rr-switches').textContent = run.timeline.filter((segment, index) => index > 0 && segment.start <= time).length;
    playButton.disabled = time === RR_TOTAL;
    stepButton.disabled = time === RR_TOTAL;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.querySelectorAll('.process-token').forEach(token => {
        const previous = previousPositions.get(token.dataset.process);
        if (!previous || previous.lane === token.parentElement.id) return;
        const current = token.getBoundingClientRect();
        token.animate([
          {transform: `translate(${previous.rect.left - current.left}px, ${previous.rect.top - current.top}px)`, opacity: .65},
          {transform: 'translate(0, 0)', opacity: 1},
        ], {duration: 320, easing: 'cubic-bezier(.2,.7,.3,1)'});
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
    time = Math.min(RR_TOTAL, time + 1);
    if (time === RR_TOTAL) pause();
    paint();
  };
  const play = () => {
    if (time === RR_TOTAL) return;
    playButton.setAttribute('aria-pressed', 'true');
    playButton.setAttribute('aria-label', '暂停');
    playButton.title = '暂停';
    playButton.firstElementChild.textContent = 'Ⅱ';
    timer = setInterval(advance, Number(root.querySelector('#rr-speed').value));
  };
  playButton.addEventListener('click', () => timer === null ? play() : pause());
  stepButton.addEventListener('click', () => { pause(); advance(); });
  root.querySelector('#rr-reset').addEventListener('click', () => { pause(); time = 0; paint(); });
  root.querySelector('#rr-quantum')?.addEventListener('input', event => {
    pause();
    quantum = Number(event.target.value);
    root.querySelector('#rr-quantum-value').value = quantum;
    run = makeSchedulingRun(quantum, 'RR');
    time = 0;
    paint();
  });
  root.querySelector('#sjf-scenario')?.addEventListener('change', event => {
    pause();
    const arrival = event.target.value === 'later' ? 1 : event.target.value === 'equal' ? 2 : 0;
    const processes = RR_PROCESSES.map(process => ({...process, arrival: process.id === 'B' ? arrival : 0}));
    run = makeSchedulingRun(quantum, strategyKind, processes);
    time = 0;
    paint();
  });
  position.addEventListener('input', event => { pause(); time = Number(event.target.value); paint(); });
  root.querySelector('#rr-speed').addEventListener('change', () => {
    if (timer !== null) { pause(); play(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  paint();
}

renderSchedulingPage(document.getElementById('root'), document.body.dataset.page ?? 'roundRobin');