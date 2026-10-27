/* Optional replay of one completed access, using the model's unmodified snapshots. */
function createReplacementAccessDetail(host) {
  let runs=[],traces=[],index=0,timer=null,count=0;
  const names={fifo:'FIFO',lru:'LRU',opt:'OPT',random:'Random'};
  host.innerHTML='<summary>展开本次访问的处理过程</summary><div class="access-detail-body"><p class="condition" data-detail-scope></p><div class="access-detail-panels"></div><div class="transport"><button type="button" data-detail-prev aria-label="上一个访问处理步骤">←</button><button type="button" data-detail-play class="primary" aria-pressed="false">播放过程</button><button type="button" data-detail-next>下一步 →</button><button type="button" data-detail-reset>重置</button></div><p class="thrash-sr-only" data-detail-status role="status" aria-live="polite"></p></div>';
  const $=q=>host.querySelector(q),limit=()=>Math.max(1,...traces.map(t=>t.length))-1;
  function announce(){ $('[data-detail-status]').textContent=[...host.querySelectorAll('.access-detail-action')].map(n=>n.textContent).join('；'); }
  function controls(){ $('[data-detail-prev]').disabled=index===0;$('[data-detail-next]').disabled=index===limit();$('[data-detail-reset]').disabled=index===0&&!timer;$('[data-detail-play]').textContent=timer?'暂停':index===limit()?'重新播放':'播放过程';$('[data-detail-play]').setAttribute('aria-pressed',String(!!timer)); }
  function pause(speak=false){clearInterval(timer);timer=null;controls();if(speak)announce();}
  function describe(s,r){const p=r.accesses[count-1].page;return {request:'程序请求读取页 '+p,hit:'硬件找到驻留页 '+p,fault:'目标页未驻留，发生缺页',select:'OS 选中页 '+s.victim+'，准备淘汰',writeback:'正在保存页 '+s.victim+' 的修改',written:'写回完成，页框可以复用',load:'页 '+p+' 已调入，原读取尚未完成',access:'页 '+p+' 读取完成'}[s.phase]||s.reason;}
  function paint(){
    if(!count||!traces.length)return;
    $('[data-detail-scope]').textContent='回放第 '+count+' 次访问 · 每格按物理框号固定排列；两组分别按自身处理步骤推进。';
    $('.access-detail-panels').innerHTML=traces.map((t,i)=>{
      const pos=Math.min(index,t.length-1),s=t[pos],r=runs[i],done=s.phase==='access';
      return '<section data-detail-group="'+i+'"><header><b>'+names[r.policy]+' · '+r.capacity+' 框</b><span>'+ (pos+1)+' / '+t.length+' 步</span></header><h4 class="access-detail-action">'+describe(s,r)+'</h4><div class="access-detail-frames">'+s.frames.map((f,j)=>'<div data-detail-frame="'+j+'" data-page="'+(f.page??'')+'" class="'+(f.page===null?'is-empty':'')+(s.selected===j?' is-active':'')+'"><small>框 '+j+'</small><b>'+(f.page===null?'空闲':'页 '+f.page)+'</b></div>').join('')+'</div><p class="access-detail-reason">'+s.reason+'</p><p class="access-detail-count">已完成 '+(done?count:count-1)+' 次 · 累计缺页 '+s.faults+' 次'+(done?' · 本组读取完成':'')+'</p></section>';
    }).join('');controls();
  }
  function seek(n){pause();index=Math.max(0,Math.min(limit(),n));paint();announce();}
  $('[data-detail-prev]').onclick=()=>seek(index-1);$('[data-detail-next]').onclick=()=>seek(index+1);$('[data-detail-reset]').onclick=()=>seek(0);
  $('[data-detail-play]').onclick=()=>{if(timer){pause(true);return;}if(index===limit())index=0;paint();timer=setInterval(()=>{index++;paint();if(index===limit())pause(true);},1100);controls();};
  host.addEventListener('toggle',()=>{if(!host.open)pause();});
  return {pause,set(nextRuns,nextCount){pause();runs=nextRuns;count=nextCount;index=0;host.hidden=!count;traces=count?runs.map(r=>r.snapshots.filter(s=>s.accessIndex===count-1)):[];paint();}};
}
