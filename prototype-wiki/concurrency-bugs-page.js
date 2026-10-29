(() => {
  const U=OSLabConcurrencyStage2UI,M=OSLabConcurrencyBugs;
  U.shell('concurrencyBugs',[{href:'#patterns',title:'错误类型'},{href:'#trace',title:'交错与修正'},{href:'#review',title:'检查方法'}],`
    <section class="intro"><p class="eyebrow">并发 / 正确性</p><h1>并发错误</h1><p class="lead">单次访问受到保护，<span class="read-keep">并不等于</span>多步操作的逻辑正确。</p><p class="definition">即使每次共享数据访问都正确加锁，多步操作仍可能因穿插或先后次序错误而失败。分析时需要明确：哪些操作必须作为整体完成，哪些操作必须发生在另一些操作之后。</p></section>
    <section class="cc-section" id="patterns"><h2>原子性违反与顺序违反</h2><div class="c3-pair c3-editorial"><div><h3>原子性违反</h3><p>原本应当作为一个整体完成的操作，被其他线程插入修改。例如先检查队列非空，释放锁后再取任务，先前的检查就可能已经失效。</p></div><div><h3>顺序违反</h3><p>程序依赖的先后关系没有得到保证。例如使用配置的线程先取得锁，也不能让尚未发生的初始化自动完成；还需要明确的完成条件。</p></div></div><p class="cc-caption">“原子性”是针对需要保持的逻辑关系而言，不要求把所有操作都变成一条硬件指令。这里的两种错误都可以发生在单核上。</p></section>
    <section class="cc-section" id="trace"><h2>错误交错与同步范围</h2>
      <div class="cc-mode-tabs" role="group" aria-label="错误类型"><button data-bug-kind="atomicity" aria-pressed="true">检查后使用</button><button data-bug-kind="ordering" aria-pressed="false">初始化后使用</button></div>
      <p class="cc-intro-text" id="bug-purpose"></p><div class="cc-preset" role="group" aria-label="同步方案"><button data-bug-variant="unsafe" aria-pressed="true"></button><button data-bug-variant="safe" aria-pressed="false"></button></div>
      <div class="cc-preset" role="group" aria-label="线程次序"><span>执行次序</span><button data-bug-order="first" aria-pressed="true"></button><button data-bug-order="second" aria-pressed="false"></button></div>
      <div id="bug-demo"><div class="c3-shared"><div><span id="bug-shared-label"></span><strong id="bug-value"></strong></div><div><span>互斥锁</span><strong id="bug-lock"></strong></div></div><div class="c3-pair" id="bug-threads"></div><div class="cc-log" role="status"><span id="bug-action"></span><p id="bug-log"></p></div>${OSLabConcurrencyUI.transport('bug')}<p class="cc-result" id="bug-result"></p></div>
      <p class="cc-conditions">这是受控交错的伪代码模型，每次共享数据访问都受同一互斥锁保护，发生错误时暂停。实际 C/C++ 程序中的无同步数据竞争涉及语言的未定义行为，不能只按这个模型推断。</p>
    </section>
    <section class="cc-section" id="review"><h2>并发程序的检查方法</h2><div class="c3-list"><div><h3>操作的前提条件</h3><p>取任务时队列必须非空；使用配置时初始化必须已经完成。把这些关系写清楚，才能判断锁的范围和等待条件是否足够。</p></div><div><h3>共享状态的变化时机</h3><p>尤其注意释放锁、等待返回和调用其他模块的前后。曾经成立的判断，不一定在重新获得锁后仍成立；给每行代码分别加锁也不能代替保护完整操作。</p></div><div><h3>反例与修正验证</h3><p>一次正确输出只说明一种执行次序没有暴露问题。修正后还要检查原来的错误次序，以及线程先后顺序反过来的情况。扩大锁的范围也有代价，应覆盖必要关系，并留意是否新增持锁等待。</p></div></div></section>`);
  document.querySelector('.cc-page').classList.add('c3-page');
  let kind='atomicity',variant='unsafe',order='first';
  const names={start:'初始状态',lock:'获取锁',unlock:'释放锁',check:'检查条件',take:'按检查结果取任务',init:'初始化配置',signal:'通知等待者',wait:'释放锁并等待',use:'使用配置'};
  function settings(){
    const atomic=kind==='atomicity';
    document.getElementById('bug-purpose').textContent=atomic?'队列只有一项任务，A、B 都要先检查再取走。比较分别加锁与保护整段操作；再改变执行次序，检查错误是否总会出现。':'B 初始化配置，A 使用配置。比较单纯互斥与检查完成条件后的等待；交换谁先运行，观察是否仍能正确使用。';
    document.querySelector('[data-bug-variant="unsafe"]').textContent=atomic?'检查与取走分别加锁':'仅用互斥锁';
    document.querySelector('[data-bug-variant="safe"]').textContent=atomic?'检查与取走共同加锁':'增加完成条件与等待';
    document.querySelector('[data-bug-order="first"]').textContent=atomic?'交替执行':'A 先使用';
    document.querySelector('[data-bug-order="second"]').textContent=atomic?'A 完成后 B 执行':'B 先初始化';
  }
  settings();
  const player=U.timeline('bug',()=>kind==='atomicity'?M.atomicity(variant,order==='first'?'interleaved':'serial'):M.ordering(variant,order==='first'?'consumerFirst':'producerFirst'),(s,index,frames)=>{
    document.getElementById('bug-demo').classList.toggle('c3-error',s.error);
    document.getElementById('bug-shared-label').textContent=kind==='atomicity'?'共享队列':'共享配置';
    document.getElementById('bug-value').textContent=kind==='atomicity'?(s.queue[0]||'队列为空'):(s.ready?'42 · 已初始化':'空值 · 未初始化');
    document.getElementById('bug-lock').textContent=s.lock?`${s.lock} 持有`:'空闲';
    document.getElementById('bug-threads').innerHTML=['A','B'].map(who=>{
      const ops=variant==='safe'?['lock','check','take','unlock']:['lock','check','unlock','lock','take','unlock'];
      const executed=who===s.actor?frames[index-1]?.pc?.[who]:-1;
      return `<section class="c3-thread" data-thread="${who}"><h3>线程 ${who}</h3>${kind==='atomicity'?`<span class="c3-status">先前检查：${s.checked[who]===null?'尚未检查':s.checked[who]?'队列非空':'队列为空'}</span><ol class="c3-step-list">${ops.map((op,i)=>`<li${i===executed?' aria-current="step"':''} data-operation="${op}" class="${i===executed?(s.error?'c3-failed':'c3-current'):i<s.pc[who]?'c3-past':''}">${names[op]}</li>`).join('')}</ol>`:`<p>${who==='A'?'使用配置；需要初始化已完成。':'写入配置；公布初始化完成。'}</p>`}<span class="c3-status">${s.states[who]}</span></section>`;
    }).join('');
    const returning=kind==='ordering'&&s.op==='lock'&&frames[index-1]?.states[s.actor]==='已通知，等待重新获锁';
    document.getElementById('bug-action').textContent=`${s.actor?s.actor+' · ':''}${returning?'重新获得锁，wait 返回':names[s.op]}`;
    document.getElementById('bug-log').textContent=returning?'A 在原来的 wait 调用中重新获得互斥锁，随后从 wait 返回。下一步重新检查 ready。':s.log;
    document.getElementById('bug-result').textContent=s.error?(kind==='atomicity'?'检查结果已经过期。修正需要把检查和使用放入同一个临界区，防止中间插入破坏条件的修改。':'互斥没有保证初始化在使用之前完成。需要检查共享完成条件，并在条件不成立时等待。'):index===frames.length-1?(variant==='unsafe'?'这个次序没有触发错误。改用另一种次序，检查方案是否仍然成立。':kind==='atomicity'?'只有一个线程取走任务，另一个在线程间共享的锁内检查到队列为空，安全地跳过操作。':'无论 A 还是 B 先运行，A 都在确认初始化完成之后使用配置。'):(kind==='atomicity'?'高亮行对应本步解说；检查后释放锁时，留意其他线程能否改变队列。':'对照配置状态与线程的执行次序。');
  });
  U.choose('[data-bug-kind]',b=>{kind=b.dataset.bugKind;settings();player.reload();});
  U.choose('[data-bug-variant]',b=>{variant=b.dataset.bugVariant;player.reload();});
  U.choose('[data-bug-order]',b=>{order=b.dataset.bugOrder;player.reload();});
})();
