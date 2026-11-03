(() => {
  const U = OSLabConcurrencyUI, M = OSLabConcurrency;
  document.getElementById('root').innerHTML = `<div class="page cc-page cc-locks-page" id="top">
    ${wikiHeader('locks', [{href: '#protection', title: '临界区'}, {href: '#mutex', title: '原子获取'}, {href: '#waiting', title: '自旋与阻塞'}, {href: '#implementation', title: '实现与取舍'}])}
    <main><section class="intro"><p class="eyebrow">并发 / 同步</p><h1>锁与互斥</h1><p class="lead">锁让访问同一份共享数据的<span class="read-keep">线程</span>，按互斥方式执行<span class="read-keep">临界区</span>。</p><p class="definition">线程进入临界区之前获取锁，离开时释放锁。锁被占用时，其他获取者需要等待。设计锁既要保证互斥，也要考虑等待的代价和获得锁的机会是否公平。</p></section>
      <section class="cc-section" id="protection" aria-labelledby="protection-title"><h2 id="protection-title">临界区与锁的保护范围</h2>
        <p class="cc-intro-text">两个线程各把 count 加 1 时，需要保护完整的“读取、计算、写回”。两者共用同一把锁：一个线程更新期间，另一个停在获取锁的位置，直到持锁者完成更新并释放锁。</p>
        <div class="cc-code-explainer"><pre><code>pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;

pthread_mutex_lock(&amp;mutex);
count = count + 1;
pthread_mutex_unlock(&amp;mutex);</code></pre><div><h3>两个线程遵守同一规则</h3><p><code>lock</code> 成功后进入临界区，<code>unlock</code> 结束保护范围。锁不会自动找到程序中的共享变量，所有相关访问都要遵守这套规则。</p><p>若只给读取和写回分别加锁，两个线程仍可能读到同一个旧值。保护范围必须覆盖这次更新的全过程。</p></div></div>
        <p class="cc-caption">示例省略错误处理；实际调用需要检查返回值，并在持锁后的各条退出路径上正确释放锁。</p>
      </section>
      <section class="cc-section" id="mutex" aria-labelledby="mutex-title"><h2 id="mutex-title">锁标志的检查与原子获取</h2>
        <p class="cc-intro-text">用一个标志记录“空闲”或“已占用”还不够：若检查与设置是两个操作，两个线程可能先后检查到空闲，随后都进入临界区。原子读改写操作把读取旧值与写入新值合为不可分割的一步，避免这个间隙。</p>
        <div class="cc-mode-tabs" role="group" aria-label="共享更新的保护方式"><button type="button" data-lock-mode="none" aria-pressed="false">不加锁</button><button type="button" data-lock-mode="naive" aria-pressed="false">先检查后占用</button><button type="button" data-lock-mode="atomic" aria-pressed="true">原子操作获取锁</button></div>
        <p class="cc-mode-explanation" id="lock-mode-note"></p>
        <p class="cc-conditions">沿用上一页的共享计数器：两个线程各执行一次 count 加 1；选择加锁方案时，两者共用同一把锁。</p>
        <div id="counter-demo"></div>
        <details class="cc-details"><summary>原子交换的获取规则</summary><pre><code>while (atomic_exchange(&amp;flag, 1) == 1) {
    /* 锁已被占用，继续尝试。 */
}
/* 临界区：读取、计算并写回 count。 */
atomic_store(&amp;flag, 0);</code></pre><p>flag 初值为 0。A 交换时写入 1、得到旧值 0，因此获取成功；B 随后交换，得到旧值 1，继续等待。只有 A 释放锁、把 flag 设回 0 后，其他线程才可能获取成功。这里用伪代码解释互斥；实际实现还需要正确的内存顺序，保证临界区中的数据对后续持锁者可见。</p><p>演示按简化的顺序执行模型推演。错误锁与无锁版本用于展示反例，不是可直接使用的 C 同步实现。</p></details>
        <p class="cc-takeaway"><strong>获取锁的操作必须可靠，临界区的范围也必须完整。</strong>原子获取解决两个线程同时闯入的问题；前一节的整段保护解决更新被拆开的风险。</p>
      </section>
      <section class="cc-section" id="waiting" aria-labelledby="waiting-title"><h2 id="waiting-title">自旋与阻塞</h2>
        <p class="cc-intro-text">自旋等待会反复检查锁，在运行时持续消耗 CPU。阻塞等待使线程进入阻塞状态，等待期间不参与 CPU 调度；被唤醒后重新就绪，等待获得 CPU 并继续获取锁。登记等待、唤醒和调度也有成本，持锁时间与 CPU 数量会影响两种方式的取舍。</p>
        <div class="cc-wait-settings"><div class="cc-preset" role="group" aria-label="CPU 核心数量"><span>CPU 数量</span><button type="button" data-cores="1" aria-pressed="true">单核</button><button type="button" data-cores="2" aria-pressed="false">双核</button></div><label>A 剩余工作量 <select id="wait-hold"><option value="1">1 单位</option><option value="4" selected>4 单位</option><option value="8">8 单位</option></select></label></div>
        <p class="cc-conditions" id="wait-conditions"></p>
        <div class="cc-wait-comparison">${['spin', 'block'].map((id, i) => `<section class="cc-wait-panel"><h3>${i ? '阻塞等待' : '自旋等待'}</h3><div class="cc-wait-state" id="wait-state-${id}"></div><div class="cc-lanes" id="wait-lanes-${id}"></div><dl class="cc-metrics"><div><dt>已用时间单位</dt><dd id="wait-time-${id}">0</dd></div><div><dt>等待管理占用 CPU</dt><dd id="wait-cost-${id}">0</dd></div></dl><p class="cc-wait-log" id="wait-log-${id}" aria-live="polite"></p></section>`).join('')}</div>
        <div class="cc-legend"><span><b class="cc-work-key">A / B</b>临界区工作</span><span><b class="cc-spin-key">旋</b>获取失败后自旋</span><span><b class="cc-overhead-key">眠 / 唤</b>阻塞登记 / 唤醒</span><span><b>获</b>成功获取锁</span><span><b>·</b>CPU 空闲</span></div>
        ${U.transport('wait')}<p class="cc-result" id="wait-result"></p>
        <details class="cc-details"><summary>比较条件与计量范围</summary><p>A 起初持有锁，完成指定的剩余工作后释放；B 需要获取锁，再执行 1 单位临界区工作。没有其他线程，临界区内没有 I/O。单核以 1 单位时间片轮流调度可运行的 A、B，并先让 B 尝试；双核分别运行 A 和 B。</p><p>每单位临界区工作、一次获取尝试各耗时 1 单位。阻塞版把首次失败与登记等待合计为 1 单位，释放后的唤醒另计 1 单位。为便于比较，唤醒计入 A 所在 CPU；省略其他切换与缓存成本。教学模型保证登记等待与唤醒正确配合，不模拟丢失唤醒。</p><p>“等待管理占用 CPU”累计失败尝试、阻塞登记和唤醒的 CPU 时间，不含共同需要的成功获取与临界区工作。时间单位用于推导本模型的结果，不代表真实硬件耗时，也不意味着所有互斥锁都按此实现。</p></details>
      </section>
      <section class="cc-section" id="implementation" aria-labelledby="implementation-title"><h2 id="implementation-title">锁的实现与评价</h2>
        <div class="cc-responsibilities"><div><h3>硬件</h3><p>提供原子读改写等指令，以及相应的内存顺序支持。它们是实现锁的基础，不会自动把一段程序变成正确的临界区。</p></div><div><h3>线程库</h3><p>封装锁的状态、获取与释放规则。没有竞争时，互斥锁可能在用户态完成操作；竞争时可以自旋、请求阻塞，或结合两者。</p></div><div><h3>操作系统</h3><p>在需要时阻塞与唤醒线程，并决定就绪线程何时获得 CPU。被唤醒只是恢复运行资格，不保证立即运行或获得锁。</p></div></div>
        <div class="cc-evaluation"><h3>正确性、公平性与性能</h3><p>互斥是基本要求，但能保证互斥的锁仍可能让某个线程长期得不到机会。简单的原子交换自旋锁不保证按等待先后获得锁。评价性能时，还要区分没有竞争、有竞争，以及线程数超过 CPU 数量的情况。</p><p>实际锁常结合多种办法：短暂自旋有机会避开阻塞开销；等待较长时再阻塞，可以减少无效的 CPU 占用。具体效果取决于工作负载和实现，不能只根据“自旋”或“阻塞”的名称判断。</p></div>
      </section>${U.references('locks')}${wikiRelated('locks')}
    </main><footer><span>OSLab · 并发</span><a href="#top">返回顶部 ↑</a></footer></div>`;
  const counter = U.interleaver(document.getElementById('counter-demo'), 'atomic');
  const notes = {none: '两个线程可以在读取、计算和写回之间交错，结果依赖执行次序。', naive: '检查标志和设置标志分为两步。交替执行时，两个线程会先后检查到空闲；到第 4 步，它们都已进入临界区。', atomic: '原子操作读取锁的旧值并设置占用标志。获取失败的线程留在入口处，持锁线程完成更新并释放后，其他线程才能进入。'};
  document.getElementById('lock-mode-note').textContent = notes.atomic;
  document.querySelectorAll('[data-lock-mode]').forEach(b => b.onclick = () => { counter.setMode(b.dataset.lockMode); document.querySelectorAll('[data-lock-mode]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); document.getElementById('lock-mode-note').textContent = notes[b.dataset.lockMode]; });
  let cores = 1, hold = 4, index = 0, traces, player;
  function build() { traces = Object.fromEntries(['spin', 'block'].map(strategy => [strategy, M.waitingTrace({strategy, cores, hold})])); index = 0; }
  const length = () => Math.max(...Object.values(traces).map(t => t.length));
  const labels = {waiting: '等待获取锁', blocked: '阻塞', inside: '已获得锁', done: '已完成'};
  function paint() {
    document.getElementById('waiting').dataset.step = index;
    document.getElementById('wait-conditions').textContent = `共同条件：A 持锁，还需 ${hold} 单位工作；B 获取锁后执行 1 单位工作。${cores === 1 ? '单核按 1 单位时间片轮流运行，先让 B 尝试。' : '双核分别运行 A、B。'}格子等宽，每格 1 单位时间。`;
    for (const strategy of ['spin', 'block']) {
      const s = traces[strategy][Math.min(index, traces[strategy].length - 1)];
      document.getElementById(`wait-state-${strategy}`).textContent = `A：${s.remaining ? `还剩 ${s.remaining} 单位工作` : '已释放锁'}　B：${labels[s.b]}`;
      document.getElementById(`wait-time-${strategy}`).textContent = `${s.time}${s.done ? ' · 已完成' : ''}`;
      document.getElementById(`wait-cost-${strategy}`).textContent = `${s.overhead} 单位`;
      document.getElementById(`wait-log-${strategy}`).textContent = s.done ? '本组已完成，两线程均已释放锁。' : s.log;
      document.getElementById(`wait-lanes-${strategy}`).innerHTML = s.lanes.map((lane, i) => `<div class="cc-lane"><span>CPU ${i + 1}</span><div class="cc-ticks" style="--ticks:${length() - 1}">${Array.from({length: length() - 1}, (_, t) => { const cell = lane[t]; return `<span class="cc-tick ${cell ? `cc-tick-${cell.kind}` : ''}" title="时间 ${t + 1}${cell ? `：${cell.label}` : s.done ? '：本组已完成' : '：尚未执行'}"${!s.done && t === s.time - 1 ? ' aria-current="step"' : ''}>${cell?.label || ''}</span>`; }).join('')}</div></div>`).join('');
    }
    document.getElementById('wait-progress').textContent = `${index} / ${length() - 1} 时间单位`;
    const a = traces.spin.at(-1), b = traces.block.at(-1);
    document.getElementById('wait-result').textContent = index === length() - 1
      ? (cores === 1 ? (hold === 1 ? `短暂持锁时，本模型自旋用 ${a.time} 单位完成，阻塞用 ${b.time} 单位。等待很短，阻塞与唤醒的固定成本反而更明显。` : `本模型自旋用 ${a.time} 单位完成，阻塞用 ${b.time} 单位。单核上 B 的反复尝试占用了 A 本可推进工作的时间；B 阻塞后，A 可以连续运行。`) : `双核上，自旋用 ${a.time} 单位完成，阻塞用 ${b.time} 单位。A 可以持续运行，自旋不再抢走 A 的 CPU，但 B 消耗了 ${a.failed} 单位 CPU 用于失败尝试；阻塞还需等待唤醒。`)
      : '两组完成相同的临界区工作。观察 B 等待期间是否占用 CPU，以及 A 释放锁后 B 还需要经过哪些步骤。';
    player?.paint();
  }
  build();
  player = U.player('wait', {next: () => { index++; paint(); }, prev: () => { index--; paint(); }, reset: () => { index = 0; paint(); }, atEnd: () => index === length() - 1, atStart: () => index === 0});
  document.querySelectorAll('[data-cores]').forEach(b => b.onclick = () => { player.stop(); cores = Number(b.dataset.cores); document.querySelectorAll('[data-cores]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); build(); paint(); });
  document.getElementById('wait-hold').onchange = e => { player.stop(); hold = Number(e.target.value); build(); paint(); };
  paint();
})();
