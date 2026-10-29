(() => {
  'use strict';
  function initial(policy='opposite') {
    if(!['opposite','ordered'].includes(policy))throw new Error('Invalid lock policy');
    return {policy,locks:{L1:null,L2:null},threads:{A:{pc:0,wait:null,done:false},B:{pc:0,wait:null,done:false}},completed:0,deadlock:false,actor:null,op:'start',log:'两把锁均空闲。每个线程都需要同时持有 L1、L2，才能完成操作。'};
  }
  function program(s,who){const keys=who==='B'&&s.policy==='opposite'?['L2','L1']:['L1','L2'];return [['lock',keys[0]],['lock',keys[1]],['work'],['unlock',keys[1]],['unlock',keys[0]]];}
  function dependencies(s){return Object.entries(s.threads).filter(([,t])=>t.wait&&s.locks[t.wait]).map(([who,t])=>({from:who,to:s.locks[t.wait],lock:t.wait}));}
  function advance(state,who) {
    const s=structuredClone(state);if(!s.threads[who])throw new Error('Unknown thread');
    if(s.deadlock||s.threads[who].done)return s;
    const t=s.threads[who],[op,key]=program(s,who)[t.pc];s.actor=who;s.op=op;
    if(op==='lock'&&s.locks[key]){t.wait=key;s.log=`${who} 等待 ${key}；这把锁由 ${s.locks[key]} 持有。${Object.values(s.locks).includes(who)?'等待期间仍保留已经取得的锁。':'它目前没有持有其他锁。'}`;}
    else {
      if(op==='lock'){s.locks[key]=who;t.wait=null;s.log=`${who} 取得 ${key}。其他线程不能同时持有这把锁。`;}
      if(op==='work'){if(!Object.values(s.locks).every(x=>x===who))throw new Error('Work without both locks');s.completed++;s.log=`${who} 同时持有两把锁，完成需要共同保护的操作。`;}
      if(op==='unlock'){if(s.locks[key]!==who)throw new Error('Invalid unlock');s.locks[key]=null;s.log=`${who} 释放 ${key}。${Object.values(s.threads).some(x=>x.wait===key)?'等待者有机会重新获取，但锁没有自动转交。':''}`;}
      t.pc++;t.done=t.pc===5;
    }
    const edges=dependencies(s);s.deadlock=edges.length===2&&edges[0].from===edges[1].to&&edges[1].from===edges[0].to;
    if(s.deadlock)s.log='A 等待 B 的 L2，B 等待 A 的 L1。双方都必须先获得另一把锁才能继续，因此都无法走到释放锁的操作。';
    return s;
  }
  function trace(policy='opposite',order='interleaved'){
    if(!['interleaved','serial'].includes(order))throw new Error('Invalid schedule');
    const frames=[initial(policy)];let turn=0;
    for(let guard=0;guard<50;guard++){
      const s=frames.at(-1);if(s.deadlock||Object.values(s.threads).every(t=>t.done))break;
      const who=order==='serial'?(s.threads.A.done?'B':'A'):(turn++%2?'B':'A');
      const t=s.threads[who];if(t.done||(t.wait&&s.locks[t.wait]))continue;
      frames.push(advance(s,who));
    }
    return frames;
  }
  globalThis.OSLabDeadlock=Object.freeze({initial,program,dependencies,advance,trace});
})();
