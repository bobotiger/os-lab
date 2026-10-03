const PROCESS_API_SCENARIOS = Object.freeze({
  shell: {title: 'Shell：创建、准备、替换', command: 'sort < input.txt > output.txt', description: '子进程将标准输入改为 input.txt、标准输出改为 output.txt，这称为重定向；父 Shell 仍连接终端。随后子进程装载 sort，父 Shell 等待前台命令结束。'},
  fork: {title: '只有 fork：两个进程，同一程序', command: 'fork()', description: '创建子进程，但没有装载新程序。父子都从 fork 调用之后继续，通过不同返回值走不同分支。'},
  exec: {title: '只有 exec：同一进程，换程序', command: 'execvp("sort", argv)', description: '当前进程用 sort 的程序映像替换 Shell 映像，PID 不变，不创建新的进程。sort 从终端读取输入。'},
});

function buildProcessApiScenario(scenario = 'shell') {
  if (!Object.hasOwn(PROCESS_API_SCENARIOS, scenario)) throw new Error('进程 API 场景无效');
  const state = {
    parent: {pid: 42, ppid: 1, program: 'shell', status: '可执行', fds: ['终端输入', '终端输出', '终端错误'], forkReturn: '尚未调用', location: '解析命令', exitStatus: null},
    child: null, output: '', collected: null,
  };
  const frames = [];
  const add = (label, title, text, actor, action, code, change) => {
    if (change) change();
    frames.push({label, title, text, actor, action, code, ...structuredClone(state), stage: frames.length});
  };
  const createChild = () => {
    state.child = {...structuredClone(state.parent), pid: 43, ppid: 42, forkReturn: '0', location: 'fork 返回后的子分支'};
    state.parent.forkReturn = '43';
    state.parent.location = 'fork 返回后的父分支';
  };
  add('解析命令', '起点：PID 42 正在执行 Shell', 'PID 区分进程身份，程序映像决定它执行的代码。创建另一个进程与替换当前程序是不同操作。', 'parent', '准备命令', 'parse', null);
  if (scenario === 'exec') {
    add('调用 exec', '装载 sort，但不创建 PID 43', '成功的 exec 用新程序替换原程序映像，PID 仍为 42。标准输入输出保持连接到终端；旧 Shell 代码不会在成功的 exec 后继续。', 'parent', 'execvp 成功', 'exec', () => {
      state.parent.program = 'sort';
      state.parent.location = 'sort 的程序入口';
    });
    add('执行 sort', 'PID 42 正在执行 sort，旧 Shell 映像已被替换', '终端输入 pear、apple、banana，sort 输出排序结果。exec 已成功装载新程序；执行排序的是 sort 的代码，旧 Shell 代码不再继续。', 'parent', '读取并排序', 'work', () => {
      state.output = 'apple\nbanana\npear\n';
      state.parent.location = 'sort 的处理逻辑';
    });
    add('程序退出', '原 Shell 被替换，不能恢复提示符', 'sort 正常退出，状态为 0。PID 42 的退出状态由它的父进程收集。成功的 exec 不会返回旧 Shell；新程序退出也不会恢复旧程序。', 'parent', 'exit(0)', 'exit', () => {
      state.parent.status = '已退出，待外部父进程回收';
      state.parent.exitStatus = 0;
      state.parent.fds = null;
      state.parent.location = '已退出';
    });
  } else {
    add('fork 返回', '新增 PID 43，父子仍执行 Shell', 'fork 成功后，父进程得到子 PID 43，子进程得到 0，两边从调用之后继续。父子谁先执行并无保证；子进程继承的是文件描述符引用，不是把文件本身复制一份。', 'both', 'fork 成功', 'fork', createChild);
    if (scenario === 'fork') {
      add('子分支', '子进程继续原程序，不会自动变成 sort', 'PID 43 根据返回值 0 进入子分支。代码与数据从 fork 时的状态开始，之后对普通私有内存的修改相互独立；Linux 通常通过写时复制实现，而非立即完整复制所有物理页。', 'child', '执行子分支', 'branch', () => { state.child.location = '原程序的子分支'; });
      add('父分支', '父进程也继续原程序', 'PID 42 根据返回值 43 进入父分支。父子程序映像仍是 Shell，尚未调用 exec 或退出；进入分支不等于程序执行完成。', 'parent', '执行父分支', 'branch', () => { state.parent.location = '原程序的父分支'; });
    } else {
      add('重定向输入', '只修改子进程的标准输入', '子进程打开 input.txt，将对应描述符 dup2 到 0，再关闭临时描述符。之后读取标准输入就读取文件；父 Shell 的描述符 0 仍指向终端。', 'child', 'open + dup2(fd, 0) + close', 'input', () => {
        state.child.fds[0] = 'input.txt';
        state.child.location = 'exec 前的准备代码';
      });
      add('重定向输出', '只修改子进程的标准输出', '子进程以创建／截断方式打开 output.txt，将它 dup2 到 1 并关闭临时描述符。标准错误 2 保留在终端；父 Shell 的输出仍在终端。', 'child', 'open + dup2(fd, 1) + close', 'output', () => { state.child.fds[1] = 'output.txt'; });
      add('替换映像', 'PID 43 不变，Shell 变成 sort', 'execvp 成功后，原代码、数据与用户栈等被新程序映像替换。此例中的 0、1、2 未设置 close-on-exec，因此保留；新程序无需知道重定向怎样完成。', 'child', 'execvp 成功', 'exec', () => {
        state.child.program = 'sort';
        state.child.location = 'sort 的程序入口';
      });
      add('父进程等待', '父 Shell 等待这个前台子进程', '父进程调用 waitpid(43, ...)，此时子进程尚未退出，所以等待。它不是暂停所有进程；子进程仍可执行。这次 wait 位于 exec 之后，但父子执行顺序不固定，父进程也可能更早调用 wait。', 'parent', 'waitpid 等待', 'wait', () => {
        state.parent.status = '等待子进程';
        state.parent.location = 'waitpid 调用中';
      });
      add('执行 sort', 'sort 从文件读取，向文件输出', '输入预设为 pear、apple、banana。sort 通过标准描述符工作，排序结果进入 output.txt，而不是父 Shell 的终端输出。', 'child', '读取并排序', 'work', () => {
        state.output = 'apple\nbanana\npear\n';
        state.child.location = 'sort 的处理逻辑';
      });
      add('子进程退出', '执行已结束，退出状态还未被收集', 'sort 正常退出，关闭其文件描述符。PID 43 暂留退出状态等回收信息，不能再执行程序；这是“已退出、待回收”，不是就绪或阻塞。', 'child', 'exit(0)', 'exit', () => {
        state.child.status = '已退出，待回收';
        state.child.exitStatus = 0;
        state.child.fds = null;
        state.child.location = '已退出';
        state.parent.status = '可继续返回 waitpid';
      });
      add('收集状态', 'waitpid 返回 43，收集退出状态 0', '父 Shell 得知这个子进程结束，并通过等待状态取得正常退出码 0。wait 的作用不只是等待，也包括回收退出记录。', 'parent', 'waitpid 返回', 'wait', () => {
        state.collected = {pid: 43, exitCode: 0};
        state.child.status = '已回收';
        state.parent.status = '可执行';
        state.parent.location = '显示下一次提示符';
      });
    }
  }
  return frames.map((frame, index) => ({...frame, complete: index === frames.length - 1}));
}

globalThis.OSLabProcessApi = {scenarios: PROCESS_API_SCENARIOS, buildScenario: buildProcessApiScenario};