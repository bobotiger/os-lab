/* Page-local teaching views; all replacement decisions come from the existing models. */
function renderReplacementPage(root) {
  const M=OSLabReplacement,S=OSLabReplacementStudy;
  const names={fifo:'FIFO',lru:'LRU',opt:'OPT',random:'Random'};
  const colors={fifo:'#a66730',lru:'#22745f',opt:'#657794',random:'#8666a2'};
  const cases={textbook:M.scenarios.textbook.accesses,belady:M.scenarios.belady.accesses,loop:Array.from({length:12},(_,i)=>({page:i%4,write:false}))};
  const capacities=n=>Array.from({length:12},(_,i)=>`<option${n===i+1?' selected':''}>${i+1}</option>`).join('');
  const policies=p=>Object.keys(names).map(id=>`<option value="${id}"${p===id?' selected':''}>${names[id]}</option>`).join('');
  root.innerHTML=`<div class="page pr-page" id="top"><a class="pr-skip" href="#pr-main">跳到正文</a>${wikiHeader('replacement',[])}<main id="pr-main" tabindex="-1">
    <section class="intro"><h1>页面置换策略</h1><p>物理内存只能保留一部分页面。置换策略由 OS 决定：腾出页框时，尽量留下接下来还会用到的页。</p></section>
    <nav class="topic-tabs" role="tablist" aria-label="页面置换学习主题">${[['compare','淘汰依据'],['workloads','局部性与容量'],['implementation','Clock 与写回'],['pressure','工作集与抖动']].map(([id,label],i)=>`<button type="button" role="tab" id="tab-${id}" data-topic="${id}" aria-controls="${id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${label}</button>`).join('')}</nav>
    <section id="compare" class="topic" role="tabpanel" aria-labelledby="tab-compare">
      <header class="compare-heading"><h2 id="compare-title"></h2><p id="compare-purpose"></p></header>
      <div class="case-options" role="group" aria-label="选择比较情境">${[['textbook','FIFO 与 LRU','同容量，比较保留依据'],['belady','FIFO 的容量异常','同策略，改变页框数'],['loop','LRU 的循环困境','反复访问 4 页']].map(([id,title,note])=>`<button type="button" data-case="${id}" aria-pressed="${id==='textbook'}"><b>${title}</b><span>${note}</span></button>`).join('')}</div>
      <p id="cmp-condition" class="condition"></p>
      <div class="sequence-wrap"><span class="sequence-label">页面访问顺序 <small>点击定位 · 下方数字为页号</small></span><div id="cmp-sequence" class="sequence" role="group" aria-label="逐次查看已完成的页面访问"></div></div>
      <div class="current-reading" aria-live="polite" aria-atomic="true"><h3 id="cmp-observation"></h3><p id="cmp-explanation"></p></div>
      <div id="cmp-panels" class="comparison">${['a','b'].map((g,i)=>`<section class="comparison-panel" data-group="${g}"><header><label>策略<select id="cmp-policy-${g}" aria-label="${g.toUpperCase()} 组策略">${policies(i?'lru':'fifo')}</select></label><label>页框<select id="cmp-capacity-${g}" aria-label="${g.toUpperCase()} 组页框数">${capacities(3)}</select></label><span class="cmp-live-numbers"><span id="cmp-faults-${g}" class="fault-count"></span><small id="cmp-hit-${g}"></small></span></header><p id="cmp-rule-${g}" class="policy-rule"></p><div id="cmp-frames-${g}" class="frame-grid"></div><div id="cmp-decision-${g}" class="decision"></div><p id="cmp-basis-${g}" class="basis"></p><div id="cmp-origin-${g}" class="origin"></div></section>`).join('')}</div>
      <div class="progress-row" id="cmp-transport-row"><p id="cmp-progress"></p><div class="transport" role="group" aria-label="访问过程控制"><button id="cmp-prev" aria-label="上一次访问">←</button><button id="cmp-next" class="primary"></button><button id="cmp-play">连续访问</button><button id="cmp-reset">从头查看</button></div></div>
      <details id="cmp-detail" class="reference"></details><p id="cmp-conclusion" class="conclusion"></p><section id="cmp-benchmark" class="opt-benchmark" aria-labelledby="opt-benchmark-title"><header><span class="eyebrow">完整序列 · 缺页次数</span><h3 id="opt-benchmark-title">距离最优还有多远</h3><p id="opt-benchmark-scope"></p></header><div id="opt-benchmark-results" aria-live="polite" aria-atomic="true"></div><p class="opt-definition"><b>OPT 淘汰最晚再用的页。</b>它预知后续访问，是相同容量下的理想下限；实际 OS 无法预知完整未来。</p><button class="text-action" id="cmp-show-opt">在 A 组逐步查看 OPT →</button></section>
      <details class="reference" id="cmp-cost"><summary>少量缺页会带来多少等待</summary><p>读取内存按 100 ns、调入一页按 10 ms 估算。</p><label for="cost-miss">缺页率 <output id="cost-miss-label"></output></label><input id="cost-miss" aria-label="选择缺页率" type="range" min="0" max="4" value="2"><div class="amat-result"><strong id="cost-average"></strong><span>平均访问时间</span><span id="cost-slowdown"></span></div><p id="cost-formula" class="cost-formula"></p><p>平均访问时间 = 内存访问时间 + 缺页率 × 调入时间。这里采用串行估算，脏页写回另计。</p><div id="cmp-cost-values" class="cost-values"></div><p>当前两组均为读访问，Random 使用固定种子 7。估算值不是机器实测耗时。</p></details>
      <p class="boundary">框号固定，每格同为一个页框。删除线表示本次淘汰的旧页；绿色底边表示当前访问完成。首次载入计入缺页。</p>
    </section>
    <section id="workloads" class="topic" role="tabpanel" aria-labelledby="tab-workloads" hidden>
      <header class="lesson-intro"><h2>过去的访问，能否预测下一次使用</h2><p>LRU 利用时间局部性：最近用过的页，往往还会再用。改变访问模式，观察这一经验何时有效、何时失效。</p></header>
      <div class="case-options" role="group" aria-label="选择页面访问模式">${[['hot','热点访问','约 80% 访问集中在 2 页'],['uniform','均匀随机访问','10 页没有固定热点'],['loop','循环顺序访问','按 0～9 反复循环']].map(([id,title,note])=>`<button type="button" data-pattern="${id}" aria-pressed="${id==='hot'}"><b>${title}</b><span>${note}</span></button>`).join('')}</div>
      <div id="work-pattern-preview" class="pattern-preview" aria-label="当前访问模式"></div><div class="current-reading" aria-live="polite" aria-atomic="true"><h3 id="work-observation"></h3><p id="work-reason"></p></div>
      <figure class="curve-figure"><div class="curve-legend">${S.policies.map(p=>`<span><svg viewBox="0 0 32 8" aria-hidden="true"><path d="M0 4H32" stroke="${colors[p]}" stroke-width="2" stroke-dasharray="${p==='opt'?'5 4':p==='random'?'2 3':p==='fifo'?'9 3':'none'}"/></svg>${names[p]}${p==='opt'?' · 理想参照':''}</span>`).join('')}</div><div id="work-chart" class="curve-chart"></div><figcaption>横轴为页框数，纵轴为命中率；各策略使用同一批访问记录。每个容量点包含首次载入。</figcaption></figure>
      <label class="curve-control" for="work-capacity">当前页框数 <output id="work-capacity-value">4</output><input id="work-capacity" type="range" min="1" max="12" value="4"></label><div id="work-results" class="point-results" aria-live="polite"></div>
      <details class="reference" id="work-trace"><summary>查看当前模式的访问样本与统计条件</summary><p>每种模式使用 4 条固定种子序列，每条 500 次访问，合计 2000 次，最多 10 个不同页。下列样本为其中一条序列的前 20 次访问；Random 的选择同样可复现。</p><div id="work-sample" class="sample-pages"></div><p>热点与随机模式都存在有限样本波动，单个容量点不能代表所有程序。页框足够时仍有首次载入，因此这里的命中率不会达到 100%。</p></details>
    </section>
    <section id="implementation" class="topic" role="tabpanel" aria-labelledby="tab-implementation" hidden></section>
    <section id="pressure" class="topic" role="tabpanel" aria-labelledby="tab-pressure" hidden>
      <header class="lesson-intro"><h2>抖动：刚换出去，很快又要调回来</h2><p>各进程反复使用的页留不住，系统便可能把大量时间花在换页上。此时除了选择淘汰页，还需要控制同时活跃的内存需求。</p></header>
      <section class="thrash-demo" aria-labelledby="thrash-title">
        <header class="thrash-demo-heading"><div><p class="thrash-kicker">共用 8 个页框 · 全局 LRU</p><h3 id="thrash-title">连续观察页面的淘汰与重新调入</h3></div><div class="thrash-modes" role="group" aria-label="选择抖动播放情境"><button type="button" data-pressure-playback="3" aria-pressed="true">3 个同时活跃</button><button type="button" data-pressure-playback="2" aria-pressed="false">2 个同时活跃</button></div></header>
        <p id="thrash-demo-condition" class="condition"></p><div id="thrash-jobs" class="thrash-jobs" aria-label="各进程的当前状态"></div>
        <div class="thrash-reading"><p id="thrash-progress"></p><h4 id="thrash-observation"></h4><p id="thrash-reason"></p></div>
        <figure class="thrash-memory"><figcaption>物理内存 · 框号固定，每格等大；标记 ★ 的是 P0 的页 0</figcaption><div id="thrash-frames" class="thrash-frames"></div><div id="thrash-transfer" class="thrash-transfer"></div></figure>
        <div class="thrash-controls"><div role="group" aria-label="抖动演示控制"><button type="button" id="thrash-prev" aria-label="上一个处理步骤">←</button><button type="button" id="thrash-play" class="primary" aria-pressed="false">连续播放</button><button type="button" id="thrash-next">下一步 →</button><button type="button" id="thrash-reset">重置</button><label class="thrash-speed-label"><span>速度</span><select id="thrash-speed" aria-label="演示速度"><option value="900">慢速</option><option value="500" selected>正常</option><option value="250">快速</option></select></label></div></div>
        <div id="thrash-metrics" class="live-metrics" aria-label="截至当前步骤的统计"></div>
        <div id="thrash-location" class="thrash-location"></div>
        <div class="thrash-history"><h4>P0 · 页 0 的最近变化</h4><ol id="thrash-history"></ol></div>
        <details class="reference thrash-detail"><summary>当前步骤与换页原因</summary><p id="thrash-detail-reason"></p><p id="thrash-cycle-note"></p><p>一个进程缺页时，可能淘汰另一个进程的页面。所有访问合法、页面已有后备副本且本轮只读；淘汰干净页可直接复用页框。播放间隔不表示实际耗时。</p></details>
        <p id="thrash-stage" class="thrash-sr-only"></p><p id="thrash-announcement" class="thrash-sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
      </section>
      <section class="thrash-remedy" aria-labelledby="pressure-remedy-title"><header><h3 id="pressure-remedy-title">少一些进程同时运行，仍然完成相同工作</h3><p>工作集是进程最近一段时间内访问过的页。本例每个进程反复使用 3 页，三个进程各完成 36 次访问，等待的进程随后运行。</p></header>
        <div class="pressure-setting"><label for="pressure-limit">对照组最多同时活跃 <select id="pressure-limit"><option>1</option><option selected>2</option><option>3</option></select> 个进程</label><span id="pressure-condition"></span></div>
        <div id="pressure-results" class="pressure-results"></div>
        <div class="thrash-cost-note"><b>同一时间刻度</b><p>按每次调入 10 ms 估算条长；两组都完成 108 次目标读取，读取合计 10.8 μs。</p></div>
        <div class="thrash-conclusion" aria-live="polite" aria-atomic="true"><h4 id="pressure-observation"></h4><p id="pressure-reason"></p></div>
      </section>
      <details class="reference" id="pressure-records"><summary>逐进程访问记录与比较条件</summary><div id="pressure-traces" class="pressure-traces"></div><p>每格一次已完成访问，橙色斜纹表示缺页，绿色表示命中；每行按该进程的访问顺序排列，不表示三行同时执行。所有页面大小相同，初始内存为空，页面已有后备副本且本轮只读取，不需要脏页写回。</p><p>三个进程各循环使用 3 页。按进程轮转发起访问，限制活跃数会改变交错顺序；完成 36 次访问的进程结束本轮工作，其页面保留供后续置换，不代表进程退出时的资源回收。</p><p>串行估算采用每次调入 10 ms、每次目标读取 100 ns。条形图只计页面调入；未计 CPU 计算、调度及 I/O 重叠，数值不是机器实测耗时。是否反复缺页还取决于访问顺序，不能仅凭页面总数超过页框数就判断发生抖动。</p></details>
    </section><footer class="topic-footer"><a href="page-fault.html">缺页与按需分页 →</a><a href="#top">回到页首 ↑</a></footer></main></div>`;
  root.querySelector('.site-header nav')?.remove();
  document.title='页面置换策略 · OSLab';
  organizeReplacementPage(root);
  const compareTransport=root.querySelector('#cmp-transport-row');root.querySelector('#cmp-panels').before(compareTransport);
  const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)],text=(q,t)=>$(q).textContent=t;
  const accessDetail=createReplacementAccessDetail($('#cmp-detail'));
  const implementationView=renderReplacementImplementation($('#implementation'),M);
  let topic='compare',caseId='textbook',pattern='hot',count=6,cmpRuns=[],cmpAccesses=[],timer=null,pressureStage=0,pressureTimer=null;
  const pressureMotion=createPressureMotion($('.thrash-demo'));
  const stateAt=(r,n)=>n?r.completed[n-1]:r.snapshots[0];
  const pressureRuns=[1,2,3].map(n=>S.pressure(n)),pressureRun=pressureRuns[2];
  let pressureMode=3,pressureDemoRun=pressureRun,pressureSteps=[],pressureReloads=new Map();
  function buildPressureTimeline(){
    pressureDemoRun=pressureRuns[pressureMode-1];
    const snapshots=pressureDemoRun.run.snapshots;
    pressureSteps=pressureMode===3?[pressureDemoRun.run.completed[7],...snapshots.filter(s=>s.accessIndex>=8&&['fault','select','load','access'].includes(s.phase))]:snapshots.filter(s=>['initial','fault','hit','select','load','access'].includes(s.phase));
    const loaded=new Set();let repeated=0;pressureReloads=new Map();
    snapshots.forEach(s=>{if(s.phase==='load'){const page=pressureDemoRun.accesses[s.accessIndex].page;if(loaded.has(page))repeated++;loaded.add(page);}pressureReloads.set(s,repeated);});
    pressureStage=0;
  }
  buildPressureTimeline();
  const pressurePage=p=>'P'+Math.floor(p/3)+' · 页 '+p%3;
  function pause(){clearInterval(timer);timer=null;text('#cmp-play',count===cmpAccesses.length?'重新连续访问':'连续访问');$('#cmp-play').setAttribute('aria-pressed','false');$('#compare .current-reading').setAttribute('aria-live','polite');}
  function seek(n){pause();count=Math.max(0,Math.min(cmpAccesses.length,n));paintCompare();}
  function frameMarkup(run,n){
    const state=stateAt(run,n);
    return state.frames.map((f,index)=>{
      const changed=n&&state.selected===index&&state.victim!==null,active=n&&state.selected===index;
      const detail=f.page===null?'空闲页框':run.policy==='fifo'?'调入于访问 '+(f.loadedAt+1):run.policy==='lru'?'访问 #'+(f.usedAt+1):run.policy==='opt'?(()=>{const k=run.accesses.findIndex((a,i)=>i>=n&&a.page===f.page);return k<0?'不再使用':'再用 #'+(k+1);})():'随机候选';
      return '<div class="frame'+(active?' selected':'')+(f.page===null?' is-empty':'')+'" data-frame="'+index+'" data-page="'+(f.page??'')+'" data-capacity="1"><small>框 '+index+'</small><div class="frame-content">'+(changed?'<del aria-label="已淘汰页 '+state.victim+'">'+state.victim+'</del><i aria-hidden="true">→</i>':'')+'<strong>'+(f.page===null?'空':f.page)+'</strong></div><span>'+detail+'</span></div>';
    }).join('');
  }
  function origin(r,n){if(!n)return null;const s=stateAt(r,n),before=stateAt(r,n-1),page=r.accesses[n-1].page,hit=s.faults===before.faults;if(hit)return {index:before.frames.find(f=>f.page===page).loadedAt,kind:'载入',page,hit};for(let i=n-2;i>=0;i--)if(r.completed[i].victim===page)return {index:i,kind:'淘汰',page,hit};return {index:-1,kind:'首次',page,hit};}
  function reason(r,n){if(!n)return '尚未发起访问。';const s=stateAt(r,n),o=origin(r,n);if(o.hit)return '该页仍在内存，直接使用现有页框。';if(s.victim===null)return '还有空闲页框，本次缺页不需要淘汰驻留页。';const v=stateAt(r,n-1).frames.find(f=>f.page===s.victim);if(r.policy==='fifo')return '页 '+v.page+' 在第 '+(v.loadedAt+1)+' 次访问时调入，第 '+(v.usedAt+1)+' 次访问时被使用；FIFO 仍按调入先后淘汰。';if(r.policy==='lru')return '页 '+v.page+' 最近在第 '+(v.usedAt+1)+' 次使用，是当前最久未使用的页。';if(r.policy==='opt'){const k=r.accesses.findIndex((a,i)=>i>=n&&a.page===v.page);return k<0?'页 '+v.page+' 在剩余序列中不再使用。':'页 '+v.page+' 下次在第 '+(k+1)+' 次使用，晚于其他候选页。';}return '固定种子随机选择一个驻留页，不参考载入或使用次序。';}
  function paintCompare(){
    if(!timer)text('#cmp-play',count===cmpAccesses.length?'重新连续访问':'连续访问');
    const states=cmpRuns.map(r=>stateAt(r,count)),origins=cmpRuns.map(r=>origin(r,count));
    const preset=caseId==='textbook'?cmpRuns[0].policy==='fifo'&&cmpRuns[1].policy==='lru':cmpRuns.every(r=>r.policy===(caseId==='belady'?'fifo':'lru'));
    if(!preset){text('#compare-title','比较不同淘汰选择的后续代价');text('#compare-purpose','两组沿同一访问序列推进；OPT 基准始终使用对应组的页框数量。');}
    $('#compare .current-reading').setAttribute('aria-live',timer?'off':'polite');
    text('#cmp-progress','已完成 '+count+' / '+cmpAccesses.length+' 次访问');text('#cmp-next',count<cmpAccesses.length?'读取页 '+cmpAccesses[count].page+' →':'本序列已完成');$('#cmp-next').disabled=count===cmpAccesses.length;$('#cmp-prev').disabled=count===0;
    $$('[data-cmp-access]').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===count-1));b.tabIndex=i===(count?count-1:0)?0:-1;b.classList.toggle('completed',i<count-1);});
    text('#cmp-observation',!count?'页框初始为空':origins[0].hit!==origins[1].hit?'第 '+count+' 次读取页 '+cmpAccesses[count-1].page+'：一组缺页，另一组命中':'第 '+count+' 次读取页 '+cmpAccesses[count-1].page+'：'+(origins[0].hit?'两组命中':'两组缺页'));
    text('#cmp-explanation',!count?'沿相同序列观察首次载入、淘汰和再次使用。':cmpRuns.map((r,i)=>names[r.policy]+'（'+r.capacity+' 框）'+(origins[i].hit?'保留了目标页':states[i].victim!==null?'淘汰页 '+states[i].victim+'，载入页 '+cmpAccesses[count-1].page:'使用空闲页框载入')).join('；')+'。');
    const orderRules={fifo:'淘汰最早载入的页；命中不改变载入次序。',lru:'淘汰最久未用的页；每次访问更新使用次序。',opt:'淘汰下一次使用最远的页；需要预知未来。',random:'随机选一个驻留页；不参考过去的使用。'};
    cmpRuns.forEach((r,i)=>{const g=i?'b':'a',s=states[i],o=origins[i];text('#cmp-faults-'+g,'缺页 '+s.faults+' 次');text('#cmp-hit-'+g,'命中率 '+(count?(s.hits/count*100).toFixed(1)+'%':'—')); text('#cmp-rule-'+g,orderRules[r.policy]);$('#cmp-frames-'+g).innerHTML=frameMarkup(r,count);$('#cmp-decision-'+g).innerHTML=!count?'尚未读取':o.hit?'<b>命中页 '+o.page+'</b>':s.victim===null?'<b>首次载入页 '+o.page+'</b>':'<span>淘汰页 <b>'+s.victim+'</b></span><span aria-hidden="true">→</span><span>载入页 <b>'+o.page+'</b></span>';text('#cmp-basis-'+g,reason(r,count));$('#cmp-origin-'+g).innerHTML=o&&o.index>=0?'<button type="button" data-cmp-jump="'+o.index+'">回看第 '+(o.index+1)+' 次'+o.kind+'页 '+o.page+'</button>':'';});
    const equal=cmpRuns[0].policy===cmpRuns[1].policy&&cmpRuns[0].capacity===cmpRuns[1].capacity;let conclusion;
    if(equal)conclusion='两组策略、容量和访问记录相同，结果相同。';
    else if(cmpRuns.every(r=>r.policy==='fifo')&&cmpRuns[0].capacity!==cmpRuns[1].capacity){const large=cmpRuns[0].capacity>cmpRuns[1].capacity?0:1,small=1-large;const missing=states[small].frames.filter(f=>f.page!==null&&!states[large].frames.some(x=>x.page===f.page)).map(f=>f.page);conclusion=states[large].faults>states[small].faults?'当前容量下出现 Belady 异常：'+cmpRuns[large].capacity+' 框缺页 '+states[large].faults+' 次，反而多于 '+cmpRuns[small].capacity+' 框的 '+states[small].faults+' 次。更多页框改变了载入与淘汰顺序。':'当前容量下尚未出现更多页框反而更多缺页。FIFO 不按最近使用更新队列，容量变化会改变后续淘汰。';if(missing.length)conclusion+=' 较大容量中没有保留较小容量中的页 '+missing.join('、')+'，两组驻留集合不满足包含关系。';}
    else if(cmpRuns.every(r=>r.capacity===1))conclusion='只有一个页框，缺页时没有选择淘汰对象的余地。不同策略会替换同一个驻留页。';
    else if(cmpRuns.every(r=>r.capacity>=new Set(cmpAccesses.map(a=>a.page)).size))conclusion='两组都能容纳全部不同页；首次载入后，无需再淘汰。继续增加容量不会减少这条序列的缺页。';
    else if(caseId==='loop'&&cmpRuns.every(r=>r.policy==='lru'))conclusion='4 页循环中，同一页再次使用前经过另外 3 页。少于 4 框时，LRU 已淘汰该页；能容纳全部 4 页时，首次载入后即可命中。';
    else if(count===6&&caseId==='textbook'&&cmpRuns[0].policy==='fifo'&&cmpRuns[1].policy==='lru'&&cmpRuns.every(r=>r.capacity===3))conclusion='两组本次都缺页，代价暂时相同；差别在于 FIFO 淘汰了即将再用的页 0。下一次读取页 0，可以看到这次选择的后果。';
    else if(count===7&&caseId==='textbook'&&origins[0]?.hit!==origins[1]?.hit)conclusion='本次缺页来自此前的淘汰。对照最近一次载入或淘汰记录，可以追溯策略选择怎样影响后续访问。';
    else if(cmpRuns.every(r=>r.policy==='lru'))conclusion='LRU 的较大驻留集合包含较小集合。同一访问序列增加页框，不会产生 FIFO 这类容量异常。';
    else conclusion='较好的淘汰选择应减少后续缺页；最近使用记录是一种预测依据，不能保证每种访问模式下都最优。';
    text('#cmp-conclusion',conclusion);paintBenchmark();accessDetail.set(cmpRuns,count);
    $('#cmp-cost-values').innerHTML=cmpRuns.map(r=>{const s=stateAt(r,count),c=S.cost(count,s.faults);return '<p><b>'+names[r.policy]+' · '+r.capacity+' 框</b><span>'+count+' 次访问、'+s.faults+' 次缺页 → 平均 '+(c.average===null?'—':c.average>=1?c.average.toFixed(3)+' ms':(c.average*1000).toFixed(3)+' μs')+'</span></p>';}).join('');
  }
  function paintBenchmark(){
    text('#opt-benchmark-scope','完整 '+cmpAccesses.length+' 次访问；逐步过程已完成 '+count+' 次。以下均含首次载入。');
    const signature=caseId+':'+cmpRuns.map(r=>r.policy+'/'+r.capacity).join(':');
    if($('#opt-benchmark-results').dataset.signature===signature)return;
    $('#opt-benchmark-results').dataset.signature=signature;
    const capacities=[...new Set(cmpRuns.map(r=>r.capacity))];
    $('#opt-benchmark-results').innerHTML=capacities.map(capacity=>{
      const optimal=M.buildRun('opt',cmpAccesses,capacity,{trace:false}).completed.at(-1).faults;
      const actual=cmpRuns.map((r,i)=>({r,i})).filter(x=>x.r.capacity===capacity);
      return '<div class="opt-benchmark-group" data-opt-capacity="'+capacity+'"><h4>'+capacity+' 个页框'+(capacities.length>1?' · 与同容量 OPT 对照':' · 相同容量')+'</h4><div class="opt-benchmark-cards" style="--opt-columns:'+(actual.length+1)+'"><div class="opt-baseline"><span>OPT 基准</span><div><strong data-opt-faults>'+optimal+'</strong><small>次</small></div><p>最少缺页次数</p></div>'+actual.map(({r,i})=>{const faults=r.completed.at(-1).faults,delta=faults-optimal;return '<div class="opt-actual" data-opt-group="'+(i?'b':'a')+'"><span>'+(i?'B':'A')+' 组 · '+names[r.policy]+'</span><div><strong data-actual-faults>'+faults+'</strong><small>次</small></div><p data-opt-gap="'+delta+'">'+(delta?'比 OPT 多 '+delta+' 次':'与 OPT 相同')+'</p></div>';}).join('')+'</div></div>';
    }).join('');
  }
  function rebuildCompare(start=6){pause();const headings={textbook:['刚用过的页，仍可能被 FIFO 淘汰','观察第 6 次访问的选择，再读取页 0，比较这次淘汰造成的后果。'],belady:['页框增加，FIFO 的缺页反而可能增多','改变两组页框数，再沿同一序列观察驻留集合与淘汰次序。'],loop:['循环访问时，最久未用的页可能马上就要用','4 页反复循环。比较不同容量，观察再次访问前该页能否留在内存。']};text('#compare-title',headings[caseId][0]);text('#compare-purpose',headings[caseId][1]);cmpAccesses=cases[caseId];cmpRuns=['a','b'].map(g=>M.buildRun($('#cmp-policy-'+g).value,cmpAccesses,Number($('#cmp-capacity-'+g).value)));count=Math.min(start,cmpAccesses.length);$('#cmp-sequence').innerHTML=cmpAccesses.map((a,i)=>'<button type="button" data-cmp-access="'+i+'" aria-label="第 '+(i+1)+' 次读取页 '+a.page+'"><small>'+String(i+1).padStart(2,'0')+'</small><b>'+a.page+'</b></button>').join('');$$('[data-case]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===caseId)));text('#cmp-condition',cmpRuns[0].capacity===cmpRuns[1].capacity?'两组页框数相同，对照策略的选择依据。':cmpRuns[0].policy===cmpRuns[1].policy?'两组使用同一策略，只改变页框数量。':'策略与容量同时改变，结果受两个条件共同影响。');paintCompare();centerSequence();}
  function centerSequence(){const host=$('#cmp-sequence'),b=host.querySelector('[aria-pressed=true]');if(b&&host.clientWidth)host.scrollLeft=b.offsetLeft-host.offsetLeft-host.clientWidth/2+b.clientWidth/2;}
  function paintWorkload(){
    const c=Number($('#work-capacity').value),point=S.curves(pattern)[c-1];text('#work-capacity-value',String(c));$$('[data-pattern]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pattern===pattern)));
    let title,reason;if(c===1){title='只有一个页框，缺页时没有淘汰选择的余地';reason='缺页时只能替换当前页。本例四种策略的命中率相同。';}else if(c>=10){title='全部页面都能保留时，策略差异消失';reason='序列最多使用 10 页。容量足够后，所有策略只在首次载入时缺页；继续增加页框不再减少缺页。';}else if(pattern==='loop'){title='循环访问的页数超过容量时，LRU 会反复淘汰随后要用的页';reason='同一页再次使用前经过另外 9 页。当前 '+c+' 框不足以保留全部 10 页，LRU 与 FIFO 不断淘汰即将再用的旧页，命中率均为 0%。';}else if(pattern==='uniform'){title='均匀随机访问时，最近用过的页未必更快再用';reason='各页被均匀随机访问，LRU、FIFO 与 Random 的差异主要受容量和样本波动影响。OPT 借助未来信息仍能取得更高命中率。';}else{title='热点页频繁被访问，LRU 会将它们排在最近使用的一端';const delta=(point.results.lru.rate-point.results.fifo.rate)*100;reason='约 80% 访问集中于 2 个热点页。当前容量下，LRU 命中率比 FIFO '+(delta>=0?'高 ':'低 ')+Math.abs(delta).toFixed(1)+' 个百分点；单点结果还需要结合整条曲线判断。';}
    $('#work-pattern-preview').innerHTML='<span>访问样本</span>'+S.workload(pattern,3).slice(0,10).map(a=>'<b class="'+(pattern==='hot'&&a.page<2?'is-hot':'')+'">'+a.page+'</b>').join('')+'<span>…</span>';text('#work-observation',title);text('#work-reason',reason);$('#work-results').innerHTML=S.policies.map(p=>'<div data-policy="'+p+'"><b>'+names[p]+'</b><strong>'+(point.results[p].rate*100).toFixed(1)+'%</strong><span>缺页 '+point.results[p].faults+' / 2000</span></div>').join('');$('#work-sample').innerHTML=S.workload(pattern,3).slice(0,20).map(a=>'<span>'+a.page+'</span>').join('');drawCurve();
  }
  function drawCurve(){const host=$('#work-chart');if(!host.clientWidth)return;const w=host.clientWidth,h=260,L=40,R=15,T=18,B=38,x=n=>L+(n-1)/11*(w-L-R),y=v=>h-B-v*(h-T-B),data=S.curves(pattern),c=Number($('#work-capacity').value);host.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="各策略在 1 到 12 个页框下的命中率，具体选中数值见图下方">'+[0,.25,.5,.75,1].map(v=>'<path d="M'+L+' '+y(v)+'H'+(w-R)+'" stroke="#dce4ea"/><text x="'+(L-7)+'" y="'+(y(v)+4)+'" text-anchor="end">'+v*100+'%</text>').join('')+[1,2,4,6,8,10,12].map(n=>'<text x="'+x(n)+'" y="'+(h-17)+'" text-anchor="middle">'+n+'</text>').join('')+'<text x="'+(w-R)+'" y="'+(h-1)+'" text-anchor="end">页框数</text><path d="M'+x(c)+' '+T+'V'+(h-B)+'" stroke="#8294a7" stroke-dasharray="3 4"/>'+S.policies.map(p=>'<polyline fill="none" stroke="'+colors[p]+'" stroke-width="2"'+(p==='opt'?' stroke-dasharray="5 4"':p==='random'?' stroke-dasharray="2 3"':p==='fifo'?' stroke-dasharray="9 3"':'')+' points="'+data.map(d=>x(d.capacity)+','+y(d.results[p].rate)).join(' ')+'"/><circle cx="'+x(c)+'" cy="'+y(data[c-1].results[p].rate)+'" r="3.5" fill="'+colors[p]+'"/>').join('')+'</svg>';host.onclick=e=>{const b=host.getBoundingClientRect();$('#work-capacity').value=String(Math.max(1,Math.min(12,Math.round((e.clientX-b.left-L)/(w-L-R)*11)+1)));paintWorkload();};}
  function updatePressureControls(){
    const first=pressureStage===0,last=pressureStage===pressureSteps.length-1;
    $('#thrash-prev').disabled=first;$('#thrash-next').disabled=last;$('#thrash-reset').disabled=first&&pressureTimer===null;
    text('#thrash-play',pressureTimer!==null?'暂停':last?'重新播放':'连续播放');$('#thrash-play').setAttribute('aria-pressed',String(pressureTimer!==null));
  }
  function announcePressure(){text('#thrash-announcement',$('#thrash-progress').textContent+'；'+$('#thrash-observation').textContent);}
  function pausePressure(announce=true){const playing=pressureTimer!==null;clearInterval(pressureTimer);pressureTimer=null;pressureMotion.pause();updatePressureControls();if(playing&&announce)announcePressure();}
  function seekPressure(index){pausePressure(false);pressureStage=Math.max(0,Math.min(pressureSteps.length-1,index));paintPressureStep();announcePressure();}
  function playPressure(){
    if(pressureStage===pressureSteps.length-1){pressureStage=0;paintPressureStep();}
    pressureMotion.resume(Number($('#thrash-speed').value));
    pressureTimer=setInterval(()=>{pressureStage++;paintPressureStep();if(pressureStage===pressureSteps.length-1)pausePressure();},Number($('#thrash-speed').value));
    updatePressureControls();text('#thrash-announcement','开始连续播放页面淘汰与调入过程。');
  }
  function paintPressureStep(){
    const r=pressureDemoRun,s=pressureSteps[pressureStage],initial=pressureStage===0;
    const completed=s.phase==='initial'?0:s.phase==='access'?s.accessIndex+1:s.accessIndex;
    const page=s.accessIndex<0?null:r.accesses[s.accessIndex].page,read=page===null?'':pressurePage(page),victim=s.victim,old=victim===null?'':pressurePage(victim);
    const firstUse=page!==null&&!r.accesses.slice(0,s.accessIndex).some(a=>a.page===page),pending=!['initial','access'].includes(s.phase),repeated=pressureReloads.get(s)||0;
    let title,short,reason;
    if(initial&&pressureMode===3){title='内存已满，接下来需要第 9 页';short='9 页循环访问，8 个页框无法全部保留。';reason='前 8 次读取已完成，P0 的页 0 仍在内存中。下一次读取 P2 的页 2，需要选择淘汰页。';}
    else if(s.phase==='initial'){title='先调入页面，再观察能否反复使用';short='最多同时使用 6 页，物理内存有 8 框。';reason='P0、P1 先运行，P2 等待。每个进程循环访问 3 页；一个进程完成本轮工作后，等待的进程开始运行。';}
    else if(s.phase==='fault'){title=read+(firstUse?'：首次缺页':'：再次缺页');short='目标页不在内存，当前读取等待调入。';reason=firstUse?'这页尚未调入过。OS 先检查空闲页框，必要时选择淘汰页。':'这页此前已经调入，随后被淘汰。OS 需重新调入它，原读取才能继续。';}
    else if(s.phase==='hit'){title=read+'：命中';short='页面仍在内存，直接使用现有页框。';reason='本次访问不需要调入页面，也不需要淘汰其他页；完成读取后更新最近使用次序。';}
    else if(s.phase==='select'){title='OS 准备淘汰 '+old;short='它是当前最久未使用的页，仍占用框 '+s.selected+'。';reason=old+' 是当前最久未使用的页。它仍占用框 '+s.selected+'，接下来复用这个页框调入 '+read+'。';}
    else if(s.phase==='load'){title=read+'：已调入';short='页面已准备好，原读取尚未完成。';reason=(victim===null?'使用空闲框 '+s.selected:'框 '+s.selected+' 中的 '+old+' 已被淘汰')+'，'+read+' 已载入；接下来继续执行原读取。';}
    else {title=read+'：读取完成';short=s.accessIndex===107?'全部读取完成，共重复调入 '+repeated+' 次。':'更新最近使用次序，继续下一次访问。';reason=s.accessIndex===107?'108 次读取全部完成，其中 '+repeated+' 次需要重新调入此前被淘汰的页。':'这次读取完成，累计完成数增加 1。后续是否缺页取决于目标页是否仍在内存中。';}
    const host=$('.thrash-demo');host.dataset.thrashStep=String(pressureStage);host.dataset.phase=s.phase;host.dataset.access=String(s.accessIndex+1);host.dataset.mode=String(pressureMode);
    text('#thrash-demo-condition',pressureMode===3?'3 个进程各循环使用 3 页，合计 9 页。':'先运行 2 个进程，最多同时使用 6 页；第 3 个随后运行。');
    text('#thrash-progress',s.phase==='initial'?'初始内存为空':'第 '+(s.accessIndex+1)+' / 108 次访问 · 已完成 '+completed+' 次读取'+(pending?' · 当前读取尚未完成':''));
    text('#thrash-observation',title);text('#thrash-reason',short);text('#thrash-detail-reason',reason);
    text('#thrash-cycle-note',pressureMode===3?'同一页再次使用前经过另外 8 页，LRU 已将它淘汰。下一次缺页又淘汰另一页，换页便反复发生。':'同时活跃的页面能够留在内存中，首次调入后可以反复使用。少运行一部分进程会改变访问的交错顺序，等待的进程随后仍完成工作。');
    const jobs=r.states[completed];
    $('#thrash-jobs').innerHTML=r.jobs.map(j=>'<span data-job="'+j.id+'" data-state="'+(jobs.progress[j.id]===36?'done':jobs.active.includes(j.id)?'active':'queued')+'"><b>P'+j.id+'</b> '+(jobs.progress[j.id]===36?'本轮完成':jobs.active.includes(j.id)?'活跃':'等待')+' <small>'+jobs.progress[j.id]+'/36</small></span>').join('');
    const frames=$('#thrash-frames');
    if(!frames.children.length)frames.innerHTML=Array.from({length:8},(_,i)=>'<div class="thrash-frame" data-thrash-frame="'+i+'" data-capacity="1"><small>框 '+i+'</small><div class="thrash-page-slot"><div class="thrash-page"><b></b><span></span></div></div><em></em><i class="thrash-frame-signal" aria-hidden="true"></i></div>').join('');
    s.frames.forEach((f,i)=>{
      const n=frames.children[i],selected=!initial&&s.selected===i,empty=f.page===null;
      const status=selected?({select:'待淘汰',load:'已调入',hit:'命中',access:'读取完成'}[s.phase]||''):'';
      n.className='thrash-frame'+(empty?' is-empty':' owner-'+Math.floor(f.page/3))+(f.page===0?' is-focus':'')+(selected?(s.phase==='select'?' is-candidate':s.phase==='load'?' is-replaced':' is-current'):'');
      n.dataset.page=empty?'':String(f.page);n.querySelector('b').textContent=empty?'空闲':'P'+Math.floor(f.page/3);n.querySelector('span').textContent=empty?'':('页 '+f.page%3);n.querySelector('em').textContent=(f.page===0?'★ ':'')+(status||(f.page===0?'跟踪页':''));
    });
    const transfer=$('#thrash-transfer');
    if(!initial&&victim!==null){const prepared=s.phase==='select';transfer.innerHTML='<span>框 '+s.selected+'</span><b class="thrash-out">'+old+'<small>'+(prepared?'待淘汰':'已淘汰')+'</small></b><span class="thrash-arrow" aria-hidden="true">→</span><b class="thrash-in">'+read+'<small>'+(prepared?'待调入':'已调入')+'</small></b>';}
    else transfer.textContent=s.phase==='hit'?'框 '+s.selected+' 保留着目标页，无需调入。':s.phase==='load'?'将 '+read+' 调入空闲框 '+s.selected+'。':initial?(pressureMode===3?'所有页框均已占用。':'8 个页框均为空闲。'):'';
    const resident=s.frames.some(f=>f.page===0);$('#thrash-location').dataset.resident=String(resident);$('#thrash-location').innerHTML='<b>P0 · 页 0</b><span>'+(resident?'当前在物理内存中':'未驻留，后备存储有副本')+'</span>';
    $('#thrash-metrics').innerHTML='<span>已完成读取<b data-live-completed>'+completed+'</b></span><span>累计缺页<b data-live-faults>'+s.faults+'</b></span><span>重复调入<b data-live-reloads>'+repeated+'</b></span>';
    const stop=r.run.snapshots.indexOf(s),history=[];
    for(const event of r.run.snapshots.slice(0,stop+1)){
      if(event.phase==='load'&&event.victim===0)history.push({index:event.accessIndex,kind:'evict',label:'被淘汰'});
      if(event.phase==='fault'&&r.accesses[event.accessIndex].page===0&&event.accessIndex>0)history.push({index:event.accessIndex,kind:'fault',label:'再次缺页'});
      if(event.phase==='load'&&r.accesses[event.accessIndex].page===0)history.push({index:event.accessIndex,kind:'load',label:event.accessIndex?'重新调入':'首次调入'});
    }
    const recent=history.slice(-3);$('#thrash-history').innerHTML=recent.length?recent.map(h=>'<li class="is-'+h.kind+'" data-history-kind="'+h.kind+'" data-access="'+(h.index+1)+'"><small>访问 '+(h.index+1)+'</small><b>'+h.label+'</b></li>').join(''):'<li><small>尚未访问</small><b>等待首次调入</b></li>';
    pressureMotion.update(s,pressureStage,pressureMode,Number($('#thrash-speed').value));
    text('#thrash-stage',initial?'初始状态':({fault:'缺页',select:'选中旧页',load:'调入新页',access:'读取完成',hit:'命中'}[s.phase]));updatePressureControls();
  }
  function paintPressure(){
    const limit=Number($('#pressure-limit').value),runs=[pressureRun,pressureRuns[limit-1]],baseCost=S.cost(108,108);
    text('#pressure-condition','最多同时使用 '+limit*3+' 页 / 8 个页框；两组均使用 LRU。');
    $('#pressure-results').innerHTML=runs.map((r,i)=>{const s=r.run.completed.at(-1),unique=new Set(r.accesses.map(a=>a.page)).size,repeated=s.faults-unique,cost=S.cost(r.accesses.length,s.faults,s.writebacks);return '<section class="pressure-panel" data-pressure="'+(i?'limited':'base')+'"><header><h4>'+(i?'对照组 · 最多 '+limit+' 个同时活跃':'基准组 · 3 个同时活跃')+'</h4><p><strong data-pressure-repeat>'+repeated+'</strong> 次重复调入</p></header><p class="thrash-fault-count">首次调入 '+unique+' 次 + 重复调入 '+repeated+' 次<br>共 <b data-pressure-faults>'+s.faults+'</b> 次缺页 / 108 次访问</p><div class="thrash-time" role="img" aria-label="页面调入 '+s.faults+' 次，每次 10 毫秒，合计 '+cost.io+' 毫秒"><div class="thrash-time-bar" style="width:'+cost.io/baseCost.io*100+'%" data-io-ms="'+cost.io+'"></div></div><p class="thrash-time-label">页面调入合计 <b>'+cost.io.toLocaleString('en-US')+' ms</b></p></section>';}).join('');
    text('#pressure-observation',limit===3?'没有减少活跃数，重复换页依旧发生':'同样完成全部工作，重复调入从 99 次降为 0 次');text('#pressure-reason',limit===3?'两组都按 9 页循环访问，只有 8 个页框。LRU 在下一轮需要某页之前已将其淘汰，108 次访问全部缺页。':'对照组最多同时使用 '+limit*3+' 页，常用页能够留在内存中。等待的进程随后运行，三个进程仍各完成 36 次访问；减少的是反复调入已经用过的页。');
    $('#pressure-traces').innerHTML=runs.map((r,i)=>'<section data-pressure-trace="'+(i?'limited':'base')+'"><h4>'+(i?'对照组':'基准组')+' · 各进程均完成 36 次访问</h4>'+r.jobs.map(j=>{const entries=r.run.completed.filter((s,k)=>r.owners[k]===j.id),misses=entries.filter(s=>s.faults>(r.run.completed[s.accessIndex-1]?.faults??0)).length;return '<div class="process-access"><b>P'+j.id+'</b><div class="visit-cells" role="img" aria-label="P'+j.id+' 完成 36 次访问，其中 '+misses+' 次缺页">'+entries.map(s=>{const fault=s.faults>(r.run.completed[s.accessIndex-1]?.faults??0);return '<span class="'+(fault?'is-fault':'is-hit')+'" title="'+pressurePage(r.accesses[s.accessIndex].page)+'：'+(fault?'缺页':'命中')+'"></span>';}).join('')+'</div></div>';}).join('')+'</section>').join('');
  }
  function activate(next){pause();pausePressure();accessDetail.pause();implementationView.pause();topic=next;$$('[data-topic]').forEach(b=>{const active=b.dataset.topic===next;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;$('#'+b.dataset.topic).hidden=!active;});if(next==='workloads')paintWorkload();if(next==='compare')centerSequence();}
  root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.closest('#cmp-detail'))pause();if(b.dataset.topic){activate(b.dataset.topic);return;}if(b.dataset.case){caseId=b.dataset.case;if(caseId==='textbook'){['a','b'].forEach((g,i)=>{$('#cmp-policy-'+g).value=i?'lru':'fifo';$('#cmp-capacity-'+g).value='3';});}else ['a','b'].forEach((g,i)=>{$('#cmp-policy-'+g).value=caseId==='belady'?'fifo':'lru';$('#cmp-capacity-'+g).value=i?'4':'3';});rebuildCompare(caseId==='belady'?12:caseId==='loop'?8:6);return;}if(b.dataset.cmpAccess!==undefined){seek(Number(b.dataset.cmpAccess)+1);return;}if(b.dataset.cmpJump!==undefined){seek(Number(b.dataset.cmpJump)+1);centerSequence();$('[data-cmp-access="'+b.dataset.cmpJump+'"]').focus({preventScroll:true});return;}if(b.dataset.pressurePlayback){pausePressure(false);pressureMode=Number(b.dataset.pressurePlayback);buildPressureTimeline();$$('[data-pressure-playback]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));paintPressureStep();announcePressure();return;}if(b.dataset.pattern){pattern=b.dataset.pattern;paintWorkload();return;}});
  $('.topic-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const all=$$('[data-topic]'),old=all.indexOf(document.activeElement),i=e.key==='Home'?0:e.key==='End'?all.length-1:(old+(e.key==='ArrowRight'?1:-1)+all.length)%all.length;activate(all[i].dataset.topic);all[i].focus();});
  $('#cmp-sequence').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const b=e.target.closest('button');if(!b)return;e.preventDefault();const all=$$('[data-cmp-access]'),old=all.indexOf(b),i=e.key==='Home'?0:e.key==='End'?all.length-1:Math.max(0,Math.min(all.length-1,old+(e.key==='ArrowRight'?1:-1)));seek(i+1);centerSequence();all[i].focus({preventScroll:true});});
  ['a','b'].forEach(g=>['policy','capacity'].forEach(k=>$('#cmp-'+k+'-'+g).addEventListener('change',()=>rebuildCompare(count))));$('#cmp-prev').onclick=()=>seek(count-1);$('#cmp-next').onclick=()=>{seek(count+1);centerSequence();};$('#cmp-reset').onclick=()=>seek(0);$('#cmp-play').onclick=()=>{accessDetail.pause();if(timer){pause();return;}if(count===cmpAccesses.length)seek(0);timer=setInterval(()=>{count=Math.min(count+1,cmpAccesses.length);paintCompare();centerSequence();const origins=cmpRuns.map(r=>origin(r,count));const states=cmpRuns.map(r=>stateAt(r,count));if(count===cmpAccesses.length||origins[0].hit!==origins[1].hit||(states[0].victim!==states[1].victim&&states.some(s=>s.victim!==null)))pause();},1500);text('#cmp-play','暂停');$('#cmp-play').setAttribute('aria-pressed','true');$('#compare .current-reading').setAttribute('aria-live','off');};
  $('#cmp-show-opt').onclick=()=>{$('#cmp-policy-a').value='opt';rebuildCompare(count);$('#cmp-policy-a').focus({preventScroll:true});};
  const paintCost=()=>{const rate=[0,.0001,.001,.01,.1][Number($('#cost-miss').value)],average=.1+rate*10000; text('#cost-miss-label',(rate*100)+'%');text('#cost-average',average>=1000?(average/1000).toFixed(4)+' ms':Number(average.toFixed(3))+' μs');text('#cost-slowdown','约为只访问内存的 '+Number((average/.1).toFixed(1)).toLocaleString('en-US')+' 倍');text('#cost-formula','100 ns + '+(rate*100)+'% × 10 ms');};
  $('#cost-miss').oninput=paintCost;paintCost();
  $('#cmp-cost').addEventListener('toggle',()=>{if($('#cmp-cost').open){pause();accessDetail.pause();}});
  $$('.thrash-detail,#pressure-records').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)pausePressure();}));
  $('#cmp-detail').addEventListener('toggle',()=>{if($('#cmp-detail').open)pause();});$('#work-capacity').oninput=paintWorkload;$('#pressure-limit').onchange=paintPressure;$('#thrash-prev').onclick=()=>seekPressure(pressureStage-1);$('#thrash-next').onclick=()=>seekPressure(pressureStage+1);$('#thrash-reset').onclick=()=>seekPressure(0);$('#thrash-play').onclick=()=>pressureTimer===null?playPressure():pausePressure();$('#thrash-speed').onchange=()=>{if(pressureTimer!==null){pausePressure(false);playPressure();}};
  const openAnchor=()=>{const hash=location.hash.slice(1);if(['top','pr-main'].includes(hash))return;activate(['workloads','pressure'].includes(hash)?hash:['clock','implementation','dirty'].includes(hash)?'implementation':'compare');if(hash==='dirty')implementationView.select('dirty');};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();pausePressure();accessDetail.pause();implementationView.pause();}});window.addEventListener('pagehide',()=>{pause();pausePressure();accessDetail.pause();implementationView.pause();});window.addEventListener('hashchange',openAnchor);window.addEventListener('resize',()=>{if(topic==='workloads')drawCurve();});
  rebuildCompare();paintPressure();paintPressureStep();openAnchor();
}
renderReplacementPage(document.getElementById('root'));

function organizeReplacementPage(root){
  const $=s=>root.querySelector(s),make=(tag,cls)=>Object.assign(document.createElement(tag),{className:cls});
  const layout=make('div','compare-layout'),stage=make('div','comparison-stage'),aside=make('aside','compare-aside');
  $('#compare').append(layout);layout.append(stage,aside);
  ['.sequence-wrap','#compare .current-reading','#cmp-transport-row','#cmp-panels','#cmp-condition','#cmp-conclusion','#cmp-detail','#compare .boundary'].forEach(s=>stage.append($(s)));
  aside.append($('#cmp-benchmark'),$('#cmp-cost'));
  root.querySelectorAll('.comparison-panel').forEach((panel,i)=>{panel.append(panel.querySelector('.cmp-live-numbers'));const label=make('span','group-letter');label.textContent=i?'B':'A';panel.querySelector('header').prepend(label);});
  const work=make('div','workbench'),settings=make('div','work-settings'),plot=make('div','work-plot'),finding=$('#workloads .current-reading');
  $('#workloads .lesson-intro').after(work);work.append(settings,plot);
  settings.append($('#workloads .case-options'),$('.curve-control'));
  plot.append($('#work-pattern-preview'),$('.curve-figure'),$('#work-results'));
  work.after(finding);finding.classList.add('work-finding');
  const tl=make('div','thrash-layout'),ts=make('div','thrash-stage'),follow=make('aside','thrash-follow');
  $('#thrash-jobs').after(tl);tl.append(ts,follow);
  ['.thrash-reading','.thrash-memory','.thrash-controls','#thrash-metrics'].forEach(s=>ts.append($(s)));
  follow.innerHTML='<h4>跟踪同一个页</h4>';follow.append($('#thrash-location'),$('.thrash-history'));
}
