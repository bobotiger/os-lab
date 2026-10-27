function renderAddressSpacePage(root) {
  const M = OSLabAddressSpace;
  const names = {overview:'一份内存，多个进程',layout:'进程内部的布局',isolation:'私有与共享'};
  const bases = {A:16,B:48,C:80};
  const blocks = ['OS','A',null,'B',null,'C'];
  root.innerHTML = '<div class="page as-page" id="top">'+wikiHeader('addressSpaces',[])+
    '<a class="as-skip" href="#as-main">跳到正文</a><main id="as-main">'+
    '<section class="intro"><h1>地址空间 <span>Address Spaces</span></h1><p class="definition"><strong>地址空间是进程看到的内存视图。</strong>程序用虚拟地址引用指令和数据；它们在物理内存中的位置，由 OS 与硬件共同管理。</p></section>'+
    '<div class="as-topics" role="tablist" aria-label="地址空间学习主题">'+Object.entries(names).map(([id,name])=>'<button type="button" role="tab" id="as-topic-'+id+'" data-topic="'+id+'" aria-controls="'+id+'" aria-selected="false" tabindex="-1">'+name+'</button>').join('')+'</div>'+
    '<section id="overview" class="as-panel" role="tabpanel" aria-labelledby="as-topic-overview">'+
      '<div class="as-lead"><h2>CPU 轮流运行，多个进程留在内存</h2><p>切换进程时，不必把整份程序内存搬出再搬入。各进程共同驻留，仍使用自己的虚拟地址。</p></div>'+
      '<figure class="as-view-figure" id="as-view-figure" aria-labelledby="as-view-title">'+
        '<figcaption id="as-view-title"><span>进程视图 · 放大</span><span>机器中的物理内存</span></figcaption>'+
        '<div class="as-view-pair" id="as-view-pair">'+
          '<div class="as-virtual-column"><div class="as-view-label"><strong id="as-view-process">进程 A</strong><span>虚拟地址 0–15</span></div><div class="as-virtual-map" id="as-virtual-map">'+M.regions.map(region=>'<div data-view-region="'+region.id+'" style="flex:'+ (region.end-region.start+1)+'"><span>'+({data:'全局数据',unused:'未使用'}[region.id]||region.title)+'</span><small>'+region.start+'–'+region.end+'</small></div>').join('')+'<span class="as-address-pin" id="as-virtual-pin">6</span></div></div>'+
          '<div class="as-physical-column"><div class="as-view-label"><strong>所有进程共用</strong><span>物理地址 0–95</span></div><div class="as-physical-map" id="as-physical-map">'+blocks.map((id,i)=>id&&id!=='OS'?'<button type="button" data-run-process="'+id+'" data-physical-start="'+i*16+'" aria-pressed="false"><span>进程 '+id+'</span><small>'+i*16+'–'+(i*16+15)+'</small><em></em></button>':'<div class="'+(id?'as-kernel-block':'as-free-block')+'"><span>'+ (id?'操作系统':'空闲')+'</span><small>'+i*16+'–'+(i*16+15)+'</small></div>').join('')+'<span class="as-physical-pin" id="as-physical-pin">22</span></div></div>'+
          '<svg class="as-view-route" id="as-view-route" aria-hidden="true"><defs><marker id="as-route-head" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#315fc4"/></marker></defs><path id="as-view-line" marker-end="url(#as-route-head)"/></svg>'+
        '</div><div class="as-view-result" aria-live="polite"><span class="as-va-readout">虚拟地址 <b>6</b></span><span aria-hidden="true">→</span><span class="as-pa-readout">物理地址 <b id="as-view-pa">22</b></span><p id="as-view-explanation">当前使用 A 的映射，其他进程仍留在原处。</p></div>'+
      '</figure><p class="as-boundary">本例单 CPU，三个进程各使用 16 个地址单位，并分别连续放置；编号不对应真实字节。两侧按各自范围绘制，柱高不用于比较容量。</p>'+
      '<div class="as-goal-strip"><section><h3>位置对程序透明</h3><p>程序使用虚拟地址，不必知道实际装入位置。</p></section><section><h3>私有访问受到保护</h3><p>共用物理内存，不等于可以任意访问其他进程。</p></section><section><h3>转换也要付出开销</h3><p>转换消耗时间，记录映射需要空间。</p></section></div>'+
      '<details class="as-reference"><summary>OS 与硬件如何配合</summary><p>OS 建立和管理映射及访问权限；硬件在普通访存时执行地址转换与权限检查。普通访存不需要每次执行系统调用；缺页或权限异常会转入 OS 处理。程序打印出的普通用户态指针也是虚拟地址。</p><a href="address-translation.html">查看地址转换 →</a></details>'+
    '</section>'+
    '<section id="layout" class="as-panel" role="tabpanel" aria-labelledby="as-topic-layout" hidden><div id="as-layout-host"></div></section>'+
    '<section id="isolation" class="as-panel" role="tabpanel" aria-labelledby="as-topic-isolation" hidden>'+
      '<div class="as-lead"><h2>地址是否相同，不能判断是否共享</h2><p>两组都让 A 写入 99，再由 B 读取。区别在于：两个地址最终指向两份存储，还是同一份存储。</p></div>'+
      '<div class="as-mapping-comparison" id="as-isolation-pair">'+['private','shared'].map(type=>'<figure class="as-mapping-case" data-mapping-case="'+type+'"><figcaption><h3>'+ (type==='private'?'私有映射':'共享映射')+'</h3><span>'+ (type==='private'?'同址 · 两份对象':'异址 · 同一对象')+'</span></figcaption><div class="as-map-sources"><button type="button" id="'+(type==='private'?'as-isolation-write':'as-shared-write')+'" data-comparison-write="'+type+'" class="as-source as-source-a"><span>进程 A</span><strong>地址 6</strong><small>写入 99 →</small></button><button type="button" data-comparison-read="'+type+'" class="as-source as-source-b" disabled><span>进程 B</span><strong>地址 '+(type==='private'?'6':'10')+'</strong><small>等待 A 写入</small></button></div><svg class="as-map-links" viewBox="0 0 400 76" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="as-head-'+type+'" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill="#758ba0"/></marker></defs><path data-map-route="A" d="M96 2 L'+(type==='private'?'96':'200')+' 69" marker-end="url(#as-head-'+type+')"/><path data-map-route="B" d="M304 2 L'+(type==='private'?'304':'200')+' 69" marker-end="url(#as-head-'+type+')"/></svg><div class="as-map-stores">'+(type==='private'?['private-A','private-B']:['shared']).map(object=>'<div class="as-storage" data-object-readout="'+object+'"><span>'+ (object==='shared'?'共享对象':object.endsWith('A')?'A 的私有对象':'B 的私有对象')+'</span><strong>10</strong></div>').join('')+'</div><div class="as-map-result" data-case-result="'+type+'"><span>B 的读取结果</span><strong>—</strong><small>尚未读取</small></div></figure>').join('')+'</div>'+
      '<div class="as-comparison-bottom"><p id="as-isolation-result" aria-live="polite"></p><button type="button" id="as-isolation-reset" class="as-quiet-button">重置</button></div><p class="as-boundary">两组执行相同操作；共享映射已建立，读写均被允许。地址为示意编号，与“进程内部的布局”使用不同配置。</p>'+
      '<div class="as-comparison-insight"><strong>隔离与共享可以同时成立</strong><p>私有部分互不影响；经 OS 建立共享映射后，不同进程可以访问同一份存储。共享的是存储内容，虚拟地址不必相同。</p></div>'+
    '</section>'+
    '<nav class="as-next-links" aria-label="相关知识"><a href="memory-api.html">内存 API →</a><a href="address-translation.html">地址转换 →</a></nav></main><footer class="site-footer"><span>OSLab / 内存虚拟化</span><a href="#top">回到页首 ↑</a></footer></div>';
  root.querySelector('.site-header nav').remove();
  const $ = selector=>root.querySelector(selector);
  const $$ = selector=>[...root.querySelectorAll(selector)];
  const layout = renderAddressSpaceLayout($('#as-layout-host'), M);
  let activeTopic = 'overview', currentProcess = 'A', comparisonStage = 0;
  const comparison = M.buildMappingComparison();
  const drawRoute = () => {
    if(activeTopic!=='overview') return;
    const host=$('#as-view-pair'), start=$('#as-virtual-pin'), end=$('#as-physical-pin');
    const h=host.getBoundingClientRect(), a=start.getBoundingClientRect(), b=end.getBoundingClientRect();
    $('#as-view-route').setAttribute('viewBox','0 0 '+h.width+' '+h.height);
    $('#as-view-line').setAttribute('d','M '+(a.right-h.left+3)+' '+(a.top+a.height/2-h.top)+' L '+(b.left-h.left-5)+' '+(b.top+b.height/2-h.top));
  };
  const selectProcess = id => {
    currentProcess=id;
    $('#as-view-figure').dataset.process=id;
    $('#as-view-process').textContent='进程 '+id;
    $('#as-view-pa').textContent=bases[id]+6;
    $('#as-physical-pin').textContent=bases[id]+6;
    $('#as-physical-pin').style.top=(bases[id]+6.5)/96*100+'%';
    $('#as-view-explanation').textContent='当前使用 '+id+' 的映射，其他进程仍留在原处。';
    $$('[data-run-process]').forEach(button=>{
      const selected=button.dataset.runProcess===id;
      button.setAttribute('aria-pressed',String(selected));
      button.setAttribute('aria-label','进程 '+button.dataset.runProcess+'，物理地址 '+bases[button.dataset.runProcess]+' 至 '+(bases[button.dataset.runProcess]+15)+'，'+(selected?'正在运行':'切换运行'));
      button.querySelector('em').textContent=selected?'CPU 正在运行':'切换运行 →';
    });
    drawRoute();
  };
  $('#as-physical-map').addEventListener('click',event=>{
    const button=event.target.closest('[data-run-process]');
    if(button) selectProcess(button.dataset.runProcess);
  });
  const paintComparison = () => {
    const snapshot = comparison[comparisonStage];
    $('#as-isolation-pair').dataset.phase=snapshot.phase;
    for(const entry of snapshot.cases) {
      const host=$('[data-mapping-case="'+entry.id+'"]');
      for(const object of entry.objects) host.querySelector('[data-object-readout="'+object.id+'"] strong').textContent=object.value;
      const a=host.querySelector('[data-comparison-write]'), b=host.querySelector('[data-comparison-read]');
      a.disabled=comparisonStage!==0;
      a.querySelector('small').textContent=comparisonStage===0?'写入 99 →':'已写入 99';
      a.setAttribute('aria-label','两组对照：A 通过地址 6 写入 99');
      b.disabled=comparisonStage!==1;
      b.querySelector('small').textContent=comparisonStage===0?'等待 A 写入':comparisonStage===1?'读取 →':'读取完成';
      b.setAttribute('aria-label','两组对照：B 读取各自映射的对象');
      const result=host.querySelector('[data-case-result]');
      result.querySelector('strong').textContent=entry.readB===null?'—':entry.readB;
      result.querySelector('small').textContent=entry.readB===null?'尚未读取':entry.id==='private'?'原值保持不变':'读到 A 写入的值';
    }
    $('#as-isolation-result').textContent=[
      '初始值均为 10。先从 A 的地址写入，再查看 B 的读取结果。',
      'A 已写入 99。私有场景只有 A 的对象改变；共享场景的一份对象已改变。B 尚未读取。',
      'B 读取：私有映射得到 10，共享映射得到 99。决定结果的是映射到哪份存储。'
    ][comparisonStage];
  };
  $('#as-isolation-pair').addEventListener('click',event=>{
    const button=event.target.closest('[data-comparison-write],[data-comparison-read]');
    if(!button||button.disabled) return;
    comparisonStage=button.hasAttribute('data-comparison-write')?1:2;
    paintComparison();
    if(comparisonStage===1) $('[data-mapping-case="'+(button.dataset.comparisonWrite)+'"] [data-comparison-read]').focus({preventScroll:true});
    else $('#as-isolation-reset').focus({preventScroll:true});
  });
  $('#as-isolation-reset').addEventListener('click',()=>{comparisonStage=0;paintComparison();});
  const activate = topic => {
    if(!names[topic]) return;
    layout.pause();activeTopic=topic;
    $('.as-page').dataset.topic=topic;
    Object.keys(names).forEach(id=>{
      $('#'+id).hidden=id!==topic;
      const button=$('#as-topic-'+id);
      button.setAttribute('aria-selected',String(id===topic));
      button.tabIndex=id===topic?0:-1;
    });
    if(topic==='overview') requestAnimationFrame(drawRoute);
  };
  $('.as-topics').addEventListener('click',event=>{const button=event.target.closest('[data-topic]');if(button) activate(button.dataset.topic);});
  $('.as-topics').addEventListener('keydown',event=>{
    if(!event.target.closest('[data-topic]')||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();const ids=Object.keys(names),index=ids.indexOf(activeTopic);
    const next=event.key==='Home'?0:event.key==='End'?ids.length-1:(index+(event.key==='ArrowRight'?1:-1)+ids.length)%ids.length;
    activate(ids[next]);$('#as-topic-'+ids[next]).focus({preventScroll:true});
  });
  const openAnchor=()=>{
    const anchor=location.hash.slice(1),topic=({demo:'layout',lifetime:'layout',layout:'layout',isolation:'isolation',overview:'overview'})[anchor];
    if(topic) {activate(topic);if(anchor==='lifetime') layout.select('lifetime');}
  };
  window.addEventListener('hashchange',openAnchor);
  new ResizeObserver(drawRoute).observe($('#as-view-pair'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden) layout.pause();});
  window.addEventListener('pagehide',()=>layout.pause());
  selectProcess('A');paintComparison();activate('overview');openAnchor();
}
renderAddressSpacePage(document.getElementById('root'));

