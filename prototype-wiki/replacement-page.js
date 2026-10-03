function renderReplacementPage(root) {
  const {scenarios, buildRun} = OSLabReplacement;
  const policies = {
    opt: {title: 'OPT · 最优置换', rule: '淘汰后续序列中最晚再次访问的页；未来不再访问的页优先。依据完整未来序列，作为比较基准。'},
    fifo: {title: 'FIFO · 先进先出', rule: '淘汰最早载入的页。命中不改变入队时间，因此老页面即使常被访问也可能被淘汰。'},
    lru: {title: 'LRU · 最近最少使用', rule: '淘汰最近一次访问最早的页。每次命中都更新历史，以过去的访问推测近期需求。'},
  };
  const phaseNames = {initial: '初始状态', request: '发起访问', hit: '页面命中', fault: '发生缺页', clear: '清除访问位', select: '选定待淘汰页', writeback: '写回脏页', written: '写回完成', load: '页面载入', access: '访问完成'};
  const controls = prefix => `<div class="rr-transport" role="group" aria-label="${prefix === 'rp-compare' ? '策略对照' : 'Clock'}演示控制"><button type="button" class="icon-button primary" id="${prefix}-play" aria-label="播放" title="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button><button type="button" class="icon-button" id="${prefix}-next" aria-label="下一阶段" title="下一阶段"><span aria-hidden="true">↦</span></button><button type="button" class="icon-button" id="${prefix}-reset" aria-label="重新开始" title="重新开始"><span aria-hidden="true">↺</span></button></div><label>播放速度<select id="${prefix}-speed"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label>`;
  root.innerHTML = `<div class="page rr-page pt-page rp-page" id="top">
    ${wikiHeader('replacement', [{href: '#why', title: '置换与成本'}, {href: '#compare', title: '策略对照'}, {href: '#clock', title: 'Clock'}, {href: '#pressure', title: '局部性与压力'}])}
    <main>
      <section class="intro"><p class="eyebrow">内存虚拟化 / Beyond Physical Memory: Policies</p><h1>页面置换策略 <span>Page Replacement</span></h1><p class="lead">没有可用空闲页框时，置换策略决定移出哪一页。</p><p class="definition">页面置换将一个驻留页移出物理内存，使它的页框可以存放本次需要的页面。被修改、尚未写回后备存储的页称为脏页；保留其修改需要先写回。策略选择会影响后续缺页和写回次数，过去的访问记录只能提供预测依据。</p><p class="model-note">访问序列中的数字是虚拟页号。单进程使用 2–4 个等大页框，起初为空；所有页面访问合法且有后备副本。一次访问完成后才开始下一次。初次载入也计为缺页，页框不包括页表自身的存储。</p></section>
      <section class="rr-rules" id="why"><p class="section-index">01 / RECLAIM A FRAME</p><h2>内存已满时，如何选择淘汰页面</h2><p class="pt-copy">页面不在物理内存中时，访问触发缺页，OS 先寻找空闲页框。没有空闲页框时，置换策略选择一个已经在内存中的页面，准备将其移出内存，这个页面称为待淘汰页；腾出的页框用于载入本次需要的页面。</p><div class="rp-flow" role="img" aria-label="目标页不在物理内存中，访问触发缺页；有空闲框则直接载入，没有空闲框则选择待淘汰页，脏页先写回，再复用页框、载入并重试访问"><div><strong>目标页不在内存</strong><span>发生缺页，访问等待</span></div><span aria-hidden="true">→</span><div><strong>寻找可用页框</strong><span>有空闲框：直接载入<br>没有空闲框：选择待淘汰页</span></div><span aria-hidden="true">→</span><div><strong>准备目标页</strong><span>脏页先写回，撤销旧映射<br>载入新页，更新映射</span></div><span aria-hidden="true">→</span><div><strong>重试访问</strong><span>页面就绪后完成原访问</span></div></div><div class="pt-notes"><article><h3>淘汰的是驻留内容</h3><p>页框仍留在物理内存，旧页面失去驻留映射，新页面内容占用这个框。TLB 替换只删除转换缓存；页面置换则改变驻留状态，相关旧转换也必须失效。</p></article><article><h3>干净页与脏页</h3><p>干净页的内容与后备副本一致，可直接丢弃内存副本。脏页包含尚未写回的修改，要保留修改就必须先写回；写回完成前不能覆盖此页框。</p></article><article><h3>缺页次数不是耗时</h3><p>命中率是命中次数除以总访问次数。载入与写回都有成本，管理策略本身也有开销；相同缺页数可能对应不同 I/O 量，不能直接换算成性能倍数。</p></article></div></section>
      <section class="rr-rules" id="compare"><div class="section-heading"><div><p class="section-index">02 / SAME REFERENCES · DIFFERENT CHOICES</p><h2>OPT、FIFO 与 LRU 的选择依据</h2></div></div><div class="rr-toolbar pt-toolbar">${controls('rp-compare')}<label>访问场景<select id="rp-scenario">${['textbook', 'classic', 'belady', 'locality'].map(id => `<option value="${id}">${scenarios[id].title}</option>`).join('')}</select></label><label>页框数<select id="rp-capacity"><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option></select></label></div><p class="pt-copy">三列从相同空内存开始，每一步均完成同一次访问。OPT 查看后续序列，FIFO 按载入顺序，LRU 按最近访问顺序；并列选择较小页框号。初始冷缺页与之后的置换缺页都计入总数。</p><div id="rp-sequence" class="rp-sequence" role="group" aria-label="访问序列回看"></div><p id="rp-compare-status" class="rp-status" aria-live="polite"></p><div class="rp-policies">${Object.entries(policies).map(([id, policy]) => `<section class="rp-policy" aria-labelledby="rp-${id}-title"><h3 id="rp-${id}-title">${policy.title}</h3><p class="rp-rule">${policy.rule}</p><div id="rp-${id}-frames"></div><dl class="rp-metrics" id="rp-${id}-metrics"></dl><p class="rp-decision" id="rp-${id}-decision"></p><p class="rp-order" id="rp-${id}-order"></p><div class="rp-history" id="rp-${id}-history"></div></section>`).join('')}</div><input class="rp-position" id="rp-compare-position" type="range" min="0" max="11" value="0" step="1" aria-label="策略对照访问进度"><p id="rp-summary" class="rp-summary"></p><div class="pt-notes"><article><h3>OPT 在相同序列与容量下达到最少缺页数</h3><p>在固定序列、相同容量、按需载入条件下，OPT 达到最少缺页数。真实系统不知道未来；LRU 在某个有限序列上可以与 OPT 相同，但并非总能达到最优。</p></article><article><h3>FIFO 的 Belady 异常</h3><p>序列 1,2,3,4,1,2,5,1,2,3,4,5 中，FIFO 用 3 个页框缺页 9 次，用 4 个反而缺页 10 次。更多容量改变淘汰顺序，并不保证 FIFO 的命中更好；OPT、LRU 没有这种异常。</p></article><article><h3>Random 与历史信息</h3><p>Random 随机决定淘汰哪一页，维护简单，却可能淘汰频繁访问的页面，即热点页。LRU 利用近期访问，LFU 利用频率；过时热点和循环扫描都可能使历史线索失效，没有一种简单规则适合所有负载。</p></article></div></section>
      <section class="rr-rules" id="clock"><p class="section-index">03 / APPROXIMATE RECENCY</p><h2>Clock：访问位与循环扫描</h2><p class="pt-copy">精确 LRU 需要记录页面最近一次访问的顺序。Clock 则用访问位 R 记录自上次清零后是否发生过访问：硬件在访问时置 R=1；OS 扫描遇到 1 就清零并前进，遇到 0 则选中。指针按页框顺序循环扫描，页面命中不移动指针。</p><div class="rr-toolbar pt-toolbar">${controls('rp-clock')}<label>Clock 场景<select id="rp-clock-scenario"><option value="dirty">脏页与写回</option><option value="textbook">重复访问与未来距离</option><option value="locality">热点与一次性扫描</option></select></label></div><p class="pt-caption">Clock 固定使用 3 个页框，选择第一个 R=0 的页。修改位 D=1 表示存在尚未写回的修改，复用页框前需要先写回；D 不参与本例的淘汰选择。空闲框按框号使用，载入后指针前进；最后一框之后回到框 0。</p><div id="rp-clock-sequence" class="rp-sequence" role="group" aria-label="Clock 访问序列回看"></div><div class="rp-clock-workbench"><aside class="pt-event" aria-live="polite" aria-atomic="true"><p id="rp-clock-progress" class="detail-kicker"></p><h3 id="rp-clock-phase"></h3><p id="rp-clock-reason"></p><p id="rp-clock-pending" class="pt-result"></p></aside><div><div class="rp-backing" id="rp-clock-backing"></div><div id="rp-clock-frames"></div><p id="rp-clock-pointer" class="rp-order"></p><dl class="rp-metrics" id="rp-clock-metrics"></dl></div></div><input class="rp-position" id="rp-clock-position" type="range" min="0" max="1" value="0" step="1" aria-label="Clock 阶段"><div class="rp-phases" id="rp-clock-phases" role="group" aria-label="当前访问阶段回看"></div><div class="pt-notes"><article><h3>第二次机会不是精确排序</h3><p>R 只记录自上次清零以来是否发生过访问，不记录次数或先后。所有框 R=1 时，扫描可清完一圈再选择；Clock 近似 LRU，但不保证作出同样选择。</p></article><article><h3>把写回成本纳入选择</h3><p>一种改进是优先寻找 R=0 且 D=0 的干净页，再考虑脏页。这样可能减少写回，但也需要更多扫描。基本 Clock 与考虑脏页的变体是不同的选择规则。</p></article><article><h3>写回完成不等于目标访问完成</h3><p>写回保存待淘汰页的修改；载入准备目标页；重试才执行原来的读或写。读取只置 R，写入同时置 R 和 D。各阶段数量不代表实际 I/O 时长。</p></article></div></section>
      <section class="rr-rules" id="pressure"><p class="section-index">04 / LOCALITY · WORKING SET · I/O</p><h2>访问模式与内存压力决定策略效果</h2><div class="pt-notes"><article><h3>访问局部性与近期访问记录的预测价值</h3><p>近期访问过的页可能再次访问，是时间局部性；相邻地址可能随后被访问，是空间局部性。热点集中时 LRU 通常更有依据；完全随机访问削弱历史的预测价值。</p></article><article><h3>循环访问 4 页、容量 3 框时的 LRU 缺页</h3><p>依次循环访问 4 个不同页，容量只有 3 时，LRU 每次淘汰的恰好是即将再次需要的页；从空内存开始，每次访问都缺页。Random 有时能避开这种固定循环，但结果也有波动。</p></article><article><h3>工作集大小与可用内存对换页频率的影响</h3><p>工作集是进程在近期持续使用的页面集合。多个进程的活跃需求超过可用内存，可能反复换入换出，系统将大量时间用于页面换入换出，留给程序执行的时间减少，这称为抖动。降低并发、准入控制或增加内存，比只更换淘汰规则更直接。</p></article></div><div class="rp-further"><h3>载入时机与写回组织也是策略</h3><p>按需分页等到访问触发缺页才准备页面；预取提前载入可能即将使用的页，预测错误会消耗带宽并挤占有用页面。OS 也可在内存紧张前回收、提前写回脏页，维持一批可用框，而不必让每次缺页都同步等待脏页写回。</p><p>批量组织写回可降低 I/O 开销，传统磁盘尤其受益于减少寻道和零散写入。内存耗尽时终止进程能释放资源，但与正常页面置换不同，也不能把所有缺页都理解成内存耗尽。</p></div></section>
      ${wikiRelated('replacement')}
    </main><footer><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer></div>`;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const cancelAnimations = () => root.querySelectorAll('.rp-frame').forEach(node => node.getAnimations().forEach(animation => animation.cancel()));
  const frameMarkup = (step, clock = false) => `<div class="rp-frames" style="--rp-count:${step.frames.length}">${step.frames.map((frame, index) => `<div class="rp-frame${step.selected === index ? ' rp-selected' : ''}${clock && step.hand === index ? ' rp-hand' : ''}"><span class="rp-frame-label">页框 ${index}${clock && step.hand === index ? ' · 指针 ↓' : ''}</span><strong>${frame.page === null ? '空闲' : `页 ${frame.page}`}</strong>${clock ? `<span>R=${Number(frame.referenced)} · D=${Number(frame.dirty)}</span>` : `<span>${step.selected === index ? '本次访问页框' : '驻留位置'}</span>`}</div>`).join('')}</div>`;
  const metrics = step => `<div><dt>命中</dt><dd>${step.hits}</dd></div><div><dt>缺页</dt><dd>${step.faults}</dd></div><div><dt>写回完成</dt><dd>${step.writebacks}</dd></div>`;
  const sequence = (accesses, attribute) => accesses.map((access, index) => `<button type="button" ${attribute}="${index}" aria-label="回看第 ${index + 1} 次访问：页 ${access.page}${access.write ? '，写入' : ''}" aria-pressed="false"><small>${index + 1}</small><strong>${access.page}</strong><small>${access.write ? '写' : '读'}</small></button>`).join('');
  const highlight = () => {
    cancelAnimations();
    if (!motion.matches) root.querySelectorAll('.rp-selected').forEach(node => node.animate([{opacity: .45}, {opacity: 1}], {duration: 250}));
  };
  const playback = (prefix, paint) => {
    let position = 0;
    let length = 1;
    let timer = null;
    const playButton = root.querySelector(`#${prefix}-play`);
    const nextButton = root.querySelector(`#${prefix}-next`);
    const slider = root.querySelector(`#${prefix}-position`);
    const speed = root.querySelector(`#${prefix}-speed`);
    const pause = () => { clearInterval(timer); timer = null; playButton.setAttribute('aria-pressed', 'false'); playButton.setAttribute('aria-label', '播放'); playButton.title = '播放'; playButton.firstElementChild.textContent = '▶'; };
    const seek = value => { cancelAnimations(); position = Math.max(0, Math.min(length - 1, value)); slider.value = position; slider.setAttribute('aria-valuetext', `阶段 ${position + 1} / ${length}`); playButton.disabled = nextButton.disabled = position === length - 1; paint(position); };
    const advance = () => { if (position + 1 === length - 1) pause(); seek(position + 1); };
    const play = () => { if (position === length - 1) return; timer = setInterval(advance, Number(speed.value)); playButton.setAttribute('aria-pressed', 'true'); playButton.setAttribute('aria-label', '暂停'); playButton.title = '暂停'; playButton.firstElementChild.textContent = 'Ⅱ'; };
    playButton.addEventListener('click', () => timer === null ? play() : pause());
    nextButton.addEventListener('click', () => { pause(); advance(); });
    root.querySelector(`#${prefix}-reset`).addEventListener('click', () => { pause(); seek(0); });
    slider.addEventListener('input', () => { pause(); seek(Number(slider.value)); });
    speed.addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
    return {pause, seek: value => { pause(); seek(value); }, rebuild: count => { pause(); length = count; slider.max = count - 1; seek(0); }};
  };
  let comparison = {};
  let comparisonAccesses = [];
  const compareControl = playback('rp-compare', position => {
    root.querySelector('#rp-compare-status').textContent = position === 0 ? '内存初始为空，尚未发起访问。' : `已完成第 ${position} / ${comparisonAccesses.length} 次访问 · 页 ${comparisonAccesses[position - 1].page}`;
    root.querySelectorAll('[data-rp-access]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.rpAccess) === position - 1)));
    for (const [id, run] of Object.entries(comparison)) {
      const step = position === 0 ? run.snapshots[0] : run.completed[position - 1];
      root.querySelector(`#rp-${id}-frames`).innerHTML = frameMarkup(step);
      root.querySelector(`#rp-${id}-metrics`).innerHTML = metrics(step);
      const local = run.snapshots.filter(snapshot => snapshot.accessIndex === position - 1);
      const selection = local.find(snapshot => snapshot.phase === 'select');
      const missed = local.some(snapshot => snapshot.phase === 'fault');
      root.querySelector(`#rp-${id}-decision`).textContent = position === 0 ? step.reason : `${missed ? '缺页' : '命中'}。${selection ? selection.reason : missed ? '有空闲页框，无需淘汰。' : '页面已经驻留，无需载入。'} 本次访问已完成。`;
      const occupied = step.frames.map((frame, index) => ({...frame, index})).filter(frame => frame.page !== null);
      let order;
      if (id === 'opt') {
        order = occupied.map(frame => { const next = comparisonAccesses.findIndex((access, index) => index >= position && access.page === frame.page); return `页 ${frame.page}：${next < 0 ? '后续不再访问' : `下次在第 ${next + 1} 次`}`; }).join('；');
      } else {
        occupied.sort((first, second) => (id === 'fifo' ? first.loadedAt - second.loadedAt : first.usedAt - second.usedAt) || first.index - second.index);
        order = `${id === 'fifo' ? '最早载入 → 最晚载入' : '最久未用 → 最近使用'}：${occupied.map(frame => frame.page).join(' → ') || '空'}`;
      }
      root.querySelector(`#rp-${id}-order`).textContent = order || '没有驻留页。';
      root.querySelector(`#rp-${id}-history`).innerHTML = `<table class="pt-table"><caption>已完成访问的驻留记录</caption><thead><tr><th scope="col">访问</th><th scope="col">结果</th><th scope="col">淘汰</th><th scope="col">框内页</th></tr></thead><tbody>${run.completed.slice(0, position).map((completed, index) => `<tr${index === position - 1 ? ' class="pt-active"' : ''}><td>${index + 1} · ${run.accesses[index].page}</td><td>${run.snapshots.some(snapshot => snapshot.accessIndex === index && snapshot.phase === 'fault') ? '缺页' : '命中'}</td><td>${completed.victim ?? '无'}</td><td>${completed.frames.map(frame => frame.page ?? '空').join(' / ')}</td></tr>`).join('') || '<tr><td colspan="4">尚无完成的访问</td></tr>'}</tbody></table>`;
    }
    root.querySelector('#rp-summary').textContent = position === 0 ? '三种策略的页框均为空，尚未发起访问。' : position === comparisonAccesses.length ? `本序列完成：OPT / FIFO / LRU 缺页 ${Object.values(comparison).map(run => run.completed.at(-1).faults).join(' / ')} 次。观察结果只针对当前序列和页框数。` : '三种策略已完成同一次访问，驻留的页面可能不同；后续访问可能因此发生不同的缺页。';
    highlight();
  });
  const rebuildComparison = () => {
    comparisonAccesses = scenarios[root.querySelector('#rp-scenario').value].accesses;
    const capacity = Number(root.querySelector('#rp-capacity').value);
    comparison = Object.fromEntries(Object.keys(policies).map(id => [id, buildRun(id, comparisonAccesses, capacity)]));
    root.querySelector('#rp-sequence').innerHTML = sequence(comparisonAccesses, 'data-rp-access');
    compareControl.rebuild(comparisonAccesses.length + 1);
  };
  let clockRun;
  const clockControl = playback('rp-clock', position => {
    const step = clockRun.snapshots[position];
    const access = clockRun.accesses[step.accessIndex];
    root.querySelector('#rp-clock-progress').textContent = `阶段 ${position + 1} / ${clockRun.snapshots.length}${access ? ` · 第 ${step.accessIndex + 1} 次访问 · 页 ${access.page}${access.write ? ' 写' : ' 读'}` : ''}`;
    root.querySelector('#rp-clock-phase').textContent = phaseNames[step.phase];
    root.querySelector('#rp-clock-reason').textContent = step.reason;
    root.querySelector('#rp-clock-pending').textContent = step.phase === 'initial' ? '尚无访问请求' : step.phase === 'access' ? '本次访问已完成' : '本次访问尚未完成';
    root.querySelector('#rp-clock-frames').innerHTML = frameMarkup(step, true);
    root.querySelector('#rp-clock-metrics').innerHTML = metrics(step);
    root.querySelector('#rp-clock-pointer').textContent = `指针当前指向框 ${step.hand}。扫描顺序：0 → 1 → 2 → 0。选中框与指针位置可能不同：清位和载入后指针已前进。`;
    root.querySelector('#rp-clock-backing').innerHTML = `<strong>后备存储</strong><span>${step.phase === 'writeback' ? `页 ${step.victim} 的修改正在写回，旧页仍占据页框。` : step.phase === 'written' ? `页 ${step.victim} 的后备副本已更新。` : step.phase === 'load' ? `页 ${access.page} 的内容已载入选中页框。` : '非驻留页面保留可载入的副本；驻留脏页的最新修改仍在内存。'}</span>`;
    root.querySelectorAll('[data-rp-clock-access]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.rpClockAccess) === step.accessIndex)));
    const focusedPhase = document.activeElement?.dataset.rpPhase;
    root.querySelector('#rp-clock-phases').innerHTML = clockRun.snapshots.map((snapshot, index) => ({snapshot, index})).filter(({snapshot}) => snapshot.accessIndex === step.accessIndex).map(({snapshot, index}) => `<button type="button" data-rp-phase="${index}" aria-pressed="${position === index}">${phaseNames[snapshot.phase]}${snapshot.phase === 'clear' ? ` · 框 ${snapshot.selected}` : ''}</button>`).join('');
    if (focusedPhase !== undefined) root.querySelector(`[data-rp-phase="${focusedPhase}"]`)?.focus({preventScroll: true});
    highlight();
  });
  const rebuildClock = () => {
    clockRun = buildRun('clock', scenarios[root.querySelector('#rp-clock-scenario').value].accesses);
    root.querySelector('#rp-clock-sequence').innerHTML = sequence(clockRun.accesses, 'data-rp-clock-access');
    clockControl.rebuild(clockRun.snapshots.length);
  };
  root.querySelector('#rp-scenario').addEventListener('change', rebuildComparison);
  root.querySelector('#rp-capacity').addEventListener('change', rebuildComparison);
  root.querySelector('#rp-clock-scenario').addEventListener('change', rebuildClock);
  root.querySelector('#rp-sequence').addEventListener('click', event => { const button = event.target.closest('[data-rp-access]'); if (button) compareControl.seek(Number(button.dataset.rpAccess) + 1); });
  root.querySelector('#rp-clock-sequence').addEventListener('click', event => { const button = event.target.closest('[data-rp-clock-access]'); if (button) clockControl.seek(clockRun.snapshots.findIndex(step => step.accessIndex === Number(button.dataset.rpClockAccess))); });
  root.querySelector('#rp-clock-phases').addEventListener('click', event => { const button = event.target.closest('[data-rp-phase]'); if (button) clockControl.seek(Number(button.dataset.rpPhase)); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { compareControl.pause(); clockControl.pause(); cancelAnimations(); } });
  window.addEventListener('pagehide', () => { compareControl.pause(); clockControl.pause(); cancelAnimations(); });
  motion.addEventListener('change', event => { if (event.matches) cancelAnimations(); });
  rebuildComparison();
  rebuildClock();
}

renderReplacementPage(document.getElementById('root'));