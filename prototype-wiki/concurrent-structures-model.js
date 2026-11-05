(() => {
  'use strict';
  function hashTrace(scope = 'table', workload = 'separate') {
    if (!['table', 'bucket'].includes(scope) || !['separate', 'hot'].includes(workload)) throw new Error('Invalid hash scenario');
    const s = {round: 0, scope, workload, buckets: [[], [], [], []], locks: Array(scope === 'table' ? 1 : 4).fill(null),
      threads: [{id: 'A', key: 4, pc: 0, status: '准备插入'}, {id: 'B', key: workload === 'hot' ? 8 : 9, pc: 0, status: '准备插入'}], blocked: 0, completed: 0, log: '两个线程各插入一个键。键除以 4 的余数决定目标桶。'};
    const frames = [structuredClone(s)];
    while (s.completed < 2) {
      const messages = [];
      for (const t of s.threads) {
        if (t.pc === 3) continue;
        const bucket = t.key % 4, lock = scope === 'table' ? 0 : bucket;
        if (t.pc === 0) {
          if (s.locks[lock]) { s.blocked++; t.status = '等待锁'; messages.push(`${t.id} 的目标是桶 ${bucket}，但所需的锁正被 ${s.locks[lock]} 占用`); }
          else { s.locks[lock] = t.id; t.pc++; t.status = '已获锁，准备插入'; messages.push(`${t.id} 获取${scope === 'table' ? '整表锁' : `桶 ${bucket} 的锁`}`); }
        } else if (t.pc === 1) {
          if (s.locks[lock] !== t.id) throw new Error('Unprotected insert');
          s.buckets[bucket].push(t.key); t.pc++; t.status = '已插入，尚未释放锁'; messages.push(`${t.id} 将键 ${t.key} 插入桶 ${bucket}`);
        } else {
          s.locks[lock] = null; t.pc++; t.status = '已完成'; s.completed++; messages.push(`${t.id} 释放锁，完成插入`);
        }
      }
      s.round++; s.log = messages.join('；') + '。'; frames.push(structuredClone(s));
    }
    return frames;
  }
  function counterTrace(threshold = 4) {
    if (![1, 2, 4].includes(threshold)) throw new Error('Invalid threshold');
    const s = {total: 0, global: 0, locals: [0, 0], merges: 0, cpu: null, phase: 'start', log: '当前尚未更新；两个 CPU 接下来各执行 6 次更新。本地计数达到阈值时，合并到全局计数。'};
    const frames = [structuredClone(s)];
    for (let n = 0; n < 12; n++) {
      const cpu = n % 2; s.cpu = cpu; s.total++; s.locals[cpu]++; s.phase = 'local';
      s.log = `CPU ${cpu} 在本地锁保护下加 1。本地累计为 ${s.locals[cpu]}，已完成更新总数为 ${s.total}；全局读取仍返回 ${s.global}。`;
      frames.push(structuredClone(s));
      if (s.locals[cpu] >= threshold) {
        const amount = s.locals[cpu]; s.global += amount; s.locals[cpu] = 0; s.merges++; s.phase = 'merge';
        s.log = `CPU ${cpu} 持有本地锁，并获取全局锁，将 ${amount} 次更新合并到全局。本地清零，全局变为 ${s.global}。`;
        frames.push(structuredClone(s));
      }
    }
    return frames;
  }
  globalThis.OSLabConcurrentStructures = Object.freeze({hashTrace, counterTrace});
})();
