/* Deterministic teaching models. Steps describe a simplified interleaving,
   not the semantics of a C program with an unsynchronized data race. */
(() => {
  'use strict';
  const ids = ['A', 'B'];
  const programs = {
    none: ['读取 count', '寄存器加 1', '写回 count'],
    naive: ['检查锁标志', '设置锁标志', '读取 count', '寄存器加 1', '写回 count', '释放锁'],
    atomic: ['原子地获取锁', '读取 count', '寄存器加 1', '写回 count', '释放锁'],
  };
  function initial(mode = 'none') {
    if (!programs[mode]) throw new Error('Unknown lock mode');
    return {mode, count: 0, flag: false, holders: [], threads: ids.map(id => ({id, pc: 0, register: null, done: false})),
      steps: 0, attempts: 0, violation: false, actor: null, operation: null, writes: [],
      log: mode === 'none' ? '两个线程各执行一次 count 加 1，初值为 0。先选择一个线程执行读取。' : '两个线程使用同一把锁保护 count 加 1。可以手动安排执行，也可以播放预设次序。'};
  }
  function advance(previous, id) {
    if (!ids.includes(id)) throw new Error('Unknown thread');
    if (previous.threads.find(t => t.id === id).done) return previous;
    const s = structuredClone(previous);
    const t = s.threads.find(t => t.id === id);
    const p = programs[s.mode];
    s.actor = id; s.operation = p[t.pc]; s.steps++;
    const prefix = `线程 ${id}`;
    let moved = true;
    if (s.operation === '检查锁标志') {
      if (s.flag) { moved = false; s.attempts++; s.log = `${prefix}发现锁标志为“已占用”，继续等待。`; }
      else s.log = `${prefix}读到“空闲”，准备占用锁。但检查与设置分为两步，另一个线程仍可能读到“空闲”。`;
    } else if (s.operation === '设置锁标志') {
      s.flag = true; s.holders.push(id);
      s.log = `${prefix}设置锁标志并进入临界区。${s.holders.length > 1 ? '两个线程都认为自己已获得锁，互斥已经失效。' : '另一个线程如果先前也通过了检查，仍会继续设置标志。'}`;
    } else if (s.operation === '原子地获取锁') {
      if (s.flag) { moved = false; s.attempts++; s.log = `${prefix}的原子操作读到锁已被占用，获取失败，尚未进入临界区。`; }
      else { s.flag = true; s.holders.push(id); s.log = `${prefix}在一个不可分割的操作中读取旧值并设置“已占用”，成功获取锁。`; }
    } else if (s.operation === '读取 count') {
      t.register = s.count;
      s.log = `${prefix}把共享变量的值 ${s.count} 读入自己的寄存器。共享变量尚未改变。`;
    } else if (s.operation === '寄存器加 1') {
      t.register++;
      s.log = `${prefix}的寄存器变为 ${t.register}；共享变量 count 仍为 ${s.count}。`;
    } else if (s.operation === '写回 count') {
      const old = s.count; s.count = t.register; s.writes.push(id);
      s.log = `${prefix}把寄存器中的 ${t.register} 写回 count。${old === s.count ? '它再次写入相同的值，没有在另一线程的更新结果上加 1。' : `共享变量从 ${old} 变为 ${s.count}。`}`;
    } else {
      s.flag = false; s.holders = s.holders.filter(owner => owner !== id);
      s.log = `${prefix}离开临界区并释放锁。${s.holders.length ? '另一个线程仍在临界区内，错误的锁无法保证互斥。' : '尚未获得锁的线程可以再次尝试。'}`;
    }
    if (moved) t.pc++;
    t.done = t.pc === p.length;
    s.violation ||= s.holders.length > 1;
    return s;
  }
  function schedule(mode = 'none', name = 'interleaved') {
    if (!programs[mode] || !['interleaved', 'serial'].includes(name)) throw new Error('Unknown preset');
    if (name === 'serial') return [...Array(programs[mode].length).fill('A'), ...Array(programs[mode].length).fill('B')];
    if (mode === 'none') return ['A', 'B', 'A', 'B', 'A', 'B'];
    if (mode === 'naive') return ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'];
    return ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'A', 'B', 'B', 'B', 'B', 'B'];
  }
  function replay(mode, order) {
    const states = [initial(mode)];
    for (const id of order) states.push(advance(states.at(-1), id));
    return states;
  }
  function waitingTrace({strategy = 'spin', cores = 1, hold = 4} = {}) {
    if (!['spin', 'block'].includes(strategy) || ![1, 2].includes(cores) || !Number.isInteger(hold) || hold < 1 || hold > 8) throw new Error('Invalid waiting scenario');
    let s = {time: 0, remaining: hold, b: 'waiting', pendingWake: false, failed: 0, overhead: 0, done: false,
      lanes: Array.from({length: cores}, () => []), log: 'A 已持有锁，B 即将尝试获取。A 的剩余工作量由上方设置决定。'};
    const states = [structuredClone(s)];
    let turn = 'B';
    const runnableA = () => s.remaining > 0 || s.pendingWake;
    const runnableB = () => !['blocked', 'done'].includes(s.b);
    while (!s.done && s.time < 60) {
      const heldAtStart = s.remaining > 0;
      const bAtStart = s.b;
      const actions = [];
      const aTick = () => {
        if (s.remaining > 0) { s.remaining--; actions.push(`A 完成 1 单位临界区工作${s.remaining ? `，还剩 ${s.remaining} 单位` : '并释放锁'}`); return {kind: 'work', actor: 'A', label: 'A'}; }
        s.pendingWake = false; s.b = 'waiting'; s.overhead++;
        actions.push('执行唤醒操作，使 B 从阻塞变为就绪；B 尚未获得锁');
        return {kind: 'overhead', actor: 'OS', label: '唤'};
      };
      const bTick = () => {
        if (bAtStart === 'inside') { s.b = 'done'; actions.push('B 完成 1 单位临界区工作并释放锁'); return {kind: 'work', actor: 'B', label: 'B'}; }
        if (!heldAtStart) { s.b = 'inside'; actions.push('B 成功获取锁，下一步执行临界区工作'); return {kind: 'acquire', actor: 'B', label: '获'}; }
        s.failed++; s.overhead++;
        if (strategy === 'block') { s.b = 'blocked'; actions.push('B 获取失败，登记等待并阻塞，暂时不再参与调度'); return {kind: 'overhead', actor: 'B', label: '眠'}; }
        actions.push('B 获取失败，消耗了 1 单位 CPU 时间，随后仍可继续尝试');
        return {kind: 'spin', actor: 'B', label: '旋'};
      };
      const idle = () => ({kind: 'idle', actor: null, label: '·'});
      if (cores === 1) {
        let who = turn;
        if (who === 'A' && !runnableA()) who = 'B';
        if (who === 'B' && !runnableB()) who = 'A';
        s.lanes[0].push(who === 'A' ? aTick() : bTick());
        turn = who === 'A' ? 'B' : 'A';
      } else {
        const runA = runnableA(), runB = runnableB();
        s.lanes[0].push(runA ? aTick() : idle());
        s.lanes[1].push(runB ? bTick() : idle());
      }
      if (!s.remaining && s.b === 'blocked') s.pendingWake = true;
      s.time++; s.done = s.b === 'done'; s.log = actions.join('；') + '。';
      states.push(structuredClone(s));
    }
    return states;
  }
  globalThis.OSLabConcurrency = Object.freeze({programs, initial, advance, schedule, replay, waitingTrace});
})();
