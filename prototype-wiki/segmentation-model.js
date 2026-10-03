const SEGMENT_DESCRIPTORS = Object.freeze([
  Object.freeze({id: 0, name: '代码', base: 8, bounds: 8, direction: 1, virtualStart: 0, virtualEnd: 7, permissions: Object.freeze(['read', 'execute'])}),
  Object.freeze({id: 1, name: '堆', base: 24, bounds: 6, direction: 1, virtualStart: 16, virtualEnd: 21, permissions: Object.freeze(['read', 'write'])}),
  Object.freeze({id: 3, name: '栈', base: 56, bounds: 8, direction: -1, virtualStart: 56, virtualEnd: 63, permissions: Object.freeze(['read', 'write'])}),
]);

const SEGMENT_OPERATIONS = Object.freeze({read: '读取', write: '写入', execute: '取指'});

function createSegmentMemory() {
  const memory = Array.from({length: 64}, (_, address) => ({address, owner: address < 8 ? 'OS' : null, content: null}));
  for (const segment of SEGMENT_DESCRIPTORS) {
    const start = segment.direction === 1 ? segment.base : segment.base - segment.bounds;
    for (let index = 0; index < segment.bounds; index += 1) {
      const offset = segment.direction === 1 ? index : index - segment.bounds;
      memory[start + index] = {address: start + index, owner: segment.id, content: segment.id === 0 ? '程序指令用途示意' : segment.id === 1 && offset === 4 ? 'buffer = 10' : segment.id === 3 && offset === -4 ? 'local = 7' : `${segment.name}区域用途示意`};
    }
  }
  return memory;
}

function buildSegmentAccess(address = 20, operation = 'read') {
  if (!Number.isInteger(address) || address < 0 || address > 63 || !Object.hasOwn(SEGMENT_OPERATIONS, operation)) throw new Error('演示需要 0–63 的整数地址及有效访问类型');
  const segmentID = Math.floor(address / 16);
  const segment = SEGMENT_DESCRIPTORS.find(entry => entry.id === segmentID);
  const state = {address, operation, segments: structuredClone(SEGMENT_DESCRIPTORS), physical: createSegmentMemory(), segmentID: null, rawOffset: null, offset: null, boundsOK: null, permissionsOK: null, checked: null, physicalAddress: null, accessed: false, result: null, fault: null, mode: 'user'};
  const frames = [];
  const add = (label, title, text, change) => {
    if (change) change();
    frames.push({...structuredClone(state), label, title, text, stage: frames.length});
  };
  const reject = reason => add('保护异常', '本次请求被拒绝，交给 OS 处理', '没有生成可用物理地址，也没有本次访问结果。CPU 通过异常入口转入内核态，后续处置由 OS 决定，不必然终止进程。段映射、界限或权限错误不能通过载入页面自动修复。', () => { state.fault = reason; state.mode = 'kernel'; });
  add('发出请求', `程序请求${SEGMENT_OPERATIONS[operation]}虚拟地址 ${address}`, '程序给出虚拟地址和访问类型。每个段有自己的基址、长度、增长方向和权限，不能继续套用一组覆盖全空间的寄存器。');
  add('识别段', segment ? `地址属于${segment.name}段的选择区间` : '这个段选择槽没有配置映射', segment ? `虚拟地址的高 2 位给出段号。本例每个选择区间宽 16：0–15 选择代码，16–31 选择堆，48–63 选择栈。确定了段号，不代表区间中的每个地址都有效；还要检查当前段长。` : '地址 32–47 选择槽 2，本例没有为它配置段。选择区间只是地址编码，不是物理页或已分配对象。', () => { state.segmentID = segmentID; if (!segment) state.checked = false; });
  if (!segment) {
    reject('unmapped');
  } else {
    const rawOffset = address % 16;
    const offset = segment.direction === 1 ? rawOffset : rawOffset - 16;
    add('计算段内偏移', segment.direction === 1 ? `从${segment.name}选择区间起点算偏移` : '栈从上边界向下计算负偏移', segment.direction === 1 ? `${address} − ${segmentID * 16} = ${offset}。偏移相对这个段，不相对整个地址空间。` : `${address} − 64 = ${offset}。64 是虚拟栈不包含在段内的上边界；低 4 位 ${rawOffset} 在向下增长模式中解释为 ${rawOffset}−16=${offset}，不能直接加成正偏移。`, () => { state.rawOffset = rawOffset; state.offset = offset; });
    const boundsOK = segment.direction === 1 ? offset >= 0 && offset < segment.bounds : offset >= -segment.bounds && offset < 0;
    const permissionsOK = segment.permissions.includes(operation);
    add('检查界限与权限', boundsOK && permissionsOK ? '段内范围与访问权限都通过' : !boundsOK ? '已确定段号，但偏移超出段长' : '地址在段内，但操作权限不允许', `${segment.direction === 1 ? `0 ≤ offset < ${segment.bounds}` : `−${segment.bounds} ≤ offset < 0`}：${boundsOK ? '通过' : '拒绝'}。${segment.name}段的${SEGMENT_OPERATIONS[operation]}权限：${permissionsOK ? '允许' : '不允许'}。范围与操作权限必须同时满足；它们不检查每个 C 对象的生命周期与边界。`, () => { state.boundsOK = boundsOK; state.permissionsOK = permissionsOK; state.checked = boundsOK && permissionsOK; });
    if (!state.checked) {
      reject(!boundsOK ? 'bounds' : 'permission');
    } else {
      add('生成物理地址', `使用${segment.name}段的基址转换`, `${segment.base} ${offset < 0 ? '− ' + Math.abs(offset) : '+ ' + offset} = ${segment.base + offset}。${segment.direction === -1 ? 'base=56 是物理栈不包含在段内的上边界，实际分配范围为 48–55。' : `base=${segment.base} 是这个段的物理起点。`}只有检查通过，才产生可用物理地址。`, () => { state.physicalAddress = segment.base + offset; });
      add(operation === 'read' ? '读取目标内容' : operation === 'write' ? '确认写权限' : '确认取指权限', operation === 'read' ? '已读取转换后位置的内容' : operation === 'write' ? '本次写入的段权限检查通过' : '本次取指的段权限检查通过', operation === 'read' ? `已读取物理地址 ${state.physicalAddress} 对应的内容。段内范围与读取权限通过，不等于任意 C 对象访问都合法。` : operation === 'write' ? `物理地址 ${state.physicalAddress} 已生成，段允许本次写入；目标内容尚未写入。段权限通过不等于任意 C 对象写入都合法。` : `物理地址 ${state.physicalAddress} 已生成，段允许本次取指；目标指令尚未读取或执行。取指权限通过不等于目标字节必然构成有效指令。`, () => { state.accessed = true; state.result = operation === 'read' ? state.physical[state.physicalAddress].content : operation === 'write' ? '写权限检查通过' : '取指权限检查通过'; });
    }
  }
  return frames.map((frame, index) => ({...frame, complete: index === frames.length - 1}));
}

globalThis.OSLabSegmentation = {segments: SEGMENT_DESCRIPTORS, operations: SEGMENT_OPERATIONS, buildAccess: buildSegmentAccess};