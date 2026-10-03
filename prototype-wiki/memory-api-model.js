const MEMORY_API_SCENES = Object.freeze({
  malloc: 'malloc：申请、使用、释放',
  failure: 'malloc：分配失败',
  calloc: 'calloc：字节清零',
  move: 'realloc：成功并移动',
  inplace: 'realloc：成功，地址未变',
  resizeFailure: 'realloc：失败，保留原对象',
  alias: '两个指针指向同一个对象',
});
const MEMORY_API_ERRORS = Object.freeze({
  unallocated: {title: '未申请就使用', code: 'int *p;\n*p = 10;', reason: 'p 尚未初始化，也没有指向有效对象。声明指针变量不等于申请它所指的空间。', kind: '未定义行为'},
  size: {title: '空间不足 / sizeof 用错', code: 'int *p = malloc(sizeof p);\np[2] = 30;', reason: '本例指针为 8 字节，只够两个 4 字节的 int，写入第三个越界。sizeof p 衡量指针；三个元素需要 3 * sizeof *p。两种 sizeof 偶然相等也不表示含义相同。', kind: '未定义行为'},
  string: {title: '字符串少了结尾字节', code: 'char *s = malloc(strlen("cat"));\nstrcpy(s, "cat");', reason: 'strlen 返回 3，不包含结尾的空字符。复制 cat 和结尾的 \\0 需要 4 字节，正确大小为 strlen("cat") + 1。', kind: '未定义行为'},
  uninitialized: {title: '读取未初始化内容', code: 'int *p = malloc(2 * sizeof *p);\nint value = p[0];', reason: '假设申请成功，但 malloc 没有初始化内容；读取这个 int 没有可依赖的确定值。先写入，或者使用适用的初始化方式。', kind: '无可依赖结果'},
  bounds: {title: '越界访问', code: 'int *p = malloc(2 * sizeof *p);\np[2] = 30;', reason: '假设申请成功；两个元素的合法索引是 0 和 1，索引 2 已在对象之外。旁边看起来有空白，不意味着程序拥有那部分空间。', kind: '未定义行为'},
  leak: {title: '丢失最后一个引用', code: 'int *p = malloc(2 * sizeof *p);\np = NULL;', reason: '假设申请成功且没有其他引用。清空 p 没有释放对象，程序丢失了用于后续访问和释放的引用。这是资源管理错误，不是这一赋值本身的未定义行为。', kind: '内存泄漏'},
  useAfterFree: {title: '释放后继续使用', code: 'free(p);\nint value = p[0];', reason: '对象生命周期已经结束。旧地址的历史记录不是仍可访问的活对象，底层字节未清零也不能让原对象恢复有效。', kind: '未定义行为'},
  doubleFree: {title: '重复释放', code: 'free(p);\nfree(p);', reason: '同一分配已经释放，再次释放不合法。free(NULL) 是允许的，但不能把它和再次释放旧对象混为一谈。', kind: '未定义行为'},
  invalidFree: {title: '释放对象内部地址', code: 'int *p = malloc(2 * sizeof *p);\nfree(p + 1);', reason: '假设申请成功；free 需要匹配尚未释放的分配起始指针，不能使用对象内部地址，也不能释放栈变量地址。', kind: '未定义行为'},
});

