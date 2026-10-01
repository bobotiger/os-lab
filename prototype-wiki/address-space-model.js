const ADDRESS_SPACE_REGIONS = Object.freeze([
  {id: 'code', title: '代码', start: 0, end: 1, text: '程序指令所在区域。执行指令与把这里当成可任意修改的数据不同；真实权限由 OS 与硬件配置。'},
  {id: 'data', title: '静态 / 全局数据', start: 2, end: 3, text: '全局变量和具有静态存储期的数据。其生命周期与一次函数调用不同；真实系统会进一步区分可写数据、只读数据等区域。'},
  {id: 'heap', title: '堆', start: 4, end: 7, text: '动态分配对象所在区域。对象不因分配它的函数返回而自动释放；本例不实现分配器，也不模拟碎片或物理页申请。'},
  {id: 'unused', title: '未使用区域', start: 8, end: 11, text: '为布局留出的空白，不是已经占用的物理内存。这里不表示一定已经映射、可读写或可供任意访问。'},
  {id: 'stack', title: '栈', start: 12, end: 15, text: '调用帧和局部数据的示意区域。本例按栈帧组织调用与返回；真实局部变量也可能放在寄存器或被优化，布局并不固定。'},
]);
const ADDRESS_SPACE_SCENES = Object.freeze({
  isolation: {title: '同一个地址，两个进程', text: 'A、B 都使用虚拟地址 6，但访问各自的私有对象。修改 A 的对象，不改变 B 的对象。'},
  layout: {title: '程序眼中的内存布局', text: '从代码到栈，观察各区域的用途。这个地址范围和布局都是示意，不是某种真实平台的地址表。'},
  lifetime: {title: '堆对象与栈帧的生命周期', text: '对照函数调用／返回与动态分配／释放。普通私有对象的生命周期不等于物理页的分配回收时间。'},
});

function buildAddressSpaceScenario(scene = 'isolation') {
  if (!Object.hasOwn(ADDRESS_SPACE_SCENES, scene)) throw new Error('地址空间场景无效');
  const process = (id, value) => ({id, globals: {2: id === 'A' ? 1 : 2, 3: 'flag'}, objects: scene === 'lifetime' ? [] : [{id: 'buffer', address: 6, value}], frames: [{id: 'main', addresses: [14, 15]}]});
  const state = {processes: [process('A', 10), process('B', 20)]};
  const snapshots = [];
  const add = (label, title, text, focus, address, change) => {
    if (change) change();
    snapshots.push({label, title, text, focus, address, ...structuredClone(state), stage: snapshots.length});
  };
  if (scene === 'layout') {
    for (const region of ADDRESS_SPACE_REGIONS) add(region.title, `${region.title}：一种用途，不是整个物理内存`, region.text, 'A', region.id === 'heap' ? 6 : region.start, null);
  } else if (scene === 'isolation') {
    add('两个私有空间', '相同的地址值，不是同一个对象', '两个进程各有虚拟地址范围 0–15，地址 6 分别属于各自的堆对象。物理侧仅表示不同私有存储位置，没有实现页表或具体转换算法。', 'A', 6, null);
    add('读取 A', 'A 读取地址 6，得到 10', '内存访问属于 A 的地址空间。程序使用虚拟地址，不需要知道对象在物理内存的具体位置。', 'A', 6, null);
    add('写入 A', 'A 将地址 6 的值改为 99', '只修改 A 的私有对象。B 的地址 6 仍为 20；这里只讨论普通私有内存，不包含显式共享内存。', 'A', 6, () => { state.processes[0].objects[0].value = 99; });
    add('读取 B', 'B 读取地址 6，仍得到 20', '切换观察对象，不是把 A 的地址当作指向 B 的全局指针。同一个数字需要结合所属进程及其映射才能解释。', 'B', 6, null);
    add('对照结果', '地址相同，私有内容各自独立', 'A 的对象为 99，B 的对象为 20。隔离由 OS 与硬件协作实现，不是仅靠给变量起不同名字；共享映射需要另行建立。', 'A', 6, null);
  } else {
    add('main 活动', '起点：只有 main 的调用帧', 'A 的栈中有 main，本例尚未分配堆对象。图中“可分配位置”不代表这段虚拟区域已经消耗了相同大小的物理内存。', 'A', 14, null);
    add('调用函数', '调用 work，建立新的调用帧', '本例新增 work 调用帧，局部数据示意放在地址 12、13。栈帧只是简化表示，不要求所有真实函数都使用相同的栈布局。', 'A', 12, () => { state.processes[0].frames.push({id: 'work', addresses: [12, 13]}); });
    add('分配对象', 'work 请求一个堆对象，地址为 6', '分配器在本例返回地址 6，随后把对象初始化为 10。malloc 可以复用已有内存，并不保证每次请求都向 OS 申请新物理页。main 保留该对象的引用。', 'A', 6, () => { state.processes[0].objects.push({id: 'buffer', address: 6, value: 10}); });
    add('再分配对象', '第二个对象出现在地址 7', '第二个对象的值为 30，供 work 暂用。这里固定展示地址 7，不代表真实分配器总会返回紧邻的地址或按本图方向增长。', 'A', 7, () => { state.processes[0].objects.push({id: 'temp', address: 7, value: 30}); });
    add('释放临时对象', '释放 temp，地址 7 不再有活对象', 'free 结束对象的生命周期，并把空间交还分配器管理；不保证清零内容或立即归还 OS 物理页。不得继续把原地址当作这个活对象使用。', 'A', 7, () => { state.processes[0].objects.pop(); });
    add('函数返回', 'work 返回，其调用帧结束', 'work 的调用帧撤销，局部数据不再有效；main 保留引用的堆对象仍在地址 6。图中撤销对象或帧不表示底层字节自动清零。', 'A', 12, () => { state.processes[0].frames.pop(); });
    add('释放保留对象', 'main 最后释放 buffer', '地址 6 的堆对象生命周期结束，main 调用帧仍在。两个对象的分配释放与调用帧的建立撤销是不同的生命周期；此处不模拟物理内存回收。', 'A', 6, () => { state.processes[0].objects.pop(); });
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
  if (frame) return {region: region.id, content: `${frame.id} 的调用帧`, value: null, location: `${processId} 的私有调用帧存储`, active: true};
  if (region.id === 'code') return {region: region.id, content: address === 0 ? '程序指令 / 计算与分支' : '程序指令 / 访存与调用', value: null, location: '未展开代码的物理映射', active: true};
  if (region.id === 'data') return {region: region.id, content: `全局数据 = ${process.globals[address]}`, value: process.globals[address], location: `${processId} 的私有全局数据存储`, active: true};
  return {region: region.id, content: region.id === 'unused' ? '布局留白，未描述映射' : '此处没有活对象或调用帧', value: null, location: '不推断物理页是否存在或已归还', active: false};
}

globalThis.OSLabAddressSpace = {regions: ADDRESS_SPACE_REGIONS, scenes: ADDRESS_SPACE_SCENES, buildScenario: buildAddressSpaceScenario, inspect: inspectAddressSpace};