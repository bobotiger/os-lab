const SHARE_PRESETS = Object.freeze({
  weighted: {title: '5 : 3 : 2', weights: [5, 3, 2]},
  equal: {title: '1 : 1 : 1', weights: [1, 1, 1]},
  dominant: {title: '8 : 1 : 1', weights: [8, 1, 1]},
});
const SHARE_STRIDE_SCALE = 120;

function buildShareRun(presetId = 'weighted', duration = 60, seed = 42) {
  if (!SHARE_PRESETS[presetId] || !Number.isInteger(duration) || duration < 1 || duration > 240 || !Number.isInteger(seed) || seed < 1 || seed >= 2147483647) {
    throw new Error('比例份额示例参数无效');
  }
  const weights = SHARE_PRESETS[presetId].weights;
  let offset = 0;
  const processes = weights.map((weight, index) => {
    const process = {id: ['A', 'B', 'C'][index], weight, start: offset, end: offset + weight, stride: SHARE_STRIDE_SCALE / weight};
    offset += weight;
    return process;
  });
  const total = offset;
  let randomState = seed;
  const nextTicket = () => {
    const range = 2147483646;
    const limit = range - range % total;
    let value;
    do {
      randomState = randomState * 16807 % 2147483647;
      value = randomState - 1;
    } while (value >= limit);
    return value % total;
  };
  const build = kind => {
    const counts = [0, 0, 0];
    const passes = [0, 0, 0];
    const snapshots = [{time: 0, counts: [...counts], passes: [...passes], decision: null}];
    for (let time = 1; time <= duration; time += 1) {
      const before = [...passes];
      const ticket = kind === 'lottery' ? nextTicket() : null;
      const selected = kind === 'lottery'
        ? processes.findIndex(process => ticket >= process.start && ticket < process.end)
        : passes.indexOf(Math.min(...passes));
      counts[selected] += 1;
      if (kind === 'stride') passes[selected] += processes[selected].stride;
      snapshots.push({time, counts: [...counts], passes: [...passes], decision: {id: processes[selected].id, selected, ticket, before, after: [...passes]}});
    }
    return snapshots;
  };
  return {presetId, duration, seed, total, processes, lottery: build('lottery'), stride: build('stride')};
}

globalThis.OSLabShares = {presets: SHARE_PRESETS, strideScale: SHARE_STRIDE_SCALE, buildRun: buildShareRun};