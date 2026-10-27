(function(global){
  'use strict';
  const copy=x=>structuredClone(x);
  const integer=(x,min,max,name)=>{if(!Number.isInteger(x)||x<min||x>max)throw new RangeError(name);return x;};
  const pfn=vpn=>(vpn*7+3)%64;
  function run(accesses,{capacity=2,pageSize=16,policy='lru',handler='hardware',seed=11,table={}}={}){
    integer(capacity,1,8,'capacity');if(![16,32,64].includes(pageSize)||!['lru','random'].includes(policy)||!['hardware','software'].includes(handler))throw new RangeError('options');
    if(!Array.isArray(accesses)||!accesses.length||accesses.length>256)throw new RangeError('accesses');integer(seed,1,4294967295,'seed');
    let random=seed>>>0;const rand=()=>{random^=random<<13;random^=random>>>17;random^=random<<5;return(random>>>0)/4294967296;};
    const entries=[],snapshots=[],completed=[];let hits=0,misses=0,tableReads=0,targets=0,faults=0;
    accesses.forEach((raw,index)=>{
      const a=typeof raw==='number'?{address:raw,write:false}:raw,address=integer(a.address,0,1023,'address'),write=!!a.write,vpn=Math.floor(address/pageSize),offset=address%pageSize,pc=1024+index*4;
      const pte={valid:true,present:true,write:true,pfn:pfn(vpn),...table[vpn]};
      let firstHit=null,victim=null,physical=null,fault=null;
      const snapshot=(phase,actor)=>{const s=copy({phase,actor,index,address,write,vpn,offset,pc,entries,hits,misses,tableReads,targets,faults,firstHit,victim,physical,fault,pte});snapshots.push(s);return s;};
      snapshot('request','程序');let found=entries.find(e=>e.vpn===vpn&&e.valid);
      firstHit=!!found;if(found){hits++;found.used=index;snapshot('hit','硬件');}
      else{misses++;snapshot('miss','硬件');if(handler==='software')snapshot('trap','OS');tableReads++;snapshot('table',handler==='software'?'OS':'硬件');
        fault=!pte.valid?'invalid':!pte.present?'absent':write&&!pte.write?'protection':null;
        if(fault){faults++;snapshot('fault','OS');return;}
        let slot=entries.findIndex(e=>!e.valid);if(slot<0&&entries.length<capacity)slot=entries.length;
        if(slot<0){slot=policy==='random'?Math.floor(rand()*capacity):entries.reduce((best,e,i)=>e.used<entries[best].used?i:best,0);victim=entries[slot].vpn;}
        found={vpn,pfn:pte.pfn,valid:true,write:pte.write,used:index};entries[slot]=found;snapshot('fill',handler==='software'?'OS':'硬件');snapshot('retry',handler==='software'?'OS 返回 / 硬件重试':'硬件');
      }
      if(write&&!found.write){fault='protection';faults++;snapshot('fault','硬件');return;}
      physical=found.pfn*pageSize+offset;snapshot('translated','硬件');targets++;completed.push(snapshot('access','硬件'));
    });
    return {accesses:copy(accesses),capacity,pageSize,policy,handler,seed,snapshots,completed};
  }
  function scenario(kind='normal',handler='hardware'){
    const cases={normal:{accesses:[100,104,116,132,100],table:{}},readonly:{accesses:[100,{address:104,write:true}],table:{6:{write:false}}},absent:{accesses:[100],table:{6:{present:false,pfn:null}}},invalid:{accesses:[100],table:{6:{valid:false,present:false,pfn:null}}}};
    if(!cases[kind])throw new RangeError('scenario');return run(cases[kind].accesses,{handler,table:cases[kind].table});
  }
  function locality({kind='dense',capacity=3,pageSize=16,passes=1}={}){
    if(!['dense','stride','cycle'].includes(kind))throw new RangeError('kind');integer(capacity,1,4,'capacity');integer(passes,1,2,'passes');if(![16,32,64].includes(pageSize))throw new RangeError('pageSize');
    const round=kind==='cycle'?Array.from({length:capacity+1},(_,i)=>i*pageSize):Array.from({length:10},(_,i)=>100+i*(kind==='dense'?4:pageSize));
    const rounds=kind==='cycle'?8:passes,accesses=Array.from({length:rounds},()=>round).flat();
    return {kind,capacity,pageSize,round,rounds,accesses,coverage:capacity*pageSize,activePages:new Set(round.map(a=>Math.floor(a/pageSize))).size,
      lru:run(accesses,{capacity,pageSize}),random:run(accesses,{capacity,pageSize,policy:'random',seed:11})};
  }
  function contexts(){
    const groups={flush:{entries:[],hits:0,misses:0,tableReads:0,targets:0,invalidated:0},asid:{entries:[],hits:0,misses:0,tableReads:0,targets:0,invalidated:0}};
    const requests=[{owner:'A',asid:1,vpn:10,pfn:100},{owner:'B',asid:2,vpn:10,pfn:170},{owner:'A',asid:1,vpn:10,pfn:100}],snapshots=[];
    let current='A';const snapshot=(phase,index)=>snapshots.push(copy({phase,index,current,request:requests[index],groups}));snapshot('initial',0);
    requests.forEach((r,index)=>{if(index){current=r.owner;for(const e of groups.flush.entries){if(e.valid)groups.flush.invalidated++;e.valid=false;}snapshot('switch',index);}
      for(const [mode,g] of Object.entries(groups)){const found=g.entries.find(e=>e.valid&&e.vpn===r.vpn&&(mode!=='asid'||e.asid===r.asid));g.hit=!!found;
        if(found){g.hits++;found.used=index;g.physical=found.pfn*16+5;}else{g.misses++;g.tableReads++;const e={...r,valid:true,used:index},empty=g.entries.findIndex(e=>!e.valid);if(empty>=0)g.entries[empty]=e;else g.entries.push(e);g.physical=e.pfn*16+5;}}
      snapshot('translated',index);for(const g of Object.values(groups))g.targets++;snapshot('access',index);
    });return snapshots;
  }
  global.OSLabTlb=Object.freeze({pfn,run,scenario,locality,contexts});
})(typeof window==='undefined'?globalThis:window);
