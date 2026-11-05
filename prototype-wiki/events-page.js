(() => {
  const U=OSLabConcurrencyStage2UI,M=OSLabEvents;
  U.shell('events',[{href:'#loop',title:'事件与请求状态'},{href:'#comparison',title:'等待与响应'},{href:'#boundaries',title:'适用范围'}],`
    <section class="intro"><p class="eyebrow">并发 / 拓展</p><h1>事件驱动并发</h1><p class="lead">在事件驱动并发（event-driven concurrency）中，一个线程也可以交替处理多个请求。某个请求等待 I/O 时，线程可以先处理已经就绪的其他请求。</p><p class="definition">连接有数据可读、一次 I/O 操作完成，都可以作为事件。事件循环（event loop）反复取得可处理的事件，再调用相应的事件处理函数（event handler）。处理函数完成眼下能做的工作后及时返回，循环才能处理下一件事。</p></section>
    <section class="cc-section" id="loop"><h2>事件循环与请求状态</h2>
      <p class="cc-intro-text">例如文件服务收到请求 A，提交读取后，要把“读完后向谁返回结果、接下来执行什么”保存下来，再返回事件循环。文件尚未读完时，循环可以处理请求 B。</p>
      <div class="cc-code-explainer"><div><h3>循环分发事件</h3><pre><code>while (running) {
    event = wait_event();
    request = event.request;
    handle(request, event);
}</code></pre><p class="cc-caption">伪代码中的事件关联相应请求；没有可处理的事件时，循环可以休眠等待。</p></div><div><h3>请求 A 恢复处理所需的信息</h3><dl class="cc-request-state"><div><dt>请求标识</dt><dd>A</dd></div><div><dt>当前进度</dt><dd>已提交文件读取，等待结果</dd></div><div><dt>后续动作</dt><dd>检查读取结果，生成响应</dd></div></dl><p>I/O 完成事件到达后，处理函数找到 A 的状态，继续处理 A。等待期间，I/O 由操作系统与设备推进，事件循环线程可以处理 B。</p></div></div>
      <p class="cc-takeaway">这里的并发来自<strong>多个请求的处理过程交错</strong>。单个事件循环线程同一时刻仍只执行一个处理函数，不等于多个函数在多个 CPU 上并行计算。</p></section>
    <section class="cc-section" id="comparison"><h2 id="event-title">阻塞调用与异步 I/O</h2><div class="cc-mode-tabs" role="group" aria-label="耗时工作的类型"><button data-event-kind="io" aria-pressed="true">等待 I/O</button><button data-event-kind="cpu" aria-pressed="false">连续计算</button></div><p class="cc-intro-text" id="event-purpose"></p><div class="cc-preset" role="group" aria-label="共同工作量"><span id="event-cost-label">I/O 等待时间</span><button data-event-cost="4" aria-pressed="true">4 单位</button><button data-event-cost="8" aria-pressed="false">8 单位</button></div><p class="cc-conditions" id="event-conditions"></p>
      <div id="event-demo"><div class="c3-event-heading"><strong id="event-shared-work"></strong><span id="event-time"></span></div><div class="c3-event-rows" id="event-panels"></div><div class="c3-legend"><span>蓝色 A：处理请求 A</span><span>绿色 B：处理请求 B</span><span>斜线“阻”：线程被阻塞</span><span>“闲”：没有就绪事件</span></div><p class="cc-result c3-event-conclusion cc-step-explanation" id="event-result" role="status"></p>${OSLabConcurrencyUI.transport('event')}<details class="cc-details" id="event-details"><summary>本步状态与请求上下文</summary><div class="c3-pair" id="event-contexts"></div></details></div>
      <details class="cc-details"><summary>时间单位与比较范围</summary><p>时间是教学模型中的离散单位，不是实际系统测试。两组请求、到达时间和工作量相同，忽略调度、切换、提交和恢复之外的额外开销。每格表示一个单位时间；没有就绪事件时允许事件循环休眠等待，不要求忙等。</p><p id="event-scope"></p></details>
    </section>
    <section class="cc-section" id="boundaries"><h2>事件驱动的适用范围</h2><div class="c3-pair c3-editorial"><div><h3>处理函数之间的执行次序</h3><p>同一个事件循环内，普通处理函数依次运行，不会被另一个处理函数任意插入执行。如果数据只由这个线程访问，处理函数之间就无须为互斥访问这些数据而加锁；但跨事件的逻辑次序仍需要正确安排。</p></div><div><h3>跨事件的状态管理</h3><p>请求 A 等待 I/O 时，处理其他事件的函数仍可能修改共享状态。恢复 A 时，要确认请求没有被取消、结果仍然有效，并处理失败或重复事件。单个线程依次执行函数，并不能自动保证跨事件的逻辑完整。</p></div></div>
      <div class="c3-list"><div><h3>就绪通知与完成通知</h3><p><code>select</code>、<code>poll</code> 等接口提供就绪通知（readiness notification），例如告诉应用某个套接字可以读取。此时一整条消息可能还没收齐。异步 I/O（asynchronous I/O）的完成通知（completion notification）则告诉应用先前提交的操作已经结束，应用仍要检查结果。两者都能支持事件处理，但含义不同。</p></div><div><h3>应用调度与操作系统调度</h3><p>应用决定先处理哪个就绪事件；OS 仍决定事件循环线程何时获得 CPU。OS 可以抢占这个线程，但这不会让同一循环中的另一个处理函数自动开始执行。</p></div><div><h3>阻塞、多核与混合设计</h3><p>如果处理函数执行阻塞调用，事件循环线程就会暂停，其他请求也只能等待。长时间计算同样会推迟其他请求的处理。可以切分计算，或把适合的工作交给工作线程；多个线程共享数据时，同步问题重新出现。等待页面调入等隐式阻塞，也可能影响循环的响应。</p></div></div><p class="cc-takeaway">事件驱动适合把等待与短小的处理步骤分开。是否采用它，取决于工作中有多少等待、处理函数能否及时返回，以及保存状态和安排多核执行的代价。</p>
    </section>`);
  document.querySelector('.cc-page').classList.add('c3-page');
  let kind='io',cost=4;
  const player=U.timeline('event',()=>{
    const a=M.trace(kind,'blocking',cost),b=M.trace(kind,'cooperative',cost);
    return Array.from({length:Math.max(a.length,b.length)},(_,i)=>({blocking:a[Math.min(i,a.length-1)],cooperative:b[Math.min(i,b.length-1)]}));
  },(pair,index,frames)=>{
    document.getElementById('event-title').textContent=kind==='io'?'阻塞调用与异步 I/O':'长计算与协作式切分';
    document.getElementById('event-purpose').textContent=kind==='io'?'A 需要读取数据，B 只需要短暂处理。比较 A 等待 I/O 时，事件循环是否仍能处理 B；同时观察 A 的请求状态如何保留。':'A 的工作改为连续计算。把它切成小段并返回循环，可以让 B 提前得到处理；计算总量并没有减少。';
    document.getElementById('event-scope').textContent=kind==='io'
      ? '在“等待 I/O”场景中，两组 A 的 I/O 用时相同。阻塞方案让唯一的事件循环线程随 A 一起等待；异步方案保存 A 的后续处理状态并返回循环，让 B 可以先得到处理。'
      : '在“连续计算”的分段方案中，A 每计算 1 个时间单位就返回事件循环。B 在第一段结束时已经到达，本例先处理 B，再继续 A。实际事件框架的事件排序、优先级与调度策略可能不同。';
    document.getElementById('event-cost-label').textContent=kind==='io'?'I/O 等待时间':'A 的计算总量';
    document.querySelectorAll('[data-event-cost]').forEach(b=>{b.textContent=`${Number(b.dataset.eventCost)+(kind==='cpu'?2:0)} 单位`;});
    document.getElementById('event-conditions').textContent=`A 在 t=0 到达，B 在 t=1 到达，B 处理需 1 单位。${kind==='io'?'A 提交与完成处理各需 1 单位。':'两组只改变 A 是否分段计算并返回循环。'}每格 1 单位时间。`;
    document.getElementById('event-shared-work').textContent=kind==='io'?`A 的 I/O：两组均需 ${cost} 单位`:`A 的计算量：两组均为 ${cost+2} 单位`;
    document.getElementById('event-time').textContent=`当前 t = ${index}`;
    const title=mode=>kind==='io'?(mode==='blocking'?'阻塞调用':'异步提交与恢复'):(mode==='blocking'?'一个长处理函数':'分段计算并返回循环');
    document.getElementById('event-panels').innerHTML=Object.entries(pair).map(([mode,s])=>{
      const tick=s.history.at(-1),finished=Object.values(s.done).every(x=>x!==null);
      const activity=finished?'两个请求均已完成':!tick?'准备处理 A':kind==='io'&&s.io==='已完成'&&s.done.A===null?'I/O 已完成，等待继续 A':({submit:'A 提交 I/O',resume:'处理 A 的 I/O 结果',blocked:'线程被 A 的 I/O 阻塞',idle:'等待新事件'}[tick.activity]||`处理请求 ${tick.actor}`);
      const elapsed=Math.max(0,Math.min(cost,s.time-1));
      return `<section class="c3-event-panel" data-mode="${mode}"><div class="c3-event-row-heading"><h3>${title(mode)}</h3><p>${activity}</p></div><div class="c3-event-lanes" style="--ticks:${frames.length-1}"><span>事件循环</span><div class="c3-event-ticks">${Array.from({length:frames.length-1},(_,i)=>{
        const t=s.history[i];return `<span class="${t?'c3-tick-'+(t.actor||t.activity):''}"${t&&i===index-1?' aria-current="step"':''} title="t=${i}–${i+1}${t?'':'：尚未执行'}">${t?(t.actor||(t.activity==='blocked'?'阻':'闲')):''}</span>`;
      }).join('')}</div>${kind==='io'?`<span>A 的 I/O</span><div class="c3-io-track" data-elapsed="${elapsed}" data-duration="${cost}" data-io="${s.io}" aria-label="A 的 I/O：${s.io}，已用 ${elapsed} / ${cost} 单位"><div class="c3-io-span" style="grid-column:2 / span ${cost}"><i style="transform:scaleX(${elapsed/cost})"></i><span>${s.io}${s.io==='进行中'?` ${elapsed}/${cost}`:''}</span></div></div>`:''}</div><div class="c3-event-response ${s.done.B!==null?'c3-response-done':''}"><span>B 完成时间</span><strong>${s.done.B===null?(s.time===0?'尚未到达':'尚未完成'):`t=${s.done.B}`}</strong></div></section>`;
    }).join('');
    document.getElementById('event-contexts').innerHTML=Object.entries(pair).map(([mode,s])=>`<section class="c3-event-detail-panel"><h3>${title(mode)}</h3><p class="c3-event-ready">等待处理的事件：${s.ready.join('、')||'无'}</p><p class="c3-event-completed">完成时间：A ${s.done.A===null?'尚未完成':`t=${s.done.A}`}；B ${s.done.B===null?'尚未完成':`t=${s.done.B}`}</p><div class="c3-context"><span>${kind==='io'?'A 的后续处理状态':'A 的计算进度'}</span>${s.context}</div><div class="cc-log"><p>${s.log}</p></div></section>`).join('');
    const a=pair.blocking,b=pair.cooperative;
    document.getElementById('event-demo').dataset.readingKey=String(index===2 || index===frames.length-1);
    document.getElementById('event-result').textContent=kind==='io'
      ? index===frames.length-1?`A 的 I/O 均耗时 ${cost} 单位；异步方案让 B 从 t=${a.done.B} 提前到 t=${b.done.B} 完成。`
        : index===0?'比较 A 等待 I/O 时，两组能否继续处理 B。'
        : index===1?'A 的 I/O 已提交，B 也已到达。下一步比较两组如何处理 B。'
        : a.io==='进行中'?`A 的 I/O 在两组中都仍在进行；异步方案的 B 已在 t=${b.done.B} 完成，阻塞方案的 B 仍在等待。`
        : a.done.A===null?`两组 A 的 I/O 同在 t=${cost+1} 完成。异步方案的 B 已完成，阻塞方案的 B 仍在等待。`
        : `A 在两组中都于 t=${a.done.A} 完成；阻塞方案还要处理等待中的 B。`
      : index===frames.length-1?`B 的完成时间由 t=${a.done.B} 提前到 t=${b.done.B}。两组全部工作都在 t=${a.time} 完成；切分改善了响应次序，没有凭空减少计算。`
        : b.done.B!==null?`分段方案的 B 已在 t=${b.done.B} 完成；A 仍需完成相同的计算量。`
        : '两组完成相同的计算量。比较 B 到达后，事件循环能否先处理 B。';
  });
  U.choose('[data-event-kind]',b=>{kind=b.dataset.eventKind;player.reload();});U.choose('[data-event-cost]',b=>{cost=Number(b.dataset.eventCost);player.reload();});
})();
