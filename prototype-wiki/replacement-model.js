const REPLACEMENT_SCENARIOS = Object.freeze({
  textbook: {title: '重复访问与未来距离', accesses: [0, 1, 2, 0, 1, 3, 0, 3, 1, 2, 1].map(page => ({page, write: false}))},
  classic: {title: '重复访问与淘汰选择', accesses: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2].map(page => ({page, write: false}))},
  belady: {title: 'FIFO 的 Belady 异常', accesses: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5].map(page => ({page, write: false}))},
  locality: {title: '热点与一次性扫描', accesses: [0, 1, 0, 1, 2, 3, 4, 0, 1, 0, 1].map(page => ({page, write: false}))},
  dirty: {title: '脏页与写回', accesses: [{page: 0, write: true}, {page: 1, write: false}, {page: 2, write: true}, {page: 3, write: false}, {page: 1, write: false}, {page: 4, write: true}, {page: 2, write: false}]},
});

function buildReplacementRun(policy, accesses, capacity = 3, options = {}) {
  if (!['opt', 'fifo', 'lru', 'clock', 'random', 'clock-clean'].includes(policy) || !Number.isInteger(capacity) || capacity < 1 || capacity > 12 || !Array.isArray(accesses) || accesses.length < 1 || accesses.length > 4096 || accesses.some(access => !Number.isInteger(access.page) || access.page < 0 || typeof access.write !== 'boolean') || !Number.isInteger(options.seed ?? 7)) {
    throw new Error('页面置换参数无效');
  }
  const frames = Array.from({length: capacity}, () => ({page: null, referenced: false, dirty: false, loadedAt: -1, usedAt: -1}));
  const snapshots = [];
  const completed = [];
  let hand = 0;
  let faults = 0;
  let hits = 0;
  let writebacks = 0;
  let scans = 0, records = 0, referenceSets = 0;
  let randomState = ((options.seed ?? 7) >>> 0) || 1;
  const random = () => {randomState ^= randomState << 13;randomState ^= randomState >>> 17;randomState ^= randomState << 5;return (randomState >>> 0) / 4294967296;};
  const capture = (accessIndex, phase, selected, victim, reason) => {
    if(options.trace === false && phase !== 'access') return null;
    const snapshot = {accessIndex, phase, selected, victim, reason, hand, faults, hits, writebacks, scans, records, referenceSets, frames: frames.map(frame => ({...frame}))};
    if(options.trace !== false) snapshots.push(snapshot);
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
        if (policy === 'clock-clean') {
          for(let checked=0;checked<capacity*2;checked++) {
            scans++;selected=hand;
            if(frames[selected].referenced) {
              frames[selected].referenced=false;hand=(hand+1)%capacity;
              capture(accessIndex,'clear',selected,null,`页框 ${selected} 的 R=1，清为 0；继续寻找未被近期访问的干净页。`);
            } else if(!frames[selected].dirty) break;
            else {hand=(hand+1)%capacity;capture(accessIndex,'skip',selected,null,`页框 ${selected} 的 R=0、D=1，先检查其他候选页是否干净。`);}
          }
          // If two complete scans found no clean candidate, all bits are clear.
          if(frames[selected].dirty) selected=hand;
        } else if (policy === 'clock') {
          while (frames[hand].referenced) {
            scans++;
            selected = hand;
            frames[selected].referenced = false;
            hand = (hand + 1) % capacity;
            capture(accessIndex, 'clear', selected, null, `页框 ${selected} 的访问位 R=1，清为 0 并继续扫描；页面仍驻留。`);
          }
          scans++;
          selected = hand;
        } else if(policy === 'random') {
          selected=Math.floor(random()*capacity);
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
          'clock-clean': frames[selected].dirty?'未找到未被近期访问的干净页，选择已清除访问位的脏页。':'优先选择 R=0、D=0 的干净页，省去本次置换的写回。',
          random:'按固定随机序列从驻留页框中选择，可重复查看同一结果。',
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
      if (policy === 'clock' || policy === 'clock-clean') hand = (selected + 1) % capacity;
      capture(accessIndex, 'load', selected, victim, `页 ${access.page} 已载入页框 ${selected}，映射已更新；原来的访问尚未完成。`);
    }
    frames[selected].referenced = true;
    frames[selected].usedAt = accessIndex;
    if (access.write) frames[selected].dirty = true;
    if(policy==='lru') records++;
    if(policy==='clock'||policy==='clock-clean') referenceSets++;
    completed.push(capture(accessIndex, 'access', selected, victim, `${access.write ? '写入' : '读取'}页 ${access.page} 完成，R=1${access.write ? '、D=1' : ''}；${victim === null ? '没有淘汰页面' : `页 ${victim} 已不再驻留`}。`));
  });
  return {policy, capacity, accesses: accesses.map(access => ({...access})), snapshots, completed};
}

globalThis.OSLabReplacement = {scenarios: REPLACEMENT_SCENARIOS, buildRun: buildReplacementRun};
