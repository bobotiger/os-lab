/* Clock views share the deterministic replacement model; controls only select snapshots. */
function renderReplacementImplementation(host, M) {
  const accesses=M.scenarios.dirty.accesses.slice(0,4);
  const runs=['clock','clock-clean'].map(policy=>M.buildRun(policy,accesses));
  const lru=M.buildRun('lru',accesses);
  const steps=run=>run.snapshots.filter(s=>s.accessIndex===3&&s.phase!=='request');
  const clockSteps=steps(runs[0]);
  const dirtySteps=runs.map(run=>[run.completed[2],...steps(run)]);
  let selected='clock';
  host.classList.add('replacement-implementation');
  host.innerHTML=`
    <header class="lesson-intro"><h2>用较低开销，找到合适的淘汰对象</h2><p>精确 LRU 要在每次访问时维护使用次序。Clock 只记录“清零后是否用过”，把寻找候选的工作留到回收时。</p></header><div class="impl-responsibility"><div><b>硬件 · 访问时</b><span>读写将 R 置 1；写入还将 D 置 1。</span></div><span aria-hidden="true">→</span><div><b>OS · 回收时</b><span>检查 R，清零或选择淘汰；D 决定是否写回。</span></div></div>
    <div class="subtopics" role="group" aria-label="Clock 的实现取舍"><button type="button" data-implementation="clock" aria-pressed="true">访问位与循环扫描</button><button type="button" data-implementation="dirty" aria-pressed="false">脏页与写回代价</button></div>
    <div class="impl-conditions"><span>已完成</span><b>写页 0</b><span>→</span><b>读页 1</b><span>→</span><b>写页 2</b><strong>现在读页 3</strong></div>
    <section id="impl-clock" aria-label="Clock 循环扫描">
      <div class="impl-clock-stage">
        <div class="impl-current"><p id="clock-progress"></p><h3 id="clock-observation"></h3><p id="clock-pending"></p><p id="clock-reason"></p></div>
        <figure class="impl-clock-figure"><div id="clock-diagram"></div><figcaption>箭头：下次检查位置 · 描边：当前处理的框</figcaption></figure>
        <div class="impl-transport" role="group" aria-label="Clock 演示控制"><button type="button" id="clk-play" class="primary" aria-pressed="false">自动播放</button><button type="button" id="clk-prev" aria-label="上一个处理步骤">←</button><button type="button" id="clk-next">下一步 →</button><button type="button" id="clk-reset">重置</button></div>
        <div id="clock-metrics" class="impl-metrics" aria-label="本次缺页处理统计"></div>
        <div class="impl-bits"><span><b>R=1</b> 清零后被访问过</span><span><b>D=1</b> 有未写回的修改</span></div>
      </div>
      
      <details class="reference" id="clock-history"><summary>少记了哪些信息，节省了哪些操作</summary><p>精确 LRU 持续更新各页最后一次访问的次序。R 位只记录自上次清零后是否被访问过，不能区分同为 R=1 的页谁先被访问。</p><div id="lru-order" class="order-list"></div><p id="clock-accounting"></p><p>硬件置位、记录访问与检查候选是不同操作，次数不能直接相加当作耗时。</p></details>
    </section>
    <section id="impl-dirty" aria-label="普通 Clock 与优先干净页的比较" hidden>
      <div class="impl-dirty-heading"><h3>多检查一个候选，省去一次写回</h3><p>两组从相同内存状态读取页 3；普通 Clock 遇到 R=0 就选中，另一组继续寻找干净页。</p></div>
      <div class="impl-transport impl-dirty-controls" role="group" aria-label="脏页比较演示控制"><button type="button" id="dirty-play" class="primary" aria-pressed="false">自动播放</button><button type="button" id="dirty-prev" aria-label="脏页比较上一步">←</button><button type="button" id="dirty-next">下一步 →</button><button type="button" id="dirty-reset">重置</button></div>
      <div id="dirty-comparison" class="impl-dirty-grid">${['ordinary','clean'].map((id,i)=>`<section data-dirty-mode="${id}"><header><h4>${i?'优先干净页':'普通 Clock'}</h4><p data-dirty-progress></p></header><p class="impl-dirty-action" data-dirty-action></p><div class="impl-dirty-frames" data-dirty-frames></div><div class="impl-metrics" data-dirty-metrics></div><div class="io-track" data-dirty-io aria-label="本次置换的 I/O"></div><p class="io-count" data-dirty-count></p></section>`).join('')}</div>
      <p class="impl-io-scale">每个完整 I/O 块按 10 ms 估算。两组各推进自己的下一步，播放间隔不表示实际耗时。</p>
      <p id="dirty-conclusion" class="conclusion"></p>
      <details class="reference" id="dirty-detail"><summary>为什么优先干净页也有代价</summary><div class="impl-dirty-reasons"><p data-dirty-reason="ordinary"></p><p data-dirty-reason="clean"></p></div><p>干净页已有一致的后备副本，淘汰时可以省去写回。但多检查候选也有开销，且干净页可能很快再被使用；缺页次数和每次置换的代价需要一起考虑。</p><p>批量写回可以合并磁盘 I/O。预取则提前调入预计将使用的页；猜错会浪费 I/O 与页框。两者分别调整写出和调入时机，仍需结合访问规律。</p></details>
    </section><p class="impl-announcement" role="status" aria-live="polite" aria-atomic="true"></p>`;
  const $=q=>host.querySelector(q), $$=q=>[...host.querySelectorAll(q)];
  const text=(q,value)=>$(q).textContent=value;
  const label={access:'读取完成',fault:'缺页',clear:'检查访问位',skip:'检查脏位',select:'选中旧页',writeback:'写回中',written:'写回完成',load:'调入完成'};
  const description=(s,initial=false)=>{
    if(initial)return {action:'内存已满，准备读取页 3',reason:'页 0 和页 2 有未写回的修改，页 1 干净。三页的 R 都为 1，指针从框 0 开始。'};
    const dirty=s.selected!==null&&s.frames[s.selected].dirty;
    return {
      fault:{action:'页 3 未驻留，需要腾出一个页框',reason:'页 3 缺页，原读取等待。OS 从框 0 开始扫描候选页。'},
      clear:{action:'框 '+s.selected+'：R 清零，页面仍驻留',reason:'OS 把 R 从 1 清为 0，并移到下一框。这不是把页面移出内存；之后若再次访问该页，硬件会重新将 R 置为 1。'},
      skip:{action:'框 '+s.selected+' 有修改，继续找干净页',reason:'当前页的 R=0、D=1。先检查其他候选，寻找可以省去写回的干净页。'},
      select:{action:'准备淘汰页 '+s.victim,reason:dirty?'页 '+s.victim+' 的 R=0、D=1。已选中它，但旧页面仍占用页框；保存修改后才能复用。':'页 '+s.victim+' 的 R=0、D=0，已有一致后备副本，可以直接复用此页框。'},
      writeback:{action:'写回页 '+s.victim+'，保存修改',reason:'旧页面仍占用页框。写回尚未完成，页 3 还没有调入。'},
      written:{action:'页 '+s.victim+' 写回完成',reason:'后备副本已更新。旧页仍在框中，接下来撤销旧映射并调入页 3。'},
      load:{action:'页 3 已调入，原读取尚未完成',reason:'页 '+s.victim+' 已被淘汰，页 3 占用框 '+s.selected+'。映射更新后，还需要完成原来的读取。'},
      access:{action:'页 3 读取完成，R 置为 1',reason:'硬件完成原读取并将页 3 的 R 置为 1；读操作不产生新的脏页修改。'}
    }[s.phase];
  };
  const phaseStatus=(s,initial=false)=>initial?'初始状态':s.phase==='select'?'待淘汰':s.phase==='load'?'已调入':s.phase==='access'?'读取完成':s.phase==='clear'?'R 已清零':s.phase==='skip'?'继续检查':label[s.phase];
  function controller(prefix,length,paint){
    let index=0,timer=null;
    const state={get index(){return index;},get playing(){return timer!==null;},pause(announce=false){const active=timer!==null;clearInterval(timer);timer=null;update();if(active&&announce)say();}};
    function update(){text('#'+prefix+'-play',timer!==null?'暂停':index===length-1?'重新播放':'自动播放');$('#'+prefix+'-play').setAttribute('aria-pressed',String(timer!==null));$('#'+prefix+'-prev').disabled=index===0;$('#'+prefix+'-next').disabled=index===length-1;$('#'+prefix+'-reset').disabled=index===0&&timer===null;}
    function say(){text('.impl-announcement',prefix==='clk'?$('#clock-observation').textContent:$$('[data-dirty-action]').map(n=>n.textContent).join('；'));}
    function seek(next){state.pause();index=Math.max(0,Math.min(length-1,next));paint(index,false);update();say();}
    function play(){pause();if(index===length-1)index=0;timer=setInterval(()=>{index++;paint(index,true);if(index===length-1){state.pause();say();}update();},1100);paint(index,true);update();text('.impl-announcement','开始播放'+(prefix==='clk'?' Clock 扫描过程。':'两组置换过程。'));}
    $('#'+prefix+'-play').onclick=()=>timer!==null?state.pause(true):play();
    $('#'+prefix+'-prev').onclick=()=>seek(index-1);$('#'+prefix+'-next').onclick=()=>seek(index+1);$('#'+prefix+'-reset').onclick=()=>seek(0);
    state.paint=()=>{paint(index,false);update();};
    return state;
  }
  function metrics(s,run,initial=false){const baseline=run.completed[2],ioLoads=!initial&&['load','access'].includes(s.phase)?1:0;return '<span><b>'+ (s.scans-baseline.scans)+'</b> 次检查</span><span><b>'+(s.writebacks-baseline.writebacks)+'</b> 次写回</span><span><b>'+ioLoads+'</b> 次调入</span>';}
  function paintClock(index){
    const s=clockSteps[index],copy=description(s),centers=[[170,49],[267,216],[73,216]],hand=centers[s.hand],tip=[170+(hand[0]-170)*.6,158+(hand[1]-158)*.6];
    $('#impl-clock').dataset.phase=s.phase;$('#impl-clock').dataset.step=String(index);
    text('#clock-progress','第 4 次访问 · '+label[s.phase]);text('#clock-observation',copy.action);text('#clock-pending',s.phase==='access'?'本次读取已完成':'本次读取尚未完成');text('#clock-reason',copy.reason);
    $('#clock-diagram').innerHTML='<svg viewBox="0 0 340 280" role="img" aria-label="Clock 循环页框，下一次检查框 '+s.hand+'。'+s.frames.map((f,i)=>'框 '+i+' 页 '+f.page+' R='+Number(f.referenced)+' D='+Number(f.dirty)).join('；')+'"><defs><marker id="impl-clock-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#93602b"/></marker></defs><circle cx="170" cy="158" r="108" fill="none" stroke="#cddbd4" stroke-dasharray="4 5"/><path d="M170 158L'+tip.join(' ')+'" stroke="#93602b" stroke-width="2.2" marker-end="url(#impl-clock-arrow)"/><circle cx="170" cy="158" r="4" fill="#93602b"/>'+s.frames.map((f,i)=>{const [x,y]=centers[i];return '<g class="clock-frame'+(s.selected===i?' selected':'')+'" data-frame="'+i+'" data-page="'+f.page+'" data-r="'+Number(f.referenced)+'" data-d="'+Number(f.dirty)+'"><rect x="'+(x-48)+'" y="'+(y-37)+'" width="96" height="77" rx="5"/><text class="clock-frame-id" x="'+x+'" y="'+(y-18)+'">框 '+i+'</text><text class="clock-page-id" x="'+x+'" y="'+(y+5)+'">页 '+f.page+'</text><text class="clock-bits" x="'+x+'" y="'+(y+27)+'">R='+Number(f.referenced)+' · D='+Number(f.dirty)+'</text></g>';}).join('')+'<text class="clock-center-label" x="170" y="188">0 → 1 → 2 → 0</text></svg>';
    $('#clock-metrics').innerHTML=metrics(s,runs[0]);
    const completed=s.phase==='access'?4:3,exact=lru.completed[completed-1];
    $('#lru-order').innerHTML=exact.frames.filter(f=>f.page!==null).sort((a,b)=>a.usedAt-b.usedAt).map(f=>'<span><b>页 '+f.page+'</b><small>最后访问于第 '+(f.usedAt+1)+' 次</small></span>').join('');
    text('#clock-accounting','已完成相同的 '+completed+' 次访问：LRU 已记录 '+exact.records+' 次访问，并更新使用次序；Clock 由硬件置位 '+s.referenceSets+' 次，本次回收已检查 '+s.scans+' 次。');
  }
  function paintDirty(index){
    $('#impl-dirty').dataset.step=String(index);
    const finished=dirtySteps.every(steps=>index>=steps.length-1);
    dirtySteps.forEach((steps,i)=>{
      const step=Math.min(index,steps.length-1),s=steps[step],initial=step===0,mode=i?'clean':'ordinary',panel=$('[data-dirty-mode="'+mode+'"]'),copy=description(s,initial),atEnd=step===steps.length-1;
      panel.dataset.phase=initial?'initial':s.phase;panel.dataset.step=String(step);
      panel.querySelector('[data-dirty-progress]').textContent=initial?'读取页 3 前':'处理步骤 '+step+' / '+(steps.length-1)+(atEnd?' · 已完成':'');
      panel.querySelector('[data-dirty-action]').textContent=copy.action;
      panel.querySelector('[data-dirty-frames]').innerHTML=s.frames.map((f,j)=>'<div class="impl-dirty-frame'+(!initial&&s.selected===j?' is-selected':'')+'" data-frame="'+j+'" data-page="'+f.page+'" data-r="'+Number(f.referenced)+'" data-d="'+Number(f.dirty)+'"><small>框 '+j+'</small><b>页 '+f.page+'</b><span>R='+Number(f.referenced)+' · D='+Number(f.dirty)+'</span><em>'+(!initial&&s.selected===j?phaseStatus(s):f.dirty?'有修改':'干净')+'</em></div>').join('');
      panel.querySelector('[data-dirty-metrics]').innerHTML=metrics(s,runs[i],initial);
      const write=s.writebacks-runs[i].completed[2].writebacks,loaded=!initial&&['load','access'].includes(s.phase),writing=s.phase==='writeback';
      panel.querySelector('[data-dirty-io]').innerHTML=(write||writing?'<span class="write'+(writing?' is-pending':'')+'">'+(writing?'写回中':'写回完成')+'<small>页 '+s.victim+' · '+(writing?'预计 ':'')+'10 ms</small></span>':'')+(loaded?'<span class="read">调入完成<small>页 3 · 10 ms</small></span>':'')+(!write&&!writing&&!loaded?'<span class="io-placeholder">尚未完成 I/O</span>':'');
      panel.querySelector('[data-dirty-count]').textContent=(write+Number(loaded))+' 次 I/O 已完成 · '+((write+Number(loaded))*10)+' ms';
      text('[data-dirty-reason="'+mode+'"]',(i?'优先干净页：':'普通 Clock：')+copy.reason);
    });
    text('#dirty-conclusion',finished?'两组各缺页 1 次。优先干净页多检查 1 次，省去 1 次写回，I/O 估算从 20 ms 减为 10 ms。':'有修改的页需要先写回；干净页可直接复用页框。');
  }
  const clock=controller('clk',clockSteps.length,paintClock);
  const dirty=controller('dirty',Math.max(...dirtySteps.map(steps=>steps.length)),paintDirty);
  function pause(){clock.pause();dirty.pause();}
  function select(name){pause();selected=name==='dirty'?'dirty':'clock';$$('[data-implementation]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.implementation===selected)));$('#impl-clock').hidden=selected!=='clock';$('#impl-dirty').hidden=selected!=='dirty';}
  host.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)pause();}));
  $$('[data-implementation]').forEach(button=>button.onclick=()=>select(button.dataset.implementation));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('pagehide',pause);
  clock.paint();dirty.paint();
  return {pause,select};
}
