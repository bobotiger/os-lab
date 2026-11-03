(() => {
  const U=OSLabConcurrencyStage2UI, M=OSLabSemaphores, transport=OSLabConcurrencyUI.transport;
  U.shell('semaphores',[{href:'#permits',title:'许可与初值'},{href:'#buffer',title:'队列协作'},{href:'#comparison',title:'与条件变量对照'}],`
    <section class="intro"><p class="eyebrow">并发 / 同步</p><h1>信号量</h1><p class="lead">信号量用计数记录可用的操作名额。本页把每个名额称为一个“许可”。</p><p class="definition">sem_wait 成功时取得并消耗一个许可；没有许可时等待。sem_post 增加一个可用许可，并可能唤醒等待者。初值决定一开始可取得多少个许可，可用于控制资源使用数量，也可让线程等待另一线程完成准备。</p></section>
    <section class="cc-section" id="permits"><h2>许可与初值</h2><div class="c2-scenarios c2-three" role="group" aria-label="信号量用途"><button data-permit-kind="mutex" aria-pressed="false"><strong>初值 1</strong><span>一次只允许一个线程进入</span></button><button data-permit-kind="resources" aria-pressed="true"><strong>初值 2</strong><span>控制两个资源的使用名额</span></button><button data-permit-kind="order" aria-pressed="false"><strong>初值 0</strong><span>等待另一线程发布许可</span></button></div>
      <p class="cc-intro-text" id="permit-purpose"></p><div class="cc-preset" id="permit-order" role="group" aria-label="发布与等待的先后次序" hidden><button data-permit-order="postFirst" aria-pressed="true">先 post，后 wait</button><button data-permit-order="waitFirst" aria-pressed="false">先 wait，后 post</button></div>
      <div id="permit-demo"><div class="c2-permit-layout"><div class="c2-permit-bank"><span>当前可用许可</span><strong id="permit-value">2</strong><div id="permit-tokens" aria-hidden="true"></div><span id="permit-waiters"></span></div><div id="permit-actors" class="c2-permit-actors"></div></div><div class="cc-log" role="status"><span id="permit-action"></span><p id="permit-log"></p></div>${transport('permit')}<p class="cc-result" id="permit-result"></p></div>
      <details class="cc-details"><summary>许可、等待者与信号量的表示</summary><p>图中分别显示非负的“可用许可数”和等待线程。某些教材用负数编码等待者数量，这是另一种抽象表示。本图不把负值直接画成资源数量，也不承诺对应某个系统的 sem_getvalue 输出。</p><p>本例在 post 后先显示唤醒，再显示等待线程恢复执行并完成 wait；调用返回前，线程不能使用资源。为使推演可重复，选择固定等待者，不表示实际信号量保证先进先出。</p><p>信号量本身不记录必须由哪个线程归还许可，也不会仅因初值为 1 就自动限制其永远不大于 1。用它实现互斥时，程序需要遵守正确的 wait/post 配对；通常优先使用表达所有权更明确的互斥锁。</p></details>
    </section>
    <section class="cc-section" id="buffer"><h2>空位许可与任务许可</h2><p class="cc-intro-text">沿用条件变量页的容量为 2 的任务队列。empty 记录还能获取多少个空位许可，full 记录还能获取多少个任务许可。生产者先取得空位许可，再加锁入队；消费者先取得任务许可，再加锁取出。队列锁仍负责保护实际的数据修改。</p>
      <div class="c2-code-pair cc-visible-code"><div><h3>消费者：先取得任务许可</h3><pre><code>sem_wait(full);
lock(mutex);
item = take();
unlock(mutex);
sem_post(empty);</code></pre></div><div><h3>生产者：先取得空位许可</h3><pre><code>sem_wait(empty);
lock(mutex);
put(item);
unlock(mutex);
sem_post(full);</code></pre></div></div>
      <p class="cc-caption">空队列开始时，empty = 2、full = 0。这里用伪代码表示每次调用成功后的流程，实际程序还需检查返回值。</p>
      <p class="cc-takeaway"><strong>sem_wait 不会释放线程已经持有的互斥锁。</strong>先加锁再等待空位，可能使负责出队的消费者也拿不到锁。因此这两个流程都先取得许可，再加锁修改队列。</p>
      <div class="cc-preset" role="group" aria-label="信号量队列初始状态"><span>初始队列</span><button data-buffer-scene="empty" aria-pressed="true">队列为空</button><button data-buffer-scene="full" aria-pressed="false">队列已满</button></div><div class="cc-preset" id="buffer-order" role="group" aria-label="资源许可与加锁次序" hidden><button data-buffer-variant="safe" aria-pressed="true">先取得空位许可，再加锁</button><button data-buffer-variant="unsafe" aria-pressed="false">先加锁，再等待空位</button></div>
      <div id="buffer-demo"><div class="c2-simulation"><div class="c2-queue-diagram"><div class="c2-queue-heading"><strong>实际队列</strong><span id="buffer-count"></span></div><div id="buffer-slots" data-observe="queue"></div><div class="c2-permit-pair" data-observe="permits"><div><span>可用空位许可 · empty</span><strong id="buffer-empty"></strong></div><div><span>可用任务许可 · full</span><strong id="buffer-full"></strong></div></div><div class="c2-mutex" id="buffer-mutex" data-observe="lock"></div><div id="buffer-actors" data-observe="actors"></div><details class="cc-details c2-state-details"><summary>许可的取得与归还状态</summary><div class="c2-reservations" id="buffer-reservations"></div></details></div><aside class="c2-explanation"><div class="cc-log" role="status"><span id="buffer-action"></span><code class="c2-current-code" id="buffer-code"></code><p id="buffer-log"></p></div>${transport('buffer')}<p class="cc-caption">获取许可与修改队列是不同步骤。黄色任务表示已入队、尚未发布任务许可；虚线位置为空位。</p></aside></div><p class="cc-result" id="buffer-result"></p></div>
      <details class="cc-details"><summary>许可预留与实际队列数量</summary><p>实际任务数 = 可用任务许可 + 已取得但未取走的任务许可 + 已入队但未发布的任务。实际空位数也需要计入已预留的空位，以及已取走任务但尚未归还的空位许可。因此只看 empty + full，不一定等于容量。</p><p>推演使用一个生产者与一个消费者，步骤之间可以切换线程；不模拟处理器内部时序。伪代码省略错误处理，实际调用需要成功取得许可后才继续。</p></details>
    </section>
    <section class="cc-section" id="comparison"><h2>条件变量与信号量</h2><div class="c2-editorial-pair"><div><h3>条件变量：等待共享状态</h3><p>消费者持锁检查 count。条件不成立时，<code>pthread_cond_wait</code> 释放锁并等待，返回前重新获得锁。通知只提醒状态可能改变，线程还要重新检查；无人等待时，通知不会积存。</p></div><div><h3>信号量：取得可用许可</h3><p><code>sem_wait</code> 成功后消耗一个许可；<code>sem_post</code> 增加的许可可以留给后来的调用者。sem_wait 等待时<strong>不会释放已经持有的互斥锁</strong>，所以队列示例先取得许可，再加锁修改数据。</p></div></div>
      <p class="cc-takeaway">两种方式都能实现生产者与消费者协作。选择时要明确程序需要维护的是<strong>什么条件</strong>或<strong>多少许可</strong>，并把等待、资源预留和实际数据修改的先后关系设计完整。</p>
      <details class="cc-details"><summary>POSIX 信号量接口</summary><pre><code>sem_init(&amp;slots, 0, 2);  /* 同一进程的线程共享，初值 2 */
sem_wait(&amp;slots);      /* 成功后取得一个许可 */
/* 使用相应资源 */
sem_post(&amp;slots);      /* 归还一个许可 */</code></pre><p>示例展示接口位置，不是完整程序。需要检查初始化和 wait 的结果，处理可能的失败或中断，并在资源使用结束后正确归还许可。初值与 post 的次数都必须符合资源模型。</p></details>
    </section>`);
  let kind='resources',order='postFirst',scenario='empty',variant='safe';
  const purposes={mutex:'初始只有 1 个许可。A 获得许可后，B 需要等待 A 归还。正确配对 wait 与 post，可以使临界区互斥执行。',resources:'有两个资源使用名额，A、B 各取得一个。C 需要等到有人归还许可，才有机会开始使用。许可控制数量，具体使用哪个资源仍由程序安排。',order:'初始没有许可。B 完成准备工作后执行 post，A 成功完成 wait 后才能继续。比较 post 发生在 wait 之前或之后的情况。'};
  const permit=U.timeline('permit',()=>M.permitTrace(kind,order),(s,index,frames)=>{
    document.getElementById('permit-purpose').textContent=purposes[kind];
    document.getElementById('permit-value').textContent=s.available;
    document.getElementById('permit-tokens').innerHTML=s.available?Array(s.available).fill('<i></i>').join(''):'<span>暂无可用许可</span>';
    document.getElementById('permit-waiters').textContent=`等待许可：${s.waiting.join('、')||'无'}`;
    document.getElementById('permit-actors').innerHTML=Object.entries(s.states).map(([id,state])=>`<div class="c2-permit-thread ${s.actor===id?'c2-current':''}"><strong>线程 ${id}</strong><span>${state}</span><small>${s.grants.includes(id)?'已取得 1 个许可':'未持有许可'}</small></div>`).join('');
    const returning=s.op==='wait' && frames[index-1]?.states[s.actor]?.includes('已唤醒');
    const action=s.op==='wait'?(returning?'原来的 sem_wait 恢复并返回':'调用 sem_wait'):s.op==='work'?'使用资源':`sem_${s.op}`;
    document.getElementById('permit-action').textContent=s.actor?`${s.actor} · ${action}`:'初始状态';
    document.getElementById('permit-log').textContent=s.log;
    document.getElementById('permit-result').textContent=index===frames.length-1?(kind==='order'?'不论谁先运行，A 都在 B 发布许可之后才能成功完成 wait。post 先发生时，许可会保留。':kind==='mutex'?'一份许可在两个线程之间交替使用。互斥依赖程序正确配对获取与归还，不能多发许可。':'三个线程依次得到使用机会，初始的两个许可最终全部归还。信号量控制并发使用数量，不保证具体的调度顺序。'):'关注可用许可、已获许可与等待者的区别。被唤醒的线程仍需要恢复执行，wait 返回后才可以使用资源。';
  });
  const buffer=U.timeline('buffer',()=>M.queueTrace(scenario,variant),(s,index,frames)=>{
    document.getElementById('buffer-demo').classList.toggle('c2-error',s.error);
    document.getElementById('buffer-count').textContent=`${s.queue.length} 项任务 / 容量 2`;
    document.getElementById('buffer-slots').innerHTML=U.slots(s.queue,2,s.unpublished);
    document.getElementById('buffer-empty').textContent=s.empty; document.getElementById('buffer-full').textContent=s.full;
    document.getElementById('buffer-mutex').textContent=`互斥锁：${s.lock?`${s.lock} 持有`:'空闲'}`;
    document.getElementById('buffer-actors').innerHTML=U.actors(s.states,s.actor);
    document.getElementById('buffer-reservations').innerHTML=`<p><b>P</b> ${s.reservedEmpty?'已预留 1 个空位，尚未入队':s.unpublished?'已入队 1 项，尚未发布任务许可':s.produced?'入队与许可发布已完成':'尚未取得空位许可'}</p><p><b>C1</b> ${s.reservedFull?'已取得 1 个任务许可，尚未取出':s.unpostedEmpty?'已取出 1 项，尚未归还空位许可':s.consumed?'出队与空位归还已完成':'尚未取得任务许可'}</p>`;
    const returning=s.op==='wait' && frames[index-1]?.states[s.actor]?.includes('已唤醒');
    const names={start:'初始状态',wait:returning?'原来的 sem_wait 恢复并返回':'调用 sem_wait',post:s.channel==='full'?'发布任务许可（full）':'归还空位许可（empty）',lock:'获取队列锁',unlock:'释放队列锁',put:'实际入队',take:'实际出队'};
    document.getElementById('buffer-action').textContent=`${s.actor?s.actor+' · ':''}${names[s.op]}`;
    document.getElementById('buffer-log').textContent=s.log;
    const code = {wait:`sem_wait(${s.channel})${returning?' 返回':''}`,post:`sem_post(${s.channel})`,lock:'lock(mutex)',unlock:'unlock(mutex)',put:'put(item)',take:'item = take()'}[s.op];
    document.getElementById('buffer-code').textContent=code || '';
    document.getElementById('buffer-code').hidden=!code;
    U.focus('buffer', {wait:['permits','actors'],post:['permits','actors'],lock:['lock'],unlock:['lock'],put:['queue'],take:['queue']}[s.op] || [], ['wait','put','take','post'].includes(s.op) || s.error);
    const result=document.getElementById('buffer-result');result.classList.toggle('cc-error-result',s.error);
    result.textContent=index===frames.length-1?(s.error?'持锁等待空位造成相互等待。应先取得资源许可，再获取修改队列所需的锁。':scenario==='full'?'消费者腾出位置并归还空位许可，生产者才继续入队。等待空位的生产者没有占住队列锁。':'一个任务已完成入队与出队。两个空位许可全部归还，任务许可恢复为 0。'):s.unpublished?'实际任务数已增加，任务许可尚未发布：入队与 post(full) 是两个步骤。':s.reservedEmpty?'P 已取得空位许可，实际位置仍然为空；预留不等于已经放入任务。':s.reservedFull?'C1 已取得任务许可，任务仍在队列里；取得许可不等于已经取走任务。':s.unpostedEmpty?'实际空位已出现，但空位许可还未归还。下一步 post(empty) 才让它重新可用。':'对照实际队列与两类可用许可，观察预留、数据修改和许可发布的先后关系。';
  });
  U.choose('[data-permit-kind]',b=>{kind=b.dataset.permitKind;document.getElementById('permit-order').hidden=kind!=='order';permit.reload();});
  U.choose('[data-permit-order]',b=>{order=b.dataset.permitOrder;permit.reload();});
  U.choose('[data-buffer-scene]',b=>{scenario=b.dataset.bufferScene;variant='safe';document.getElementById('buffer-order').hidden=scenario!=='full';document.querySelectorAll('[data-buffer-variant]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.bufferVariant==='safe')));buffer.reload();});
  U.choose('[data-buffer-variant]',b=>{variant=b.dataset.bufferVariant;buffer.reload();});
})();
