const MULTIPROCESSOR_SCENES = Object.freeze({
  queues: {title: '每核队列与负载均衡', text: 'CPU 0 分配 A、B、C，CPU 1 分配 D。一个核空闲时，是否从另一核队尾迁移一个排队任务？'},
  shared: {title: '共享队列', text: '两个 CPU 从同一队列领取任务，按 CPU 0、CPU 1 的顺序协调取队首，锁争用开销取零。'},
  affinity: {title: '缓存亲和性', text: 'A 曾在 CPU 0 执行，现在重新就绪。两个核都可用，可以留在原核或迁移到 CPU 1；原运行关联可能影响缓存复用，但不保证命中。'},
});

function buildMultiprocessorRun(scene = 'queues', balance = true, target = 0) {
  if (!Object.hasOwn(MULTIPROCESSOR_SCENES, scene) || typeof balance !== 'boolean' || ![0, 1].includes(target)) throw new Error('多处理器场景无效');
  if (scene === 'affinity') {
    const state = {time: 0, cpus: [null, null], queues: [['A'], []], shared: [], busy: [0, 0], migrations: 0, cache: [['A'], []], tasks: [{id: 'A', burst: 2, remaining: 2}], events: ['A 重新就绪，原运行关联在 CPU 0。']};
    const snapshots = [structuredClone(state)];
    state.time = 1;
    state.queues[0] = [];
    state.cpus[target] = 'A';
    state.migrations = target;
    state.events = [target === 0 ? '将 A 派发到原核：可能复用已有缓存数据。' : '将 A 派发到新核：可能需要重新预热，代价取决于缓存与工作集。'];
    snapshots.push(structuredClone(state));
    state.time = 2;
    state.busy[target] = 1;
    state.tasks[0].remaining = 1;
    state.cache[target] = ['A'];
    state.events = ['A 已在所选 CPU 执行一个示意单位；有运行关联不保证缓存内容仍驻留。'];
    snapshots.push(structuredClone(state));
    state.time = 3;
    state.busy[target] = 2;
    state.tasks[0].remaining = 0;
    state.cpus[target] = null;
    state.events = ['A 的两个 CPU 工作单位已完成。给定工作量不包含缓存预热代价，不能据此比较留在原核与迁移的实际性能。'];
    snapshots.push(structuredClone(state));
    return {scene, balance, target, snapshots, duration: 3, timeline: []};
  }
  const tasks = [{id: 'A', burst: 8}, {id: 'B', burst: 4}, {id: 'C', burst: 4}, {id: 'D', burst: 2}].map(task => ({...task, remaining: task.burst}));
  const state = {time: 0, cpus: [null, null], queues: scene === 'queues' ? [['A', 'B', 'C'], ['D']] : [[], []], shared: scene === 'shared' ? ['A', 'D', 'B', 'C'] : [], busy: [0, 0], migrations: 0, cache: [[], []], tasks, events: []};
  const snapshots = [];
  const timeline = [];
  const dispatch = () => {
    for (const cpu of [0, 1]) {
      if (state.cpus[cpu]) continue;
      if (scene === 'queues' && balance && !state.queues[cpu].length && state.queues[1 - cpu].length) {
        const moved = state.queues[1 - cpu].pop();
        state.queues[cpu].push(moved);
        state.migrations += 1;
        state.events.push(`CPU ${cpu} 从 CPU ${1 - cpu} 队尾迁移 ${moved}；未抢占正在运行的任务。`);
      }
      const queue = scene === 'shared' ? state.shared : state.queues[cpu];
      if (queue.length) {
        state.cpus[cpu] = queue.shift();
        state.events.push(`CPU ${cpu} 领取 ${state.cpus[cpu]}。${scene === 'shared' ? '取队首经过协调，同一任务只被领取一次。' : ''}`);
      }
    }
  };
  dispatch();
  snapshots.push(structuredClone(state));
  while (tasks.some(task => task.remaining > 0)) {
    const running = [...state.cpus];
    timeline.push({time: state.time, cpus: running});
    state.events = [];
    for (const cpu of [0, 1]) {
      if (!running[cpu]) continue;
      const task = tasks.find(task => task.id === running[cpu]);
      task.remaining -= 1;
      state.busy[cpu] += 1;
      if (!task.remaining) {
        state.cpus[cpu] = null;
        state.events.push(`${task.id} 在 CPU ${cpu} 完成。`);
      }
    }
    state.time += 1;
    dispatch();
    if (!state.events.length) state.events.push('各 CPU 继续执行当前任务；图示在单位边界更新。');
    snapshots.push(structuredClone(state));
  }
  return {scene, balance, target, snapshots, duration: state.time, timeline};
}

globalThis.OSLabMultiprocessor = {scenes: MULTIPROCESSOR_SCENES, buildRun: buildMultiprocessorRun};