function renderSegmentationPage(root) {
  const {segments,operations,buildAccess,buildCompaction}=OSLabSegmentation;
  const example={0:4,1:20,3:60};
  const topics={layout:'分开存放',access:'地址与权限',space:'连续空间的代价'};
  const range=segment=>segment.direction===1?[segment.base,segment.base+segment.bounds-1]:[segment.base-segment.bounds,segment.base-1];
  const bits=value=>value.toString(2).padStart(6,'0');
  
  const transport=id=>`<div class="se-transport" id="se-${id}-controls" role="group" aria-label="${id==='access'?'地址转换':'内存整理'}播放控制"><button type="button" data-control="prev" aria-label="上一步">←</button><button type="button" data-control="play" class="se-primary" aria-pressed="false">播放</button><button type="button" data-control="next" aria-label="下一步">→</button><button type="button" data-control="reset">重置</button><select aria-label="播放速度"><option value="2000">慢速</option><option value="1300" selected>正常</option><option value="700">快速</option></select></div>`;
  const region=(segment,physical=false)=>{const [start,end]=physical?range(segment):[segment.virtualStart,segment.virtualEnd];return `<button type="button" data-segment="${segment.id}" class="se-region se-color-${segment.id}" style="top:${start/64*100}%;height:${segment.bounds/64*100}%" aria-label="${physical?'物理':'虚拟'}${segment.name}段，${start} 至 ${end}" aria-pressed="false"><b>${segment.name}</b><span>${start}–${end}</span></button>`;};
  root.innerHTML=`<div class="page se-page" id="top"><a class="se-skip" href="#main-content">跳到主要内容</a>${wikiHeader('segmentation',[])}<main id="main-content" tabindex="-1">
    <header class="se-intro"><h1>分段 <span>Segmentation</span></h1><p>从整个地址空间共用一对设置，改为给代码、堆和栈分别设置基址与界限。<strong>各段独立放置，段内保持连续。</strong></p></header>
    <nav class="se-topics" role="tablist" aria-label="分段学习主题">${Object.entries(topics).map(([id,title])=>`<button type="button" role="tab" id="se-tab-${id}" data-topic="${id}" aria-controls="${id==='layout'?'why':id==='access'?'demo':'tradeoffs'}" aria-selected="${id==='layout'}" tabindex="${id==='layout'?0:-1}">${title}</button>`).join('')}</nav>
    <section id="why" role="tabpanel" aria-labelledby="se-tab-layout">
      <header class="se-section-head"><h2>段间空白不必占用物理内存</h2><p>一个很大的虚拟地址范围，可能只包含几个较小的段。分段后，OS 只为各段分配空间。</p></header>
      <figure class="se-savings" aria-label="相同比例比较物理分配量：整段 64，分段 22">
        <div class="se-saving-row"><span>整个地址空间 <b>64</b></span><div class="se-size-scale se-whole"><i class="se-size-code" style="left:0;width:12.5%"></i><i class="se-size-heap" style="left:25%;width:9.375%"></i><i class="se-size-stack" style="left:87.5%;width:12.5%"></i><span>段间空白也需分配</span></div></div>
        <div class="se-saving-row"><span>按段分配 <b>22</b></span><div class="se-size-scale"><div class="se-sized-block se-size-code" style="width:12.5%">8</div><div class="se-sized-block se-size-heap" style="width:9.375%">6</div><div class="se-sized-block se-size-stack" style="width:12.5%">8</div><span class="se-saved-note">省去 42 单位</span></div></div>
        <figcaption>上图比较分配量；下面显示三段的实际位置。单位为示意大小，不对应真实字节。</figcaption>
      </figure>
      <div class="se-layout"><figure class="se-mapping-figure"><div class="se-map-headings"><span>进程 A · 虚拟地址</span><span>物理内存</span></div>
        <div class="se-mapping"><div class="se-map se-virtual">${segments.map(s=>region(s)).join('')}<span class="se-gap" style="top:12.5%;height:12.5%">段外<span>8–15</span></span><span class="se-gap" style="top:34.375%;height:53.125%">未分配的虚拟范围<span>22–55</span></span></div>
          <svg class="se-links" viewBox="0 0 100 480" preserveAspectRatio="none" role="img" aria-label="三个段各自映射到连续物理区域"><defs><marker id="se-arrow" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" fill="context-stroke"/></marker></defs>${segments.map(s=>`<path data-route="${s.id}" d="M0 ${(s.virtualStart+s.bounds/2)/64*480}L100 ${(range(s)[0]+s.bounds/2)/64*480}" marker-end="url(#se-arrow)"/>`).join('')}</svg>
          <div class="se-map se-physical"><span class="se-os">OS<span>0–7</span></span>${segments.map(s=>region(s,true)).join('')}<span class="se-free" style="top:25%;height:12.5%">空闲<span>16–23</span></span><span class="se-free" style="top:46.875%;height:28.125%">空闲<span>30–47</span></span><span class="se-free" style="top:87.5%;height:12.5%">空闲<span>56–63</span></span></div>
        </div><figcaption class="se-map-caption"><span>0 → 63</span><span>两侧使用同一比例</span><span>0 → 63</span></figcaption></figure>
        <aside class="se-inspector"><p class="se-eyebrow">每个段都有自己的设置</p><h3 id="se-segment-name"></h3><dl id="se-segment-facts"></dl><p id="se-segment-note"></p><button type="button" class="se-primary" id="se-trace">查看这段的地址转换 →</button></aside>
      </div>
      <p class="se-conclusion"><strong>省去的是段与段之间的空白。</strong>每个段内部仍连续分配；若堆段内部使用稀疏，其中的空白仍会占内存。</p>
    </section>
    <section id="demo" role="tabpanel" aria-labelledby="se-tab-access" hidden>
      <header class="se-section-head"><h2>先选段，再用段内偏移转换</h2><p>高位确定使用哪组设置；低位的含义还要结合增长方向。范围和权限都通过，才能访问。</p></header>
      <div class="se-presets" role="group" aria-label="经典访问场景"><button type="button" data-case="heap">堆内读取 <b>VA 20</b></button><button type="button" data-case="stack">栈内读取 <b>VA 60</b></button><button type="button" data-case="permission">写代码段 <b>VA 4</b></button></div>
      <div class="se-request"><label>虚拟地址 <input id="se-address" type="number" min="0" max="63" step="1" value="20" aria-describedby="se-input-error" inputmode="numeric"></label><div class="se-operations" role="group" aria-label="访问类型">${Object.entries(operations).map(([op,name])=>`<button type="button" data-operation="${op}" aria-pressed="${op==='read'}">${name}</button>`).join('')}</div>${transport('access')}</div>
      <p id="se-input-error" class="se-error" role="alert" hidden></p>
      <div id="se-access-content"><div class="se-steps" id="se-access-steps" role="group" aria-label="转换阶段"></div>
        <div class="se-access-board"><aside class="se-directory"><h3>各段设置 <span>OS 配置</span></h3>${segments.map(s=>`<button type="button" class="se-descriptor se-color-${s.id}" data-descriptor="${s.id}" data-example="${example[s.id]}"><span><b>${s.id.toString(2).padStart(2,'0')} · ${s.name}</b><small>${s.direction===1?'向高地址增长':'向低地址增长'}</small></span><span class="se-descriptor-values"><span>base <b>${s.base}</b></span><span>长度 <b>${s.bounds}</b></span></span><small>${s.permissions.map(op=>operations[op]).join(' / ')}</small></button>`).join('')}<button type="button" data-descriptor="2" data-example="32" class="se-unmapped">10 · 未配置段</button><p>切换进程时，OS 保存、恢复各段设置。每次转换与保护检查由硬件完成。</p></aside>
          <div class="se-access-focus"><div class="se-address-code"><span class="se-va-label">VA <b id="se-va">20</b></span><div class="se-bits" id="se-bits"></div><span class="se-mode" id="se-mode">用户态</span></div>
            <div class="se-execution" aria-live="polite"><span id="se-access-progress"></span><h3 id="se-access-title"></h3><p id="se-access-text"></p></div>
            <figure id="se-offset-figure"></figure>
            <div class="se-checks"><span id="se-range-check"></span><span id="se-permission-check"></span></div>
            <div class="se-result"><div><span>物理地址</span><strong id="se-pa">—</strong></div><p id="se-result-text">尚未生成</p></div>
          </div>
        </div>
      </div>
      <p class="se-note">本例 A 使用 6 位虚拟地址：高 2 位选段，低 4 位编码偏移，每个选址区间最多 16 单位。区间大小与当前段长是两回事；每次请求访问 1 单位。</p>
      <details id="sharing" class="se-detail"><summary>只读代码段可以共享，数据段仍各自独立</summary><div class="se-sharing"><figure><div class="se-share-sources"><div>进程 A<small>代码段 0–7 · 读 / 取指</small></div><div>进程 B<small>代码段 0–7 · 读 / 取指</small></div></div><svg viewBox="0 0 600 65" preserveAspectRatio="none" aria-hidden="true"><line x1="150" y1="0" x2="300" y2="65"/><line x1="450" y1="0" x2="300" y2="65"/></svg><div class="se-share-target">同一份物理代码 <strong>8–15</strong></div><figcaption>两份段设置指向同一份代码，共占 8 单位；各进程的堆和栈可以继续保持私有。</figcaption></figure><div><h3>禁止写入，保护共享的代码</h3><p>代码段可以同时映射给多个进程。禁止写入，使一个进程不能随意改动其他进程正在使用的代码。</p><button type="button" id="se-check-shared" class="se-text-button">检查对代码段的写入 →</button></div></div></details>
    </section>
    <section id="tradeoffs" role="tabpanel" aria-labelledby="se-tab-space" hidden>
      <header class="se-section-head"><h2>总空闲 20，也可能放不下一个 16 单位的段</h2><p>段与段可以分散，每个段却仍需要连续空间。分散在已分配段之间的小块空闲，形成了<strong>外部碎片</strong>。</p></header>
      <div class="se-space-metrics"><div><span>当前空闲总量</span><strong id="se-free-total">20</strong></div><div><span>最大连续空闲块</span><strong id="se-free-largest">8</strong></div><div><span>新段需要</span><strong>16</strong></div><p id="se-fit-status">总量够，连续空间不够</p></div>
      <div class="se-space-toolbar"><div><h3>整理内存，再分配新段</h3><p>OS 按地址顺序将各段紧凑排列，并同步更新基址。</p></div>${transport('space')}</div>
      <figure class="se-compaction"><figcaption><span>物理地址 · 0–63</span><span id="se-process-state">A、B 正在运行</span></figcaption><div class="se-memory" id="se-space-memory"><div id="se-space-free"></div>${[['os','OS'],['code','代码'],['heap','堆'],['b','B'],['stack','栈'],['new','新段']].map(([id,name])=>`<div class="se-space-block se-block-${id}" data-block="${id}"><span>${name}</span></div>`).join('')}</div><div class="se-ruler" aria-hidden="true">${[0,8,16,24,32,40,48,56,64].map(n=>`<span style="left:${n/64*100}%">${n}</span>`).join('')}</div><p class="se-space-key"><i></i>虚线空白为可用区域。A 的代码、堆、栈仍为 8、6、8 单位；B 的段另占 14 单位。</p></figure>
      <div class="se-steps" id="se-space-steps" role="group" aria-label="整理内存的阶段"></div>
      <div class="se-space-bottom"><div class="se-execution" aria-live="polite"><span id="se-space-progress"></span><h3 id="se-space-title"></h3><p id="se-space-text"></p></div><div class="se-copy-cost"><span>累计复制内容</span><strong id="se-copied">0</strong><small>单位</small><p>已有段的基址更新 <b id="se-updates">0</b> 次</p></div></div>
      <div class="se-base-changes" id="se-base-changes"></div>
      <p class="se-conclusion"><strong>整理改变物理位置，程序仍使用原来的虚拟地址。</strong>代价包括暂停进程、复制内容和更新段设置，空闲总量并未增加。<a href="paging.html">分页</a>进一步允许同一段的不同页分散在物理内存中。</p>
      <details class="se-detail" id="granularity"><summary>细分更多段，也有相应的开销</summary><div class="se-granularity"><div><h3>减少段内的无用分配</h3><p>代码、堆、栈只是粗粒度的划分。如果一个大段内部使用稀疏，细分为更多段可以让分配更贴近实际用途。</p></div><div><h3>维护更多映射与空闲区域</h3><p>段很多时，通常需要内存中的段表保存设置。各段仍按变长连续块分配，外部碎片仍然存在。</p></div></div><p class="se-note">段增长时，OS 还要确保有足够的连续区域，再修改段长或搬移该段。变长空间也需要选块、拆分与合并；<a href="free-space.html">空闲空间管理</a>将以进程内的虚拟堆为例，分析这些方法。</p></details>
    </section>
    <nav class="se-next-mechanism" aria-label="连续分配的后续问题"><p>各段大小不同，分配时仍要寻找足够大的连续块。</p><a href="free-space.html">空闲空间管理：怎样选块与合并 →</a><a href="paging.html">分页：改按固定大小分散放置 →</a></nav>
    </main><footer class="se-footer"><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer></div>`;
  root.querySelector('.site-header nav').remove();
  const $=s=>root.querySelector(s), $$=s=>Array.from(root.querySelectorAll(s));
  let topic='layout',selected=1,address=20,operation='read',validInput=true;
  const controllers=[];
  function controller(id,initial,paint){
    const panel=$(`#se-${id}-controls`),steps=$(`#se-${id}-steps`),buttons=Object.fromEntries(Array.from(panel.querySelectorAll('[data-control]'),b=>[b.dataset.control,b]));
    let frames=initial,index=0,timer=null,disabled=false;
    const api={get index(){return index;},get frames(){return frames;},pause(){clearInterval(timer);timer=null;update();},seek(next){controllers.forEach(c=>c.pause());index=Math.max(0,Math.min(next,frames.length-1));render();},replace(next){controllers.forEach(c=>c.pause());frames=next;index=0;buildSteps();render();},disable(value){disabled=value;panel.querySelector('select').disabled=value;update();},refresh:render};
    function update(){Object.values(buttons).forEach(b=>{b.disabled=disabled;});if(!disabled){buttons.prev.disabled=index===0;buttons.next.disabled=index===frames.length-1;}buttons.play.textContent=timer!==null?'暂停':index===frames.length-1?'重播':'播放';buttons.play.setAttribute('aria-pressed',String(timer!==null));}
    function buildSteps(){steps.innerHTML=frames.map((f,i)=>`<button type="button" data-step="${i}" aria-pressed="false" tabindex="-1">${f.label}</button>`).join('');}
    function render(){paint(frames[index],index,frames.length);Array.from(steps.children).forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===index));b.tabIndex=i===index?0:-1;});update();}
    function play(){controllers.forEach(c=>c.pause());if(index===frames.length-1){index=0;render();}timer=setInterval(()=>{index++;if(index===frames.length-1)api.pause();render();},Number(panel.querySelector('select').value));update();}
    buttons.play.addEventListener('click',()=>timer===null?play():api.pause());buttons.prev.addEventListener('click',()=>api.seek(index-1));buttons.next.addEventListener('click',()=>api.seek(index+1));buttons.reset.addEventListener('click',()=>api.seek(0));panel.querySelector('select').addEventListener('change',()=>{if(timer!==null)play();});
    steps.addEventListener('click',e=>{const b=e.target.closest('[data-step]');if(b)api.seek(Number(b.dataset.step));});
    steps.addEventListener('keydown',e=>{if(!e.target.closest('[data-step]')||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();api.seek(e.key==='Home'?0:e.key==='End'?frames.length-1:index+(e.key==='ArrowRight'?1:-1));steps.querySelector('[aria-pressed="true"]').focus({preventScroll:true});});
    buildSteps();return api;
  }
  const access=controller('access',buildAccess(),paintAccess),space=controller('space',buildCompaction(),paintSpace);controllers.push(access,space);
  function chooseSegment(id){
    selected=id;const s=segments.find(s=>s.id===id),physical=range(s);
    $$('[data-segment]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.segment)===id)));
    $$('[data-route]').forEach(path=>path.dataset.active=String(Number(path.dataset.route)===id));
    $('#se-segment-name').textContent=`${s.name}段`;
    $('#se-segment-facts').innerHTML=[['虚拟范围',`${s.virtualStart}–${s.virtualEnd}`],['物理范围',`${physical[0]}–${physical[1]}`],[s.direction===1?'物理起点 base':'物理上边界 base',s.base],['段长 bounds',s.bounds],['访问权限',s.permissions.map(op=>operations[op]).join(' / ')]].map(([key,val])=>`<div><dt>${key}</dt><dd>${val}</dd></div>`).join('');
    $('#se-segment-note').textContent=s.direction===-1?'栈向低地址增长。base 56 是不包含在段内的上边界，第一个可用位置是 55。':'这个段有独立的基址与界限，不需要与其他段相邻。';
    $('#se-trace').textContent=`查看${s.name}段 VA ${example[id]} 的转换 →`;
  }
  function switchTopic(next){
    controllers.forEach(c=>c.pause());topic=next;
    $$('[data-topic]').forEach(b=>{const active=b.dataset.topic===next;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
    $('#why').hidden=next!=='layout';$('#demo').hidden=next!=='access';$('#tradeoffs').hidden=next!=='space';
  }
  function readRequest(){
    controllers.forEach(c=>c.pause());const raw=$('#se-address').value.trim(),value=Number(raw);
    validInput=raw!==''&&Number.isInteger(value)&&value>=0&&value<=63;
    $('#se-input-error').hidden=validInput;$('#se-input-error').textContent=validInput?'':'请输入 0–63 的整数虚拟地址。';$('#se-address').setAttribute('aria-invalid',String(!validInput));$('#se-access-content').hidden=!validInput;access.disable(!validInput);
    $$('[data-operation]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.operation===operation)));
    if(validInput){address=value;access.replace(buildAccess(address,operation));}
  }
  function request(value,op='read'){$('#se-address').value=value;operation=op;readRequest();}
  function paintAccess(frame,index,total){
    const segment=segments.find(s=>s.id===Math.floor(frame.address/16)),binary=bits(frame.address);
    $('#se-va').textContent=frame.address;
    $('#se-bits').innerHTML=`<span data-selected="${frame.segmentID!==null}"><b>${binary.slice(0,2)}</b><small>段号 ${frame.segmentID===null?'待识别':frame.segmentID}</small></span><span data-selected="${frame.offset!==null}"><b>${binary.slice(2)}</b><small>${frame.offset===null?'偏移编码':segment.direction===-1?`${frame.rawOffset} − 16 = ${frame.offset}`:`偏移 ${frame.offset}`}</small></span>`;
    $$('[data-descriptor]').forEach(b=>{const active=Number(b.dataset.descriptor)===frame.segmentID;b.dataset.active=String(active);if(active)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
    $$('[data-case]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case==='heap'&&address===20&&operation==='read'||b.dataset.case==='stack'&&address===60&&operation==='read'||b.dataset.case==='permission'&&address===4&&operation==='write')));
    $('#se-mode').textContent=frame.mode==='kernel'?'内核态':'用户态';$('#se-mode').dataset.fault=Boolean(frame.fault);
    $('#se-access-progress').textContent=`${index+1} / ${total}`;
    let title=frame.title,text='';
    if(index===0)text='先从地址中识别段号，再选择该段的基址、段长、增长方向与权限。';
    else if(index===1)text=segment?`段号 ${frame.segmentID} 选择${segment.name}段。它当前的段长为 ${segment.bounds}，不等于整个 16 单位选址区间。`:'高 2 位为 10，选择槽 2；本例没有为该槽配置段，不能继续转换。';
    else if(frame.fault)text=frame.fault==='unmapped'?'没有对应段设置，本次没有物理地址和访问结果。硬件触发异常后，由 OS 决定后续处置。':frame.fault==='bounds'?'偏移超出当前段长，目标内存未被访问。硬件触发保护异常，交由 OS 处置。':'地址在段内，但这项操作没有权限。硬件阻止访问并触发保护异常，交由 OS 处置。';
    else if(index===2)text=segment.direction===1?`${frame.address} − ${segment.id*16} = ${frame.offset}。参与基址加法的是段内偏移 ${frame.offset}，不是完整虚拟地址 ${frame.address}。`:`低 4 位编码为 ${frame.rawOffset}，按向下增长解释为 ${frame.rawOffset} − 16 = ${frame.offset}。等价于从虚拟上边界 64 向低地址偏移 ${Math.abs(frame.offset)}。`;
    else if(index===3)text=frame.checked?'范围和权限同时通过；尚未生成物理地址。':!frame.boundsOK?'确定了段号，仍可能超出该段当前的有效范围。不能只检查地址是否在 0–63 内。':`${segment.name}段允许${segment.permissions.map(op=>operations[op]).join("、")}，不允许${operations[operation]}。位置在段内与操作获准是两项独立条件。`;
    else if(index===4)text=`${segment.base} ${frame.offset<0?'− '+Math.abs(frame.offset):'+ '+frame.offset} = ${frame.physicalAddress}。物理地址已生成，目标内存尚未读取或写入。`;
    else text=operation==='read'?`已读取物理地址 ${frame.physicalAddress} 的内容，程序仍使用虚拟地址 ${frame.address}。`:operation==='write'?'段允许此次写入，物理地址已生成；目标内容尚未写入。':'段允许此次取指，物理地址已生成；目标指令尚未读取或执行。';
    $('#se-access-title').textContent=title;$('#se-access-text').textContent=text;$('#se-access-title').dataset.fault=frame.checked===false;
    $('#se-range-check').textContent=frame.boundsOK===null?'范围 · 待检查':`范围 · ${frame.boundsOK?'通过':'拒绝'}  ${segment.direction===1?`0 ≤ ${frame.offset} < ${segment.bounds}`:`−${segment.bounds} ≤ ${frame.offset} < 0`}`;
    $('#se-permission-check').textContent=frame.permissionsOK===null?'权限 · 待检查':`${operations[operation]}权限 · ${frame.permissionsOK?'允许':'拒绝'}`;
    $('#se-range-check').dataset.ok=frame.boundsOK;$('#se-permission-check').dataset.ok=frame.permissionsOK;
    $('#se-pa').textContent=frame.physicalAddress??'—';$('#se-pa').dataset.address=frame.physicalAddress??'';
    $('#se-result-text').textContent=frame.fault?'本次访问被阻止':frame.physicalAddress===null?'尚未生成':index===4?'转换完成，尚未访问':frame.result;
    if(!segment){$('#se-offset-figure').innerHTML='<div class="se-no-segment"><strong>段槽 10 未配置</strong><p>虚拟范围 32–47 没有对应的物理区域。</p></div>';return;}
    const down=segment.direction===-1,virtualOrigin=segment.id*16,physicalOrigin=down?segment.base-16:segment.base,start=down?16-segment.bounds:0,raw=frame.address%16;
    const row=(physical)=>`<div class="se-offset-row"><div class="se-offset-heading"><span>${physical?'物理区域':'虚拟选址区间'} <b>${physical?physicalOrigin:virtualOrigin}–${(physical?physicalOrigin:virtualOrigin)+15}</b></span>${down?`<small>上边界 ${physical?segment.base:64} 不含在内</small>`:''}</div><div class="se-slot ${physical?'se-physical-slot':'se-virtual-slot'}" data-origin="${physical?physicalOrigin:virtualOrigin}"><span class="se-slot-valid" style="left:${start/16*100}%;width:${segment.bounds/16*100}%"></span>${!physical||frame.physicalAddress!==null?`<span class="se-slot-target" style="left:${raw/16*100}%" data-address="${physical?frame.physicalAddress:frame.address}" data-accessed="${physical&&frame.accessed&&operation==='read'}"></span>`:''}${frame.offset!==null&&!physical?`<svg class="se-offset-distance" viewBox="0 0 160 24" preserveAspectRatio="none" aria-label="段内偏移 ${frame.offset}"><line x1="${down?160:0}" y1="12" x2="${raw*10}" y2="12"/><line x1="${down?160:0}" y1="5" x2="${down?160:0}" y2="19"/><line x1="${raw*10}" y1="5" x2="${raw*10}" y2="19"/></svg><b class="se-offset-label" style="left:${Math.max(6,Math.min(94,(raw+(down?16:0))/32*100))}%">${frame.offset>=0?'+':''}${frame.offset}</b>`:''}</div><div class="se-slot-scale"><span>${physical?physicalOrigin:virtualOrigin}</span><span>${physical?physicalOrigin+8:virtualOrigin+8}</span><span>${physical?physicalOrigin+16:virtualOrigin+16}</span></div></div>`;
    $('#se-offset-figure').innerHTML=`<figcaption>${segment.name}段的有效范围：虚拟 ${segment.virtualStart}–${segment.virtualEnd} ↔ 物理 ${range(segment).join('–')}</figcaption>${row(false)}${row(true)}<p class="se-range-key">斜纹区域在本段范围之外。</p><div class="se-boundaries" role="group" aria-label="比较该段边界">${(segment.id===0?[[7,'最后有效 7'],[8,'越界 8']]:segment.id===1?[[21,'最后有效 21'],[22,'越界 22']]:[[56,'最低有效 56'],[55,'越界 55']]).map(([va,label])=>`<button type="button" data-boundary="${va}" aria-pressed="${frame.address===va}">${label}</button>`).join('')}</div>`;
  }
  function paintSpace(frame,index,total){
    $('#se-free-total').textContent=frame.totalFree;$('#se-free-largest').textContent=frame.largestFree;
    $('#se-fit-status').textContent=frame.allocated?'新段已分配':frame.largestFree>=frame.request?'已有足够的连续空间':'总量够，连续空间不够';$('#se-fit-status').dataset.fits=frame.allocated||frame.largestFree>=frame.request;
    $('#se-process-state').textContent=frame.paused?'A、B 已暂停':'A、B 正在运行';
    $('#se-space-free').innerHTML=frame.free.map(block=>`<span style="left:${block.start/64*100}%;width:${block.size/64*100}%" title="空闲 ${block.start}–${block.start+block.size-1}，${block.size} 单位"></span>`).join('');
    $$('[data-block]').forEach(node=>{const block=frame.blocks.find(b=>b.id===node.dataset.block);node.hidden=!block;if(block){node.style.left=`${block.start/64*100}%`;node.style.width=`${block.size/64*100}%`;node.dataset.start=block.start;node.dataset.size=block.size;node.setAttribute('aria-label',`${block.name}，物理 ${block.start}–${block.start+block.size-1}，${block.size} 单位`);}});
    $('#se-space-progress').textContent=`${index+1} / ${total}`;$('#se-space-title').textContent=frame.title;$('#se-space-text').textContent=frame.text;$('#se-copied').textContent=frame.copied;$('#se-updates').textContent=frame.updates;
    $('#se-base-changes').innerHTML=[['heap',24],['b',30],['stack',56]].map(([id,original])=>{const block=frame.blocks.find(b=>b.id===id);return `<span>${block.name} · base <b>${original===block.base?block.base:`${original} → ${block.base}`}</b></span>`;}).join('');
  }
  $$('[data-segment]').forEach(b=>b.addEventListener('click',()=>chooseSegment(Number(b.dataset.segment))));
  $('#se-trace').addEventListener('click',()=>{request(example[selected]);switchTopic('access');$('#se-tab-access').focus({preventScroll:true});});
  $$('[data-topic]').forEach(b=>b.addEventListener('click',()=>switchTopic(b.dataset.topic)));
  $('.se-topics').addEventListener('keydown',e=>{if(!e.target.closest('[data-topic]')||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const ids=Object.keys(topics),i=ids.indexOf(topic);switchTopic(e.key==='Home'?ids[0]:e.key==='End'?ids.at(-1):ids[(i+(e.key==='ArrowRight'?1:2))%3]);$(`#se-tab-${topic}`).focus({preventScroll:true});});
  $$('[data-case]').forEach(b=>b.addEventListener('click',()=>{const choices={heap:[20,'read'],stack:[60,'read'],permission:[4,'write']};request(...choices[b.dataset.case]);}));
  $('#se-address').addEventListener('input',readRequest);$$('[data-operation]').forEach(b=>b.addEventListener('click',()=>{operation=b.dataset.operation;readRequest();}));
  $$('[data-example]').forEach(b=>b.addEventListener('click',()=>request(Number(b.dataset.example))));
  $('#se-offset-figure').addEventListener('click',e=>{const b=e.target.closest('[data-boundary]');if(b){const value=b.dataset.boundary;request(Number(value),operation);$(`[data-boundary="${value}"]`).focus({preventScroll:true});}});
  $('#se-check-shared').addEventListener('click',()=>{request(4,'write');access.seek(3);$('#sharing').open=false;$('#demo').scrollIntoView({block:'start'});$('#se-access-steps [aria-pressed="true"]').focus({preventScroll:true});});
  $$('.se-detail summary').forEach(summary=>summary.addEventListener('click',()=>controllers.forEach(c=>c.pause())));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)controllers.forEach(c=>c.pause());});window.addEventListener('pagehide',()=>controllers.forEach(c=>c.pause()));
  function anchor(value){const hash=typeof value==='string'?value:location.hash.slice(1);if(hash==='why')switchTopic('layout');if(hash==='demo'||hash==='stack'||hash==='sharing'){switchTopic('access');if(hash==='stack'){request(60);access.seek(2);}if(hash==='sharing')$('#sharing').open=true;}if(hash==='tradeoffs'||hash==='granularity'){switchTopic('space');if(hash==='granularity')$('#granularity').open=true;}}
  window.addEventListener('hashchange',anchor);root.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(link)anchor(link.hash.slice(1));});
  chooseSegment(1);access.refresh();space.refresh();anchor();
}
renderSegmentationPage(document.getElementById('root'));