function buildMemoryApiScenario(scene = 'malloc') {
  if (!Object.hasOwn(MEMORY_API_SCENES, scene)) throw new Error('内存 API 场景无效');
  const state = {pointers: {p: {status: 'null', address: null, object: null}}, objects: [], read: null, requestedBytes: 8};
  const frames = [];
  const add = (label, code, text, change) => {
    if (change) change();
    frames.push({...structuredClone(state), label, code, text, stage: frames.length});
  };
  const allocate = (zero = false) => {
    state.objects.push({id: 'first', address: '0x1000', bytes: 8, values: zero ? [0, 0] : [null, null], live: true});
    state.pointers.p = {status: 'valid', address: '0x1000', object: 'first'};
  };
  const release = () => {
    state.objects.find(object => object.live).live = false;
    for (const pointer of Object.values(state.pointers)) if (pointer.status === 'valid') pointer.status = 'dangling';
  };
  if (scene === 'failure') {
    add('请求空间', 'int *p = NULL;\np = malloc(2 * sizeof *p);', '请求 8 字节，但分配失败，返回 NULL，没有产生堆对象。调用方必须检查返回值，不能假定请求一定成功。');
    add('检查失败', 'if (p == NULL) {\n    return;\n}', '检测到 NULL 后返回，不执行后续对象访问，也不解引用 NULL。');
  } else if (scene === 'move' || scene === 'inplace' || scene === 'resizeFailure') {
    allocate();
    state.objects[0].values = [10, 20];
    state.pointers.tmp = {status: 'null', address: null, object: null};
    add('原对象', 'int *tmp = NULL;\n/* p 已指向两个初始化的 int */', 'p 指向 8 字节的活对象，两个值为 10、20。请求大小非零，之后扩为三个 int。');
    add('请求调整', 'tmp = realloc(p, 3 * sizeof *p);', scene === 'resizeFailure' ? '本路径返回 NULL，原对象与 p 仍有效。使用临时指针接收失败结果，不覆盖原引用。' : '成功创建调整后的 12 字节对象，前两个值保留，新增长部分未初始化。即使地址数字没变，旧对象的生命周期也已结束；旧引用不可继续使用。', () => {
      state.requestedBytes = 12;
      if (scene !== 'resizeFailure') {
        state.objects[0].live = false;
        state.pointers.p.status = 'dangling';
        const address = scene === 'move' ? '0x2000' : '0x1000';
        state.objects.push({id: 'resized', address, bytes: 12, values: [10, 20, null], live: true});
        state.pointers.tmp = {status: 'valid', address, object: 'resized'};
      }
    });
    add('检查结果', 'if (tmp != NULL) {\n    p = tmp;\n}', scene === 'resizeFailure' ? 'tmp 为 NULL，条件不成立：p 仍指向原来的 8 字节对象，可以继续使用或释放。不能把原对象当作已扩大。' : 'tmp 有效，p 改为使用返回的新指针。不能让其他指向旧对象的引用自动变成有效的新引用。', () => {
      if (scene !== 'resizeFailure') state.pointers.p = structuredClone(state.pointers.tmp);
    });
    add('释放活对象', 'free(p);\np = NULL;\ntmp = NULL;', '释放当前仍有效的分配，再显式清空本例保存的引用。realloc 失败时，这一步释放的是原对象。', () => { release(); state.pointers.p = {status: 'null', address: null, object: null}; state.pointers.tmp = {status: 'null', address: null, object: null}; });
  } else if (scene === 'alias') {
    allocate();
    state.objects[0].values = [10, 20];
    add('一个对象', '/* p 已指向两个初始化的 int */', '一个分配对象，大小为 8 字节。指针变量不是堆对象本身。');
    add('复制引用', 'int *q = p;', 'q 指向同一个对象，不是复制对象，也没有增加堆分配。', () => { state.pointers.q = structuredClone(state.pointers.p); });
    add('释放对象', 'free(p);', '对象生命周期结束，p、q 的旧引用都失效。相同的地址数值不能赋予访问已释放对象的权限。', release);
    add('只清空 p', 'p = NULL;', 'p 为 NULL，但 q 的旧引用仍失效。给一个变量赋 NULL 不会自动修复所有别名，q 仍不能用于访问原对象。', () => { state.pointers.p = {status: 'null', address: null, object: null}; });
  } else {
    const zero = scene === 'calloc';
    add('申请空间', zero ? 'int *p = calloc(2, sizeof *p);\nif (p == NULL) return;' : 'int *p = malloc(2 * sizeof *p);\nif (p == NULL) return;', zero ? '本例成功申请 8 字节，并按字节清零；对本例的 int 元素，可观察为 0。全零字节不保证对所有类型都表示语义上的零值。' : '本例成功申请 8 字节，p 指向起始位置。对象内容尚未初始化，图中的 ? 不代表零或某个固定随机值。', () => allocate(zero));
    add('初始化', 'p[0] = 10;\np[1] = 20;', '给对象的两个 int 写入确定值。p[0] 与 p[1] 位于该对象范围内；本例假设 sizeof(int) 为 4。', () => { state.objects[0].values = [10, 20]; });
    add('使用对象', 'int total = p[0] + p[1];', '两个已初始化元素相加得到 30。分配了空间不意味着可以访问对象之外的索引。', () => { state.read = 30; });
    add('释放对象', 'free(p);', '对象生命周期结束，p 的旧引用失效。分配器可以复用空间，但不保证清零或立即归还物理页。', release);
    add('清空变量', 'p = NULL;', '显式清空 p，避免继续通过它误用原对象。free 不会自动完成这一赋值；其他别名仍需另行管理。', () => { state.pointers.p = {status: 'null', address: null, object: null}; });
  }
  return frames.map((frame, index) => ({...frame, complete: index === frames.length - 1}));
}

function buildMemoryApiError(id) {
  if (!Object.hasOwn(MEMORY_API_ERRORS, id)) throw new Error('错误示例无效');
  const snapshot = structuredClone(buildMemoryApiScenario()[['useAfterFree', 'doubleFree'].includes(id) ? 3 : id === 'unallocated' ? 4 : 0]);
  if (id === 'unallocated') { snapshot.objects = []; snapshot.pointers.p = {status: 'uninitialized', address: null, object: null}; }
  if (id === 'string') { snapshot.objects[0].bytes = 3; snapshot.objects[0].values = [null, null, null]; snapshot.objects[0].element = 'char'; snapshot.requestedBytes = 3; snapshot.pointers = {s: snapshot.pointers.p}; }
  if (id === 'leak') snapshot.pointers.p = {status: 'null', address: null, object: null};
  return {...snapshot, ...MEMORY_API_ERRORS[id], id, stopped: true, result: null};
}

globalThis.OSLabMemoryApi = {scenes: MEMORY_API_SCENES, errors: MEMORY_API_ERRORS, buildScenario: buildMemoryApiScenario, buildError: buildMemoryApiError};