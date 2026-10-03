const TRANSLATION_CONTENTS = Object.freeze([
  '程序指令', '程序指令', 'counter = 1', 'flag = true',
  '堆内尚无对象', '堆内尚无对象', 'buffer = 10', '堆内尚无对象',
  '未使用区域', '未使用区域', '未使用区域', '未使用区域',
  '栈内尚无调用帧', '栈内尚无调用帧', 'main.saved = 6', 'main 调用帧',
]);

function createTranslationMemory(base = 24) {
  return Array.from({length: 64}, (_, address) => ({address, owner: address < 8 ? 'OS' : address >= base && address < base + 16 ? 'A' : null, offset: address >= base && address < base + 16 ? address - base : null, content: address >= base && address < base + 16 ? TRANSLATION_CONTENTS[address - base] : null}));
}

function buildAddressAccess(address = 6, base = 24) {
  if (!Number.isInteger(address) || ![24, 40].includes(base)) throw new Error('地址或基址设置无效');
  const state = {address, base, bounds: 16, physical: createTranslationMemory(base), checked: null, physicalAddress: null, accessed: false, fault: false, mode: 'user', paused: false, value: null};
  const frames = [];
  const add = (label, title, text, change) => {
    if (change) change();
    frames.push({...structuredClone(state), label, title, text, stage: frames.length});
  };
  add('发出虚拟地址', '程序只给出自己的虚拟地址', `进程 A 发出地址 ${address}。此时尚未通过界限检查，不把这个数字直接当作物理位置。`, null);
  const valid = address >= 0 && address < state.bounds;
  add('检查界限', valid ? '地址在虚拟范围内，允许继续转换' : '地址不在虚拟范围内，禁止本次访问', valid ? `0 ≤ ${address} < 16。bounds=16 表示空间长度，最后一个有效地址是 15。` : `${address} 不满足 0 ≤ VA < 16。即使基址加这个数字还在机器范围内，也不属于 A 获准使用的虚拟范围。`, () => { state.checked = valid; });
  if (valid) {
    add('加上基址', '硬件生成物理地址', `${base} + ${address} = ${base + address}。base 是这段地址空间的物理起点；程序使用的虚拟地址仍为 ${address}。`, () => { state.physicalAddress = base + address; });
    add('访问物理位置', '访问转换后的物理位置', '硬件使用已检查并转换的地址进行访问。整段界限检查不能代替 C 对象的生命周期与边界规则：落在整段范围内，不代表任意对象访问都合法。', () => { state.accessed = true; state.value = state.physical[state.physicalAddress].content; });
  } else {
    add('保护异常', '硬件触发异常，由 OS 接管', '没有执行加法转换或本次内存访问。控制进入内核处理保护异常，后续处置由 OS 决定，不必然终止进程。越过整段界限也不属于载入页面即可解决的缺页。', () => { state.fault = true; state.mode = 'kernel'; });
  }
  return frames.map((frame, index) => ({...frame, complete: index === frames.length - 1}));
}

function buildAddressRelocation() {
  const state = {address: 6, base: 24, bounds: 16, physical: createTranslationMemory(), checked: true, physicalAddress: 30, accessed: true, fault: false, mode: 'user', paused: false, value: 'buffer = 10', copied: false};
  const frames = [];
  const add = (label, title, text, change) => {
    if (change) change();
    frames.push({...structuredClone(state), label, title, text, stage: frames.length});
  };
  add('原处访问', '虚拟地址 6，对应物理地址 30', 'A 的完整 16 单位地址空间位于物理 24–39。数据 buffer = 10，main 中保存的虚拟引用为 6。', null);
  add('OS 暂停 A', '先暂停，再准备改变物理位置', 'OS 保存必要状态并暂停 A。物理 40–55 是已确认可用的连续空闲区域，长度足以容纳 A 的完整地址空间。', () => { state.paused = true; state.mode = 'kernel'; state.checked = null; state.accessed = false; state.physicalAddress = null; state.value = null; });
  add('复制整段内容', '先复制内容，寄存器仍指向原位置', 'OS 将原来的 16 单位内容复制到 40–55。A 仍暂停，base 仍为 24；新区域的内容副本已准备好，但尚未更新 A 的地址转换设置。', () => {
    for (let offset = 0; offset < 16; offset += 1) state.physical[40 + offset] = {...structuredClone(state.physical[24 + offset]), address: 40 + offset, owner: 'copy'};
    state.copied = true;
  });
  add('更新基址', '复制完成，OS 将 base 改为 40', 'OS 特权地更新寄存器，新区域归属 A，再释放原区域供后续复用。bounds 仍为 16；释放区域改变归属，不保证底层字节清零。', () => {
    state.base = 40;
    for (let offset = 0; offset < 16; offset += 1) {
      state.physical[40 + offset].owner = 'A';
      state.physical[24 + offset].owner = null;
      state.physical[24 + offset].offset = null;
    }
  });
  add('恢复访问', '同一虚拟地址，现在对应物理地址 46', 'A 恢复后仍使用虚拟地址 6，硬件检查通过并转换为 40+6=46。数据仍为 buffer = 10，保存的虚拟引用仍为 6。修改 base 本身不会复制内存内容。', () => { state.paused = false; state.mode = 'user'; state.checked = true; state.physicalAddress = 46; state.accessed = true; state.value = state.physical[46].content; });
  return frames.map((frame, index) => ({...frame, complete: index === frames.length - 1}));
}

globalThis.OSLabAddressTranslation = {contents: TRANSLATION_CONTENTS, buildAccess: buildAddressAccess, buildRelocation: buildAddressRelocation};