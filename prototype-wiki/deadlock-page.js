(() => {
  const U=OSLabConcurrencyStage2UI,M=OSLabDeadlock;
  U.shell('deadlock',[{href:'#dependencies',title:'资源依赖'},{href:'#conditions',title:'必要条件'},{href:'#responses',title:'处理思路'}],`
    <section class="intro"><p class="eyebrow">并发 / 资源等待</p><h1>死锁</h1><p class="lead">如果一组线程相互等待，谁都无法先释放其他线程需要的资源，这组线程就陷入了死锁（deadlock）。</p><p class="definition">如果持锁线程还能继续执行，等待者就有机会在它释放锁后获得锁。图中的死锁是另一种情况。A 要等 B 放锁，B 也要等 A 放锁，两者都走不到释放锁的那一步。</p></section>
    <section class="cc-section" id="dependencies"><h2>锁的次序与循环等待</h2><p class="cc-intro-text">A、B 都要持有 L1 和 L2 才能工作。先观察各取一把锁后为什么停住，再让两个线程统一按 L1 → L2 获取锁，比较资源依赖的变化。</p>
      <div class="cc-preset" role="group" aria-label="获取锁的规则"><button data-dead-policy="opposite" aria-pressed="true">相反次序</button><button data-dead-policy="ordered" aria-pressed="false">统一次序</button></div><p class="cc-conditions" id="dead-orders"></p>
      <div class="cc-preset" role="group" aria-label="调度次序"><span>线程执行次序</span><button data-dead-order="interleaved" aria-pressed="true">交替推进</button><button data-dead-order="serial" aria-pressed="false">A 完成后 B 执行</button></div>
      <div id="dead-demo"><div class="c3-lock-layout"><div class="c3-pair" id="dead-threads"></div><div class="c3-dependencies" id="dead-edges"></div></div><div class="c3-inline-stats"><span>已完成操作 <b id="dead-completed">0 / 2</b></span><span>等待关系 <b id="dead-edge-count">0</b></span></div><div class="cc-log" role="status"><span id="dead-action"></span><p id="dead-log"></p></div>${OSLabConcurrencyUI.transport('dead')}<p class="cc-result" id="dead-result"></p></div>
      <p class="cc-conditions">每把锁只有一份，只能由持有者正常释放；线程不主动撤销操作。箭头从等待线程指向锁的持有者，标明所等待的锁。步骤表示执行次序，不表示真实耗时。</p>
    </section>
    <section class="cc-section" id="conditions"><h2>死锁的四个必要条件</h2><div class="c3-conditions"><div><h3>互斥</h3><p>资源不能同时被多个线程占用。本例同一把锁只能有一个持有者。</p></div><div><h3>持有并等待</h3><p>等待新资源时，仍保留已经取得的资源。本例等待第二把锁时没有释放第一把。</p></div><div><h3>不可剥夺</h3><p>资源不能被外部强行取走。本例必须由持锁线程执行释放操作。</p></div><div><h3>循环等待</h3><p>循环等待（circular wait）指等待关系形成一个环。本例 A 等 B 释放锁，B 又等 A 释放锁。</p></div></div><p class="cc-takeaway">破坏任一必要条件，都能排除相应的死锁。统一获取锁的次序，排除的是<strong>循环等待</strong>，不要求线程从此完全没有等待。</p><details class="cc-details"><summary>等待环的适用范围</summary><p>本例每种资源只有一个实例，形成这样的等待环足以判定死锁。如果一种资源有多个可替代实例，仅凭图上有环还不能判定，需要继续分析其他实例能否满足请求。</p></details></section>
    <section class="cc-section" id="responses"><h2>死锁的预防与恢复</h2>
      <table class="cc-reference-table"><thead><tr><th scope="col">办法</th><th scope="col">对等待关系的影响</th></tr></thead><tbody>
        <tr><th scope="row">统一次序</th><td>都先取 L1 再取 L2。B 等 L1 时没有占住 L2，A 可以继续完成，排除了<strong>循环等待</strong>。所有路径都要遵守资源本身的顺序，不能只依赖函数参数的排列。</td></tr>
        <tr><th scope="row">释放重试</th><td>用非阻塞的尝试获取第二把锁；失败时释放第一把，再重试。线程不会持有第一把锁阻塞在第二把锁上，打断了本例的相互等待。不过反复冲突可能导致活锁，仍需安排退避和重试。</td></tr>
        <tr><th scope="row">检测恢复</th><td>允许等待形成环，再选择可撤销的操作回滚并释放资源。这是在死锁发生后<strong>恢复</strong>，不是预防；不能任意替别的线程解锁，否则可能暴露未完成的数据修改。</td></tr>
      </tbody></table>
      <details class="cc-details"><summary>避免死锁与减少并发</summary><p>若系统预先知道任务的资源需求，可以推迟某些资源分配，避免进入无法保证完成的状态。这类方法依赖准确的需求信息，也可能降低并发程度。线程内部的锁通常难以提前完整申报，因此需要结合实际系统选择方法。</p></details>
      <div class="c3-pair c3-editorial"><div><h3>活锁</h3><p>活锁（livelock）中的线程仍在执行，但反复重试或让步，工作一直没有进展。</p></div><div><h3>饥饿</h3><p>饥饿（starvation）指其他线程能够继续工作，某个线程却长期得不到需要的资源。</p></div></div>
    </section>`);
  document.querySelector('.cc-page').classList.add('c3-page');
  let policy='opposite',order='interleaved';
  const player=U.timeline('dead',()=>M.trace(policy,order),(s,index,frames)=>{
    const edges=M.dependencies(s);document.getElementById('dead-demo').classList.toggle('c3-error',s.deadlock);
    document.getElementById('dead-orders').textContent=policy==='opposite'?'A：L1 → L2；B：L2 → L1。':'A、B 均为：L1 → L2。工作内容与所需资源保持不变。';
    document.getElementById('dead-threads').innerHTML=Object.entries(s.threads).map(([who,t])=>`<section class="c3-thread"><h3>线程 ${who}</h3><span class="c3-status">持有的锁</span><div class="c3-held-area">${Object.entries(s.locks).filter(([,owner])=>owner===who).map(([key])=>`<span class="c3-lock-token">${key}</span>`).join('')||'<span class="c3-status">无</span>'}</div><span class="c3-status">${t.done?'已完成并释放锁':t.wait?(s.locks[t.wait]?`等待 ${t.wait}`:`${t.wait} 已空闲，待重新获取`):t.pc===2?'可以执行操作':t.pc>=3?'操作完成，准备释放锁':'准备获取锁'}</span></section>`).join('');
    document.getElementById('dead-edges').classList.toggle('c3-cycle',s.deadlock);
    const description = edges.length ? edges.map(e => `${e.from} 等待 ${e.to} 持有的 ${e.lock}`).join('；') : '当前没有线程被另一线程持有的锁挡住。';
    document.getElementById('dead-edges').innerHTML=`<h3>${s.deadlock?'循环等待':'当前等待关系'}</h3><svg class="c3-wait-graph" viewBox="0 0 360 200" role="img" aria-label="${description}"><defs><marker id="dead-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="currentColor"/></marker></defs>${edges.map(e => `<path class="c3-dependency" data-from="${e.from}" data-to="${e.to}" d="${e.from === 'A' ? 'M63 82 C126 14 234 14 297 82' : 'M297 118 C234 186 126 186 63 118'}" marker-end="url(#dead-arrow)"/><text class="c3-edge-label" x="180" y="${e.from==='A'?20:194}" text-anchor="middle">等待 ${e.lock}</text>`).join('')}<g class="c3-node-A"><circle cx="45" cy="100" r="25"/><text x="45" y="108" text-anchor="middle">A</text></g><g class="c3-node-B"><circle cx="315" cy="100" r="25"/><text x="315" y="108" text-anchor="middle">B</text></g>${edges.length?'':'<text class="c3-no-wait" x="180" y="105" text-anchor="middle">暂无等待关系</text>'}</svg>`;
    document.getElementById('dead-completed').textContent=`${s.completed} / 2`;document.getElementById('dead-edge-count').textContent=edges.length;
    document.getElementById('dead-action').textContent=s.deadlock?'死锁已形成':s.actor?`${s.actor} · ${{lock:'获取锁',work:'执行操作',unlock:'释放锁'}[s.op]}`:'初始状态';
    document.getElementById('dead-log').textContent=s.log;
    document.getElementById('dead-result').textContent=s.deadlock?'继续等待不会解除这组依赖。重置并改用统一次序，观察等待的一方是否仍占住另一把锁。':index===frames.length-1?(policy==='opposite'?'本次依次执行没有死锁，但相反的获取次序仍有风险。切换为交替推进即可观察反例。':'两个线程都完成操作。B 可能等待 L1，但等待时没有占住 A 所需的 L2，因此没有形成环。'):'对照每个线程持有的锁和等待箭头，判断是否还有能够继续运行并释放资源的一方。';
  });
  U.choose('[data-dead-policy]',b=>{policy=b.dataset.deadPolicy;player.reload();});U.choose('[data-dead-order]',b=>{order=b.dataset.deadOrder;player.reload();});
})();
