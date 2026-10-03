const REPLACEMENT_SCENARIOS = Object.freeze({
  textbook: {title: '重复访问与未来距离', accesses: [0, 1, 2, 0, 1, 3, 0, 3, 1, 2, 1].map(page => ({page, write: false}))},
  classic: {title: '重复访问与淘汰选择', accesses: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2].map(page => ({page, write: false}))},
  belady: {title: 'FIFO 的 Belady 异常', accesses: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5].map(page => ({page, write: false}))},
  locality: {title: '热点与一次性扫描', accesses: [0, 1, 0, 1, 2, 3, 4, 0, 1, 0, 1].map(page => ({page, write: false}))},
  dirty: {title: '脏页与写回', accesses: [{page: 0, write: true}, {page: 1, write: false}, {page: 2, write: true}, {page: 3, write: false}, {page: 1, write: false}, {page: 4, write: true}, {page: 2, write: false}]},
});

function buildReplacementRun(policy, accesses, capacity = 3) {
  if (!['opt', 'fifo', 'lru', 'clock'].includes(policy) || !Number.isInteger(capacity) || capacity < 2 || capacity > 4 || !Array.isArray(accesses) || accesses.length < 1 || accesses.length > 64 || accesses.some(access => !Number.isInteger(access.page) || access.page < 0 || typeof access.write !== 'boolean')) {
    throw new Error('页面置换参数无效');
  }
  const frames = Array.from({length: capacity}, () => ({page: null, referenced: false, dirty: false, loadedAt: -1, usedAt: -1}));
  const snapshots = [];
  const completed = [];
  let hand = 0;
  let faults = 0;
  let hits = 0;
  let writebacks = 0;
  const capture = (accessIndex, phase, selected, victim, reason) => {
    const snapshot = {accessIndex, phase, selected, victim, reason, hand, faults, hits, writebacks, frames: frames.map(frame => ({...frame}))};
    snapshots.push(snapshot);
    return snapshot;
  };
  capture(-1, 'initial', null, null, '页框最初为空；所有访问都属于合法、可从后备存储载入的页面。');
  accesses.forEach((access, accessIndex) => {
    capture(accessIndex, 'request', null, null, `访问页 ${access.page}，${access.write ? '写入' : '读取'}页面内容。`);
    let selected = frames.findIndex(frame => frame.page === access.page);
    let victim = null;
    if (selected >= 0) {
      hits += 1;
      capture(accessIndex, 'hit', selected, null, `页 ${access.page} 已驻留，直接使用现有页框。`);
    } else {
      faults += 1;
      capture(accessIndex, 'fault', null, null, `页 ${access.page} 尚未驻留，发生缺页；目标访问等待页面准备完成。`);
      selected = frames.findIndex(frame => frame.page === null);
      if (selected < 0) {
        if (policy === 'clock') {
          while (frames[hand].referenced) {
            selected = hand;
            frames[selected].referenced = false;
            hand = (hand + 1) % capacity;
            capture(accessIndex, 'clear', selected, null, `页框 ${selected} 的访问位 R=1，清为 0 并继续扫描；页面仍驻留。`);
          }
          selected = hand;
        } else if (policy === 'opt') {
          const nextUses = frames.map(frame => {
            const nextIndex = accesses.findIndex((future, futureIndex) => futureIndex > accessIndex && future.page === frame.page);
            return nextIndex < 0 ? Infinity : nextIndex;
          });
          selected = nextUses.indexOf(Math.max(...nextUses));
        } else {
          const ages = frames.map(frame => policy === 'fifo' ? frame.loadedAt : frame.usedAt);
          selected = ages.indexOf(Math.min(...ages));
        }
        victim = frames[selected].page;
        const reasons = {
          fifo: '它最早进入内存；命中不会改变进入顺序。',
          lru: '它的最近一次访问最早；命中也会更新最近访问顺序。',
          opt: '它的下一次访问最远，或之后不再访问；相同时选较小页框号。',
          clock: '扫描指针遇到 R=0；指针下一次从后续页框继续。',
        };
        capture(accessIndex, 'select', selected, victim, `选定页 ${victim}，准备将其淘汰。${reasons[policy]}`);
        if (frames[selected].dirty) {
          capture(accessIndex, 'writeback', selected, victim, `页 ${victim} 的 D=1，必须先把修改后的内容写回后备存储；此页框尚未复用。`);
          frames[selected].dirty = false;
          writebacks += 1;
          capture(accessIndex, 'written', selected, victim, `页 ${victim} 写回完成，后备副本已更新；现在可以撤销旧映射并复用页框。`);
        }
      }
      frames[selected] = {page: access.page, referenced: false, dirty: false, loadedAt: accessIndex, usedAt: -1};
      if (policy === 'clock') hand = (selected + 1) % capacity;
      capture(accessIndex, 'load', selected, victim, `页 ${access.page} 已载入页框 ${selected}，映射已更新；原来的访问尚未完成。`);
    }
    frames[selected].referenced = true;
    frames[selected].usedAt = accessIndex;
    if (access.write) frames[selected].dirty = true;
    completed.push(capture(accessIndex, 'access', selected, victim, `${access.write ? '写入' : '读取'}页 ${access.page} 完成，R=1${access.write ? '、D=1' : ''}；${victim === null ? '没有淘汰页面' : `页 ${victim} 已不再驻留`}。`));
  });
  return {policy, capacity, accesses: accesses.map(access => ({...access})), snapshots, completed};
}

globalThis.OSLabReplacement = {scenarios: REPLACEMENT_SCENARIOS, buildRun: buildReplacementRun};