(() => {
  const U=OSLabConcurrencyStage2UI,M=OSLabConcurrencyBugs;
  U.shell('concurrencyBugs',[{href:'#patterns',title:'错误类型'},{href:'#trace',title:'交错与修正'},{href:'#review',title:'检查方法'}],`
    <section class="intro"><p class="eyebrow">并发 / 正确性</p><h1>并发错误</h1><p class="lead">即使每次读写都加了锁，多步操作仍可能因线程之间的执行次序而出错。这类问题属于并发错误（concurrency bug）。</p><p class="definition">检查并发程序时，要分清哪些步骤必须作为一个整体完成，哪些步骤必须按规定的先后次序执行。</p></section>
    <section class="cc-section" id="patterns"><h2>原子性与执行顺序错误</h2><div class="c3-pair c3-editorial"><div><h3>违反原子性</h3><p>违反原子性（atomicity violation）是指本应作为整体完成的操作被其他线程打断。例如检查队列非空后就解锁，等到取任务时，任务可能已被另一个线程取走。</p></div><div><h3>违反执行顺序</h3><p>违反执行顺序（order violation）是指依赖的先后关系没有得到保证。例如程序必须先初始化、再读取配置。即使读取线程拿到了锁，也仍要确认初始化已经完成。</p></div></div><p class="cc-caption">“原子性”是针对需要保持的逻辑关系而言，不要求把所有操作都变成一条硬件指令。这里的两种错误都可以发生在单核上。</p></section>
    <section class="cc-section" id="trace"><h2>错误交错与同步范围</h2>
      <div class="cc-mode-tabs" role="group" aria-label="错误类型"><button data-bug-kind="atomicity" aria-pressed="true">检查后使用</button><button data-bug-kind="ordering" aria-pressed="false">初始化后使用</button></div>
      <p class="cc-intro-text" id="bug-purpose"></p><div class="bug-settings"><div class="cc-preset" role="group" aria-label="同步方案"><span>保护方式</span><button data-bug-variant="unsafe" aria-pressed="true"></button><button data-bug-variant="safe" aria-pressed="false"></button></div>
      </div>

      ${OSLabConcurrencyBugMovie.markup()}
      <details id="bug-detail" class="cc-details bug-detail"><summary>执行次序与逐操作详情</summary><div class="cc-preset" role="group" aria-label="线程次序"><span>执行次序</span><button data-bug-order="first" aria-pressed="true"></button><button data-bug-order="second" aria-pressed="false"></button></div>
      <div id="bug-demo"><div class="bug-stage"><div class="c3-shared"><div class="bug-data-heading"><span id="bug-shared-label"></span><span id="bug-change" class="bug-change"></span></div><div id="bug-object" class="bug-object"><strong id="bug-value"></strong><p id="bug-data-note"></p></div><div class="bug-lock-status"><span>互斥锁</span><strong id="bug-lock"></strong></div></div><div class="c3-pair" id="bug-threads"></div></div><div class="bug-step-footer"><div class="cc-log" role="status" aria-live="polite"><span id="bug-action"></span><p id="bug-log"></p></div>${OSLabConcurrencyUI.transport('bug')}</div><p class="cc-result" id="bug-result" hidden></p></div>
      </details>
      <details class="cc-details bug-model-notes"><summary>模型条件与实际程序</summary><p>这是受控交错的伪代码模型，每次共享数据访问都受同一互斥锁保护，发生错误时暂停。实际 C/C++ 程序中，如果未同步的访问构成数据竞争（data race），就会产生未定义行为（undefined behavior），不能用这个顺序模型预测结果。</p></details>
    </section>
    <section class="cc-section" id="review"><h2>并发程序的检查方法</h2><div class="c3-list"><div><h3>操作的前提条件</h3><p>取任务时队列必须非空；使用配置时初始化必须已经完成。把这些关系写清楚，才能判断锁的范围和等待条件是否足够。</p></div><div><h3>共享状态的变化时机</h3><p>尤其注意释放锁、等待返回和调用其他模块的前后。曾经成立的判断，不一定在重新获得锁后仍成立；给每行代码分别加锁也不能代替保护完整操作。</p></div><div><h3>反例与修正验证</h3><p>修正后，先用原来出错的执行顺序再试一次。然后交换 A、B 的先后顺序，检查原本先执行的线程变成后执行时，是否仍能得到正确结果。扩大锁的范围也有代价，应覆盖必要关系，并留意是否新增持锁等待。</p></div></div></section>`);
  document.querySelector('.cc-page').classList.add('c3-page');
  let kind='atomicity',variant='unsafe',order='first';
  const names={start:'初始状态',lock:'获取锁',unlock:'释放锁',check:'检查条件',take:'按检查结果取任务',init:'初始化配置',signal:'通知等待者',wait:'释放锁并等待',use:'使用配置'};
  function settings(){
    const atomic=kind==='atomicity';
    document.getElementById('bug-purpose').textContent=atomic?'两个线程共用一个队列和一把锁；队列中只有任务 1。':'B 初始化配置，A 使用配置；两者共用一把锁。ready 从 false 变为 true，表示初始化完成。';
    document.querySelector('[data-bug-variant="unsafe"]').textContent=atomic?'检查与取走分别加锁':'仅用互斥锁';
    document.querySelector('[data-bug-variant="safe"]').textContent=atomic?'检查与取走共同加锁':'增加完成条件与等待';
    document.querySelector('[data-bug-order="first"]').textContent=atomic?'交替执行':'A 先使用';
    document.querySelector('[data-bug-order="second"]').textContent=atomic?'A 完成后 B 执行':'B 先初始化';
  }
  settings();
  const player=U.timeline('bug',()=>kind==='atomicity'?M.atomicity(variant,order==='first'?'interleaved':'serial'):M.ordering(variant,order==='first'?'consumerFirst':'producerFirst'),(s,index,frames)=>{
    const demo=document.getElementById('bug-demo'), previous=frames[index-1];
    demo.classList.toggle('c3-error',s.error);
    demo.dataset.kind=kind; demo.dataset.actor=s.actor||'';
    demo.dataset.readingKey=String(s.error||['check','take','wait','signal'].includes(s.op));
    document.getElementById('bug-shared-label').textContent=kind==='atomicity'?'共享队列':'共享配置';
    document.getElementById('bug-value').textContent=kind==='atomicity'?(s.queue[0]||'队列为空'):(s.ready?'42':'未初始化');
    document.getElementById('bug-lock').textContent=s.lock?`${s.lock} 持有`:'空闲';
    document.getElementById('bug-lock').dataset.owner=s.lock||'';
    const changed=Boolean(previous&&(kind==='atomicity'?previous.queue.length!==s.queue.length:previous.ready!==s.ready));
    const object=document.getElementById('bug-object');
    object.classList.toggle('bug-data-changed',changed);
    object.classList.toggle('bug-data-empty',kind==='atomicity'?!s.queue.length:!s.ready);
    document.getElementById('bug-change').textContent=changed?'本步改变':'';
    document.getElementById('bug-data-note').textContent=kind==='atomicity'?(s.queue.length?'队列中只有这一项任务':`任务 1 已由 ${s.taken[0]} 取走`):`ready = ${s.ready}`;

    const returning=kind==='ordering'&&s.op==='lock'&&frames[index-1]?.states[s.actor]==='已通知，等待重新获锁';
    document.getElementById('bug-threads').innerHTML=['A','B'].map(who=>{
      const atomic=kind==='atomicity';
      const ops=atomic?(variant==='safe'?['lock','check','take','unlock']:['lock','check','unlock','lock','take','unlock']):who==='A'?(variant==='safe'?['lock','check','wait','use','unlock']:['lock','use','unlock']):(variant==='safe'?['lock','init','signal','unlock']:['lock','init','unlock']);
      const executed=who===s.actor?(atomic?frames[index-1]?.pc?.[who]:ops.indexOf(returning?'wait':s.op)):-1;
      const visited=new Set(frames.slice(1,index+1).filter(frame=>frame.actor===who).map(frame=>frame.op));
      const code={lock:'lock(mutex)',check:'while (!ready)',wait:'wait(cv,mutex)',use:'use(config)',init:'config = 42;<br>ready = true;',signal:'signal(cv)',unlock:'unlock(mutex)'};
      const stale=atomic&&s.checked[who]===true&&!s.queue.length&&!s.taken.includes(who);
      const lastCheck=!atomic?[...frames.slice(0,index+1)].reverse().find(frame=>frame.actor===who&&frame.op==='check'):null;
      const memory=atomic?(s.checked[who]===null?'尚未检查队列':`检查时：${s.checked[who]?'有任务':'队列为空'}`):who==='A'?(variant==='unsafe'?'未检查初始化状态':lastCheck?`上次检查：ready = ${lastCheck.ready}`:'尚未检查 ready'):'写入配置并设置 ready';
      const stateLabels={'锁已空闲，待重新获取':'等待重新获锁','使用了过期的检查结果':'检查结果已过期','已初始化，仍持锁':'初始化完成，持锁','已通知，等待重新获锁':'已通知，待获锁','已使用配置并释放锁':'已完成','已初始化并释放锁':'已完成初始化'};
      return `<section class="c3-thread ${s.actor===who?'bug-active':''}" data-thread="${who}"><div class="bug-thread-heading"><h3>线程 ${who}</h3><span class="bug-active-label">${s.actor===who?'本步执行':''}</span></div><div class="bug-check ${stale?'bug-stale':''}"><span>${memory}</span>${stale?'<b>已过期</b>':''}</div><ol class="c3-step-list">${ops.map((op,i)=>`<li${i===executed?' aria-current="step"':''} data-operation="${op}" class="${i===executed?(s.error?'c3-failed':'c3-current'):(atomic?i<s.pc[who]:visited.has(op))?'c3-past':''}">${atomic?names[op]:`<code>${code[op]}</code>`}</li>`).join('')}</ol><span class="c3-status">${stateLabels[s.states[who]]||s.states[who]}</span></section>`;
    }).join('');
    document.getElementById('bug-action').textContent=`${s.actor?s.actor+' · ':''}${returning?'重新获得锁，wait 返回':s.op==='lock'&&s.lock!==s.actor?'获取锁失败，等待':names[s.op]}`;
    document.getElementById('bug-log').textContent=index===0?(kind==='atomicity'?'两个线程尚未检查队列，互斥锁空闲。':'配置尚未初始化，互斥锁空闲。'):returning?'A 在原来的 wait 调用中重新获得锁并返回，接着重新检查 ready。':kind==='atomicity'&&s.error?`${s.actor} 检查时有任务，但任务已被 ${s.taken[0]} 取走。检查与使用之间释放了锁，检查记录已失效。`:s.log;
    document.getElementById('bug-result').hidden=index!==frames.length-1;
    document.getElementById('bug-result').textContent=s.error?(kind==='atomicity'?'检查结果已经过期。修正需要把检查和使用放入同一个临界区，防止中间插入破坏条件的修改。':'互斥没有保证初始化在使用之前完成。需要检查共享完成条件，并在条件不成立时等待。'):index===frames.length-1?(variant==='unsafe'?'这个次序没有触发错误。改用另一种次序，检查方案是否仍然成立。':kind==='atomicity'?'只有一个线程取走任务，另一个在线程间共享的锁内检查到队列为空，安全地跳过操作。':'无论 A 还是 B 先运行，A 都在确认初始化完成之后使用配置。'):(kind==='atomicity'?'高亮行对应本步解说；检查后释放锁时，留意其他线程能否改变队列。':'高亮行对应本步操作。wait 释放锁并等待，重新获锁后仍从这个调用返回，再检查 ready。');
  });
  document.getElementById('bug-next').classList.add('cc-primary');
  document.getElementById('bug-play').classList.remove('cc-primary');

  const detail = document.getElementById('bug-detail');
  const movie = OSLabConcurrencyBugMovie.mount(() => [kind,variant,order], next => { detail.open = false; document.querySelector('[data-bug-variant="' + next + '"]').click(); }, () => player.stop());
  detail.querySelector('summary').addEventListener('click', () => { movie.disarm(); player.stop(); });
  detail.addEventListener('toggle', () => { if (detail.open) movie.disarm(); else player.stop(); });
  document.getElementById('bug-play').addEventListener('click', () => movie.disarm());
  function reload() { player.reload(); movie.reload(!detail.open); }
  U.choose('[data-bug-kind]',b=>{kind=b.dataset.bugKind;settings();reload();});
  U.choose('[data-bug-variant]',b=>{variant=b.dataset.bugVariant;reload();});
  U.choose('[data-bug-order]',b=>{order=b.dataset.bugOrder;reload();});
})();
