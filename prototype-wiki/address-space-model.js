const ADDRESS_SPACE_REGIONS = Object.freeze([
  {id: 'code', title: '代码', start: 0, end: 1, text: '程序指令所在区域。执行指令与把这里当成可任意修改的数据不同；真实权限由 OS 与硬件配置。'},
  {id: 'data', title: '静态 / 全局数据', start: 2, end: 3, text: '全局变量和具有静态存储期的数据。其生命周期与一次函数调用不同；真实系统会进一步区分可写数据、只读数据等区域。'},
  {id: 'heap', title: '堆', start: 4, end: 7, text: '动态分配对象所在区域。对象不因分配它的函数返回而自动释放；分配器负责管理和复用可用空间。'},
  {id: 'unused', title: '未使用区域', start: 8, end: 11, text: '这个虚拟地址范围当前未用于代码、数据、堆对象或调用帧。它不代表已经占用的物理内存，也不保证已建立映射或允许读写。'},
  {id: 'stack', title: '栈', start: 12, end: 15, text: '调用帧和局部数据的示意区域。本例按栈帧组织调用与返回；真实局部变量也可能放在寄存器或被优化，布局并不固定。'},
]);
const ADDRESS_SPACE_SCENES = Object.freeze({
  isolation: {title: '同一个地址，两个进程', text: 'A、B 都使用虚拟地址 6，但访问各自的私有对象。修改 A 的对象，不改变 B 的对象。'},
  layout: {title: '程序眼中的内存布局', text: '代码、全局数据、堆和栈承担不同用途。具体地址范围和区域排列随平台、程序及运行环境变化。'},
  lifetime: {title: '堆对象与栈帧的生命周期', text: '对照函数调用／返回与动态分配／释放。普通私有对象的生命周期不等于物理页的分配回收时间。'},
});

function buildAddressSpaceScenario(scene = 'lifetime') {
  if (!Object.hasOwn(ADDRESS_SPACE_SCENES, scene)) throw new Error('地址空间场景无效');
  const process = (id, value) => ({id, globals: {2: id === 'A' ? 1 : 2, 3: true}, objects: scene === 'lifetime' ? [] : [{id: 'buffer', address: 6, value}], frames: [{id: 'main', addresses: [14, 15]}], references: scene === 'lifetime' ? [{owner: 'main', name: 'saved', slot: 14, address: null}] : [], released: []});
  const state = {processes: [process('A', 10), process('B', 20)]};
  const snapshots = [];
  const add = (label, title, text, focus, address, change) => {
    if (change) change();
    snapshots.push({label, title, text, focus, address, ...structuredClone(state), stage: snapshots.length});
  };
  if (scene === 'layout') {
    for (const region of ADDRESS_SPACE_REGIONS) add(region.title, region.id === 'unused' ? `虚拟地址 ${region.start}–${region.end} 当前未用于代码、数据、堆对象或调用帧` : `${region.title}区域位于虚拟地址 ${region.start}–${region.end}`, region.text, 'A', region.id === 'heap' ? 6 : region.start, null);
  } else if (scene === 'isolation') {
    add('两个私有空间', '相同的地址值，不是同一个对象', '两个进程各有虚拟地址范围 0–15，地址 6 分别属于各自的堆对象。两个对象拥有不同的私有存储位置。', 'A', 6, null);
    add('读取 A', 'A 读取地址 6，得到 10', '内存访问属于 A 的地址空间。程序使用虚拟地址，不需要知道对象在物理内存的具体位置。', 'A', 6, null);
    add('写入 A', 'A 将地址 6 的值改为 99', '只修改 A 的私有对象。B 的地址 6 仍为 20；私有对象之间没有共享映射。', 'A', 6, () => { state.processes[0].objects[0].value = 99; });
    add('读取 B', 'B 读取地址 6，仍得到 20', 'B 的访问使用 B 的地址空间映射。相同的地址数字需要结合所属进程才能解释，不是跨进程通用的指针。', 'B', 6, null);
    add('对照结果', '地址相同，私有内容各自独立', 'A 的对象为 99，B 的对象为 20。隔离由 OS 与硬件协作实现，不是仅靠给变量起不同名字；共享映射需要另行建立。', 'A', 6, null);
  } else {
    add('程序开始', '代码和全局数据已在视图中，main 开始运行', '栈中有 main 的调用帧，保存引用的变量 saved 当前为 NULL；堆中尚无动态对象。地址空间是程序的内存视图，不是此刻已经占用的全部物理内存。', 'A', 14, null);
    add('调用函数', '调用 work：栈中增加一个调用帧', 'main 调用 work，把 saved 的位置传给它。work 的调用帧保存本次调用的局部数据 local = 7；main 的调用帧仍然存在。', 'A', 12, () => { state.processes[0].frames.push({id: 'work', addresses: [12, 13], local: 7}); });
    add('申请动态对象', '堆中出现 buffer，main.saved 指向它', 'work 请求并初始化一个堆对象，将引用写入 main 的 saved。地址 6 是本例固定的虚拟地址；malloc 可以复用分配器已有空间，不保证每次向 OS 申请新的物理页。', 'A', 6, () => { state.processes[0].objects.push({id: 'buffer', address: 6, value: 10}); state.processes[0].references[0].address = 6; });
    add('函数返回', 'work 的调用帧结束，buffer 仍然存在', '返回只结束 work 的调用帧及局部数据的生命周期。main 仍持有 saved 引用，堆对象不因分配它的函数返回而自动释放。', 'A', 6, () => { state.processes[0].frames.pop(); });
    add('释放对象', 'main 释放 buffer，并将 saved 设为 NULL', 'free 结束 buffer 的生命周期，随后本例显式清空 saved；清空引用不是 free 自动完成的。旧对象不能再合法使用，底层字节不保证清零，也不保证物理页立即归还 OS。', 'A', 6, () => { state.processes[0].objects.pop(); state.processes[0].released.push(6); state.processes[0].references[0].address = null; });
  }
  return snapshots.map((snapshot, index) => ({...snapshot, complete: index === snapshots.length - 1}));
}

