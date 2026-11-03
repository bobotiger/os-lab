(() => {
  const U = OSLabConcurrencyStage2UI, M = OSLabConcurrentStructures, transport = OSLabConcurrencyUI.transport;
  U.shell('concurrentStructures', [{href: '#granularity', title: '锁的粒度'}, {href: '#design', title: '保护范围'}, {href: '#approximation', title: '近似计数（拓展）'}], `
    <section class="intro"><p class="eyebrow">并发 / 数据结构</p><h1>并发数据结构</h1><p class="lead">并发数据结构既要保证多个线程<span class="read-keep">共同操作</span>时结果正确，也要控制<span class="read-keep">同步开销</span>。</p><p class="definition">用一把锁保护整个结构，是清楚、易验证的起点。当锁竞争成为瓶颈时，可以考虑分别保护独立的数据，或减少对全局共享数据的更新。这些改进都需要保持结果正确。</p></section>
    <section class="cc-section" id="granularity"><h2>锁的粒度</h2><p class="cc-intro-text">锁的粒度是指一把锁保护的数据范围。哈希表按键把数据分到不同的组，称为“桶”。整表共用一把锁时，访问不同桶也会相互等待；每桶分别加锁时，不同线程可以同时操作不同的桶。</p>
      <div class="cc-preset" role="group" aria-label="哈希表访问分布"><span>两个线程的访问位置</span><button data-hash="separate" aria-pressed="true">不同的桶</button><button data-hash="hot" aria-pressed="false">同一个桶</button></div>
      <p class="cc-conditions" id="hash-conditions"></p>
      <div id="hash-demo"><div class="c2-hash-comparison">${['table','bucket'].map((id, i) => `<section class="c2-hash-panel"><h3>${i ? '每个桶一把锁' : '整张表一把锁'}</h3><div id="hash-${id}"></div><p class="c2-panel-log" id="hash-log-${id}" aria-live="polite"></p></section>`).join('')}</div>${transport('hash')}<p class="cc-result" id="hash-result"></p></div>
      <details class="cc-details"><summary>比较条件与适用范围</summary><p>哈希表固定为 4 个桶，桶号为“键除以 4 的余数”。两个线程各插入一个不同的键。每轮依次为 A、B 各推进一个操作：获取锁、插入、释放锁；获取失败则停在入口。轮次表示观察顺序，不是 CPU 时间或真实性能测量。</p><p>这里没有扩容、删除或跨桶操作，各桶之间没有需要同步修改的公共元数据。如果一次操作需要修改多个桶，或需要维护整张表的大小、扩容状态，就必须重新设计保护范围与获取锁的次序。</p></details>
    </section>
    <section class="cc-section" id="design"><h2>数据关系决定锁的范围</h2><div class="c2-editorial-pair"><div><h3>跨桶操作与公共数据</h3><p>上面的插入只修改一个桶，所以每桶一把锁可以工作。若一次操作要把元素从桶 1 移到桶 2，就要协调两个桶；若插入还要修改整表元素总数，也必须保护这个公共计数。锁的范围由整次操作需要保持的数据关系决定。</p></div><div><h3>细分锁的收益与成本</h3><p>不同线程访问独立数据时，拆分锁可能减少等待；访问集中在同一位置时，细分锁未必有用。更多锁还会增加存储、获取与维护成本，复杂方案需要与简单方案在相同负载下比较。</p></div></div></section>
    <section class="cc-section" id="approximation"><div class="c2-extension-heading"><span>性能拓展</span><a href="condition-variables.html">先学习条件变量 →</a></div><h2>近似计数与同步开销</h2><p class="cc-intro-text">一个全局计数器即使加锁正确，也可能成为多个 CPU 反复争用的位置。近似计数让各 CPU 先在本地累计，达到阈值后再合并到全局。更新时争用全局锁的次数减少，但读取全局值可能暂时少于实际完成的更新数。</p>
      <div class="cc-preset" role="group" aria-label="本地计数合并阈值"><span>本地合并阈值</span>${[1,2,4].map(n => `<button data-threshold="${n}" aria-pressed="${n === 4}">${n} 次更新</button>`).join('')}</div>
      <p class="cc-conditions">共同工作量：两个 CPU 各更新 6 次，共 12 次。只比较全局锁获取次数和计数差额，不把动画速度当作执行性能。</p>
      <div id="approx-demo"><div class="c2-counter-layout"><div class="c2-local-counters" id="approx-locals"></div><div class="c2-transfer"><span aria-hidden="true">→</span><span>达到阈值后合并</span></div><div class="c2-global-counter"><span>读取全局计数得到</span><strong id="approx-global">0</strong><span id="approx-lag"></span></div></div>
      <div class="c2-stat-row"><div><span>实际已完成的更新</span><strong id="approx-total">0 / 12</strong></div><div><span>每次更新全局计数</span><strong id="approx-direct">0 次全局加锁</strong></div><div><span>本地累计后合并</span><strong id="approx-merges">0 次全局加锁</strong></div></div>
      <div class="cc-log" role="status"><span id="approx-action"></span><p id="approx-log"></p></div>${transport('approx')}<p class="cc-result" id="approx-result"></p></div>
      <details class="cc-details"><summary>计数没有丢失，读数仍可能不精确</summary><p>本例实际总数等于全局计数加上两个本地计数。每次本地更新仍使用本地锁，合并还需要全局锁；减少的是全局锁的竞争，并非完全取消同步。两个数之间的转移作为一个合并步骤展示。</p><p>阈值为 4 时，每个 CPU 完成 6 次更新后，会留下 2 次尚未合并的本地更新。全局读数为 8，实际总数为 12。停止更新后可以汇总剩余值；如果更新仍在进行，精确读取需要额外协调，不能随意读取各处数值就声称得到了同一时刻的总数。</p></details>
    </section>
`);
  let workload = 'separate', threshold = 4;
  const hash = U.timeline('hash', () => {
    const a = M.hashTrace('table', workload), b = M.hashTrace('bucket', workload);
    return Array.from({length: Math.max(a.length, b.length)}, (_, i) => ({table: a[Math.min(i,a.length-1)], bucket: b[Math.min(i,b.length-1)]}));
  }, (frame, index, frames) => {
    document.getElementById('hash-conditions').textContent = `A 插入键 4 → 桶 0；B 插入键 ${workload === 'hot' ? '8 → 桶 0' : '9 → 桶 1'}。两组插入相同的键，只改变锁的保护范围。`;
    for (const scope of ['table', 'bucket']) {
      const s = frame[scope];
      document.getElementById(`hash-${scope}`).innerHTML = `${scope === 'table' ? `<div class="c2-table-lock ${s.locks[0]?'c2-held':''}">整表锁：<b>${s.locks[0] ? `${s.locks[0]} 持有` : '空闲'}</b></div>` : '<div class="c2-scope-note">每把锁只保护对应的桶</div>'}<div class="c2-buckets">${s.buckets.map((items,i) => `<div class="c2-bucket"><span>桶 ${i}</span>${scope === 'bucket' ? `<small class="c2-bucket-lock ${s.locks[i]?'c2-held':''}"><span>桶锁</span><b>${s.locks[i] ? `${s.locks[i]} 持有` : '空闲'}</b></small>` : ''}<div class="c2-keys">${items.length ? items.map(k=>`<b>${k}</b>`).join('') : '<span>空</span>'}</div></div>`).join('')}</div><div class="c2-thread-status">${s.threads.map(t=>`<p><b>${t.id}</b><span>${t.status}</span></p>`).join('')}</div><div class="c2-compact-metrics"><span>已完成 <b>${s.completed} / 2</b></span><span>受阻的获取尝试 <b>${s.blocked}</b></span></div>`;
      document.getElementById(`hash-log-${scope}`).textContent = s.log;
    }
    document.getElementById('hash-result').textContent = index === frames.length-1 ? (workload === 'separate' ? '不同桶的插入不需要相互排斥。按桶加锁消除了本例中无必要的等待，同时仍保护每个桶的内部修改。' : '两个线程访问同一个桶，仍需要使用同一把锁。拆分其他桶的锁，不能消除这个热点上的竞争。') : '观察锁的持有者与线程状态：访问不同数据，是否仍被同一把锁挡住。';
  });
  const approx = U.timeline('approx', () => M.counterTrace(threshold), (s,index,frames) => {
    document.getElementById('approx-locals').innerHTML = s.locals.map((n,i)=>`<div class="${s.cpu === i ? 'c2-current' : ''}"><span>CPU ${i} 的本地累计</span><strong>${n}</strong><div class="c2-count-dots" aria-label="本地有 ${n} 次未合并更新">${Array.from({length:threshold},(_,j)=>`<i class="${j<n?'c2-dot-filled':''}"></i>`).join('')}</div></div>`).join('');
    for (const [id,value] of Object.entries({'approx-global':s.global,'approx-lag':`尚未合并 ${s.total-s.global} 次更新`,'approx-total':`${s.total} / 12`,'approx-direct':`${s.total} 次全局加锁`,'approx-merges':`${s.merges} 次全局加锁`,'approx-action':s.cpu === null ? '初始状态' : `CPU ${s.cpu} · ${s.phase === 'merge' ? '合并到全局' : '本地更新'}`,'approx-log':s.log})) document.getElementById(id).textContent=value;
    document.getElementById('approx-result').textContent=index===frames.length-1?`12 次更新已完成。阈值为 ${threshold} 时，全局加锁 ${s.merges} 次，当前全局值为 ${s.global}。${s.total>s.global?'差额保留在本地，不能把全局读数直接当作精确总数。':'结束时没有未合并更新；运行过程中的本地更新与合并之间仍可能有短暂差额。'}`:'提高阈值会减少全局合并次数，也允许更多更新暂时留在本地。';
  });
  U.choose('[data-hash]', b=>{workload=b.dataset.hash;hash.reload();}); U.choose('[data-threshold]',b=>{threshold=Number(b.dataset.threshold);approx.reload();});
})();
