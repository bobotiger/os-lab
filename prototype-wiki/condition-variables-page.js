(() => {
  const U = OSLabConcurrencyStage2UI, M = OSLabConditionVariables;
  U.shell('conditionVariables', [{href:'#condition',title:'条件与等待'},{href:'#cooperation',title:'队列协作'},{href:'#contract',title:'使用规则'}], `
    <section class="intro"><p class="eyebrow">并发 / 条件同步</p><h1>条件变量</h1><p class="lead">互斥锁保护共享数据的访问；<span class="read-keep">条件变量</span>让线程等待某个条件成立。</p><p class="definition">线程持锁检查条件，不满足时调用 wait。wait 将释放锁与进入等待作为一个不可分割的操作；被唤醒后，线程重新获得锁，wait 才返回。线程随后再次检查条件，决定能否继续。</p></section>
    <section class="cc-section" id="condition"><h2>条件检查与等待流程</h2><p class="cc-intro-text">生产者放入任务，消费者取走任务。本例队列最多放 2 项，count 表示当前任务数。互斥锁能防止队列修改相互冲突，但消费者仍要等到有任务，生产者仍要等到有空位。</p>
      <p class="cc-intro-text">条件变量 notEmpty 管理等待任务的消费者，notFull 管理等待空位的生产者。signal 通知对应的等待者，提醒它重新检查条件。</p>
      <div class="c2-code-pair"><div><h3>消费者：有任务才能取</h3><p>继续条件：<code>count &gt; 0</code></p><pre><code>lock(mutex);
while (count == 0)
    wait(notEmpty, mutex);
item = take();
signal(notFull);
unlock(mutex);
process(item);</code></pre></div><div><h3>生产者：有空位才能放</h3><p>继续条件：<code>count &lt; 2</code></p><pre><code>lock(mutex);
while (count == 2)
    wait(notFull, mutex);
put(item);
signal(notEmpty);
unlock(mutex);</code></pre></div></div>
      <p class="cc-caption">伪代码中，put 放入任务并增加 count，take 取走任务并减少 count。wait 对应 pthread_cond_wait，signal 对应 pthread_cond_signal；lock / unlock 对应互斥锁操作。消费者在解锁后处理任务，避免长时间占住队列锁。</p>
      <p class="cc-takeaway"><strong>条件是否成立，要检查共享数据。</strong>这里检查的是任务数量 count；条件变量负责等待与通知，本身不会保存“队列非空”这个事实。</p>
    </section>
    <section class="cc-section" id="cooperation"><h2>有限队列中的协作</h2>
      <div class="c2-scenarios" role="group" aria-label="条件变量场景"><button data-cv-scene="empty" aria-pressed="true"><strong>空队列</strong><span>消费者等待任务</span></button><button data-cv-scene="full" aria-pressed="false"><strong>满队列</strong><span>生产者等待空位</span></button><button data-cv-scene="barging" aria-pressed="false"><strong>任务被抢先取走</strong><span>唤醒后重新检查条件</span></button><button data-cv-scene="gap" aria-pressed="false"><strong>检查与等待之间</strong><span>防止错过通知</span></button></div>
      <p class="cc-intro-text" id="cv-purpose"></p>
      <div class="cc-preset" id="cv-variants" role="group" aria-label="条件变量实现方式" hidden><button data-cv-variant="safe" aria-pressed="true"></button><button data-cv-variant="unsafe" aria-pressed="false"></button></div>
      <p class="cc-conditions">单进程，容量为 2 的任务队列，共用一把互斥锁。条件变量 notEmpty 用于等待队列非空，notFull 用于等待队列未满。步骤表示执行次序，不表示真实耗时。</p>
      <div id="cv-demo"><div class="c2-simulation"><div class="c2-queue-diagram"><div class="c2-queue-heading"><strong>任务队列</strong><span id="cv-count"></span></div><div id="cv-slots" data-observe="queue"></div><div class="c2-mutex" id="cv-mutex" data-observe="lock"></div><div class="c2-wait-path" id="cv-waiting" data-observe="waiting"><div class="c2-wait-heading"><strong id="cv-wait-thread"></strong><span id="cv-wait-status"></span></div><div class="c2-wait-track"><ol>${['等待通知','被通知','重新获锁'].map((label,i)=>`<li data-wait-phase="${i}"><i aria-hidden="true"></i><span>${label}</span></li>`).join('')}</ol><div class="c2-wait-cursor" id="cv-wait-cursor" aria-hidden="true"><b></b></div></div></div><div id="cv-actors" data-observe="actors"></div></div><aside class="c2-explanation"><div class="cc-log" role="status"><span id="cv-action"></span><code class="c2-current-code" id="cv-code"></code><p id="cv-log"></p></div>${OSLabConcurrencyUI.transport('cv')}<details class="cc-details c2-state-details"><summary>操作统计</summary><div class="c2-compact-metrics"><span>本轮放入 <b id="cv-produced">0</b></span><span>本轮取走 <b id="cv-consumed">0</b></span></div></details></aside></div><p class="cc-result" id="cv-result"></p></div>

    </section>
    <section class="cc-section" id="contract"><h2>等待与通知的使用规则</h2><div class="c2-principles"><div><h3>检查与等待要配合互斥锁</h3><p>检查条件、修改条件所依赖的数据，需要遵守同一套加锁规则。wait 把释放锁与开始等待衔接起来，避免另一个线程在“已经检查、尚未等待”的间隙修改状态并发出通知。</p></div><div><h3>通知不保证条件仍然成立</h3><p>被通知者要先重新获得锁。此时其他线程可能已经改变共享状态；实现也可能出现虚假唤醒。因此用 while 重新检查条件，条件不成立就继续等待。</p></div><div><h3>不同等待条件分别组织</h3><p>消费者等待“非空”，生产者等待“未满”。分别使用 notEmpty、notFull，可以让放入任务时通知消费者、取走任务时通知生产者，避免唤醒了无法推进的另一类等待者。</p></div></div>
      <details class="cc-details"><summary>signal、broadcast 与锁的关系</summary><p>有等待者时，POSIX 的 signal 至少唤醒其中一个，broadcast 唤醒所有等待者；本演示每次 signal 选择一个等待者。若不同线程等待不同的资源需求，随意唤醒一个线程可能无法推进，广播后让各线程重新检查条件是一种处理方式；代价是更多线程被唤醒并竞争锁。</p><p>本页统一在持锁修改共享状态后发出通知，便于检查操作次序。POSIX 并不要求所有 signal 都必须持有互斥锁，但任何写法都必须避免共享状态检查与等待登记之间的竞态。通知不会自动释放当前线程持有的锁。</p></details>
    </section>`);
  let scenario = 'empty', variant = 'safe';
  const purposes = {empty:'消费者先运行，但队列里还没有任务。观察 wait 如何释放锁，让生产者能够入队并通知消费者。',full:'生产者先运行，但两个位置都已占用。观察消费者取走任务后，怎样使生产者恢复入队。',barging:'C1 等待任务并被通知后，C2 抢先获得锁并取走唯一的任务。比较 C1 重新获锁后，检查条件与直接取任务的不同结果。',gap:'消费者检查到空队列后，如果先解锁、稍后才登记等待，生产者可能在这段间隙放入任务并发出通知。比较正确 wait 与分开操作的结果。'};
  const operationNames = {start:'初始状态',lock:'获取互斥锁',check:'检查共享状态',wait:'释放锁并等待',unlock:'释放互斥锁',put:'放入任务',take:'取走任务',signal:'通知等待者',unsafeSleep:'错过通知后才等待'};
  function settings() {
    document.getElementById('cv-purpose').textContent=purposes[scenario];
    const box=document.getElementById('cv-variants'); box.hidden=!['barging','gap'].includes(scenario);
    box.querySelector('[data-cv-variant="safe"]').textContent=scenario==='gap'?'wait 原子释放锁并等待':'while 重新检查';
    box.querySelector('[data-cv-variant="unsafe"]').textContent=scenario==='gap'?'先解锁，稍后等待':'if 只检查一次';
    box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cvVariant===variant)));
  }
  const player=U.timeline('cv',()=>M.trace(scenario,variant),(s,index,frames)=>{
    document.getElementById('cv-demo').classList.toggle('c2-error',s.error||s.lost);
    document.getElementById('cv-count').textContent=`实际任务 ${s.queue.length} / 2`;
    document.getElementById('cv-slots').innerHTML=U.slots(s.queue);
    document.getElementById('cv-mutex').textContent=`互斥锁：${s.lock ? `${s.lock} 持有` : '空闲'}`;
    const tracked = scenario === 'full' ? 'P' : 'C1';
    let phase = -1;
    for(let i=1;i<=index;i++) {
      const frame=frames[i], before=frames[i-1];
      if(frame.actor===tracked && ['wait','unsafeSleep'].includes(frame.op)) phase=0;
      else if(phase===0 && frame.states[tracked].includes('已通知')) phase=1;
      else if(phase===1 && frame.actor===tracked && frame.op==='lock' && before.states[tracked].includes('已通知')) phase=2;
    }
    const path=document.getElementById('cv-waiting'), cursor=document.getElementById('cv-wait-cursor');
    path.dataset.phase=String(phase); path.dataset.thread=tracked;
    path.classList.toggle('c2-wait-reset',index===0 || phase<0);
    path.classList.toggle('c2-wait-complete',phase===2);
    document.getElementById('cv-wait-thread').textContent=`${tracked} · ${tracked==='P'?'notFull':'notEmpty'}`;
    document.getElementById('cv-wait-status').textContent=s.lost?'错过通知，仍在等待':phase<0?'尚未等待':phase===2?'wait 已返回':'wait 尚未返回';
    cursor.style.transform=`translateX(${Math.max(0,phase)*100}%)`; cursor.hidden=phase<0 || phase===2; cursor.querySelector('b').textContent=tracked;
    path.querySelectorAll('[data-wait-phase]').forEach(node=>{
      const n=Number(node.dataset.waitPhase);node.classList.toggle('c2-reached',n<=phase);
      if(n===phase && phase<2)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');
    });
    document.getElementById('cv-actors').innerHTML=U.actors(s.states,s.actor);
    document.getElementById('cv-action').textContent=`${s.actor ? s.actor+' · ' : ''}${operationNames[s.op]}`;
    document.getElementById('cv-log').textContent=s.log;
    const returning = s.op === 'lock' && frames[index-1]?.states[s.actor]?.includes('已通知');
    const channel = s.actor === 'P' ? 'notFull' : 'notEmpty';
    const condition = s.actor === 'P' ? `count < 2 → ${s.queue.length < 2}` : `count > 0 → ${s.queue.length > 0}`;
    const code = {lock: returning ? `wait(${channel}, mutex) 返回` : 'lock(mutex)', check: condition, wait: `wait(${channel}, mutex)`, signal: `signal(${s.actor === 'P' ? 'notEmpty' : 'notFull'})`, put: 'put(item)', take: 'item = take()', unlock: 'unlock(mutex)', unsafeSleep: '登记等待（检查后已释放锁）'}[s.op];
    document.getElementById('cv-code').textContent = code || '';
    document.getElementById('cv-code').hidden = !code;
    U.focus('cv', {check:['queue'],put:['queue'],take:['queue'],wait:['lock','waiting'],signal:['waiting','lock','actors'],lock:returning?['lock','waiting','actors']:['lock','actors'],unlock:['lock'],unsafeSleep:['queue','waiting']}[s.op] || [], ['wait','signal','unsafeSleep'].includes(s.op) || returning || s.error);
    document.getElementById('cv-produced').textContent=s.produced;
    document.getElementById('cv-consumed').textContent=s.consumed;
    const result=document.getElementById('cv-result'); result.classList.toggle('cc-error-result',s.error||s.lost);
    result.textContent=index===frames.length-1?(s.error?'只检查一次的 if 不足以保证取任务时队列仍然非空。需要在重新获得锁后，用 while 检查当前状态。':s.lost?'队列有任务，消费者却在等待。本例错过了通知：共享状态与等待登记之间出现了不受保护的间隙。':scenario==='barging'?'C1 重新检查后发现队列为空，安全地再次等待。被唤醒不等于已经获得任务；还需要生产者放入新任务并通知。':scenario==='full'?'消费者取走一项任务，释放出位置；生产者被通知、重新获得锁并检查空位后，完成新的入队。':'消费者在等待时释放锁；生产者入队并通知后，消费者重新获得锁、确认非空，才取走任务。'):'关注三个不同的变化：队列内容改变、等待者被通知、等待者重新获得锁。';
  });
  U.choose('[data-cv-scene]',b=>{scenario=b.dataset.cvScene;variant='safe';settings();player.reload();});
  U.choose('[data-cv-variant]',b=>{variant=b.dataset.cvVariant;player.reload();}); settings();
})();
