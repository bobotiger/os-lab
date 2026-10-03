function renderFreeSpacePage(root) {
  const {policies, buildStory, buildSelection} = OSLabFreeSpace;
  const story = buildStory();
  const transport = prefix => `<div class="rr-transport" role="group" aria-label="${prefix === 'fs-story' ? '合并与拆分' : '策略对照'}演示控制"><button type="button" class="icon-button primary" id="${prefix}-play" aria-label="播放" title="播放" aria-pressed="false"><span aria-hidden="true">▶</span></button><button type="button" class="icon-button" id="${prefix}-next" aria-label="下一阶段" title="下一阶段"><span aria-hidden="true">↦</span></button><button type="button" class="icon-button" id="${prefix}-reset" aria-label="重新开始" title="重新开始"><span aria-hidden="true">↺</span></button></div><label>播放速度<select id="${prefix}-speed"><option value="1600">慢速</option><option value="1000" selected>正常</option><option value="500">快速</option></select></label>`;
  const legend = '<div class="fs-legend"><span class="fs-key-free">空闲</span><span class="fs-key-object">原有活对象</span><span class="fs-key-new">新对象 N</span><span class="fs-key-scan">已检查表项</span></div>';
  root.innerHTML = `<div class="page rr-page fs-page" id="top">
    ${wikiHeader('freeSpace', [{href: '#story', title: '合并与拆分'}, {href: '#metadata', title: '空闲记录'}, {href: '#policies', title: '选择策略'}, {href: '#limits', title: '机制边界'}])}
    <main><section class="intro"><p class="eyebrow">内存虚拟化 / 分配与回收</p><h1>空闲空间管理 <span>Free-Space Management</span></h1><p class="lead">空闲总量足够，仍可能没有满足请求的连续空闲块。</p><p class="definition">空闲块是一段可供分配的连续地址范围，分配器记录它的起点和长度。申请空间时，分配器选择足够大的块，将请求部分分配出去，剩余部分继续保持空闲，这称为拆分。释放后，相邻的空闲块可以合并；隔着仍在使用的对象的块则不能直接合并。</p><p class="model-note">示例采用库分配器管理的虚拟堆，地址为堆内偏移，长度使用示意单位。长度只计可分配空间，块头与对齐开销另计；分配按请求长度精确拆分，活对象位置保持不变。</p></section>
      <section class="rr-rules" id="story" aria-labelledby="fs-story-title"><div class="section-heading"><div><p class="section-index">01 / FREE · COALESCE · SPLIT</p><h2 id="fs-story-title">释放、合并与拆分如何改变空闲块</h2></div><p>申请 6 / 虚拟堆长 12</p></div>
        <div class="rr-toolbar fs-toolbar">${transport('fs-story')}</div>
        <ol class="fs-steps">${story.map((frame, index) => `<li><button type="button" data-story-stage="${index}" aria-pressed="false"><span>${index + 1}</span>${frame.label}</button></li>`).join('')}</ol>
        <div class="fs-story-workbench"><div class="fs-story-view"><h3>虚拟堆布局 · [0, 12)</h3><p class="fs-caption">整条为 12 单位；块内数字为长度，下面是地址边界。</p><div id="fs-story-map"></div>${legend}<dl class="fs-stats" id="fs-story-stats"></dl><div id="fs-story-list"></div><p class="fs-objects" id="fs-story-objects"></p></div>
          <aside class="fs-story-event" aria-live="polite" aria-atomic="true"><p class="detail-kicker" id="fs-story-label"></p><h3 id="fs-story-event-title"></h3><p id="fs-story-text"></p><p class="fs-outcome" id="fs-story-result"></p></aside></div>
        <input id="fs-story-position" type="range" min="0" max="5" value="0" step="1" aria-label="合并与拆分阶段">
      </section>
      <section class="rr-rules fs-section" id="metadata"><p class="section-index">02 / RECORD THE RANGES</p><h2>空闲列表记的是区间，不只是剩余容量</h2><div class="fs-notes"><article><h3>起点 + 长度</h3><p>表项 [0, 4) 表示从偏移 0 开始、长度 4，末端 4 不包含在块内。空闲列表按虚拟地址顺序排列；列表中相邻的表项不一定对应相邻区间，连续虚拟区间也不保证物理页连续。</p></article><article><h3>怎样知道释放多大？</h3><p>分配器需要保存块大小等元数据，常见方式是在返回指针之前放块头，也可采用其他结构。可分配长度与元数据开销是不同部分；程序不能用任意内部地址调用 free。</p></article><article><h3>合并更新记录，不搬对象</h3><p>左块起点加长度恰好等于右块起点，且两块都空闲，才能合并。释放后可能立即合并，也可能延迟处理。合并改变可用块的连续长度，不增加空闲总量。</p></article></div></section>
      <section class="rr-rules fs-section" id="policies" aria-labelledby="fs-policies-title"><div class="section-heading"><div><p class="section-index">03 / SAME REQUEST · DIFFERENT CHOICES</p><h2 id="fs-policies-title">同一布局，应该从哪块分配？</h2></div><p>虚拟堆长 32 / 空闲 8、4、12</p></div>
        <div class="rr-toolbar fs-toolbar">${transport('fs-compare')}<label>请求长度<input id="fs-request" type="number" min="1" max="16" step="1" value="3" inputmode="numeric" aria-describedby="fs-request-note fs-input-error"></label></div><p class="fs-caption" id="fs-request-note">每列从同一预设布局独立开始，按地址顺序搜索，大小并列选低地址块；选中后从低地址端分配。默认请求 3，三种策略分别选中 8、4、12 的块。</p><p class="fs-error" id="fs-input-error" role="alert" hidden></p>
        <div id="fs-compare-content">${legend}<div class="fs-policies">${Object.entries(policies).map(([id, policy]) => `<section class="fs-policy" id="fs-policy-${id}" aria-labelledby="fs-policy-${id}-title"><h3 id="fs-policy-${id}-title">${policy.title}<span>${policy.name}</span></h3><p class="fs-policy-rule">${policy.rule}</p><p class="fs-policy-progress" id="fs-${id}-progress"></p><div id="fs-${id}-map"></div><p class="fs-policy-event" id="fs-${id}-event" aria-live="polite"></p><div id="fs-${id}-list"></div><dl class="fs-stats" id="fs-${id}-stats"></dl><p class="fs-policy-result" id="fs-${id}-result"></p></section>`).join('')}</div><input id="fs-compare-position" type="range" min="0" max="5" value="0" step="1" aria-label="策略对照阶段"><p class="fs-comparison" id="fs-comparison" aria-live="polite"></p><p class="fs-caption">三种策略从相同的初始布局分别申请，搜索次数可能不同。表项检查次数衡量列表搜索的工作量，不是实际耗时。</p></div>
      </section>
      <section class="rr-rules fs-section" id="limits"><p class="section-index">04 / FRAGMENTATION AND TRADEOFFS</p><h2>分配策略对外部碎片的影响与局限</h2><p class="fs-caption">不同策略会留下大小和位置不同的空闲块，影响后续请求能否得到满足。但被活对象隔开的空闲块仍不能直接合并，因此选择策略不能保证消除外部碎片。</p><div class="fs-notes"><article><h3>Best Fit 并非总是最好</h3><p>默认请求 3，Best Fit 从 4 中留下 1，另两种策略留下 5 或 9。这一小块可能难以满足后续请求；哪个布局更合适取决于之后的申请和释放，不能用一次选择给策略排总名次。</p></article><article><h3>外部碎片与内部浪费</h3><p>空闲总量足够，却分散在不能拼接的区间，是外部碎片。对齐、大小类别或分配多于请求的空间，则可能造成内部浪费。按请求精确拆分后留下的空闲余块，不属于已分配块内部的浪费。</p></article><article><h3>合并不等于紧凑搬移</h3><p>合并只处理相邻空闲块。跨过活对象去集中空间需要搬动对象并处理引用；普通 C 分配器不能任意移动仍由裸指针引用的对象。OS 搬移物理段可借助重定位保持虚拟地址，是另一层问题。</p></article></div><div class="fs-further"><h3>其他组织方式的取舍</h3><p>Next Fit 从上次搜索位置继续；分离空闲列表按大小组织候选，以减少搜索；伙伴系统使用二次幂块并按伙伴关系拆分、合并。分配器还可能向 OS 获取更多虚拟空间。这些选择分别影响搜索成本、空闲块的大小与分布和管理开销。</p><p>分页按固定大小管理页框，可以避免这一层的变长外部碎片；但页内的 malloc 对象仍可大小不一，所以有了分页也仍然需要堆分配器。</p></div></section>
      ${wikiRelated('freeSpace')}
    </main><footer><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer></div>`;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const map = (frame, capacity) => `<div class="fs-map" style="--fs-capacity:${capacity}" role="img" aria-label="${frame.blocks.map(block => `[${block.start}, ${block.start + block.size})，${block.owner === null ? '空闲' : '对象 ' + block.owner}，长度 ${block.size}`).join('；')}">${frame.blocks.map(block => `<div class="fs-block ${block.owner === null ? 'fs-free' : block.owner === 'N' ? 'fs-new' : 'fs-object'}${frame.selected === block.start ? ' fs-selected' : ''}" style="grid-column:${block.start + 1} / span ${block.size}" title="[${block.start}, ${block.start + block.size}) · ${block.owner ?? '空闲'} · 长度 ${block.size}"><span>${block.size >= 4 ? block.size : ''}</span></div>`).join('')}</div><div class="fs-map-ends"><span>0</span><span>${capacity} · 不包含</span></div>`;
  const list = frame => `<table class="fs-list"><caption>空闲列表 · 地址从低到高</caption><thead><tr><th scope="col">起点</th><th scope="col">长度</th><th scope="col">区间</th></tr></thead><tbody>${frame.freeList.length ? frame.freeList.map(block => `<tr class="${frame.inspected.includes(block.start) ? 'fs-inspected' : ''}${frame.selected === block.start ? ' fs-chosen' : ''}"><th scope="row">${block.start}</th><td>${block.size}</td><td>[${block.start}, ${block.start + block.size})</td></tr>`).join('') : '<tr><td colspan="3">没有空闲块</td></tr>'}</tbody></table>`;
  const stats = (frame, entries = false) => `<div><dt>空闲总量</dt><dd>${frame.totalFree}</dd></div><div><dt>最大连续空闲</dt><dd>${frame.largestRun}</dd></div>${entries ? `<div><dt>最大空闲表项</dt><dd>${frame.largestEntry}</dd></div>` : ''}`;
  const result = frame => frame.outcome === 'failed' ? '申请失败 · 没有返回可用位置' : frame.result ? `申请成功 · N @ ${frame.result.start}，长度 ${frame.result.size}` : frame.outcome === 'released' ? 'A 已释放 · 尚未完成合并' : '尚未分配新对象';
  const cancelHighlights = () => root.querySelectorAll('.fs-map').forEach(node => node.getAnimations({subtree: true}).forEach(animation => animation.cancel()));
  const highlight = () => { cancelHighlights(); if (!motion.matches) root.querySelectorAll('.fs-selected').forEach(node => node.animate([{opacity: .45}, {opacity: 1}], {duration: 220})); };
  const playback = (prefix, render) => {
    let stage = 0;
    let length = 1;
    let valid = true;
    let timer = null;
    const playButton = root.querySelector(`#${prefix}-play`);
    const nextButton = root.querySelector(`#${prefix}-next`);
    const position = root.querySelector(`#${prefix}-position`);
    const speed = root.querySelector(`#${prefix}-speed`);
    const pause = () => { clearInterval(timer); timer = null; playButton.setAttribute('aria-pressed', 'false'); playButton.setAttribute('aria-label', '播放'); playButton.title = '播放'; playButton.firstElementChild.textContent = '▶'; };
    const seek = value => {
      stage = Math.max(0, Math.min(length - 1, value));
      playButton.disabled = !valid || stage === length - 1;
      nextButton.disabled = !valid || stage === length - 1;
      position.disabled = !valid;
      position.value = stage;
      position.setAttribute('aria-valuetext', `阶段 ${stage + 1} / ${length}`);
      if (valid) render(stage);
    };
    const advance = () => { if (stage + 1 >= length - 1) pause(); seek(stage + 1); };
    const play = () => { if (!valid || stage === length - 1) return; playButton.setAttribute('aria-pressed', 'true'); playButton.setAttribute('aria-label', '暂停'); playButton.title = '暂停'; playButton.firstElementChild.textContent = 'Ⅱ'; timer = setInterval(advance, Number(speed.value)); };
    playButton.addEventListener('click', () => timer === null ? play() : pause());
    nextButton.addEventListener('click', () => { pause(); advance(); });
    root.querySelector(`#${prefix}-reset`).addEventListener('click', () => { pause(); seek(0); });
    position.addEventListener('input', () => { pause(); seek(Number(position.value)); });
    speed.addEventListener('change', () => { if (timer !== null) { pause(); play(); } });
    return {pause, seek: value => { pause(); seek(value); }, rebuild: (count, enabled = true) => { pause(); length = count; valid = enabled; position.max = length - 1; seek(0); }};
  };
  const storyControl = playback('fs-story', stage => {
    const frame = story[stage];
    root.querySelector('#fs-story-map').innerHTML = map(frame, 12);
    root.querySelector('#fs-story-list').innerHTML = list(frame);
    root.querySelector('#fs-story-stats').innerHTML = stats(frame, true);
    root.querySelector('#fs-story-objects').textContent = `当前活对象：${frame.blocks.filter(block => block.owner !== null).map(block => `${block.owner} [${block.start}, ${block.start + block.size})`).join('；') || '无'}`;
    root.querySelector('#fs-story-label').textContent = `阶段 ${stage + 1} / ${story.length} · ${frame.label}`;
    root.querySelector('#fs-story-event-title').textContent = frame.title;
    root.querySelector('#fs-story-text').textContent = frame.text;
    root.querySelector('#fs-story-result').textContent = result(frame);
    root.querySelector('#fs-story-result').classList.toggle('fs-failed', frame.outcome === 'failed');
    root.querySelectorAll('[data-story-stage]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.storyStage) === stage)));
    highlight();
  });
  let runs = {};
  const compareControl = playback('fs-compare', stage => {
    const finals = [];
    for (const id of Object.keys(policies)) {
      const frames = runs[id];
      const localStage = Math.min(stage, frames.length - 1);
      const frame = frames[localStage];
      root.querySelector(`#fs-${id}-progress`).textContent = `阶段 ${localStage + 1} / ${frames.length} · 检查 ${frame.inspected.length} 个表项`;
      root.querySelector(`#fs-${id}-map`).innerHTML = map(frame, 32);
      root.querySelector(`#fs-${id}-event`).textContent = `${frame.title}。${frame.text}`;
      root.querySelector(`#fs-${id}-list`).innerHTML = list(frame);
      root.querySelector(`#fs-${id}-stats`).innerHTML = stats(frame);
      root.querySelector(`#fs-${id}-result`).textContent = result(frame);
      root.querySelector(`#fs-${id}-result`).classList.toggle('fs-failed', frame.outcome === 'failed');
      finals.push(frame);
    }
    root.querySelector('#fs-comparison').textContent = finals.every(frame => frame.complete) ? finals.every(frame => frame.result) ? `三种策略都分配 ${finals[0].request}，剩余总量同为 ${finals[0].totalFree}。所选块长分别为 ${Object.keys(policies).map(id => runs[id].at(-2).blocks.find(block => block.start === runs[id].at(-1).result.start).size).join('、')}，剩余空闲区间的位置和长度因此不同。后续请求能否满足，还取决于之后的申请和释放。` : '三种策略都找不到足够大的连续块。更换选择规则不能把被活对象隔开的空闲空间直接合并。' : '各列正在独立搜索或分配；空闲余块只有完成分配后才改变。';
    highlight();
  });
  const rebuildComparison = () => {
    const input = root.querySelector('#fs-request');
    const raw = input.value.trim();
    const request = Number(raw);
    const valid = raw !== '' && Number.isInteger(request) && request >= 1 && request <= 16;
    cancelHighlights();
    input.setAttribute('aria-invalid', String(!valid));
    root.querySelector('#fs-input-error').hidden = valid;
    root.querySelector('#fs-input-error').textContent = valid ? '' : '请输入 1–16 的整数请求长度；空值、小数或范围外输入不作为分配请求。';
    root.querySelector('#fs-compare-content').hidden = !valid;
    if (valid) runs = Object.fromEntries(Object.keys(policies).map(id => [id, buildSelection(id, request)]));
    compareControl.rebuild(valid ? Math.max(...Object.values(runs).map(frames => frames.length)) : 1, valid);
  };
  root.querySelector('#fs-request').addEventListener('input', rebuildComparison);
  root.querySelector('.fs-steps').addEventListener('click', event => { const button = event.target.closest('[data-story-stage]'); if (button) storyControl.seek(Number(button.dataset.storyStage)); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { storyControl.pause(); compareControl.pause(); } });
  window.addEventListener('pagehide', () => { storyControl.pause(); compareControl.pause(); });
  motion.addEventListener('change', event => { if (event.matches) cancelHighlights(); });
  storyControl.rebuild(story.length);
  rebuildComparison();
}

renderFreeSpacePage(document.getElementById('root'));