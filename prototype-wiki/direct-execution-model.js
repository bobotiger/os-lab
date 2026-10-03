const LDE_SCENARIOS = Object.freeze({
  timer: {title: '计时器中断', description: 'A 持续计算，不主动让出 CPU。计时器中断使 CPU 转入内核态，OS 再决定继续 A 或切换到已就绪的 B。'},
  syscall: {title: '系统调用', description: 'A 请求一个不阻塞的查询型系统调用。普通包装函数仍在用户态，受控入口才进入内核；处理后返回 A。'},
  protection: {title: '直接执行与权限边界', description: '普通指令直接执行；A 尝试执行用户态不允许的特权操作时，硬件拒绝该操作并进入保护异常处理。'},
});

function buildDirectExecutionScenario(scenario = 'timer', decision = 'switch') {
  if (!Object.hasOwn(LDE_SCENARIOS, scenario) || !['switch', 'continue'].includes(decision)) throw new Error('受限直接执行场景无效');
  const frame = (label, title, text, fields = {}) => ({
    label, title, text, owner: 'user', context: 'A', actor: '程序 A', entry: null,
    timer: '已设置', userA: '尚未进入内核', userB: '预存用户现场',
    kernelA: '尚无切换保存', kernelB: '预存内核上下文', switches: 0,
    states: {A: '运行', B: '就绪'}, ...fields,
  });
  const ordinary = frame('用户执行', 'A 的普通指令直接在 CPU 上运行', '内核没有逐条解释这些普通指令。CPU 仍受用户态权限、地址空间与受控入口约束；B 就绪，但此刻未获得 CPU。');
  let frames;
  if (scenario === 'syscall') {
    const entry = {owner: 'kernel', entry: 'syscall', userA: '入口现场已保存', actor: '硬件'};
    frames = [ordinary,
      frame('调用包装', '普通函数调用还没有进入内核', 'A 调用系统调用包装函数，准备系统调用号和参数。包装函数本身仍是用户代码；普通函数调用不会自动提高权限。'),
      frame('受控入口', '系统调用入口使 CPU 进入内核态', '专用指令或 trap 通过已配置的合法入口进入内核，保存返回所需的必要状态。具体指令与入口机制随体系结构变化。', entry),
      frame('内核处理', '内核检查请求并准备返回值', '内核根据调用号派发处理程序、检查参数并完成查询。本例不等待 I/O、不阻塞、不触发进程切换；执行内核代码的仍是 A 的上下文。', {...entry, actor: '操作系统'}),
      frame('返回 A', '恢复 A 的用户现场，继续原程序', '返回路径恢复必要现场并降回用户态。A 从系统调用后的返回位置继续；B 仍就绪，模式切换不等于进程切换。', {actor: '内核返回路径 / 硬件', userA: '用户现场已恢复'}),
    ];
  } else if (scenario === 'protection') {
    const entry = {owner: 'kernel', entry: 'protection', userA: '异常入口现场已保存'};
    frames = [ordinary,
      frame('权限边界', '用户态不能任意配置内核入口或设备', '普通指令可以直接运行，但配置陷阱入口、控制计时器等特权操作受硬件限制。用户程序不能任意指定内核入口地址。'),
      frame('尝试越权', 'A 尝试一条不被允许的特权操作', '这是违规尝试，不是合法系统调用。此阶段只表示发出尝试，并不表示特权操作已执行成功。'),
      frame('硬件拒绝', '硬件阻止操作，触发保护异常', 'CPU 检查权限后拒绝该操作，通过预设异常入口进入内核。异常由当前指令同步触发，与异步计时器中断不同。', {...entry, actor: '硬件'}),
      frame('内核接管', '后续处置由内核决定，特权操作未完成', '内核已接管违规操作，后续处置尚未发生。是否终止进程、报告错误或采取其他处理依赖系统与异常类型；用户态函数调用不能绕过权限限制。', {...entry, actor: '操作系统'}),
    ];
  } else {
    const entry = {owner: 'kernel', entry: 'timer', userA: '中断入口现场已保存'};
    const target = decision === 'switch' ? 'B' : 'A';
    const switched = decision === 'switch';
    const outcome = {
      context: target, userA: switched ? entry.userA : '用户现场待恢复',
      kernelA: switched ? 'OS 已保存 A 的内核上下文' : '未发生上下文切换',
      kernelB: switched ? 'OS 已恢复 B 的内核上下文' : '预存内核上下文',
      switches: switched ? 1 : 0, states: switched ? {A: '就绪', B: '运行'} : {A: '运行', B: '就绪'},
    };
    frames = [ordinary,
      frame('持续计算', 'A 不主动进入内核，仍继续计算', '没有系统调用或主动让出 CPU。计时器中断机制使 OS 不必依赖程序自愿配合，也能重新获得控制权。'),
      frame('中断入口', '计时器到期，CPU 转入内核态', '中断异步打断 A，硬件保存返回所需的必要状态，转到预设中断入口。此刻还没有换成 B；保存哪些状态以及如何保存取决于体系结构。', {...entry, actor: '硬件', timer: '到期，已进入处理'}),
      frame('中断处理', 'OS 获得控制权，处理计时器事件', '内核处理事件，并安排下一次计时器触发。硬件负责进入内核，调度策略决定继续 A，还是选择已就绪的 B。', {...entry, actor: '操作系统', timer: '下一次已安排'}),
      frame('调度决定', switched ? 'OS 决定让已就绪的 B 运行' : 'OS 决定继续运行 A', switched ? '调度选择已经作出，但 A 的内核上下文还未换出，B 也还没开始执行。随后才保存 A、恢复 B。' : '一次中断不必带来进程切换。OS 可以继续让 A 使用 CPU；B 保持就绪。', {...entry, actor: '操作系统', timer: '下一次已安排'}),
      frame(switched ? '切换上下文' : '准备返回', switched ? '保存 A，恢复 B；CPU 仍在内核态' : '保持 A 的上下文，准备返回用户态', switched ? 'OS 保存 A 的内核执行上下文，并恢复 B 先前准备好的内核上下文。A 回到就绪，B 成为运行者；恢复寄存器和栈等状态是架构相关的示意，不是复制整个进程。' : '不保存另一个进程的切换现场，也不装载 B 的上下文；接下来直接恢复 A 的用户现场。', {...entry, ...outcome, actor: '操作系统', timer: '下一次已安排'}),
      frame(`返回 ${target}`, `${target} 在用户态继续执行`, switched ? 'B 的返回路径恢复 B 自己的用户现场，不使用 A 的中断返回位置。A 的现场保留，等待以后被选中；切换期间始终只有一颗 CPU。' : '恢复 A 的用户现场，从被中断处继续。OS 已获得并交还控制权，但进程间切换次数仍为 0。', {...outcome, actor: '内核返回路径 / 硬件', timer: '下一次已安排', userA: switched ? entry.userA : '用户现场已恢复', userB: switched ? 'B 的用户现场已恢复' : '预存用户现场'}),
    ];
  }
  return frames.map((snapshot, stage) => ({...snapshot, stage, mode: snapshot.owner === 'user' ? '用户态' : '内核态', states: {...snapshot.states}, complete: stage === frames.length - 1}));
}

globalThis.OSLabDirectExecution = {scenarios: LDE_SCENARIOS, buildScenario: buildDirectExecutionScenario};