(() => {
  'use strict';
  const active = new Set();
  const esc = value => String(value ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const select = (attr, fallback) => document.querySelector('['+attr+'][aria-pressed="true"]')?.getAttribute(attr) || fallback;
  function stopAll() { active.forEach(movie => movie.stop()); }
  function phase(state, title, note, options = {}) { return {state, title, note, duration:1700, ...options}; }
  function wrap(id, elements, summary='逐操作回查') {
    const nodes = elements.map(e => typeof e === 'string' ? document.querySelector(e) : e).filter(Boolean);
    const detail=document.createElement('details');detail.className='cm-detail';detail.id=id+'-detail';
    detail.innerHTML='<summary>'+summary+'</summary>';
    nodes[0].before(detail);nodes.forEach(node=>detail.append(node));return detail;
  }
  function mount({id, before, build, view, controls=[], action, actionLabel, stopLegacy}) {
    const anchor = typeof before === 'string' ? document.querySelector(before) : before;
    const el=document.createElement('div');el.className='cm-demo';el.id=id+'-movie';
    el.innerHTML='<header class="cm-heading"><span class="cm-context"></span><h3></h3></header><div class="cm-stage" role="img"></div><p class="cm-note" role="status" aria-live="polite"></p><div class="cm-controls"><button class="cc-primary cm-play" type="button" aria-pressed="false">播放动画</button><label class="cm-scrubber"><span>回看</span><input type="range" min="0" step="10" value="0" aria-label="回看动画"></label><button class="cm-action" type="button"></button></div>';
    anchor.before(el);
    const stage=el.querySelector('.cm-stage'), head=el.querySelector('h3'),note=el.querySelector('.cm-note'), playButton=el.querySelector('.cm-play'), seek=el.querySelector('input'),actionButton=el.querySelector('.cm-action');
    const reduce=matchMedia('(prefers-reduced-motion:reduce)');
    let story, elapsed=0, playing=false, raf=null, stamp=0, key='', armed=true, flights=[];
    function buttons() { playButton.textContent=playing?'暂停':elapsed>=story.duration?'重播动画':elapsed?'继续播放':'播放动画';playButton.setAttribute('aria-pressed',String(playing));el.dataset.playing=String(playing); }
    function paint(force=false) {
      let index=story.phases.findLastIndex(p=>elapsed>=p.start);if(index<0)index=0;
      const p=story.phases[index], moves=p.moves||[], progress=reduce.matches?1:Math.min(1,(elapsed-p.start)/(p.travel||650)), moving=moves.length>0&&progress<1;
      const state=moving?(p.before??story.phases[Math.max(0,index-1)].state):p.state;
      const nextKey=index+'/'+moving;
      el.dataset.phase=String(index);el.dataset.event=p.id||String(index);el.dataset.moving=String(moving);el.dataset.ended=String(elapsed>=story.duration);
      seek.value=elapsed;
      if(force||nextKey!==key){
        key=nextKey;stage.innerHTML=view(state,{story,phase:p,index,moving});
        stage.dataset.focus=p.focus||'';
        head.textContent=moving?(p.during||p.title):p.title;note.textContent=moving?(p.duringNote||p.note):p.note;
        stage.setAttribute('aria-label',head.textContent+'。'+note.textContent);seek.setAttribute('aria-valuetext',head.textContent);
        flights=[];
        if(moving) for(const move of moves){
          const from=stage.querySelector('[data-node="'+move.from+'"]'),to=stage.querySelector('[data-node="'+move.to+'"]');
          if(!from||!to)throw new Error(id+': missing motion anchor '+move.from+' / '+move.to);
          const a=from.getBoundingClientRect(),b=to.getBoundingClientRect(),r=stage.getBoundingClientRect();
          const chip=document.createElement('span');chip.className='cm-flight '+(move.type||'');chip.textContent=move.text;chip.setAttribute('aria-hidden','true');stage.append(chip);
          if(move.remove)from.classList.add('cm-moving-out');
          flights.push({chip,x:a.left+a.width/2-r.left,y:a.top+a.height/2-r.top,tx:b.left+b.width/2-r.left,ty:b.top+b.height/2-r.top});
        }
      }
      const t=progress*progress*(3-2*progress);
      for(const f of flights){f.chip.style.left=(f.x+(f.tx-f.x)*t)+'px';f.chip.style.top=(f.y+(f.ty-f.y)*t)+'px';}
      buttons();
    }
    function tick(time){if(!playing)return;if(stamp)elapsed=Math.min(story.duration,elapsed+time-stamp);stamp=time;paint();if(elapsed>=story.duration){playing=false;raf=null;buttons();}else raf=requestAnimationFrame(tick);}
    function stop(){playing=false;cancelAnimationFrame(raf);raf=null;stamp=0;if(story)buttons();}
    function play(){stopAll();globalThis.OSLabConcurrencyUI?.pauseAll?.();stopLegacy?.();document.dispatchEvent(new Event('oslab:cinema'));armed=false;if(elapsed>=story.duration){elapsed=0;key='';}playing=true;stamp=0;buttons();raf=requestAnimationFrame(tick);}
    function inView(){const r=stage.getBoundingClientRect();return Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top))*Math.max(0,Math.min(innerWidth,r.right)-Math.max(0,r.left))/(r.width*r.height)>=.9;}
    function reload(auto=false){stop();story=build();let time=0;story.phases.forEach(p=>{p.start=time;time+=p.duration;});story.duration=time;elapsed=0;key='';seek.max=time;el.querySelector('.cm-context').textContent=story.context||'';actionButton.hidden=!action;actionButton.textContent=actionLabel?.(story)||'对照另一种方案';paint(true);if(auto){armed=!anchor.open;if(armed&&!reduce.matches&&!document.hidden&&inView())play();}}
    playButton.onclick=()=>{armed=false;if(playing)stop();else play();};
    seek.oninput=()=>{armed=false;stop();elapsed=Number(seek.value);paint();};
    actionButton.onclick=()=>{stop();action?.(story);};
    const api={stop,reload,play,element:el,disarm(){armed=false;stop();}};active.add(api);
    for(const selector of controls)document.querySelectorAll(selector).forEach(control=>control.addEventListener(control.matches('select,input')?'change':'click',()=>{stop();queueMicrotask(()=>reload(true));}));
    anchor.addEventListener('toggle',()=>{if(anchor.open){api.disarm();globalThis.OSLabConcurrencyUI?.pauseAll?.();stopLegacy?.();}});
    anchor.querySelector('summary')?.addEventListener('click',()=>{api.disarm();globalThis.OSLabConcurrencyUI?.pauseAll?.();stopLegacy?.();});
    const observer=new IntersectionObserver(entries=>{const ratio=entries[0].intersectionRatio;if(anchor.open){api.disarm();return;}if(armed&&ratio>=.9&&!reduce.matches&&!document.hidden)play();else if(ratio<.1&&playing)stop();},{threshold:[0,.1,.9]});
    addEventListener('resize',()=>paint(true),{passive:true});
    reduce.addEventListener('change',()=>{stop();paint(true);});
    reload();observer.observe(stage);return api;
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});addEventListener('pagehide',stopAll);
  const badge = (id,label=id) => '<span class="cm-badge cm-'+id+'">'+esc(label)+'</span>';
  const node = (id,label,value,extra='') => '<div class="cm-object '+extra+'" data-node="'+id+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>';
  globalThis.OSLabConcurrencyMovies=Object.freeze({mount,wrap,phase,esc,select,badge,node,stopAll});
})();