function inspectAddressSpace(snapshot, processId, address) {
  if (!['A', 'B'].includes(processId) || !Number.isInteger(address) || address < 0 || address > 15) throw new Error('示意地址无效');
  const process = snapshot.processes.find(process => process.id === processId);
  const region = ADDRESS_SPACE_REGIONS.find(region => address >= region.start && address <= region.end);
  const object = process.objects.find(object => object.address === address);
  const frame = process.frames.find(frame => frame.addresses.includes(address));
  if (object) return {region: region.id, content: `${object.id} = ${object.value}`, value: object.value, location: `${processId} 的私有对象存储`, active: true};
  const reference = process.references.find(reference => reference.slot === address);
  if (reference) return {region: region.id, content: `${reference.owner}.${reference.name} = ${reference.address === null ? 'NULL' : reference.address}`, value: reference.address, location: `${processId} 的私有调用帧存储`, active: true};
  if (frame && frame.local !== undefined && address === frame.addresses[0]) return {region: region.id, content: `${frame.id}.local = ${frame.local}`, value: frame.local, location: `${processId} 的私有调用帧存储`, active: true};
  if (frame) return {region: region.id, content: `${frame.id} 的调用帧`, value: null, location: `${processId} 的私有调用帧存储`, active: true};
  if (region.id === 'code') return {region: region.id, content: address === 0 ? '程序指令 / 计算与分支' : '程序指令 / 访存与调用', value: null, location: '代码的物理位置由映射决定', active: true};
  if (region.id === 'data') return {region: region.id, content: `${address === 2 ? 'counter' : 'flag'} = ${process.globals[address]}`, value: process.globals[address], location: `${processId} 的私有全局数据存储`, active: true};
  if (process.released.includes(address)) return {region: region.id, content: 'buffer 已释放，不再是活对象', value: null, location: '对象释放不等于物理页回收', active: false};
  return {region: region.id, content: region.id === 'unused' ? '未使用的虚拟地址，不保证允许访问' : '此处没有活对象或调用帧', value: null, location: '虚拟布局不决定物理页驻留', active: false};
}

globalThis.OSLabAddressSpace = {regions: ADDRESS_SPACE_REGIONS, scenes: ADDRESS_SPACE_SCENES, buildScenario: buildAddressSpaceScenario, inspect: inspectAddressSpace};