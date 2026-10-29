(() => {
  'use strict';
  const copy = value => structuredClone(value);
  function atomicity(variant = 'unsafe', order = 'interleaved') {
    if (!['safe','unsafe'].includes(variant) || !['interleaved','serial'].includes(order)) throw new Error('Invalid atomicity configuration');
    const program = variant === 'safe' ? ['lock','check','take','unlock'] : ['lock','check','unlock','lock','take','unlock'];
    const s = {kind:'atomicity', queue:['任务 1'], lock:null, checked:{A:null,B:null}, pc:{A:0,B:0}, states:{A:'就绪',B:'就绪'}, taken:[], actor:null, op:'start', error:false, log:'队列中只有一项任务。A、B 都先检查，再决定是否取走；每次访问都加锁。'};
    const frames = [copy(s)];
    let turn = 0;
    for (let guard=0; guard<40 && !s.error && Object.values(s.pc).some(n=>n<program.length); guard++) {
      const who = order === 'serial' ? (s.pc.A<program.length?'A':'B') : (turn++%2?'B':'A');
      if (s.pc[who]>=program.length) continue;
      if (s.states[who].startsWith('等待') && s.lock && s.lock !== who) continue;
      const op = program[s.pc[who]]; s.actor=who; s.op=op;
      if(op==='lock') {
        if(s.lock) {s.states[who]=`等待 ${s.lock} 释放锁`;s.log=`${who} 等待互斥锁，不能进入受保护的操作。`;frames.push(copy(s));continue;}
        s.lock=who;s.states[who]='持有锁';s.log=`${who} 获得锁。${variant==='safe'?'检查与取走处于同一个临界区。':'本次只保护单独一次访问。'}`;
      } else if(op==='unlock') {
        s.lock=null;s.states[who]='已释放锁';s.log=`${who} 释放锁。${s.pc[who]===2?'检查结果被记住，但队列随后仍可能被别人修改。':'本次队列操作结束。'}`;
        for(const other of ['A','B'])if(s.states[other].startsWith('等待'))s.states[other]='锁已空闲，待重新获取';
      } else if(op==='check') {
        s.checked[who]=s.queue.length>0;s.log=`${who} 检查到队列${s.checked[who]?'非空，记下“可以取任务”':'为空，记下“跳过取任务”'}。`;
      } else if(!s.checked[who]) {
        s.log=`${who} 根据在锁内的检查跳过取任务，队列保持为空。`;
      } else if(!s.queue.length) {
        s.error=true;s.states[who]='使用了过期的检查结果';s.log=`${who} 先前检查时有任务，现在任务已被另一个线程取走。单次访问没有相互冲突，检查与使用之间的关系却已失效。`;
      } else {
        s.taken.push(who);s.queue.shift();s.log=`${who} 取走唯一的任务。`;
      }
      s.pc[who]++; if(s.pc[who]===program.length)s.states[who]='已完成';
      frames.push(copy(s));
    }
    return frames;
  }
  function ordering(variant = 'unsafe', order = 'consumerFirst') {
    if (!['safe','unsafe'].includes(variant) || !['consumerFirst','producerFirst'].includes(order)) throw new Error('Invalid ordering configuration');
    const s={kind:'ordering',value:null,ready:false,lock:null,waiting:false,used:false,actor:null,op:'start',states:{A:'等待使用配置',B:'准备初始化'},error:false,log:'A 使用配置，B 初始化配置。两者对配置的访问都受同一互斥锁保护。'};
    const frames=[copy(s)];
    function step(who,op){
      s.actor=who;s.op=op;
      if(op==='lock'){if(s.lock)throw new Error('Lock unavailable');s.lock=who;s.states[who]='持有锁';s.log=`${who} 获得互斥锁。互斥只排斥同时访问，不决定谁先完成初始化。`;}
      if(op==='check'){s.log=`A 检查 ready = ${s.ready}。${s.ready?'配置已经初始化，可以使用。':'初始化尚未完成，需要等待。'}`;}
      if(op==='wait'){s.lock=null;s.waiting=true;s.states.A='等待初始化';s.log='A 在条件变量上等待，同时释放锁，使 B 能够初始化配置。';}
      if(op==='init'){s.value=42;s.ready=true;s.states.B='已初始化，仍持锁';s.log='B 写入配置值 42，再设置 ready = true。数据与就绪条件都在同一把锁内修改。';}
      if(op==='signal'){const hadWaiter=s.waiting;s.waiting=false;if(hadWaiter)s.states.A='已通知，等待重新获锁';s.log=hadWaiter?'B 通知 A。通知不转交锁；ready 保留初始化已经完成这个事实。':'B 发出通知，此时没有等待者。ready 仍保留初始化已经完成这个事实，A 稍后可以检查它。';}
      if(op==='use'){s.error=!s.ready;s.used=s.ready;s.states.A=s.error?'过早使用':'已使用配置';s.log=s.error?'A 虽然持有锁，但 B 还未初始化配置。读取到了空值，程序需要的先后次序没有得到保证。':'A 在确认初始化完成后使用配置值 42。';}
      if(op==='unlock'){s.lock=null;s.states[who]=who==='A'?'已使用配置并释放锁':'已初始化并释放锁';s.log=`${who} 释放互斥锁。`;}
      frames.push(copy(s));
    }
    function initialize(){step('B','lock');step('B','init');if(variant==='safe')step('B','signal');step('B','unlock');}
    if(order==='producerFirst')initialize();
    step('A','lock');
    if(variant==='safe'){
      step('A','check');
      if(!s.ready){step('A','wait');initialize();step('A','lock');step('A','check');}
    }
    step('A','use');if(!s.error)step('A','unlock');
    if(!s.error && order==='consumerFirst' && !s.ready)initialize();
    return frames;
  }
  globalThis.OSLabConcurrencyBugs=Object.freeze({atomicity,ordering});
})();
