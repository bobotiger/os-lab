const FREE_SPACE_POLICIES = Object.freeze({
  first: {title: 'First Fit', name: '首次适应', rule: '按地址从低到高，遇到第一个足够大的空闲块就停止。'},
  best: {title: 'Best Fit', name: '最佳适应', rule: '检查全部空闲块，选择能容纳请求的最小块。'},
  worst: {title: 'Worst Fit', name: '最差适应', rule: '检查全部空闲块，选择最大的空闲块。'},
});

function freeSpaceSnapshot(blocks, details) {
  const freeList = blocks.filter(block => block.owner === null).map(({start, size}) => ({start, size}));
  let run = 0;
  let largestRun = 0;
  for (const block of blocks) {
    run = block.owner === null ? run + block.size : 0;
    largestRun = Math.max(largestRun, run);
  }
  return structuredClone({
    blocks, freeList,
    totalFree: freeList.reduce((total, block) => total + block.size, 0),
    largestRun, largestEntry: Math.max(0, ...freeList.map(block => block.size)),
    inspected: [], selected: null, result: null, outcome: 'pending', ...details,
  });
}

function buildFreeSpaceStory() {
  let blocks = [{start: 0, size: 4, owner: null}, {start: 4, size: 4, owner: 'A'}, {start: 8, size: 4, owner: null}];
  const frames = [];
  const add = details => frames.push(freeSpaceSnapshot(blocks, {request: 6, ...details}));
  add({label: '查看布局', title: '总空闲 8，最大连续空闲只有 4', text: 'A 占据虚拟堆的 4–7。两侧空闲块各长 4，不能越过活对象 A 拼成连续的 6 单位。'});
  add({label: '申请失败', title: '请求连续 6 单位，但两个空闲块都只有 4 单位', text: '分配器逐项检查 [0, 4) 与 [8, 12)。没有足够大的块，布局保持不变；失败不是缺页，也不是地址转换错误。', inspected: [0, 8], outcome: 'failed'});
  blocks = blocks.map(block => block.owner === 'A' ? {...block, owner: null} : block);
  add({label: '释放 A', title: '对象 A 已释放，相邻空闲块尚未合并', text: '程序释放 A。此刻 0–11 已连续空闲，但列表还记录三个长度为 4 的块。释放不保证字节清零，也不表示物理页归还 OS。', outcome: 'released'});
  blocks = [{start: 0, size: 8, owner: null}, {start: 8, size: 4, owner: null}];
  add({label: '合并左邻', title: '左侧两块相邻，4 + 4 合并为 8', text: '起点 0、长度 4 的块，末端恰好是刚释放块的起点 4。更新空闲记录为 [0, 8)，不复制或搬动对象。', inspected: [0], selected: 0});
  blocks = [{start: 0, size: 12, owner: null}];
  add({label: '合并右邻', title: '再合并右邻，8 + 4 合并为 12', text: '合并后的块 [0, 8) 与右邻 [8, 12) 相接，更新为一个记录长度 12 的空闲表项。空闲总量仍是 12，改变的是记录方式。', inspected: [0], selected: 0});
  blocks = [{start: 0, size: 6, owner: 'N'}, {start: 6, size: 6, owner: null}];
  add({label: '重试并拆分', title: '从长度 12 的空闲块分配 6 单位，剩余 6 单位', text: '再次请求 6，分配器从块的低地址端分出 [0, 6) 给新对象 N，剩余 [6, 12) 留在空闲列表。A 已释放，不是被搬到别处。', outcome: 'success', result: {start: 0, size: 6}});
  return frames.map((frame, index) => ({...frame, complete: index === frames.length - 1}));
}

function buildFreeSpaceSelection(policy = 'first', request = 3) {
  if (!Object.hasOwn(FREE_SPACE_POLICIES, policy)) throw new Error('未知分配策略');
  if (!Number.isInteger(request) || request < 1 || request > 16) throw new Error('请求须为 1–16 的整数');
  let blocks = [
    {start: 0, size: 8, owner: null}, {start: 8, size: 2, owner: 'A'},
    {start: 10, size: 4, owner: null}, {start: 14, size: 2, owner: 'B'},
    {start: 16, size: 12, owner: null}, {start: 28, size: 4, owner: 'C'},
  ];
  const candidates = blocks.filter(block => block.owner === null);
  const frames = [];
  const inspected = [];
  let selected = null;
  const add = details => frames.push(freeSpaceSnapshot(blocks, {request, inspected, selected: selected?.start ?? null, ...details}));
  add({label: '开始搜索', title: `申请 ${request} 单位`, text: FREE_SPACE_POLICIES[policy].rule});
  for (const candidate of candidates) {
    inspected.push(candidate.start);
    const fits = candidate.size >= request;
    if (fits && (selected === null || policy === 'best' && candidate.size < selected.size || policy === 'worst' && candidate.size > selected.size)) selected = candidate;
    add({label: '检查空闲块', title: `起点 ${candidate.start}，长度 ${candidate.size}`, text: fits ? `长度 ${candidate.size} ≥ ${request}，可容纳请求。${policy === 'first' ? '这是第一个合适块，停止搜索。' : `当前候选：起点 ${selected.start}，长度 ${selected.size}；继续检查其余表项。`}` : `长度 ${candidate.size} < ${request}，不能容纳请求。`});
    if (fits && policy === 'first') break;
  }
  if (selected === null) {
    add({label: '申请失败', title: '没有足够大的空闲块', text: `总空闲 24，但最大连续块为 12，放不下连续的 ${request}。分配失败，不修改任何对象或空闲块。`, outcome: 'failed'});
  } else {
    add({label: '确定位置', title: `选择 [${selected.start}, ${selected.start + selected.size})`, text: `检查了 ${inspected.length} 个表项。${FREE_SPACE_POLICIES[policy].rule} 大小并列时选择低地址块；检查次数是搜索工作量，不等于实际耗时。`});
    const remainder = selected.size - request;
    blocks = blocks.flatMap(block => block.start !== selected.start ? [block] : [{start: block.start, size: request, owner: 'N'}, ...(remainder ? [{start: block.start + request, size: remainder, owner: null}] : [])]);
    add({label: remainder ? '分配并拆分' : '恰好用完', title: `N 获得 [${selected.start}, ${selected.start + request})`, text: remainder ? `选中的 ${selected.size} = 请求 ${request} + 剩余 ${remainder}。余块起点为 ${selected.start + request}；其他空闲块和活对象不变。` : `请求恰好用完整块，不创建长度为 0 的空闲表项。其他块不变。`, selected: null, outcome: 'success', result: {start: selected.start, size: request}});
  }
  return frames.map((frame, index) => ({...frame, complete: index === frames.length - 1}));
}

globalThis.OSLabFreeSpace = {policies: FREE_SPACE_POLICIES, buildStory: buildFreeSpaceStory, buildSelection: buildFreeSpaceSelection};