const MLFQ_LEVELS = Object.freeze([
  {name: 'Q0', quantum: 1, allotment: 2},
  {name: 'Q1', quantum: 2, allotment: 4},
  {name: 'Q2', quantum: 4, allotment: 8},
]);

const MLFQ_SCENARIOS = Object.freeze({
  feedback: {
    title: '降级与高层抢占', boost: false,
    description: 'A、C 在 t=0 到达，CPU 需求分别为 14、8；B 在 t=7 到达，只需 2。先观察长任务降级，再观察新任务抢占低层运行者。',
    processes: [{id: 'A', arrival: 0, bursts: [14]}, {id: 'C', arrival: 0, bursts: [8]}, {id: 'B', arrival: 7, bursts: [2]}],
  },
  io: {
    title: 'I/O 不清空本层累计 CPU 用量', boost: false,
    description: 'A 连续需要 16；B 有 5 段各为 1 的 CPU 工作，段间等待 I/O 2 个单位。B 虽然多次提前让出 CPU，本层使用量仍然累计。',
    processes: [{id: 'A', arrival: 0, bursts: [16]}, {id: 'B', arrival: 0, bursts: [1, 1, 1, 1, 1], io: 2}],
  },
  boost: {
    title: '短任务陆续到达', boost: true,
    description: 'A 在 t=0 到达，需要 16；B 至 H 每隔 2 个单位到达一个，均需 2，从 t=4 开始。是否每 12 个单位整体提升，会影响低层 A 再次获得 CPU 的时刻。有限任务下的长等待不等于无限饥饿。',
    processes: [{id: 'A', arrival: 0, bursts: [16]}, ...Array.from({length: 7}, (_, index) => ({id: String.fromCharCode(66 + index), arrival: 4 + index * 2, bursts: [2]}))],
  },
});

function buildMlfqRun(sceneId, boostEnabled = MLFQ_SCENARIOS[sceneId].boost) {
  const scene = MLFQ_SCENARIOS[sceneId];
  const processes = scene.processes.map(process => ({
    ...process, bursts: [...process.bursts], status: 'new', level: 0,
    sliceUsed: 0, levelUsed: 0, burstIndex: 0, burstRemaining: process.bursts[0],
    executed: 0, waiting: 0, wakeAt: null, firstStart: null, finish: null,
  }));
  const queues = MLFQ_LEVELS.map(() => []);
  const snapshots = [];
  const timeline = [];
  let running = null;
  let boundaryEvents = [];
  const bound = processes.reduce((total, process) => total + process.bursts.reduce((sum, burst) => sum + burst, 0) + (process.bursts.length - 1) * (process.io || 0), 0) + Math.max(...processes.map(process => process.arrival));
  for (let time = 0; time <= bound; time += 1) {
    const events = boundaryEvents;
    boundaryEvents = [];
    for (const process of processes) {
      if (process.status === 'new' && process.arrival === time) {
        process.status = 'ready';
        queues[0].push(process);
        events.push({type: 'arrive', id: process.id, level: 0});
      } else if (process.status === 'blocked' && process.wakeAt === time) {
        process.status = 'ready';
        process.wakeAt = null;
        queues[process.level].push(process);
        events.push({type: 'wake', id: process.id, level: process.level, used: process.levelUsed});
      }
    }
    if (boostEnabled && time > 0 && time % 12 === 0 && processes.some(process => !['new', 'done'].includes(process.status))) {
      const waiting = queues.flat();
      const affected = processes.filter(process => !['new', 'done'].includes(process.status));
      for (const process of affected) {
        process.level = 0;
        process.sliceUsed = 0;
        process.levelUsed = 0;
      }
      queues.forEach(queue => { queue.length = 0; });
      queues[0].push(...waiting);
      events.push({type: 'boost', ids: affected.map(process => process.id)});
    }
    const higher = queues.findIndex(queue => queue.length > 0);
    if (running && higher >= 0 && higher < running.level) {
      events.push({type: 'preempt', id: running.id, level: running.level, used: running.levelUsed, slice: running.sliceUsed});
      running.status = 'ready';
      queues[running.level].unshift(running);
      running = null;
    }
    if (!running) {
      const selected = queues.find(queue => queue.length > 0);
      if (selected) {
        running = selected.shift();
        running.status = 'running';
        running.firstStart ??= time;
        events.push({type: 'dispatch', id: running.id, level: running.level});
      }
    }
    snapshots.push({
      time, running: running?.id ?? null, queues: queues.map(queue => queue.map(process => process.id)),
      processes: processes.map(process => ({...process, bursts: [...process.bursts]})), events,
    });
    if (processes.every(process => process.status === 'done')) {
      return {sceneId, boostEnabled, snapshots, timeline, duration: time};
    }
    for (const process of processes) {
      if (process.status === 'ready') process.waiting += 1;
    }
    const previous = timeline.at(-1);
    const id = running?.id ?? null;
    const level = running?.level ?? null;
    if (previous && previous.id === id && previous.level === level) previous.end = time + 1;
    else timeline.push({id, level, start: time, end: time + 1});
    if (!running) continue;
    running.executed += 1;
    running.sliceUsed += 1;
    running.levelUsed += 1;
    running.burstRemaining -= 1;
    const nextTime = time + 1;
    if (running.burstRemaining === 0 && running.burstIndex === running.bursts.length - 1) {
      running.status = 'done';
      running.finish = nextTime;
      boundaryEvents.push({type: 'finish', id: running.id});
      running = null;
      continue;
    }
    const oldLevel = running.level;
    const budgetExpired = running.levelUsed === MLFQ_LEVELS[oldLevel].allotment;
    if (budgetExpired) {
      running.level = Math.min(oldLevel + 1, MLFQ_LEVELS.length - 1);
      running.levelUsed = 0;
      running.sliceUsed = 0;
      boundaryEvents.push({type: oldLevel === running.level ? 'renew' : 'demote', id: running.id, from: oldLevel, level: running.level});
    }
    if (running.burstRemaining === 0) {
      running.burstIndex += 1;
      running.burstRemaining = running.bursts[running.burstIndex];
      running.status = 'blocked';
      running.sliceUsed = 0;
      running.wakeAt = nextTime + running.io;
      boundaryEvents.push({type: 'block', id: running.id, level: running.level, used: running.levelUsed, wakeAt: running.wakeAt});
      running = null;
    } else if (budgetExpired || running.sliceUsed === MLFQ_LEVELS[running.level].quantum) {
      if (!budgetExpired) boundaryEvents.push({type: 'rotate', id: running.id, level: running.level, used: running.levelUsed});
      running.status = 'ready';
      running.sliceUsed = 0;
      queues[running.level].push(running);
      running = null;
    }
  }
  throw new Error('MLFQ 场景未在有限时间内完成');
}

globalThis.OSLabMlfq = {levels: MLFQ_LEVELS, scenarios: MLFQ_SCENARIOS, buildRun: buildMlfqRun};