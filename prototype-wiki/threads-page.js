(() => {
  const U = OSLabConcurrencyUI;
  document.getElementById('root').innerHTML = `<div class="page cc-page" id="top">
    ${wikiHeader('threads', [{href: '#resources', title: '线程与资源'}, {href: '#lifecycle', title: '创建与等待'}, {href: '#interleaving', title: '共享更新'}])}
    <main>
      <section class="intro"><p class="eyebrow">并发 / 线程</p><h1>线程与并发</h1>
        <p class="lead">搜索文件时，程序可以一边扫描目录，一边响应你的输入。它可以让一个线程（thread）负责扫描，另一个线程处理输入。</p>
        <p class="definition">这里把扫描目录的叫作工作线程（worker thread），处理输入的叫作主线程（main thread）。两项工作在同一段时间内都能推进，这就是并发（concurrency）。</p>
        <details class="cc-details cc-learning-route"><summary>并发栏目的学习路线</summary><dl>
          <div><dt>硬件基础</dt><dd><a href="cpu-foundations.html">现代 CPU 的工作原理</a>从开关、指令与循环讲起，区分指令并行、硬件线程与多核，并解释性能规格。</dd></div>
          <div><dt>共享与互斥</dt><dd><a href="threads.html">线程与并发</a>说明执行交错怎样影响共享数据；<a href="locks.html">锁与互斥</a>解释怎样保护临界区。</dd></div>
          <div><dt>数据结构与协作</dt><dd><a href="concurrent-structures.html">并发数据结构</a>讨论锁的范围和开销；<a href="condition-variables.html">条件变量</a>与<a href="semaphores.html">信号量</a>处理等待和资源分配。</dd></div>
          <div><dt>正确性与死锁</dt><dd><a href="concurrency-bugs.html">并发错误</a>检查操作是否完整、次序是否正确；<a href="deadlock.html">死锁</a>分析相互等待怎样阻止程序继续。</dd></div>
          <div><dt>另一种组织方式</dt><dd><a href="events.html">事件驱动并发</a>介绍单个线程怎样交错处理请求，以及这种方式的适用范围。</dd></div>
          <div><dt>实践与检验</dt><dd>在<a href="linux-concurrency-labs.html#seats">Linux 并发验证实验</a>中，从抢座程序入手，比较分别加锁和保护完整操作的结果。</dd></div>
        </dl></details>
      </section>
      <section class="cc-section" id="resources" aria-labelledby="resources-title">
        <h2 id="resources-title">共享资源与独立执行上下文</h2>
        <p class="cc-intro-text">图中 A 和 B 属于同一个进程，可以通过相同的地址访问同一个全局变量。每个线程有自己的程序计数器和寄存器状态。切换线程时，系统保存前一个线程的状态，再恢复下一个线程的状态。这些供恢复执行的信息叫执行上下文（execution context）。</p>
        <figure class="cc-process-figure">
          <figcaption>一个进程，两个线程</figcaption>
          <div class="cc-contexts"><div class="cc-context cc-thread-a"><h3>线程 A</h3><p><span class="read-keep">程序计数器 A</span><span class="read-keep">寄存器 A</span></p><span><span class="read-keep">记录执行位置，</span><span class="read-keep">保存运算中间值</span></span></div><div class="cc-context cc-thread-b"><h3>线程 B</h3><p><span class="read-keep">程序计数器 B</span><span class="read-keep">寄存器 B</span></p><span><span class="read-keep">记录执行位置，</span><span class="read-keep">保存运算中间值</span></span></div></div>
          <div class="cc-address-space"><span class="cc-space-label">共同的地址空间</span><div class="cc-space-regions"><div><strong>代码</strong><span>两个线程都可执行</span></div><div><strong>全局数据与堆</strong><span>保存共享对象</span></div><div class="cc-stack-a"><strong>A 的栈</strong><span>A 的函数调用</span></div><div class="cc-stack-b"><strong>B 的栈</strong><span>B 的函数调用</span></div></div></div>
          <p class="cc-caption">两个栈都在同一个地址空间中。只要拿到有效指针，A 也能访问 B 的栈上仍然有效的对象。</p>
        </figure>
        <p class="cc-takeaway">一个线程等待磁盘时，其他就绪线程仍可运行；有多个核心时，可拆分的计算还能并行执行。线程共享数据，也带来了同步要求：<strong>两个线程都要修改一份数据时，需要协调它们的访问顺序。</strong></p><p class="cc-caption">核心与硬件线程怎样支持软件线程执行，见<a href="cpu-foundations.html#parallel">现代 CPU 的工作原理</a>。</p>
      </section>
      <section class="cc-section" id="lifecycle" aria-labelledby="lifecycle-title">
        <h2 id="lifecycle-title">线程的创建与等待</h2>
        <p class="cc-intro-text"><code>pthread_create</code> 在同一进程中创建线程，让它从指定函数开始执行。创建成功后，调用者与新线程谁先继续运行，由调度决定。调用者需要等待指定线程结束时，可以使用 <code>pthread_join</code>。</p>
        <div class="cc-preset" role="group" aria-label="线程完成次序"><span>选择执行次序</span><button type="button" data-life="early" aria-pressed="true">主线程先等待</button><button type="button" data-life="late" aria-pressed="false">工作线程先结束</button></div>
        <div class="cc-lifecycle"><div><h3>主线程</h3><code id="life-main-code"></code><p id="life-main-state"></p></div><div><h3>工作线程</h3><code id="life-worker-code"></code><p id="life-worker-state"></p></div></div>
        <div class="cc-log" role="status" aria-live="polite"><span id="life-action"></span><p id="life-log"></p></div>
        ${U.transport('life')}
        <p class="cc-takeaway">主线程可以在 <code>pthread_join</code> 成功返回后读取工作线程写好的结果。下面换一种情况，让两个工作线程在结束前都去修改同一个计数器，看看为什么还要保护更新过程。</p>
        <details class="cc-details"><summary>接口在程序中的位置</summary><pre><code>pthread_create(&amp;worker, NULL, calculate, &amp;args);
/* 主线程可在这里处理其他工作。 */
pthread_join(worker, NULL);
/* join 成功返回后，使用工作线程已写好的结果。 */</code></pre><p><code>worker</code> 用来标识新线程，<code>calculate</code> 是线程的入口函数，<code>args</code> 的地址作为参数传入。示例省略错误处理；实际使用需要检查返回值，并保证传入对象在线程使用期间仍然有效。</p></details>
      </section>
      <section class="cc-section" id="interleaving" aria-labelledby="interleaving-title">
        <h2 id="interleaving-title">线程交替执行与更新丢失</h2>
        <p class="cc-intro-text">两个工作线程各完成一项任务，都要把 <code>count</code> 加 1。假设 A 读到 0，还没写回，CPU 就切换到 B。B 也读到 0，最后两个线程都写入 1，计数只增加了一次。这叫更新丢失（lost update）。结果随执行顺序而变，这里出现的是竞态条件（race condition）。</p>
        <p class="cc-conditions">单核教学模型：两个线程各加 1，每一步完整执行；切换只发生在步骤之间。寄存器归各线程使用，count 由两者共享。</p>
        <div id="counter-demo"></div>
        <p class="cc-takeaway">锁要覆盖从读取到写回的整个过程。这段需要保护的代码称为<strong>临界区</strong>。互斥让相关线程不能同时处于临界区。</p>
        <details class="cc-details"><summary>教学模型与实际 C 程序</summary><p>本演示使用按步骤交错的抽象机器，解释更新丢失的原因。实际 C 程序中，多个线程无同步地读写同一个非原子对象，且至少一方写入，会形成数据竞争，行为未定义。编译器和处理器的行为不能只按本图的几种次序推断。</p><p><code>volatile</code> 不提供线程同步；<code>pthread_join</code> 也不能代替共享更新过程所需的互斥。正确方案需要锁或适当的原子操作。</p></details>
      </section>
      ${U.references('threads')}${wikiRelated('threads')}
    </main><footer><span>OSLab · 并发</span><a href="#top">返回顶部 ↑</a></footer></div>`;
  U.interleaver(document.getElementById('counter-demo'));
  const start = {main: '准备创建', worker: '尚未创建', mc: 'pthread_create(...)', wc: 'calculate', title: '创建之前', text: '进程已有主线程。工作线程尚未创建。'};
  const created = {main: '就绪', worker: '就绪', mc: 'pthread_create 已成功返回', wc: '等待执行 calculate', title: '创建成功', text: '两个线程都具备运行条件。本例暂停在创建之后，接下来谁先运行取决于选定的次序。'};
  const traces = {
    early: [start, created,
      {main: '阻塞', worker: '就绪', mc: 'pthread_join(worker, NULL)', wc: '等待执行 calculate', title: '主线程等待', text: '工作线程尚未结束，主线程在 join 中等待。主线程阻塞后，工作线程可以获得 CPU。'},
      {main: '阻塞', worker: '运行', mc: '等待 join 返回', wc: 'result = 42', title: '工作线程计算', text: '工作线程写入结果 42，但还没有结束。主线程仍不能越过 join。'},
      {main: '就绪', worker: '已结束', mc: 'join 尚未返回', wc: 'return NULL', title: '工作线程结束', text: '工作线程从入口函数返回。主线程从阻塞转为就绪。等调度器再次选中它，pthread_join 才会返回。'},
      {main: '运行', worker: '已结束', mc: 'join 返回；读取 result', wc: '结果：42', title: '主线程继续', text: '主线程重新获得 CPU，pthread_join 成功返回。此时工作线程已结束，主线程可以读取结果 42。'}],
    late: [start, created,
      {main: '就绪', worker: '运行', mc: '尚未调用 join', wc: 'result = 42', title: '工作线程先运行', text: '调度器先选择工作线程执行，主线程尚未调用 join。工作线程写入结果 42。'},
      {main: '就绪', worker: '已结束', mc: '尚未调用 join', wc: 'return NULL', title: '工作线程先结束', text: '工作线程已经结束。主线程稍后调用 pthread_join 时，无需再等它结束。'},
      {main: '运行', worker: '已结束', mc: 'join 返回；读取 result', wc: '结果：42', title: 'join 无需等待完成', text: '主线程调用 join 时，目标线程已经结束，因此无需再等待它完成。join 成功返回后读取结果 42。'}],
  };
  globalThis.OSLabThreadLifecycle = Object.freeze({traces});
  let mode = 'early', index = 0, player;
  const paint = () => {
    const s = traces[mode][index];
    for (const [id, value] of Object.entries({'life-main-code': s.mc, 'life-worker-code': s.wc, 'life-main-state': s.main, 'life-worker-state': s.worker, 'life-action': s.title, 'life-log': s.text, 'life-progress': `${index + 1} / ${traces[mode].length}`})) document.getElementById(id).textContent = value;
    document.getElementById('lifecycle').dataset.step = index;
    player?.paint();
  };
  player = U.player('life', {next: () => { index++; paint(); }, prev: () => { index--; paint(); }, reset: () => { index = 0; paint(); }, atEnd: () => index === traces[mode].length - 1, atStart: () => index === 0});
  document.querySelectorAll('[data-life]').forEach(b => b.onclick = () => { player.stop(); mode = b.dataset.life; index = 0; document.querySelectorAll('[data-life]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); paint(); });
  paint();
})();
