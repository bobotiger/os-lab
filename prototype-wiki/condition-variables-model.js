(() => {
  'use strict';
  const names = {P: '生产者 P', C1: '消费者 C1', C2: '消费者 C2'};
  function trace(scenario = 'empty', variant = 'safe') {
    if (!['empty', 'full', 'barging', 'gap'].includes(scenario) || !['safe', 'unsafe'].includes(variant)) throw new Error('Invalid condition-variable scenario');
    const s = {queue: scenario === 'full' ? ['任务 1', '任务 2'] : [], capacity: 2, lock: null,
      waiting: {notEmpty: [], notFull: []}, states: {P: '就绪', C1: '就绪', C2: '未参与'}, actor: null, op: 'start', error: false, lost: false,
      nextItem: scenario === 'full' ? 3 : 1, produced: 0, consumed: 0, stage: 0, log: scenario === 'full' ? '队列已满。生产者需要等待消费者取走任务，腾出位置。' : '队列为空。消费者只有在队列非空时才能取任务。'};
    if (scenario === 'barging') s.states.C2 = '就绪';
    const frames = [structuredClone(s)];
    function step(actor, op, channel) {
      s.actor = actor; s.op = op; s.stage++;
      const who = names[actor];
      if (op === 'lock') {
        if (s.lock) throw new Error('Lock occupied');
        s.lock = actor; s.states[actor] = '持有锁'; s.log = `${who}获得互斥锁。${channel === 'return' ? 'wait 现在才能返回，随后仍需检查共享状态。' : '访问队列与检查条件都在这把锁的保护下进行。'}`;
      } else if (op === 'check') {
        if (s.lock !== actor) throw new Error('Check without lock');
        const allowed = actor === 'P' ? s.queue.length < 2 : s.queue.length > 0;
        s.log = `${who}检查${actor === 'P' ? '队列是否有空位' : '队列是否非空'}：当前有 ${s.queue.length} 项任务，条件${allowed ? '成立，可以继续' : '不成立，需要等待'}。`;
      } else if (op === 'wait') {
        if (s.lock !== actor) throw new Error('Wait without lock');
        s.lock = null; s.waiting[channel].push(actor); s.states[actor] = `等待 ${channel}`;
        s.log = `${who}调用 wait，登记等待并原子地释放互斥锁。生产或消费线程现在可以获得锁，改变队列状态。`;
      } else if (op === 'unlock') {
        if (s.lock !== actor) throw new Error('Unlock without ownership');
        s.lock = null; s.states[actor] = '就绪'; s.log = `${who}释放互斥锁。已被通知的线程可以竞争这把锁，但不保证它最先获得。`;
      } else if (op === 'put' || op === 'take') {
        if (s.lock !== actor) throw new Error('Queue access without lock');
        if (op === 'put') {
          if (s.queue.length === 2) throw new Error('Queue full');
          const item = `任务 ${s.nextItem++}`; s.queue.push(item); s.produced++; s.log = `${who}放入${item}。队列变为非空；接下来通知等待任务的线程。`;
        } else if (s.queue.length) {
          const item = s.queue.shift(); s.consumed++; s.log = `${who}取走${item}，队列剩余 ${s.queue.length} 项。${actor === 'C2' ? 'C1 虽然已被唤醒，却还没有重新获得锁。' : '实际处理任务可在释放队列锁之后进行。'}`;
        } else {
          s.error = true; s.states[actor] = '错误：空队列取任务';
          s.log = `${who}没有重新检查条件，直接尝试从空队列取任务。通知没有为它预留任务，任务已被另一消费者取走，队列非空的条件不再成立。`;
        }
      } else if (op === 'signal') {
        if (s.lock !== actor) throw new Error('This example signals while holding the mutex');
        const target = s.waiting[channel].shift();
        if (target) { s.states[target] = '已通知，等待重新获锁'; s.log = `${who}通知 ${names[target]}。${who}仍持有锁；被通知者尚未从 wait 返回，也没有预留任何任务。`; }
        else s.log = `${who}发出 ${channel} 通知，但当前没有线程等待该条件变量。通知不会保存为供以后使用的许可；队列内容仍会保留。`;
      } else if (op === 'unsafeSleep') {
        if (s.lock) throw new Error('Unsafe gap expected after unlock');
        s.waiting.notEmpty.push(actor); s.states[actor] = '等待 notEmpty'; s.lost = true;
        s.log = `${who}此时才登记等待。任务已经入队，通知却早已发出；本场景不再产生新通知，C1 留在等待中。`;
      } else throw new Error('Invalid operation');
      frames.push(structuredClone(s));
    }
    function produce() { step('P', 'lock'); step('P', 'check'); step('P', 'put'); step('P', 'signal', 'notEmpty'); step('P', 'unlock'); }
    function consume(actor) { step(actor, 'lock'); step(actor, 'check'); step(actor, 'take'); step(actor, 'signal', 'notFull'); step(actor, 'unlock'); }
    if (scenario === 'full') {
      step('P', 'lock'); step('P', 'check'); step('P', 'wait', 'notFull'); consume('C1');
      step('P', 'lock', 'return'); step('P', 'check'); step('P', 'put'); step('P', 'signal', 'notEmpty'); step('P', 'unlock');
    } else {
      step('C1', 'lock'); step('C1', 'check');
      if (scenario === 'gap' && variant === 'unsafe') {
        step('C1', 'unlock'); produce(); step('C1', 'unsafeSleep');
      } else {
        step('C1', 'wait', 'notEmpty'); produce();
        if (scenario === 'barging') consume('C2');
        step('C1', 'lock', 'return');
        if (scenario === 'barging' && variant === 'unsafe') step('C1', 'take');
        else {
          step('C1', 'check');
          if (scenario === 'barging') step('C1', 'wait', 'notEmpty');
          else { step('C1', 'take'); step('C1', 'signal', 'notFull'); step('C1', 'unlock'); }
        }
      }
    }
    return frames;
  }
  globalThis.OSLabConditionVariables = Object.freeze({trace});
})();
