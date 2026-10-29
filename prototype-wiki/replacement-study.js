/* Deterministic workloads and explicitly serialized teaching cost estimates. */
(() => {
  const {buildRun}=OSLabReplacement;
  const policies=['opt','fifo','lru','random'];
  const seeds=[3,17,29,43];
  const cache=new Map();
  function workload(kind,seed=3,length=500) {
    if(!['uniform','hot','loop'].includes(kind)||!Number.isInteger(seed)||!Number.isInteger(length)||length<1||length>4096)throw new Error('访问模式参数无效');
    let state=(seed>>>0)||1;
    const next=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
    return Array.from({length},(_,i)=>({page:kind==='loop'?i%10:kind==='uniform'?Math.floor(next()*10):next()<0.8?Math.floor(next()*2):2+Math.floor(next()*8),write:false}));
  }
  function curves(kind) {
    if(cache.has(kind))return cache.get(kind);
    const traces=seeds.map(seed=>workload(kind,seed));
    const data=Array.from({length:12},(_,i)=>({capacity:i+1,results:Object.fromEntries(policies.map(policy=>{
      const totals=traces.map((accesses,j)=>buildRun(policy,accesses,i+1,{seed:seeds[j]+1009,trace:false}).completed.at(-1));
      const hits=totals.reduce((n,s)=>n+s.hits,0),faults=totals.reduce((n,s)=>n+s.faults,0);
      return [policy,{hits,faults,count:hits+faults,rate:hits/(hits+faults)}];
    }))}));
    cache.set(kind,data);return data;
  }
  function cost(count,faults,writebacks=0) {
    if(![count,faults,writebacks].every(Number.isInteger)||count<0||faults<0||writebacks<0||faults>count)throw new Error('代价参数无效');
    const memory=count*0.0001,io=(faults+writebacks)*10;
    return {memory,io,total:memory+io,average:count?(memory+io)/count:null};
  }
  function pressure(activeLimit=3) {
    if(![1,2,3].includes(activeLimit))throw new Error('活跃进程数量无效');
    const jobs=[0,1,2].map(id=>({id,pages:[id*3,id*3+1,id*3+2],total:36}));
    const progress=[0,0,0],active=[],accesses=[],owners=[],states=[{active:[],queued:[0,1,2],progress:[...progress]}];
    let admitted=0,turn=0;
    const admit=()=>{while(active.length<activeLimit&&admitted<jobs.length)active.push(admitted++);};
    admit();states[0]={active:[...active],queued:jobs.slice(admitted).map(j=>j.id),progress:[...progress]};
    while(active.length) {
      turn%=active.length;const id=active[turn];
      accesses.push({page:jobs[id].pages[progress[id]%3],write:false});owners.push(id);progress[id]++;
      if(progress[id]===jobs[id].total){active.splice(turn,1);admit();}else turn=(turn+1)%active.length;
      states.push({active:[...active],queued:jobs.slice(admitted).map(j=>j.id),progress:[...progress]});
    }
    return {jobs,owners,states,accesses,activeLimit,run:buildRun('lru',accesses,8)};
  }
  globalThis.OSLabReplacementStudy={workload,curves,cost,pressure,policies,seeds};
})();
