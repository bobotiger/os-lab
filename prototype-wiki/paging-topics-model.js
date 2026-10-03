const TOPIC_MAPPING = Object.freeze([5, 3, 6, 1]);

function buildTlbStory() {
  const frames = [];
  let entries = [];
  let hits = 0;
  let misses = 0;
  let tableReads = 0;
  let completed = 0;
  const accesses = [6, 7, 10, 6, 0, 10];
  accesses.forEach((address, accessIndex) => {
    const vpn = Math.floor(address / 4);
    const offset = address % 4;
    const snapshot = (label, text, extra = {}) => frames.push(structuredClone({address, vpn, offset, accessIndex, entries, hits, misses, tableReads, completed, physical: null, label, text, ...extra}));
    snapshot('发起访问', `第 ${accessIndex + 1} 次访问 VA ${address}：虚拟页 ${vpn}，偏移 ${offset}。尚未读取数据。`);
    const found = entries.find(entry => entry.vpn === vpn);
    if (found) {
      hits += 1;
      found.used = accessIndex;
      snapshot('TLB 命中', `缓存已有页 ${vpn} → 框 ${found.pfn}，本次无需读取页表。命中只提供转换，本次数据访问仍待完成。`, {active: vpn});
    } else {
      misses += 1;
      snapshot('TLB 未命中', `缓存没有页 ${vpn} 的转换。不代表页面不在物理内存：本例全部页面都已驻留。`, {active: vpn});
      tableReads += 1;
      snapshot('读取页表', `硬件读取单级页表，得到页 ${vpn} → 框 ${TOPIC_MAPPING[vpn]}。页面已驻留，无须磁盘载入。`, {active: vpn, table: true});
      let evicted = null;
      if (entries.length === 2) {
        const oldest = entries.reduce((previous, entry) => entry.used < previous.used ? entry : previous);
        evicted = oldest.vpn;
        entries = entries.filter(entry => entry !== oldest);
      }
      entries.push({vpn, pfn: TOPIC_MAPPING[vpn], used: accessIndex});
      snapshot('填入 TLB', `缓存页 ${vpn} → 框 ${TOPIC_MAPPING[vpn]}。${evicted === null ? '还有空槽，不必替换。' : `替换最近最少使用的页 ${evicted} 的缓存条目；不会移除它的物理页面。`}`, {active: vpn, evicted});
    }
    completed += 1;
    snapshot('访问数据', `${TOPIC_MAPPING[vpn]} × 4 + ${offset} = ${TOPIC_MAPPING[vpn] * 4 + offset}。地址转换之后，完成本次目标数据访问；命中 TLB 也不省去这一步。`, {active: vpn, physical: TOPIC_MAPPING[vpn] * 4 + offset});
  });
  return frames.map((frame, index) => ({...frame, complete: index === frames.length - 1}));
}

function buildSmallTableStory(address = 6) {
  if (!Number.isInteger(address) || address < 0 || address > 255) throw new Error('请输入 0–255 的整数虚拟地址。');
  const vpn = Math.floor(address / 4);
  const directory = Math.floor(vpn / 8);
  const leaf = vpn % 8;
  const offset = address % 4;
  const mapping = {0: 5, 1: 3, 62: 6, 63: 1};
  const allocated = directory === 0 || directory === 7;
  const mapped = Object.hasOwn(mapping, vpn);
  const frames = [];
  const snapshot = (label, text, extra = {}) => frames.push({address, vpn, directory, leaf, offset, reads: 0, physical: null, outcome: 'pending', label, text, ...extra});
  snapshot('拆分虚拟地址', `VA ${address} 分成目录索引 ${directory}、下级表索引 ${leaf}、偏移 ${offset}；位数为 3 + 3 + 2。`);
  snapshot('读取目录项', allocated ? `目录项 ${directory} 指向下级表 ${directory}。目录存的是下级表的位置，不是目标数据页框。` : `目录项 ${directory} 未配置：对应的 8 个虚拟页均未建立映射，因此没有分配这张下级表。`, {reads: 1, activeDirectory: true});
  if (!allocated) {
    snapshot('停止转换', '本例这个地址未建立映射，不能生成物理地址。不读取不存在的下级表，也不能据此推断有磁盘副本可载入。', {reads: 1, outcome: 'unmapped', activeDirectory: true});
  } else {
    snapshot('读取下级页表项', mapped ? `下级表 ${directory} 的条目 ${leaf} 给出数据页框 ${mapping[vpn]}；此时已经读取两个表项。` : `下级表存在，但条目 ${leaf} 未建立映射。表存在不代表其中每个虚拟页都可访问。`, {reads: 2, activeDirectory: true, activeLeaf: true});
    snapshot(mapped ? '生成物理地址' : '停止转换', mapped ? `${mapping[vpn]} × 4 + ${offset} = ${mapping[vpn] * 4 + offset}。偏移不变，尚未读取目标数据。` : '这个虚拟页未建立映射，无法完成转换。能否建立映射或载入页面，取决于 OS 对地址空间和访问权限的检查。', {reads: 2, outcome: mapped ? 'translated' : 'unmapped', physical: mapped ? mapping[vpn] * 4 + offset : null, activeDirectory: true, activeLeaf: true});
    if (mapped) snapshot('访问数据', '转换完成后，再访问目标数据。无 TLB、无其他缓存的本例路径共读取两个表项，再访问一次数据；这些次数不是实际耗时。', {reads: 2, outcome: 'success', physical: mapping[vpn] * 4 + offset, activeDirectory: true, activeLeaf: true, dataAccess: true});
  }
  return frames.map((frame, index) => ({...frame, complete: index === frames.length - 1}));
}

globalThis.OSLabPagingTopics = {buildTlbStory, buildSmallTableStory};