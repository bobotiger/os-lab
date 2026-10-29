(() => {
  'use strict';
  // Available permits and waiting threads are separate. A wakeup does not
  // complete wait until the resumed thread has consumed an available permit.
  function permitTrace(kind = 'resources', order = 'postFirst') {
    if (!['resources', 'mutex', 'order'].includes(kind) || !['postFirst', 'waitFirst'].includes(order)) throw new Error('Invalid permit scenario');
    const start = kind === 'resources' ? 2 : kind === 'mutex' ? 1 : 0;
    const s = {available: start, waiting: [], grants: [], states: kind === 'resources' ? {A: '就绪', B: '就绪', C: '就绪'} : {A: '就绪', B: '就绪'},
      actor: null, op: 'start', posts: 0, waits: 0, log: `初始可用许可为 ${start}。wait 成功时取走一个许可，post 增加一个许可。`};
    const frames = [structuredClone(s)];
    function step(actor, op) {
      s.actor = actor; s.op = op;
      if (op === 'wait') {
        if (s.available > 0) {
          s.available--; s.waits++; s.grants.push(actor); s.states[actor] = '已获得许可';
          s.log = `${actor} 的 sem_wait 获得一个许可并返回，可用许可减为 ${s.available}。${kind === 'order' ? (order === 'postFirst' ? 'B 在 A 等待之前发布的许可被保留，现在由 A 获取。' : 'B 发布许可后，A 才能结束等待并继续执行。') : '它可以开始使用资源。'}`;
        } else {
          if (!s.waiting.includes(actor)) s.waiting.push(actor);
          s.states[actor] = '阻塞，等待许可'; s.log = `${actor} 调用 sem_wait 时没有可用许可，因此阻塞。调用尚未返回，不能开始使用资源。`;
        }
      } else if (op === 'post') {
        const at = s.grants.indexOf(actor); if (at >= 0) s.grants.splice(at, 1);
        s.available++; s.posts++; s.states[actor] = kind === 'order' ? '已发布许可' : '已归还许可';
        const target = s.waiting.shift();
        if (target) s.states[target] = '已唤醒，wait 尚未返回';
        s.log = `${actor} 调用 sem_post，可用许可增加到 ${s.available}。${target ? `${target} 被唤醒，恢复执行后才能完成 wait。` : '当前没有等待者，许可仍被保留。'}`;
      } else if (op === 'work') {
        if (!s.grants.includes(actor)) throw new Error('Use without permit');
        s.states[actor] = '使用资源'; s.log = `${actor} 使用已取得的资源许可；其他线程是否能开始，取决于还有多少可用许可。`;
      } else throw new Error('Invalid permit operation');
      frames.push(structuredClone(s));
    }
    if (kind === 'order') {
      if (order === 'waitFirst') step('A', 'wait');
      step('B', 'post'); step('A', 'wait');
    } else if (kind === 'mutex') {
      step('A', 'wait'); step('B', 'wait'); step('A', 'work'); step('A', 'post'); step('B', 'wait'); step('B', 'work'); step('B', 'post');
    } else {
      step('A', 'wait'); step('B', 'wait'); step('C', 'wait'); step('A', 'work'); step('A', 'post'); step('C', 'wait'); step('B', 'post'); step('C', 'post');
    }
    return frames;
  }
  function queueTrace(scenario = 'empty', variant = 'safe') {
    if (!['empty', 'full'].includes(scenario) || !['safe', 'unsafe'].includes(variant)) throw new Error('Invalid semaphore queue scenario');
    const full = scenario === 'full';
    const s = {queue: full ? ['任务 1', '任务 2'] : [], capacity: 2, empty: full ? 0 : 2, full: full ? 2 : 0,
      reservedEmpty: 0, reservedFull: 0, unpublished: 0, unpostedEmpty: 0, lock: null,
      waiting: {empty: [], full: [], mutex: []}, states: {P: '就绪', C1: '就绪'}, actor: null, op: 'start', error: false,
      produced: 0, consumed: 0, nextItem: full ? 3 : 1, log: full ? '队列已有两项任务，可用任务许可为 2，空位许可为 0。' : '队列为空，可用空位许可为 2，任务许可为 0。'};
    const frames = [structuredClone(s)];
    function step(actor, op, channel) {
      s.actor = actor; s.op = op; s.channel = channel;
      if (op === 'wait') {
        if (s[channel] > 0) {
          s[channel]--; s[channel === 'empty' ? 'reservedEmpty' : 'reservedFull']++; s.states[actor] = '已获得许可';
          s.log = `${actor} 的 wait(${channel}) 成功，预留了一个${channel === 'empty' ? '空位' : '任务'}许可。队列本身尚未改变；可用许可已减为 ${s[channel]}。`;
        } else {
          s.waiting[channel].push(actor); s.states[actor] = `阻塞，等待 ${channel}`;
          s.log = `${actor} 在 wait(${channel}) 中阻塞。${s.lock === actor ? '它仍占有互斥锁，消费者将无法取得锁来腾出空位。' : '它没有占有队列锁，另一方仍能修改队列。'}`;
        }
      } else if (op === 'lock') {
        if (s.lock) {
          s.waiting.mutex.push(actor); s.states[actor] = '阻塞，等待互斥锁'; s.error = true;
          s.log = 'C1 已拿到任务许可，却被 P 持有的互斥锁挡住。P 等待空位，C1 又必须先取得锁才能取走任务，双方无法继续。';
        } else { s.lock = actor; s.states[actor] = '持有队列锁'; s.log = `${actor} 获得互斥锁，接下来修改队列。许可决定能否进行操作，锁保护队列内容及读写位置。`; }
      } else if (op === 'put') {
        if (s.lock !== actor || !s.reservedEmpty || s.queue.length >= 2) throw new Error('Invalid put');
        s.queue.push(`任务 ${s.nextItem++}`); s.reservedEmpty--; s.unpublished++; s.produced++;
        s.log = 'P 已放入任务，但尚未 post(full)。实际任务数增加，消费者可获取的任务许可还没有增加。';
      } else if (op === 'take') {
        if (s.lock !== actor || !s.reservedFull || !s.queue.length) throw new Error('Invalid take');
        const item = s.queue.shift(); s.reservedFull--; s.unpostedEmpty++; s.consumed++;
        s.log = `C1 取走${item}。实际空位已增加，但尚未 post(empty)，生产者还不能取得这个新空位的许可。`;
      } else if (op === 'unlock') {
        if (s.lock !== actor) throw new Error('Invalid unlock');
        s.lock = null; s.states[actor] = '已释放队列锁'; s.log = `${actor} 释放互斥锁。队列修改已完成，下一步发布相应许可。`;
      } else if (op === 'post') {
        const pending = channel === 'full' ? 'unpublished' : 'unpostedEmpty';
        if (!s[pending]) throw new Error('Post without matching queue operation');
        s[pending]--; s[channel]++; s.states[actor] = '已完成';
        const target = s.waiting[channel].shift(); if (target) s.states[target] = '已唤醒，wait 尚未返回';
        s.log = `${actor} 执行 post(${channel})，可用${channel === 'full' ? '任务' : '空位'}许可增加到 ${s[channel]}。${target ? `${target} 被唤醒，之后继续完成 wait。` : '即使没有等待者，许可也会保留。'}`;
      } else throw new Error('Invalid queue operation');
      if (s.queue.length !== s.full + s.reservedFull + s.unpublished || 2 - s.queue.length !== s.empty + s.reservedEmpty + s.unpostedEmpty) throw new Error('Permit conservation violated');
      frames.push(structuredClone(s));
    }
    function put() { step('P', 'wait', 'empty'); step('P', 'lock'); step('P', 'put'); step('P', 'unlock'); step('P', 'post', 'full'); }
    function take() { step('C1', 'wait', 'full'); step('C1', 'lock'); step('C1', 'take'); step('C1', 'unlock'); step('C1', 'post', 'empty'); }
    if (full && variant === 'unsafe') {
      step('P', 'lock'); step('P', 'wait', 'empty'); step('C1', 'wait', 'full'); step('C1', 'lock');
    } else if (full) { step('P', 'wait', 'empty'); take(); put(); }
    else { step('C1', 'wait', 'full'); put(); take(); }
    return frames;
  }
  globalThis.OSLabSemaphores = Object.freeze({permitTrace, queueTrace});
})();
