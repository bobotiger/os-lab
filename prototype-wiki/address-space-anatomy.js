// Static Anatomy geometry, with values resolved by the address-space model.
globalThis.OSLabAddressAnatomy = {
  create(host) {
    const still=window.matchMedia('(prefers-reduced-motion: reduce)');
    const {inspectMappingComparison: inspect}=OSLabAddressSpace;
    let composition, snapshot, pending=false, phase='idle', visible=true, progress;
    const timers=[];
    const cancelAnimations=()=>host.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
    const clearTimers=()=>timers.splice(0).forEach(clearTimeout);
    const sync=()=>{
      host.dataset.accessPhase=phase;
      host.querySelectorAll('[data-comparison-write]').forEach(button=>{
        button.disabled=pending||snapshot?.phase==='read';
        button.querySelector('small').textContent=pending?(phase==='reading'?'已写入 99':phase==='address'?'请求中':'写入中'):snapshot?.phase==='read'?'已写入 99':snapshot?.phase==='written'?'读取 B':'写入 99';
        button.setAttribute('aria-label',snapshot?.phase==='written'?'继续对照：B 读取各自的虚拟地址':'对照两种映射：A 通过虚拟地址 6 写入 99，再由 B 读取');
      });
      host.querySelectorAll('.as-map-B small').forEach(label=>{
        label.textContent=snapshot?.phase==='read'?'读取完成':snapshot?.phase==='written'?(pending?'读取中':'待读取'):'等候 A 写入';
      });
    };
    const stop=()=>{
      clearTimers(); pending=false; progress=null; cancelAnimations();
      phase=snapshot?.phase==='read'?'complete':snapshot?.phase==='written'?'written':'idle'; sync();
    };
    const finish=()=>{
      const callback=progress; clearTimers(); pending=false; progress=null; phase='complete'; callback?.(2); sync();
    };
    new IntersectionObserver(entries=>{
      visible=entries[entries.length-1].isIntersecting;
      if(!visible) stop();
    }).observe(host);
    still.addEventListener('change',()=>{
      cancelAnimations();
      if(still.matches&&pending) { if(snapshot.phase==='initial') progress(1); finish(); }
    });
    document.addEventListener('visibilitychange',()=>{ if(document.hidden) stop(); });
    window.addEventListener('pagehide',stop);
    return {
      stop,
      write(onProgress) {
        if(pending||snapshot.phase==='read') return;
        progress=onProgress;
        if(still.matches||!visible||document.hidden) { if(snapshot.phase==='initial') onProgress(1); finish(); return; }
        pending=true;
        if(snapshot.phase==='written') { phase='reading'; sync(); timers.push(setTimeout(finish,650)); return; }
        phase='address'; sync();
        timers.push(setTimeout(()=>{phase='mapping'; sync();},180));
        timers.push(setTimeout(()=>{phase='reading'; onProgress(1); sync();},650));
        timers.push(setTimeout(finish,1300));
      },
      render(next) {
        const previous=snapshot;
        snapshot=next;
        const size=host.querySelector('[data-mapping-case]').clientWidth<380?'compact':'wide';
        if(composition!==size) {
          const focusId=host.contains(document.activeElement)?document.activeElement.id:null;
          cancelAnimations(); composition=size;
          for(const entry of snapshot.cases) {
            const mount=host.querySelector(`[data-case-picture="${entry.id}"]`);
            const geometry=OSLabAddressAnatomyGeometry[size][entry.id];
            const position=target=>`left:${target.x/geometry.width*100}%;top:${target.y/geometry.height*100}%;width:${target.width/geometry.width*100}%;height:${target.height/geometry.height*100}%`;
            const sources=geometry.sources.map(source=>`${source.id==='A'?`<button type="button" id="${entry.id==='private'?'as-isolation-write':'as-shared-write'}" class="as-map-address as-map-write" data-comparison-write="${entry.id}" style="${position(source)}"><span>虚拟地址 <strong>${source.address}</strong></span><small>写入 99</small></button>`:`<div class="as-map-address as-map-B" style="${position(source)}"><span>虚拟地址 <strong>${source.address}</strong></span><small>B 的读取入口</small></div>`}<span class="as-map-process" style="left:${source.x/geometry.width*100}%;width:${source.width/geometry.width*100}%">进程 ${source.id}</span>`).join('');
            const objects=geometry.objects.map(object=>`<div class="as-map-object" data-object-readout="${object.id}" style="${position(object)}"><span>${object.id==='shared'?'共享对象':`${object.id.endsWith('A')?'A':'B'} 的私有对象`}</span><strong></strong></div>`).join('');
            mount.innerHTML=`<div class="iso as-anatomy" data-theme="light" data-composition="${size}"><div class="as-anatomy-stage" style="aspect-ratio:${geometry.width}/${geometry.height}"><svg class="iso-svg as-isolation-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-labelledby="as-map-title-${entry.id}"><title id="as-map-title-${entry.id}"></title>${geometry.markup}</svg>${sources}${objects}<span class="as-map-relation">${entry.id==='shared'?'指向同一对象':'各自的映射'}</span></div></div>`;
          }
          if(focusId) host.querySelector(`#${focusId}`)?.focus({preventScroll:true});
        }
        host.dataset.written=String(snapshot.phase!=='initial');
        for(const entry of snapshot.cases) {
          const mount=host.querySelector(`[data-case-picture="${entry.id}"]`);
          for(const object of entry.objects) mount.querySelector(`[data-object-readout="${object.id}"] strong`).textContent=object.value;
          const a=inspect(snapshot,entry.id,'A'), b=inspect(snapshot,entry.id,'B');
          mount.querySelector('title').textContent=`${entry.id==='private'?'私有':'共享'}映射。A 的虚拟地址 ${a.address} 与 B 的虚拟地址 ${b.address} 指向${entry.id==='private'?'两份私有对象':'同一份共享对象'}。A 可读取 ${a.value}，B 可读取 ${b.value}。`;
          const result=host.querySelector(`[data-case-result="${entry.id}"]`);
          result.innerHTML=`<span>B 读取地址 ${b.address}</span><strong>${entry.readB===null?'—':entry.readB}</strong><small>${entry.readB!==null?(entry.id==='shared'?'读取到 A 写入的值':'仍为原值'):snapshot.phase==='written'?'等待 B 读取':'尚未执行写入'}</small>`;
          if(previous&&previous.phase==='initial'&&snapshot.phase==='written'&&visible&&!still.matches&&!document.hidden) {
            const target=mount.querySelector(`[data-storage-object="${a.target}"]`);
            target.animate([{opacity:.35},{opacity:1}],{duration:400,easing:'ease-out'});
          }
        }
        if(!pending) phase=snapshot.phase==='read'?'complete':snapshot.phase==='written'?'written':'idle';
        sync();
      },
    };
  },
};
