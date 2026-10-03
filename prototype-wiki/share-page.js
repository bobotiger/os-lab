function renderSharePage(root) {
  const {presets, strideScale, buildRun} = OSLabShares;
  root.innerHTML = `<div class="page rr-page share-page" id="top">
    ${wikiHeader('shares', [{href: '#demo', title: '份额对照'}, {href: '#rules', title: '策略类别'}, {href: '#knowledge-related-title', title: '相关知识'}])}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">CPU 虚拟化 / 调度</p>
        <h1 id="page-title">比例份额调度 <span>Proportional Share</span></h1>
        <p class="lead">权重确定目标 CPU 份额，不保证每轮的分配顺序。</p>
        <p class="definition">权重是用于比较 CPU 分配比例的数值。进程的目标份额等于自身权重除以当前可运行进程的总权重。<strong>彩票调度</strong>把权重表示为票数，每轮随机选一张票；<strong>步长调度（Stride）</strong>则比较各进程的累计虚拟进度 pass，选择数值最小者。同一组权重可以得到不同的短期分配顺序。</p>
        <p class="model-note">单核，三个进程始终就绪并持续竞争 CPU，无 I/O，切换开销为零，每次分配 1 个示意 CPU 单位。一条序列内权重固定；彩票使用给定种子的伪随机抽签序列。Stride 初始 pass 均为 0，并列按 A、B、C 顺序选择。</p>
      </section>
      <section class="share-demo" id="demo" aria-labelledby="demo-title">
        <div class="section-heading"><div><p class="section-index">01 / PROPORTIONAL SHARE</p><h2 id="demo-title">同一组进程权重下的彩票调度与步长调度</h2></div><p class="rr-clock">已分配 <strong id="share-time">0</strong> / <span id="share-total">60</span></p></div>
        <div class="rr-toolbar share-toolbar">
          <div class="rr-transport" role="group" aria-label="播放控制">
            <button type="button" class="icon-button primary" id="share-play" title="播放" aria-label="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button>
            <button type="button" class="icon-button" id="share-step" title="分配一个 CPU 单位" aria-label="分配一个 CPU 单位"><span aria-hidden="true">↦</span></button>
            <button type="button" class="icon-button" id="share-reset" title="重新开始" aria-label="重新开始"><span aria-hidden="true">↺</span></button>
          </div>
          <label>权重 A:B:C<select id="share-weights">${Object.entries(presets).map(([id, preset]) => `<option value="${id}">${preset.title}</option>`).join('')}</select></label>
          <label>观察轮数<select id="share-duration"><option value="12">12</option><option value="60" selected>60</option><option value="240">240</option></select></label>
          <label>抽签种子<select id="share-seed"><option value="42" selected>42</option><option value="7">7</option><option value="2026">2026</option><option value="1">1</option></select></label>
          <label>播放速度<select id="share-speed"><option value="900">慢速</option><option value="450" selected>正常</option><option value="120">快速</option></select></label>
        </div>
        <p class="share-workload" id="share-workload"></p>
        <div class="share-mechanisms">
          <section class="share-mechanism" aria-labelledby="lottery-title">
            <p class="section-index">LOTTERY / 随机选择</p><h3 id="lottery-title">彩票调度</h3>
            <p class="share-method-note">每轮抽一张票，票的拥有者获得 1 个 CPU 单位。</p>
            <div class="share-ticket-pool" id="share-ticket-pool" role="img" aria-label="票池"></div>
            <div class="share-winner"><p>最近一轮中奖票号 <strong id="share-ticket">—</strong></p><p>分配给 <strong id="lottery-winner">—</strong></p></div>
            <p class="share-decision" id="lottery-reason" aria-live="polite"></p>
          </section>
          <section class="share-mechanism" aria-labelledby="stride-title">
            <p class="section-index">STRIDE / 确定性选择</p><h3 id="stride-title">步长调度</h3>
            <p class="share-method-note">步长 stride = ${strideScale} ÷ 权重。${strideScale} 是本例统一选取的计算常数，只确定虚拟进度的尺度，不是时间片长度。</p>
            <p class="share-method-note">pass 是累计虚拟进度，不是实际时间或剩余工作量。每轮选 pass 最小者；运行 1 个 CPU 单位后，pass 增加自己的步长。权重越大，步长越小，因而能更频繁地被选中。</p>
            <table class="share-pass"><thead><tr><th scope="col">进程</th><th scope="col">步长</th><th scope="col">pass 前</th><th scope="col">pass 后</th></tr></thead><tbody id="share-passes"></tbody></table>
            <p class="share-decision" id="stride-reason" aria-live="polite"></p>
          </section>
        </div>
        <div class="share-results-heading"><h3>实际份额与目标份额</h3><p><span class="share-actual-key">实际</span><span class="share-target-key">目标</span></p></div>
        <div class="share-results"><section aria-label="彩票累计份额"><h4>彩票调度</h4><div id="lottery-shares"></div></section><section aria-label="Stride 累计份额"><h4>Stride</h4><div id="stride-shares"></div></section></div>
        <div class="share-timeline-heading"><h3>每轮 CPU 分配</h3><p>每格 1 个单位 · A / B / C</p></div>
        <div class="share-sequence-scroll" tabindex="0" role="region" aria-label="两种算法的 CPU 分配序列"><div class="share-sequence" id="share-sequence"><div class="share-sequence-row"><span>彩票</span><div class="share-rounds" id="lottery-timeline" role="img" aria-label="尚未分配"></div></div><div class="share-sequence-row"><span>Stride</span><div class="share-rounds" id="stride-timeline" role="img" aria-label="尚未分配"></div></div><div class="share-sequence-ticks" id="share-ticks"></div></div></div>
        <input id="share-position" type="range" min="0" max="60" step="1" value="0" aria-label="已分配轮数">
        <p class="share-observation" id="share-observation" aria-live="polite"></p>
      </section>
      <section class="rr-rules" id="rules" aria-labelledby="rules-title">
        <div class="section-heading"><div><p class="section-index">02 / THE FAMILY</p><h2 id="rules-title">目标 CPU 份额与进程选择规则</h2></div></div>
        <dl class="concepts rr-concepts">
          <div><dt>彩票调度：概率上的份额</dt><dd>拥有 5 张票、总票数 10，每轮中奖概率为 50%。短期可能连续获胜，也可能连续没被选中；理想均匀抽签的长期统计趋向票数比例，但没有有限等待上界或固定窗口配额保证。</dd></div>
          <div><dt>Stride：优先选择累计虚拟进度最小的进程</dt><dd>本例 stride = ${strideScale} ÷ 权重。权重越大，步长越小；每次运行后 pass 增加自己的步长，因此更频繁地成为 pass 最小者。pass 不是实际时间或剩余工作量。</dd></div>
          <div><dt>公平份额，不是完成时间排序</dt><dd>它不根据短任务、完成期限或 MLFQ 的行为反馈选择进程。即使长期份额合适，也不等于每轮公平、响应时间最短，或任何进程一定最快完成。</dd></div>
        </dl>
        <div class="rr-tradeoff"><h3>其他按权重分配的调度方式</h3><p>加权轮转按权重安排服务次数，结果还受轮次顺序影响。加权公平排队（WFQ）根据权重计算虚拟完成时间，并用它决定服务顺序，常见于网络调度。</p><p>Linux CFS 比较加权后的虚拟运行时间。较新的 EEVDF 先确定尚未超过应得 CPU 份额的候选，再比较由请求长度和权重计算的虚拟截止时间。这些数值用于调度排序，并不等于任务的实际完成时刻；各策略的选择规则也不同于 Stride。</p></div>
        <div class="rr-tradeoff"><h3>目标份额的分母是当前可运行进程的总权重</h3><p>目标份额 = 自己的权重 ÷ 当前可运行进程的总权重。本例三个进程一直就绪，因此目标不变。实际系统中，阻塞、退出、新任务到达和权重变化都会改变竞争集合；Stride 还需要明确新进程的 pass 初始化等规则，不能把本例的静态过程直接套用。</p></div>
        <div class="rr-tradeoff"><h3>固定种子不保证有限轮数内达到目标份额</h3><p>给定权重与种子，伪随机抽签的顺序确定，但不保证有限轮数的份额恰好等于票数比例。某条 240 轮结果不一定比某条 60 轮结果更接近目标。Stride 的并列顺序会影响初始几轮；三组给定权重采用整数步长，其他权重还可能产生取整误差。</p></div>
      </section>
      ${wikiRelated('shares')}
    </main><footer class="site-footer"><span>OSLab / CPU 虚拟化</span><a href="#top">回到页首 ↑</a></footer>
  </div>`;
  let run = buildRun();
  let time = 0;
  let timer = null;
  const playButton = root.querySelector('#share-play');
  const stepButton = root.querySelector('#share-step');
  const position = root.querySelector('#share-position');
  const percent = value => `${value.toFixed(1)}%`;
  const prepareRun = () => {
    position.max = run.duration;
    root.querySelector('#share-total').textContent = run.duration;
    root.querySelector('#share-workload').textContent = `A、B、C 始终就绪；权重 ${run.processes.map(process => process.weight).join(' : ')}，总票数 ${run.total}。每轮同时观察两种独立调度，种子 ${run.seed} 仅影响彩票。`;
    root.querySelector('#share-ticket-pool').innerHTML = run.processes.map(process => `<div class="share-ticket-range share-${process.id.toLowerCase()}" style="width:${process.weight / run.total * 100}%"><strong>${process.id}</strong><span>${process.start === process.end - 1 ? process.start : `${process.start}–${process.end - 1}`}</span></div>`).join('') + '<span class="share-ticket-marker" id="share-ticket-marker" hidden aria-hidden="true">▼</span>';
    const width = Math.max(600, run.duration * 18 + 50);
    root.querySelector('#share-sequence').style.minWidth = `${width}px`;
    root.querySelector('#share-sequence').style.setProperty('--rounds', run.duration);
    root.querySelector('#share-ticks').innerHTML = [0, run.duration / 4, run.duration / 2, run.duration * 3 / 4, run.duration].map(tick => `<span style="left:${tick / run.duration * 100}%">${tick}</span>`).join('');
  };
  const paint = () => {
    const lottery = run.lottery[time];
    const stride = run.stride[time];
    root.querySelector('#share-time').textContent = time;
    root.querySelector('#share-ticket').textContent = lottery.decision?.ticket ?? '—';
    root.querySelector('#lottery-winner').textContent = lottery.decision?.id ?? '—';
    const marker = root.querySelector('#share-ticket-marker');
    marker.hidden = time === 0;
    if (time > 0) marker.style.left = `${(lottery.decision.ticket + .5) / run.total * 100}%`;
    root.querySelectorAll('.share-ticket-range').forEach((node, index) => node.classList.toggle('selected', lottery.decision?.selected === index));
    const drawn = lottery.decision ? run.processes[lottery.decision.selected] : null;
    root.querySelector('#lottery-reason').textContent = drawn ? `第 ${time} 轮：票号 ${lottery.decision.ticket} 属于 ${drawn.id}（${drawn.start}–${drawn.end - 1}），本轮分配给 ${drawn.id}。它的中奖概率仍为 ${percent(drawn.weight / run.total * 100)}，不是每轮都应获胜。` : '尚未抽签。票号从 0 开始，每张票只属于一个进程。';
    root.querySelector('#share-passes').innerHTML = run.processes.map((process, index) => `<tr${stride.decision?.selected === index ? ' class="selected"' : ''}><th scope="row">${process.id}</th><td>${process.stride}</td><td>${stride.decision?.before[index] ?? 0}</td><td>${stride.passes[index]}</td></tr>`).join('');
    const chosen = stride.decision ? run.processes[stride.decision.selected] : null;
    const tied = stride.decision ? stride.decision.before.filter(pass => pass === stride.decision.before[stride.decision.selected]).length > 1 : false;
    root.querySelector('#stride-reason').textContent = chosen ? `第 ${time} 轮：${chosen.id} 的 pass=${stride.decision.before[stride.decision.selected]} 最小${tied ? '，并列按 A、B、C 顺序' : ''}；运行后增加 ${strideScale} ÷ ${chosen.weight} = ${chosen.stride}，变为 ${stride.passes[stride.decision.selected]}。` : '尚未分配。三个 pass 都是 0，首次按并列规则选择 A。';
    for (const kind of ['lottery', 'stride']) {
      const frame = run[kind][time];
      root.querySelector(`#${kind}-shares`).innerHTML = run.processes.map((process, index) => {
        const target = process.weight / run.total * 100;
        const actual = time ? frame.counts[index] / time * 100 : 0;
        return `<div class="share-allocation share-${process.id.toLowerCase()}"><div><strong>${process.id}</strong><span>${frame.counts[index]} 单位 · ${time ? percent(actual) : '—'}</span><small>目标 ${percent(target)}</small></div><div class="share-allocation-track"><span style="width:${actual}%"></span><i style="left:${target}%"></i></div></div>`;
      }).join('');
      const prefix = run[kind].slice(1, time + 1);
      root.querySelector(`#${kind}-timeline`).innerHTML = Array.from({length: run.duration}, (_, index) => {
        const decision = prefix[index]?.decision;
        return `<span class="share-round${decision ? ` share-${decision.id.toLowerCase()}` : ''}"${decision ? ` title="第 ${index + 1} 轮：${decision.id}"` : ''}>${decision?.id ?? ''}</span>`;
      }).join('') + `<span class="share-sequence-cursor" style="left:${time / run.duration * 100}%"></span>`;
      root.querySelector(`#${kind}-timeline`).setAttribute('aria-label', prefix.length ? prefix.map(frame => `第 ${frame.time} 轮 ${frame.decision.id}`).join('；') : '尚未分配');
    }
    const sequenceScroll = root.querySelector('.share-sequence-scroll');
    const sequenceWidth = root.querySelector('#share-sequence').clientWidth;
    const cursor = 50 + time / run.duration * (sequenceWidth - 50);
    if (cursor < sequenceScroll.scrollLeft || cursor > sequenceScroll.scrollLeft + sequenceScroll.clientWidth) sequenceScroll.scrollLeft = Math.max(0, cursor - sequenceScroll.clientWidth / 2);
    position.value = time;
    position.setAttribute('aria-valuetext', time ? `已分配 ${time} 轮，彩票最近选 ${lottery.decision.id}，Stride 最近选 ${stride.decision.id}` : '尚未分配');
    const deviation = frame => Math.max(...run.processes.map((process, index) => Math.abs(frame.counts[index] / time - process.weight / run.total) * 100));
    root.querySelector('#share-observation').textContent = time ? `${time === run.duration ? '观察结束，三个进程仍可继续运行。' : `已观察 ${time} 轮。`}最大份额偏差：彩票 ${deviation(lottery).toFixed(1)} 个百分点，Stride ${deviation(stride).toFixed(1)} 个百分点。偏差是实际占比与目标占比之差的绝对值；这里取三个进程中的最大值，后续轮次仍可能改变它。` : '尚未分配 CPU。权重已确定目标占比，但实际占比要根据已分配的 CPU 单位计算。';
    playButton.disabled = time === run.duration;
    stepButton.disabled = time === run.duration;
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
    timer = setInterval(advance, Number(root.querySelector('#share-speed').value));
  };
  const rebuild = () => {
    pause();
    run = buildRun(root.querySelector('#share-weights').value, Number(root.querySelector('#share-duration').value), Number(root.querySelector('#share-seed').value));
    time = 0;
    prepareRun();
    paint();
  };
  playButton.addEventListener('click', () => timer === null ? play() : pause());
  stepButton.addEventListener('click', () => { pause(); advance(); });
  root.querySelector('#share-reset').addEventListener('click', () => { pause(); time = 0; paint(); });
  for (const id of ['share-weights', 'share-duration', 'share-seed']) root.querySelector(`#${id}`).addEventListener('change', rebuild);
  position.addEventListener('input', event => { pause(); time = Number(event.target.value); paint(); });
  root.querySelector('#share-speed').addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  prepareRun();
  paint();
}

renderSharePage(document.getElementById('root'));