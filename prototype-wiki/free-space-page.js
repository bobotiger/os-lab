function renderFreeSpacePage(root){
 const {buildStory,buildComparison,buildBuddy,comparisonPolicies}=OSLabFreeSpace;
 const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
 const transport=id=>`<div class="fm-controls" id="fm-${id}-controls" role="group" aria-label="${id==='story'?'回收过程':id==='compare'?'策略对照':'伙伴分配'}播放控制"><button type="button" data-control="prev" aria-label="上一步">←</button><button type="button" data-control="play" class="fm-primary" aria-pressed="false">播放</button><button type="button" data-control="next" aria-label="下一步">→</button><button type="button" data-control="reset">重置</button><select aria-label="播放速度"><option value="2000">慢速</option><option value="1300" selected>正常</option><option value="700">快速</option></select></div>`;
 const ruler=(capacity,ticks=[0,capacity/4,capacity/2,capacity*3/4,capacity])=>`<div class="fm-ruler" aria-hidden="true">${ticks.map(n=>`<span style="left:${n/capacity*100}%">${n}</span>`).join('')}</div>`;
 root.innerHTML=`<div class="page fm-page" id="top"><a class="fm-skip" href="#main-content">跳到主要内容</a>${wikiHeader('freeSpace',[])}<main id="main-content" tabindex="-1">
 <header class="fm-intro"><h1>空闲空间管理 <span>Free-Space Management</span></h1><p>malloc 的分配器在进程的<strong>虚拟堆</strong>内寻找连续空间。面对大小不同的申请，它既要满足当前请求，也要留下可供后续请求使用的空闲块。</p></header>
 <details class="fm-chapter" id="story" open><summary><h2>释放、合并与拆分</h2><span>空闲总量与可分配的连续块，是两回事。</span></summary><div class="fm-chapter-body">
 <div class="fm-story-heading"><p>申请连续 <strong>6</strong> 单位</p><dl class="fm-metrics" id="fm-story-metrics"></dl></div>
 <div class="fm-story-layout"><div class="fm-story-graphic"><div class="fm-figure-heading"><h3>虚拟堆 · 偏移 0–11</h3><span>各块按实际长度绘制</span></div><div id="fm-story-map"></div><div id="fm-contiguous"></div>
 <div class="fm-list-heading"><h3>空闲列表</h3><span>按地址递增记录起点与长度</span></div><div class="fm-free-list" id="fm-story-list"></div><p id="fm-adjacency" class="fm-note"></p></div>
 <aside class="fm-story-action"><div class="fm-log" id="fm-story-log" aria-live="polite"><small id="fm-story-progress"></small><h3 id="fm-story-title"></h3><p id="fm-story-text"></p></div>${transport('story')}</aside></div>
 <div class="fm-steps" id="fm-story-steps" role="group" aria-label="释放与合并阶段"></div>
 <p class="fm-takeaway"><strong>合并连接的是相邻的空闲区间。</strong>活对象保持原位置；释放与合并也不等于物理页已经归还 OS。</p>
 <p class="fm-note">以上大小为示意单位，暂不计块头和对齐开销。相邻合并按堆内虚拟地址判断；分段中的紧凑整理改变物理位置，而普通 C 分配器不能擅自改变 malloc 返回后仍在使用的对象地址。</p>
 <details class="fm-detail" id="metadata"><summary>块头记录大小，空闲块保存链接</summary><div class="fm-metadata"><div><h3>把管理信息放在块内</h3><p>本例在返回给程序的空间前保留 8 字节块头，记录大小。释放时先找到块头，再将整块加入空闲列表。</p><div class="fm-options" role="group" aria-label="块内管理信息状态"><button type="button" data-meta="0" aria-pressed="true">申请 20 字节后</button><button type="button" data-meta="1" aria-pressed="false">释放 p 后</button><button type="button" data-meta="2" aria-pressed="false">合并后</button></div></div><figure><div class="fm-pointer" id="fm-meta-pointer"></div><div id="fm-meta-map"></div><figcaption id="fm-meta-text"></figcaption><p class="fm-note">图中块长包含管理空间。本例块头为 8 字节、按 4 字节对齐；空闲节点的大小与 next 指针也存放在空闲块内部。</p></figure></div></details>
 </div></details>
 <details class="fm-chapter" id="policies"><summary><h2>选块策略与后续申请</h2><span>同一串申请，比较四种策略的搜索代价与剩余布局。</span></summary><div class="fm-chapter-body">
 <div class="fm-presets" role="group" aria-label="典型请求序列"><button type="button" data-preset="large"><strong>为后续大请求留空间</strong><span>3 → 12</span></button><button type="button" data-preset="small"><strong>最小余块未必带来最好结果</strong><span>2 → 3 → 4 → 3 → 12</span></button><button type="button" data-preset="failure"><strong>换策略也分不下</strong><span>13</span></button></div>
 <form id="fm-request-form"><label for="fm-requests">申请序列</label><input id="fm-requests" name="requests" value="3, 12" autocomplete="off" spellcheck="false" aria-describedby="fm-request-help fm-error"><button type="submit">应用</button><button type="button" id="fm-finish">查看最终结果</button></form><p class="fm-note" id="fm-request-help">用逗号分隔，最多 6 次；每次 1–16 单位。每组独立处理相同请求，成功分配的对象持续保留；一次失败不终止后续申请。</p><p class="fm-error" role="alert" id="fm-error" hidden></p>
 <div id="fm-comparison"><div class="fm-compare-toolbar"><div class="fm-requests" id="fm-request-timeline" role="group" aria-label="正在处理的申请"></div>${transport('compare')}</div>
 <div class="fm-compare-log fm-log" aria-live="polite" id="fm-compare-log"><small id="fm-compare-progress"></small><h3 id="fm-compare-title"></h3><p id="fm-compare-text"></p></div>
 <div class="fm-comparison" id="fm-policy-rows">${Object.entries(comparisonPolicies).map(([id,p])=>`<section class="fm-policy-row" data-policy="${id}"><header><h3>${p.name}</h3><span>${p.title}</span><p>${p.rule}</p></header><div class="fm-policy-visual"><div class="fm-policy-status" data-status></div><div data-map></div><div class="fm-policy-free" data-free></div></div><dl class="fm-policy-counts"><div><dt>累计检查</dt><dd data-checks>0</dd></div><div><dt>成功申请</dt><dd data-successes>0</dd></div><div><dt>最大空闲块</dt><dd data-largest>12</dd></div></dl></section>`).join('')}</div>
 <div class="fm-legend"><span><i class="fm-free"></i>空闲</span><span><i class="fm-live"></i>原有对象</span><span><i class="fm-new"></i>本串请求分配的对象</span><span><i class="fm-mark"></i>本步检查</span><span><i class="fm-candidate"></i>候选块</span></div><p class="fm-takeaway" id="fm-compare-conclusion"></p></div>
 <p class="fm-note">每组堆长 32，初始空闲块依次长 8、4、12；列表按地址递增，最佳与最差遇到大小并列时选低地址块。循环首次从偏移 0 开始，成功后从分配结束处继续。检查次数表示搜索工作量，不代表实际耗时；块头与对齐暂不计。</p>
 <details class="fm-detail" id="limits"><summary>列表顺序与分配器管理范围，也会影响结果</summary><div class="fm-scope"><div><h3>“首次”取决于列表顺序</h3><p>改为按大小排序后，第一个足够大的块可能改变。按地址排序有利于判断相邻关系；维护排序本身也有开销。</p></div><div><h3>堆内找不到，不等于整机内存用完</h3><p>分配器可尝试向 OS 请求更多地址空间，再继续分配。能否扩展取决于系统条件，仍可能返回失败。</p></div></div></details>
 </div></details>
 <details class="fm-chapter" id="organization"><summary><h2>按大小组织空闲块</h2><span>减少搜索或简化合并，同时接受新的空间开销。</span></summary><div class="fm-chapter-body">
 <div class="fm-approaches" role="tablist" aria-label="按大小组织方式"><button type="button" role="tab" id="fm-tab-classes" data-approach="classes" aria-controls="fm-classes" aria-selected="true">大小分类</button><button type="button" role="tab" id="fm-tab-buddy" data-approach="buddy" aria-controls="fm-buddy" aria-selected="false" tabindex="-1">伙伴分配</button></div>
 <section id="fm-classes" role="tabpanel" aria-labelledby="fm-tab-classes"><header class="fm-section-heading"><h3>先找到大小类别，再取一个空闲块</h3><p>假设只设 8、16、32 三类，请求向上取整到能容纳它的最小类别。</p></header><div class="fm-options" role="group" aria-label="比较大小取整"><button type="button" data-class-request="7">申请 7</button><button type="button" data-class-request="9">申请 9</button><button type="button" data-class-request="17">申请 17</button></div>
 <div class="fm-class-layout"><figure class="fm-pools" id="fm-pools"></figure><div><h3 id="fm-class-title"></h3><div id="fm-class-map"></div><p id="fm-class-result"></p><p class="fm-note">同类请求省去通用列表的逐块搜索；向上取整的多余空间留在已分配块内，各类别还需要保留空闲容量。</p></div></div><p class="fm-takeaway"><strong>常见请求越稳定，专门组织越有价值。</strong>Slab 按常见对象类型维护缓存，可复用已初始化的对象；缓存通过取得或归还整块 slab 调整容量。</p></section>
 <section id="fm-buddy" role="tabpanel" aria-labelledby="fm-tab-buddy" hidden><header class="fm-section-heading"><h3>按二分拆块，按伙伴关系合并</h3><p>块长限制为 2 的幂。只有来自同一次二分、大小相同且都空闲的两个块，才能合并回上一级。</p></header><div class="fm-buddy-toolbar"><div class="fm-options" role="group" aria-label="伙伴请求"><button type="button" data-buddy-request="7" aria-pressed="true">申请 7</button><button type="button" data-buddy-request="9" aria-pressed="false">申请 9</button></div>${transport('buddy')}</div>
 <figure class="fm-buddy-figure"><figcaption>一块 32 单位空间 · 块的大小与位置按同一比例绘制</figcaption><div id="fm-buddy-map"></div><div class="fm-buddy-pair" id="fm-buddy-pair"></div></figure><div class="fm-buddy-bottom"><div class="fm-log" id="fm-buddy-log" aria-live="polite"><small id="fm-buddy-progress"></small><h3 id="fm-buddy-title"></h3><p id="fm-buddy-text"></p></div><dl class="fm-metrics" id="fm-buddy-metrics"></dl></div><div class="fm-steps" id="fm-buddy-steps" role="group" aria-label="伙伴分配阶段"></div><p class="fm-takeaway"><strong>合并关系更容易确定，块内可能留下未使用空间。</strong>“相邻且一样大”还不够：两个块必须互为伙伴。</p></section>
 </div></details>
 </main><footer class="fm-footer"><nav aria-label="相关知识"><a href="memory-api.html">内存 API：申请与释放对象</a><a href="paging.html">分页：为虚拟页分配物理页框 →</a></nav><a href="#top">回到页首 ↑</a></footer></div>`;
 $('.site-header nav').remove();
 const controllers=[];
 function controller(id,frames,paint){
  const panel=$(`#fm-${id}-controls`),steps=$(`#fm-${id}-steps`),controls=Object.fromEntries([...panel.querySelectorAll('[data-control]')].map(b=>[b.dataset.control,b]));let index=0,timer=null;
  const api={get index(){return index;},get frames(){return frames;},pause(){clearInterval(timer);timer=null;update();},seek(n){controllers.forEach(c=>c.pause());index=Math.max(0,Math.min(frames.length-1,n));render();},replace(next){controllers.forEach(c=>c.pause());frames=next;index=0;setup();render();},refresh:render};
  function update(){controls.prev.disabled=index===0;controls.next.disabled=index===frames.length-1;controls.play.textContent=timer?'暂停':index===frames.length-1?'重播':'播放';controls.play.setAttribute('aria-pressed',String(timer!==null));$(`#fm-${id}-log`).setAttribute('aria-live',timer?'off':'polite');}
  function setup(){if(steps)steps.innerHTML=frames.map((f,i)=>`<button type="button" data-step="${i}" aria-pressed="false" tabindex="-1">${f.label}</button>`).join('');}
  function render(){paint(frames[index],index,frames.length);if(steps)[...steps.children].forEach((b,i)=>{b.setAttribute('aria-pressed',String(index===i));b.tabIndex=index===i?0:-1;});update();}
  function play(){controllers.forEach(c=>c.pause());if(index===frames.length-1){index=0;render();}timer=setInterval(()=>{index++;if(index===frames.length-1)api.pause();render();},Number(panel.querySelector('select').value));update();}
  controls.play.onclick=()=>timer?api.pause():play();controls.next.onclick=()=>api.seek(index+1);controls.prev.onclick=()=>api.seek(index-1);controls.reset.onclick=()=>api.seek(0);panel.querySelector('select').onchange=()=>{if(timer)play();};
  if(steps){steps.onclick=e=>{const b=e.target.closest('[data-step]');if(b)api.seek(Number(b.dataset.step));};steps.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();api.seek(e.key==='Home'?0:e.key==='End'?frames.length-1:index+(e.key==='ArrowRight'?1:-1));steps.querySelector('[aria-pressed="true"]').focus({preventScroll:true});};}
  setup();return api;
 }
 function log(id,frame,index,total){$(`#fm-${id}-progress`).textContent=`${index+1} / ${total}`;$(`#fm-${id}-title`).textContent=frame.title;$(`#fm-${id}-text`).textContent=frame.text;}
 function map(frame,capacity,{story=false,small=false,buddy=false}={}){
  return `<div class="fm-memory ${small?'fm-small-memory':''}" style="--capacity:${capacity}">${frame.blocks.map(b=>{
   let action=null;if(story){const i=storyController.index;if(i<=1&&b.owner==='A')action={at:2,label:'释放 A'};else if(i===2&&b.owner===null&&b.start<8)action={at:3,label:'合并左邻'};else if(i===3&&b.owner===null)action={at:4,label:'合并右邻'};else if(i===4&&b.owner===null)action={at:5,label:'分配 6'};}
   const tag=action?'button':'div',kind=b.owner===null?'free':b.owner.startsWith('N')?'new':'live';
   const selected=frame.selected===b.start&&b.owner===null,checking=frame.current===b.start;
   return `<${tag}${action?' type="button"':''} class="fm-block fm-${kind}${checking?' fm-checking':''}${selected?' fm-candidate':''}" data-start="${b.start}" data-size="${b.size}" data-owner="${b.owner??'free'}" style="left:${b.start/capacity*100}%;width:${b.size/capacity*100}%"${action?` data-story-action="${action.at}"`:''} aria-label="偏移 ${b.start} 至 ${b.start+b.size-1}，${b.owner??'空闲'}，长度 ${b.size}${action?'，'+action.label:''}">${small?(b.size>=4?`<span>${b.owner??b.size}</span>`:''):`<strong>${b.size}</strong><span>${b.owner===null?'空闲':b.owner==='N'?'新对象':b.owner}</span>${action?`<small>${action.label} →</small>`:''}`}${buddy&&b.owner==='N'&&b.size>frame.request?`<i class="fm-internal" style="left:${frame.request/b.size*100}%;width:${(b.size-frame.request)/b.size*100}%" aria-label="内部碎片 ${b.size-frame.request}"></i>`:''}</${tag}>`;
  }).join('')}</div>${story?ruler(capacity,[...frame.blocks.map(b=>b.start),capacity]):ruler(capacity)}`;
 }
 function paintStory(f,i,total){
  const texts=['两侧各空闲 4，中间的 A 仍在使用。被活对象分隔的空闲空间形成外部碎片，不能跨过 A 拼接出连续的 6。','两个记录块都不足 6，申请失败。A 的位置与堆布局保持不变。','A 已释放，整个堆已经连续空闲；但列表仍分开记录为三个 4 单位块。','左侧两块的地址相接：0 + 4 = 4。合为一条 8 单位记录，空闲总量不变。','新的 8 单位块与右邻相接：0 + 8 = 8。合为一条 12 单位记录，没有搬动对象。','从低地址端分出 6 单位给 N；剩余 6 单位从偏移 6 开始，留在空闲列表。'];
  const titles=['空闲 8，但没有连续的 6','申请失败，A 仍占据中间位置','连续空闲 12，列表仍分成三条','相邻两块合为 8 单位','全部合为 12 单位','分出 6 给 N，留下 6'];
  log('story',{...f,title:titles[i],text:texts[i]},i,total);$('#fm-story-title').dataset.failed=f.outcome==='failed';
  $('#fm-story-map').innerHTML=map(f,12,{story:true});$('#fm-story-metrics').innerHTML=[['空闲总量',f.totalFree],['最大连续空闲',f.largestRun],['最大记录块',f.largestEntry]].map(([name,n])=>`<div><dt>${name}</dt><dd>${n}</dd></div>`).join('');
  const runs=[];for(const b of f.blocks){if(b.owner!==null)continue;const last=runs.at(-1);if(last&&last.start+last.size===b.start)last.size+=b.size;else runs.push({start:b.start,size:b.size});}
  $('#fm-contiguous').innerHTML=runs.map(b=>`<span style="left:${b.start/12*100}%;width:${b.size/12*100}%" data-run="${b.size}">连续空闲 ${b.size}</span>`).join('');
  $('#fm-story-list').innerHTML=f.freeList.map((b,index)=>`<div class="fm-record" data-record-start="${b.start}" data-record-size="${b.size}"><span>起点 <b>${b.start}</b></span><span>长度 <strong>${b.size}</strong></span><small>next → ${f.freeList[index+1]?.start??'NULL'}</small></div>`).join('');
  $('#fm-adjacency').textContent=i===2?'连续空间已经出现；先合并记录，后续搜索才能找到它。':i===5?'分配改变块的起点与长度；余块仍可供后续申请使用。':'空闲列表记录可供搜索的块；节点不代表额外的一份内存。';
 }
 let requests=[3,12],buddyRequest=7;
 const storyController=controller('story',buildStory(),paintStory),compareController=controller('compare',buildComparison(requests),paintCompare),buddyController=controller('buddy',buildBuddy(),paintBuddy);controllers.push(storyController,compareController,buddyController);
 function paintCompare(f,i,total){
  log('compare',f,i,total);
  const starts=compareController.frames.filter(frame=>frame.phase==='request');
  $('#fm-request-timeline').innerHTML=starts.map(frame=>`<button type="button" data-request-step="${frame.stage}" aria-pressed="${f.requestIndex===frame.requestIndex}" aria-label="第 ${frame.requestIndex+1} 次申请，${frame.request} 单位"><small>${frame.requestIndex+1}</small><strong>${frame.request}</strong></button>`).join('');
  for(const [id,row] of Object.entries(f.rows)){
   const node=$(`[data-policy="${id}"]`);node.querySelector('[data-map]').innerHTML=map(row,32,{small:true});node.querySelector('[data-checks]').textContent=row.checks;node.querySelector('[data-successes]').textContent=`${row.successes} / ${f.phase==='allocate'?f.requestIndex+1:f.requestIndex}`;node.querySelector('[data-largest]').textContent=row.largestEntry;
   const selected=row.blocks.find(b=>b.start===row.selected);
   const status=row.status==='success'?`N${f.requestIndex+1} 获得 ${row.result.size} 单位，起点 ${row.result.start}`:row.status==='failed'||row.status==='rejected'?`没有足够大的块${row.status==='failed'?'，申请失败':''}`:row.current!==null?`检查起点 ${row.current} · ${row.blocks.find(b=>b.start===row.current).size} 单位${selected?'；候选 '+row.selected:''}`:row.selected!==null?`选定起点 ${row.selected}，尚未分配`:`准备搜索${id==='next'?' · 从偏移 '+row.cursor+' 继续':''}`;
   node.querySelector('[data-status]').textContent=status;node.querySelector('[data-status]').dataset.failed=['failed','rejected'].includes(row.status);
   node.querySelector('[data-free]').textContent=`空闲块：${row.freeList.length?row.freeList.map(b=>b.size).join(' · '):'无'}　总空闲 ${row.totalFree}`;
  }
  const rows=f.rows;
  $('#fm-compare-conclusion').textContent=!f.complete?'先看本次选了哪一块，再看下一次申请是否还能成功。':f.requests.join(',')==='3,12'?'最差适应先切开了唯一的 12 单位块，后续申请 12 时失败。首次适应用更少的检查次数保住了这个大块。':f.requests.join(',')==='2,3,4,3,12'?'本串请求中，首次适应全部成功；最佳适应在第四次申请中使用了 12 单位块，最后一次申请因此失败。“最佳”只指当次最小合适块。':Object.values(rows).every(r=>r.successes===0)?'没有策略能把仍被活对象分隔的空闲块拼成一个连续块。改变搜索顺序不能消除这次空间限制。':'结果取决于整串请求与当前布局。搜索更充分、单次余块更小，都不保证后续请求一定更容易满足。';
 }
 function paintBuddy(f,i,total){log('buddy',f,i,total);$('#fm-buddy-map').innerHTML=map(f,32,{buddy:true});$('#fm-buddy-metrics').innerHTML=[['实际占用',f.reserved],['块内未使用',f.internalWaste]].map(([name,n])=>`<div><dt>${name}</dt><dd>${n}</dd></div>`).join('');$('#fm-buddy-pair').innerHTML=f.highlight?`<span style="left:${f.highlight.start/32*100}%;width:${f.highlight.size/32*100}%">${f.label==='二分'?'同一次二分':f.label==='合并'?'已合并':'当前块'} · ${f.highlight.size}</span>`:'';}
 function paintMetadata(index){
  $$('[data-meta]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.meta)===index)));
  $('#fm-meta-pointer').innerHTML=index===0?'<span class="fm-pointer-label" style="left:12.5%">p = 8</span><i style="left:12.5%" aria-hidden="true"></i>':'<span>释放后，空闲块内部保存大小与 next</span>';
  const pieces=index===0?[[0,8,'header','块头 8'],[8,20,'payload','程序使用 20'],[28,36,'free','空闲块 36']]:index===1?[[0,28,'free','空闲块 28'],[28,36,'free','空闲块 36']]:[[0,64,'free','空闲块 64']];
  $('#fm-meta-map').innerHTML=`<div class="fm-memory fm-meta-memory">${pieces.map(([start,size,kind,label])=>`<div class="fm-block fm-${kind}" style="left:${start/64*100}%;width:${size/64*100}%" data-size="${size}" data-start="${start}"><span>${label}</span></div>`).join('')}</div>${ruler(64)}`;
  $('#fm-meta-text').textContent=index===0?'块头记录请求大小 20。申请消耗 8 + 20 = 28 字节；p 指向偏移 8，管理块从偏移 0 开始。':index===1?'由 p 向前找到块头，得知整块长 28。两条空闲记录分别为 (0, 28, next=28) 与 (28, 36, next=NULL)。':'两块地址相邻，合为 (0, 64, next=NULL)。空闲节点使用块内空间，无需再为每条记录调用 malloc。';
 }
 function paintClasses(request){
  const size=[8,16,32].find(size=>size>=request);$$('[data-class-request]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.classRequest)===request)));
  $('#fm-pools').innerHTML=[8,16,32].map(n=>`<div class="fm-pool" data-active="${n===size}"><span>${n} 单位类</span><div>${[0,1,2].map((_,i)=>`<i style="width:${n/96*100}%" class="${n===size&&i===0?'fm-taken':''}">${n===size&&i===0?'→':n}</i>`).join('')}</div><small>${n===size?'从此类取一块':'保留'}</small></div>`).join('')+'<figcaption>各场景起初每类有三块空闲；箭头表示已取出的块，各块使用同一长度比例。</figcaption>';
  $('#fm-class-title').textContent=`申请 ${request}，取 ${size} 单位块`;
  $('#fm-class-map').innerHTML=`<div class="fm-class-allocation" style="width:${size/32*100}%"><span style="width:${request/size*100}%">${request}</span><i style="width:${(size-request)/size*100}%">${size-request}</i></div>`;
  $('#fm-class-result').textContent=`蓝色 ${request} 单位供请求使用；斜纹 ${size-request} 单位是块内未使用空间。`;
 }
 const presets={large:[3,12],small:[2,3,4,3,12],failure:[13]};
 function applyRequests(next){requests=next;$('#fm-error').hidden=true;$('#fm-finish').disabled=false;$('#fm-requests').setAttribute('aria-invalid','false');$('#fm-comparison').hidden=false;compareController.replace(buildComparison(next));$$('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(presets[b.dataset.preset].join(',')===next.join(','))));}
 $('#fm-request-form').onsubmit=e=>{e.preventDefault();controllers.forEach(c=>c.pause());const raw=$('#fm-requests').value.trim(),parts=raw.split(/[,，\s]+/),next=parts.map(Number);try{if(!raw||parts.some(x=>!/^\d+$/.test(x)))throw Error();buildComparison(next);applyRequests(next);}catch{$('#fm-error').hidden=false;$('#fm-finish').disabled=true;$('#fm-error').textContent='请输入 1–6 个请求，用逗号分隔；每个请求为 1–16 的整数。';$('#fm-requests').setAttribute('aria-invalid','true');$('#fm-comparison').hidden=true;}};
 $('#fm-requests').oninput=()=>controllers.forEach(c=>c.pause());
 $$('[data-preset]').forEach(b=>b.onclick=()=>{$('#fm-requests').value=presets[b.dataset.preset].join(', ');applyRequests(presets[b.dataset.preset]);});
 $('#fm-finish').onclick=()=>{if($('#fm-comparison').hidden)return;compareController.seek(compareController.frames.length-1);};
 $('#fm-request-timeline').onclick=e=>{const b=e.target.closest('[data-request-step]');if(b){const step=b.dataset.requestStep;compareController.seek(Number(step));$(`[data-request-step="${step}"]`).focus({preventScroll:true});}};
 
 $('#fm-story-map').onclick=e=>{const b=e.target.closest('[data-story-action]');if(b){storyController.seek(Number(b.dataset.storyAction));$('#fm-story-steps [aria-pressed="true"]').focus({preventScroll:true});}};
 $$('[data-meta]').forEach(b=>b.onclick=()=>{controllers.forEach(c=>c.pause());paintMetadata(Number(b.dataset.meta));});
 function approach(id){controllers.forEach(c=>c.pause());$$('[data-approach]').forEach(b=>{const active=b.dataset.approach===id;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});$('#fm-classes').hidden=id!=='classes';$('#fm-buddy').hidden=id!=='buddy';}
 $$('[data-approach]').forEach(b=>b.onclick=()=>approach(b.dataset.approach));$('.fm-approaches').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const id=e.key==='Home'?'classes':e.key==='End'?'buddy':$('#fm-buddy').hidden?'buddy':'classes';approach(id);$(`[data-approach="${id}"]`).focus({preventScroll:true});};
 $$('[data-class-request]').forEach(b=>b.onclick=()=>paintClasses(Number(b.dataset.classRequest)));$$('[data-buddy-request]').forEach(b=>b.onclick=()=>{buddyRequest=Number(b.dataset.buddyRequest);buddyController.replace(buildBuddy(buddyRequest));$$('[data-buddy-request]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));});
 $$('.fm-chapter > summary').forEach(summary=>summary.onclick=()=>{controllers.forEach(c=>c.pause());const chapter=summary.parentElement;if(!chapter.open){$$('.fm-chapter').filter(n=>n!==chapter).forEach(n=>n.open=false);requestAnimationFrame(()=>summary.scrollIntoView({block:'start'}));}});
 $$('.fm-detail > summary').forEach(s=>s.onclick=()=>controllers.forEach(c=>c.pause()));
 function openChapter(id){controllers.forEach(c=>c.pause());$$('.fm-chapter').forEach(n=>n.open=n.id===id);}
 function anchor(){const hash=location.hash.slice(1);if(['story','demo','metadata'].includes(hash)){openChapter('story');if(hash==='metadata')$('#metadata').open=true;}else if(['policies','limits'].includes(hash)){openChapter('policies');if(hash==='limits')$('#limits').open=true;}else if(['organization','buddy'].includes(hash)){openChapter('organization');if(hash==='buddy')approach('buddy');}}
 window.addEventListener('hashchange',anchor);document.addEventListener('visibilitychange',()=>{if(document.hidden)controllers.forEach(c=>c.pause());});window.addEventListener('pagehide',()=>controllers.forEach(c=>c.pause()));
 storyController.refresh();applyRequests(requests);buddyController.refresh();paintMetadata(0);paintClasses(7);anchor();
}
renderFreeSpacePage(document.getElementById('root'));
