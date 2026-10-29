globalThis.OSLabProcessHomework = (() => {
  const questions = [
    '运行两个只执行计算指令的进程，记录它们的运行顺序和 CPU 空闲情况，再解释结果并计算 CPU 利用率。',
    '先完成进程 0 的计算，再执行进程 1 的一次 I/O，区分发起请求、等待服务和完成处理的耗时。',
    '分别让 I/O 进程和计算进程排在输入首位，比较总时间，以及计算能否在 I/O 服务期间执行。',
    '使用 SWITCH_ON_END，检查进程 0 等待 I/O 时，已就绪的进程 1 是否获得 CPU。',
    '保持输入相同，只改变 -S，比较进程 0 阻塞后进程 1 的首次运行时刻。',
    '使用 IO_RUN_LATER，记录进程 0 从每次 I/O 完成到再次获得 CPU 的等待区间。',
    '保持输入和 -S 相同，只改变 -I，比较进程 0 的下一次 I/O 请求何时发起。',
    '对每个固定种子分别执行四种 -S/-I 组合，用相同指令序列比较策略造成的时间差异。',
  ];
  const requirements = [
    [
      '执行本题命令。两个进程的输入均为 X:100，表示只执行计算指令；进程编号按照输入顺序为 0、1。',
      '分别找出 PID:0、PID:1 最后一次 RUN:cpu 的时间，记录完成时刻。数出 CPU 列为 1 的行数和空白行数，填写忙碌时间、空闲时间、总时间和 CPU 利用率。',
      '写出哪个进程先运行、哪个后运行，各自运行的时间范围，以及 CPU 是否出现空闲；没有空闲时明确写“无空闲”。粘贴本次完整时间表和末尾统计作为依据。',
      '解释 CPU 空闲情况与是否存在可运行进程的关系，说明本题是否发生了等待 I/O 的情况。写出“CPU 忙碌时间 ÷ 总时间 × 100%”并代入本次数字，核对利用率。',
    ],
    [
      '执行“计算进程先输入”的命令。进程 0 只执行计算，进程 1 只发起一次 I/O；保持命令中的 I/O 服务长度、-S 和 -I 不变。',
      '先标出进程 0 的计算区间，再标出进程 1 的 RUN:io、I/O 列非零的服务区间和 RUN:io_done。后两种 RUN 动作也占用 CPU，不属于 I/O 服务等待。',
      '记录总时间、CPU 忙碌时间和 I/O 忙碌时间。用这三段输出解释：为什么一次 I/O 的全过程不只等于 -L 指定的服务长度？',
    ],
    [
      '执行本题的两组命令：一组“I/O 进程先输入”，一组“计算进程先输入”。两组使用相同的任务、-L、-S 和 -I，只交换 -l 中的排列顺序。',
      '分别标出计算进程执行 RUN:cpu 的时间行和 I/O 服务的时间行。进程编号随输入位置改变，比较时按“计算进程”和“I/O 进程”识别，不把两组的同一编号当成同一种任务。',
      '并列记录两组总时间、CPU 利用率，以及 CPU 与 I/O 同时忙碌的时间行。解释输入顺序是否让计算覆盖了原本空闲的 I/O 等待区间。',
    ],
    [
      '执行“等待期间不切换”的命令：进程 0 先发起 I/O，进程 1 只执行计算，-S 为 SWITCH_ON_END，-I 为 IO_RUN_LATER。',
      '从进程 0 的 RUN:io 开始，逐行检查其阻塞期间进程 1 是否处于就绪（READY）状态，以及 CPU 列是否为空。记录全部 CPU 空闲区间。',
      '找出进程 1 第一次 RUN:cpu 的时刻，并记录总时间。结合 -S 的含义解释：为什么进程 1 已就绪，却仍未在这些时间行中运行？',
    ],
    [
      '分别执行“发起 I/O 后切换”和“等待期间不切换”两组命令。两组输入完全相同，-I 都为 IO_RUN_LATER，唯一改变的是 -S。',
      '在每组输出中标出进程 0 发起 I/O 的时刻、服务区间和进程 1 第一次 RUN:cpu 的时刻，检查计算与 I/O 是否在同一时间行发生。',
      '分别记录首次运行时刻、总时间和 CPU 利用率。引用阻塞后的具体输出行，解释 SWITCH_ON_IO 与 SWITCH_ON_END 如何改变 CPU 空闲时间。',
    ],
    [
      '执行“完成后等待选择”的命令。进程 0 连续发起 I/O，其余三个进程只执行计算；-S 为 SWITCH_ON_IO，-I 为 IO_RUN_LATER。',
      '对进程 0 的每次请求，按顺序记录 RUN:io、带 * 的完成事件和 RUN:io_done 的时刻。有下一次请求时，再记下它的 RUN:io 时刻；最后一次写“无下一次请求”。',
      '从每个 * 所在行到进程 0 再次出现 RUN:io_done 之前，列出由其他进程占用 CPU 的时间行。记录该等待区间；若两者同一行，等待长度为 0。',
      '解释“恢复就绪”为什么不等于“已经运行”，并用上述时间行说明下一次请求为何尚未发起。',
    ],
    [
      '执行“完成后立即选择”和“完成后等待选择”两组命令。四个进程、-L 和 SWITCH_ON_IO 保持相同，唯一改变的是 -I。',
      '分别记录进程 0 每次 RUN:io 的时刻、带 * 的完成事件，以及之后 RUN:io_done 和下一次 RUN:io 的时刻。最后一次请求没有后续请求，不计算其下一次请求间隔。',
      '比较两组下一次请求的发起时刻，并记录总时间、CPU 利用率和 I/O 利用率。检查完成事件之后哪个进程获得 CPU，用具体输出说明两种 -I 规则造成的差异。',
    ],
    [
      '本题有两个不同的 Python 种子，每个种子对应四组策略。记录每个种子下两个进程实际生成的 cpu/io 指令；3:50 不保证计算指令恰好占一半。',
      '同一种子内，依次执行四组策略对应的命令：SWITCH_ON_END 或 SWITCH_ON_IO，分别配 IO_RUN_LATER 或 IO_RUN_IMMEDIATE。保持 -l、-L 和 -s 不变，不修改生成的指令。',
      '按“种子 + 策略组合”记录总时间、CPU 利用率和 I/O 利用率。先在同一种子内比较四组结果，结合至少一次阻塞、CPU 切换或 I/O 完成前后的记录解释差异；若某两组相同，也说明相关事件之后选择的进程是否相同。',
      '对另一个种子重复以上比较。两个种子的指令序列可能不同，因此不能把跨种子的差异直接归因于策略。',
    ],
  ];
  const titles = ['纯计算进程与 CPU 利用率', '计算任务之后的 I/O 等待', '改变进程顺序', '等待期间不切换进程', '发起 I/O 后切换进程', 'I/O 完成后等待调度', 'I/O 完成后优先运行', '随机任务与规则组合'];
  const command = args => `python3 process-run.py ${args}`;
  const run = (label, args, input, pythonSeed = null) => ({label, input, pythonSeed, predictionCommand: command(args), command: command(args + ' -c -p')});
  const metrics = (runs, labels) => runs.flatMap((item, index) => labels.map(([id, label]) => ({id: `run-${index}-${id}`, label, section: item.label})));
  const analysis = [
    {id: 'prediction', label: '预测（选填）', multiline: true, section: '运行结果与分析'},
    {id: 'observation', label: '观察到的现象', multiline: true, section: '运行结果与分析'},
    {id: 'evidence', label: '实际输出或关键时间区间', multiline: true, section: '运行结果与分析'},
    {id: 'analysis', label: '分析与结论', multiline: true, section: '运行结果与分析'},
    {id: 'questions', label: '尚未解决的问题', multiline: true, section: '运行结果与分析'},
  ];
  const metricDescriptions = {
    total: ['全部进程完成所需的总时间（模拟时间单位）', '读取这组命令末尾统计中的总时间（Total Time），填写一个数字。它从模拟开始计到最后一个进程完成，不是机器运行脚本所用的秒数。'],
    busy: ['CPU 执行动作的时间单位数', '数出这组输出中 CPU 列为 1 的行数，并核对末尾 CPU 忙碌统计。填写时间单位数；RUN:cpu、RUN:io 和 RUN:io_done 都属于 CPU 动作。'],
    'cpu-busy': ['CPU 执行动作的时间单位数', '读取末尾 CPU 忙碌统计，或数 CPU 列为 1 的行数。填写时间单位数；计算、发起 I/O 和处理 I/O 完成都计入，I/O 服务等待本身不计入。'],
    idle: ['CPU 未执行动作的时间单位数', '数出 CPU 列为空的行数，也可用总时间减去 CPU 忙碌时间核对。填写时间单位数；若没有空闲，填写 0。'],
    'cpu-rate': ['CPU 利用率（%）', '读取这组输出末尾 CPU 忙碌统计中的百分比，填写带 % 的数值。计算方法为 CPU 忙碌时间 ÷ 总时间 × 100%，不是某一个进程占用 CPU 的比例。'],
    'io-busy': ['至少一个 I/O 请求正在服务的时间单位数', '读取末尾 I/O 忙碌统计，或数 I/O 列非零的行数。填写时间单位数；同一行即使有多个请求也只计一次，不把 RUN:io 和 RUN:io_done 的 CPU 动作算作服务时间。'],
    'io-rate': ['I/O 服务时间占总时间的比例（%）', '读取这组输出末尾 I/O 忙碌统计中的百分比，填写带 % 的数值。至少一个请求正在服务的行计入 I/O 忙碌；它可以与 CPU 忙碌重叠，因此两种利用率不必相加等于 100%。'],
    completion: ['进程 0、进程 1 各自的完成时刻', '分别查看 PID:0 和 PID:1 列，找出各自最后一次 RUN:cpu 所在行的时间。按“进程 0：时刻；进程 1：时刻”填写，不把两个值相加，也不使用后续行首次显示 DONE 的时间。'],
    first: ['进程 1 第一次执行计算的时刻', '在这组命令的 PID:1 列找到第一次 RUN:cpu，填写该行的时间。进程 1 已处于 READY 或就绪状态的行不算已经运行。'],
    overlap: ['计算与 I/O 服务同时进行的时间行', '找出计算进程显示 RUN:cpu、且同一行 I/O 列非零的时间。按“起始时刻–结束时刻（包含两端）”列出所有连续区间；没有这样的行就填“无重叠”。不要把发起或完成处理 I/O 的 CPU 动作当作计算指令。'],
    instructions: ['进程 0、进程 1 的指令顺序', '分别沿 PID:0、PID:1 列从上往下读取，只取 RUN: 后面的动作名，用 → 按顺序连接，每个进程写一行。RUN:cpu 记为 cpu，RUN:io 记为 io，RUN:io_done 记为 io_done（I/O 完成处理动作）。忽略“就绪、阻塞、完成”、时间和 * 标记，不要粘贴整张时间表。格式示例（仅表示写法）：进程 0：cpu → io → io_done；进程 1：io → io_done → cpu。具体顺序按本组实际输出填写，不用 3:50 参数代替，也不重新选择种子。'],
  };
  const eventDescriptions = {
    5: ['进程 0 每次 I/O 的完成与后续 CPU 动作时刻', '每次请求写一行：“第几次请求；RUN:io 发起时刻；* 完成时刻；RUN:io_done 处理时刻；下一次 RUN:io 时刻”。所有时刻从 PID:0 列和时间列读取；最后一次请求注明“无下一次请求”。'],
    6: ['进程 0 每次请求的发起、完成及下一次发起时刻', '在本组输出中逐次列出：“第几次请求；RUN:io 时刻；* 完成时刻；RUN:io_done 时刻；下一次 RUN:io 时刻”。可再用两次 RUN:io 的时刻差记录请求间隔；最后一次没有下一次请求，不计算这一间隔。'],
  };
  const reasoning = [
    [
      '查看运行结果前，写下你预计的两个进程完成顺序，以及 CPU 是否会空闲。不要求猜出所有时刻；已经看过结果可以留空，不必补写预测。',
      '',
      '',
      '',
    ],
    [
      '运行前写下你预计的顺序：进程 0 计算完成后，进程 1 会经历哪些 I/O 阶段，哪些阶段占用 CPU。可以留空，不要求事先给出正确时间。',
      '按输出顺序描述进程 0 的计算，以及进程 1 发起请求、等待服务和完成处理。明确 CPU 空闲出现在哪些阶段，不先把原因当成观察结果。',
      '粘贴包含 RUN:io、I/O 服务等待和 RUN:io_done 的时间行，并保留时间及 CPU/I/O 列；附上总时间和忙碌统计，支持三个阶段的划分。',
      '解释一次 I/O 为什么除了 -L 指定的服务等待，还包含发起和完成处理两个 CPU 动作；再说明本题在服务等待期间是否还有计算进程可以运行。',
    ],
    [
      '运行两组命令前，预测哪种输入顺序可能让计算与 I/O 服务同时进行，并写出你的理由。可以留空，不要求预先知道两组总时间。',
      '并列描述两组实际发生的计算/I/O 重叠区间和总时间差异。按任务类型称“计算进程”“I/O 进程”，不要把两组相同的 PID 当成同一种任务。',
      '分别粘贴两组中能显示 RUN:cpu 与 I/O 列的时间行，注明对应的输入顺序和 PID 含义；附上两组统计，不能只提供其中一组输出。',
      '回答：只交换输入顺序，为什么总时间或 CPU 利用率会改变，或者不改变？用两组的重叠与空闲区间说明计算是否覆盖了 I/O 等待。',
    ],
    [
      '运行前预测：进程 0 发起 I/O 后，在 SWITCH_ON_END 下进程 1 能否立即运行，CPU 会不会空闲。可以留空。',
      '根据实际输出写出进程 0 阻塞期间进程 1 的状态、CPU 是否执行动作，以及进程 1 最终何时第一次运行。这里先描述状态，不代替原因解释。',
      '粘贴进程 0 等待、进程 1 处于 READY/就绪而 CPU 列为空的相关行，以及进程 1 首次 RUN:cpu 的行；若未观察到某种情况，明确说明。',
      '解释“进程 1 已就绪”与“切换规则允许它获得 CPU”为什么是两件事。引用 SWITCH_ON_END 和实际等待行，说明本题 CPU 空闲与首次运行时刻的关系。',
    ],
    [
      '执行两组命令前，预测只把 -S 从 SWITCH_ON_END 改为 SWITCH_ON_IO，会如何影响进程 1 首次运行与 CPU 空闲。可以留空。',
      '分别描述两组在进程 0 发起 I/O 后，进程 1 何时开始运行，以及总时间和 CPU 利用率有什么差异；注明每组的 -S。',
      '分别粘贴两组从进程 0 的 RUN:io 到进程 1 首次 RUN:cpu 附近的时间行，保留 CPU/I/O 列；附上两组统计，便于核对是否发生重叠。',
      '只针对 -S 的改变解释结果：阻塞后是否切换到就绪进程，如何改变计算与 I/O 的重叠和 CPU 空闲？不要把保持相同的任务、-L 或 -I 当成差异原因。',
    ],
    [
      '运行前预测：IO_RUN_LATER 下，进程 0 的 I/O 完成后是否立即获得 CPU，以及下一次请求是否可能推迟。可以留空。',
      '逐次描述 * 完成事件后进程 0 是否立即执行 RUN:io_done；若存在等待，指出期间实际运行的是哪个进程，以及下一次 RUN:io 何时出现。',
      '粘贴每次 * 完成事件附近、进程 0 恢复运行及下一次发起请求附近的时间行。保留各 PID 和 CPU 列，证明等待期间谁在运行。',
      '结合 IO_RUN_LATER，解释为什么完成 I/O 后恢复就绪不等于已经获得 CPU；用等待区间说明其他计算进程如何影响下一次请求的发起。',
    ],
    [
      '运行前预测：只改变 -I 时，刚完成 I/O 的进程会不会立即获得 CPU，下一次请求的发起时刻是否可能改变。可以留空。',
      '并列描述两组 * 完成事件后的 CPU 运行者、下一次请求时刻和统计差异；明确每组使用 IO_RUN_IMMEDIATE 还是 IO_RUN_LATER。',
      '从两组各取相同请求序号的完成事件及后续 RUN:io_done、RUN:io 时间行，注明策略。保留其他 PID 列，以核对是否发生运行者切换。',
      '解释 -I 如何影响完成事件后的进程选择、下一次请求及 I/O 连续服务机会；把总时间和两种利用率差异对应到具体事件，不只重复统计数字。',
    ],
    [
      '先读取指令但尚未执行统计命令时，可预测同一种子四种策略在哪些阻塞或完成事件上选择不同进程。预测选填；读取实际指令本身不是预测。',
      '每个种子分别比较四组实际统计，写出哪些策略结果相同、哪些不同，以及能观察到的运行者变化。不要把不同种子的结果混作同一组对照。',
      '注明种子和 -S/-I 组合，粘贴对应实际指令，以及可解释差异的阻塞、切换或完成事件时间行；相同结果也应提供支持相同选择的输出。',
      '先在同一种子内说明策略如何改变某个具体事件后的运行者和时间结果；再说明跨种子时指令也变了。若某两组结果相同，解释相关事件上为何没有产生不同选择。',
    ],
  ];
  const describeField = (task, field) => {
    if (task.layout === 'integrated') {
      const index = Number(task.id.slice(-2)) - 1;
      return field.id === 'analysis' && answerFormats[index] ? {...field, placeholder: answerFormats[index]} : field;
    }
    const taskIndex = Number(task.id.match(/^process-(\d{2})$/)?.[1]) - 1;
    if (!reasoning[taskIndex]) return field;
    const analysisIndex = analysis.findIndex(item => item.id === field.id);
    if (analysisIndex >= 0) return {...field,
      label: (taskIndex === 0
        ? ['运行前的预测（选填）', '两个进程的运行顺序与 CPU 空闲情况', '本次运行的完整时间表与统计', 'CPU 空闲情况的原因与利用率计算', '仍不理解的问题（选填）']
        : ['运行前的预测（选填）', '实际观察到的过程与差异', '支持观察的原始输出与时间行', '原因解释与本题结论', '仍不理解的问题（选填）'])[analysisIndex],
      optional: analysisIndex === 0 || analysisIndex === 4,
      help: analysisIndex < 4 ? reasoning[taskIndex][analysisIndex] : '写明你仍不能解释的状态、时间行或规则，以及不清楚的具体原因。没有疑问可填写“暂无”或留空，不必为了填满而编造问题。',
      placeholder: taskIndex === 0 ? {
        observation: '先运行：进程 __，时间 __ 至 __\n后运行：进程 __，时间 __ 至 __\nCPU 空闲时间行：__（没有则填“无空闲”）',
        evidence: '粘贴本次完整时间表（从表头到最后一个时间行）\n粘贴末尾总时间、CPU 忙碌时间和利用率统计',
        analysis: 'CPU 空闲情况：__\n原因：__（结合就绪/运行状态与 I/O 等待）\nCPU 利用率 = 忙碌时间 ÷ 总时间 × 100%\n代入计算：__ ÷ __ × 100% = __%',
      }[field.id] : undefined,
    };
    const metricId = field.id.replace(/^run-\d+-/, '');
    let description = metricDescriptions[metricId];
    if (metricId === 'events') description = eventDescriptions[taskIndex];
    if (metricId === 'waiting') description = ['进程 0 完成 I/O 后等待 CPU 的区间与长度', '对每次请求，从 * 完成时刻记到 RUN:io_done 之前的最后一行，写出区间、等待长度和期间运行的进程。长度为 RUN:io_done 时刻减去 * 时刻；若同一行完成并处理，填写“无等待，长度 0”。'];
    if (metricId === 'idle' && taskIndex === 3) description = ['CPU 空闲的全部时间区间', '找出 CPU 列为空的行，按“起始时刻–结束时刻（包含两端）”逐段填写，不只填空闲总数。结合 PID:0 的阻塞和 PID:1 的就绪状态确认这些行；没有空闲就填“无空闲”。'];
    return description ? {...field, label: description[0], help: description[1], multiline: ['events', 'waiting', 'instructions', 'overlap'].includes(metricId) || (metricId === 'idle' && taskIndex === 3)} : field;
  };
  const generate = seed => {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid experiment seed');
    let state = seed || 0x6d2b79f5;
    const integer = (min, max) => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return min + (state >>> 0) % (max - min + 1);
    };
    const length = integer(3, 5);
    const cpu = length + integer(1, 2);
    const pure = `${integer(3, 6)}:100,${integer(3, 6)}:100`;
    const cpuFirst = `${cpu}:100,1:0`;
    const ioFirst = `1:0,${cpu}:100`;
    const repeated = `${integer(3, 4)}:0,${integer(5, 7)}:100,${integer(5, 7)}:100,${integer(5, 7)}:100`;
    const pythonSeeds = [1, 3, 7];
    const seedIndex = integer(0, pythonSeeds.length - 1);
    const selectedSeeds = [pythonSeeds[seedIndex], pythonSeeds[(seedIndex + 1) % pythonSeeds.length]];
    const args = (input, switchRule = 'SWITCH_ON_IO', doneRule = 'IO_RUN_LATER') => `-l ${input} -L ${length} -S ${switchRule} -I ${doneRule}`;
    const runs = [
      [run('纯计算', args(pure), pure)],
      [run('计算进程先输入', args(cpuFirst), cpuFirst)],
      [run('I/O 进程先输入', args(ioFirst), ioFirst), run('计算进程先输入', args(cpuFirst), cpuFirst)],
      [run('等待期间不切换', args(ioFirst, 'SWITCH_ON_END'), ioFirst)],
      [run('发起 I/O 后切换', args(ioFirst), ioFirst), run('等待期间不切换', args(ioFirst, 'SWITCH_ON_END'), ioFirst)],
      [run('完成后等待选择', args(repeated), repeated)],
      [run('完成后立即选择', args(repeated, 'SWITCH_ON_IO', 'IO_RUN_IMMEDIATE'), repeated), run('完成后等待选择', args(repeated), repeated)],
      selectedSeeds.flatMap(pythonSeed => ['SWITCH_ON_END', 'SWITCH_ON_IO'].flatMap(switchRule => ['IO_RUN_LATER', 'IO_RUN_IMMEDIATE'].map(doneRule => run(`种子 ${pythonSeed} · ${switchRule} / ${doneRule}`, args('3:50,3:50', switchRule, doneRule) + ` -s ${pythonSeed}`, '3:50,3:50', pythonSeed)))),
    ];
    const labels = [
      [['completion', '两个进程各自的完成时刻'], ['total', '总时间'], ['busy', 'CPU 忙碌时间'], ['idle', 'CPU 空闲时间'], ['cpu-rate', 'CPU 利用率']],
      [['total', '总时间'], ['cpu-busy', 'CPU 忙碌时间'], ['io-busy', 'I/O 忙碌时间']],
      [['total', '总时间'], ['cpu-rate', 'CPU 利用率'], ['overlap', 'CPU 与 I/O 同时忙碌的区间']],
      [['first', '进程 1 首次运行时刻'], ['idle', 'CPU 空闲区间'], ['total', '总时间']],
      [['first', '进程 1 首次运行时刻'], ['total', '总时间'], ['cpu-rate', 'CPU 利用率']],
      [['events', '每次 I/O 完成、CPU 完成处理及下一次请求的时刻'], ['waiting', '恢复就绪至再次运行的等待区间']],
      [['events', '相邻请求的发起与完成时刻'], ['total', '总时间'], ['cpu-rate', 'CPU 利用率'], ['io-rate', 'I/O 利用率']],
      [['instructions', '实际生成的指令序列'], ['total', '总时间'], ['cpu-rate', 'CPU 利用率'], ['io-rate', 'I/O 利用率']],
    ];
    return runs.map((items, index) => ({
      id: `process-${String(index + 1).padStart(2, '0')}`, title: titles[index], question: questions[index],
      conditions: `单核；I/O 服务长度为 ${length} 个模拟时间单位；基本操作数不包含附加的 I/O 完成处理动作。${index === 7 ? '同一个 Python 种子内保持生成条件不变，只比较切换和完成规则；不同种子分别分析。' : index === 2 ? '两次运行只交换进程输入顺序，任务组成与策略不变。' : index === 4 ? '两次运行只改变 -S，任务、I/O 服务长度和 -I 不变。' : index === 6 ? '两次运行只改变 -I，任务、I/O 服务长度和 -S 不变。' : '使用命令明确给出的输入及策略，不以固定示例替代本次输入。'}`,
      runs: items, fields: [...metrics(items, labels[index]), ...structuredClone(analysis)].map(field => describeField({id: `process-${String(index + 1).padStart(2, '0')}`}, field)),
      evidenceHint: index === 5 || index === 6 ? '时间后的 * 是 I/O 完成事件；RUN:io_done 是实际获得 CPU 后的完成处理，两者时刻可能不同。' : '从实际输出逐行读取时间、状态和 CPU/I/O 列；末尾统计用于核对，不能代替关键时段的逐行记录。',
    }));
  };
  const integratedTitles = ['计算与 I/O 等待', '阻塞后的进程切换', 'I/O 完成后的调度', '随机任务与规则组合（选做）'];
  const integratedQuestions = [
    '计算能否在 I/O 等待期间执行？交换两个进程的输入顺序后，总时间和 CPU 利用率为什么变化？',
    '一个进程等待 I/O 时，SWITCH_ON_IO 与 SWITCH_ON_END 怎样影响另一个就绪进程运行？',
    'I/O 完成后立即运行该进程，会怎样影响下一次请求的发起和全部进程完成的时间？',
    '保持随机指令相同，四种切换与完成规则在哪些事件上产生不同的进程选择？',
  ];
  const integratedRequirements = [
    ['两组输入包含相同的计算任务和一次 I/O，只交换进程顺序；I/O 服务长度、-S 和 -I 保持不变。', '找出计算进程为 RUN:cpu、同时 I/O 列非零的时间行。比较两组总时间和 CPU 利用率，说明等待 I/O 时能否执行计算，以及这对 CPU 空闲时间和总时间的影响。'],
    ['沿用实验 1 的“I/O 进程先输入”输出，再运行 SWITCH_ON_END 条件。只改变 -S，其他参数不变。', '找出两组中计算进程第一次出现 RUN:cpu 的时刻。I/O 等待期间，它已就绪时 CPU 是否运行它？用 -S 的规定说明原因。'],
    ['进程 0 连续发起 I/O，另外三个进程只计算。两组都用 SWITCH_ON_IO，只改变 -I。', '比较进程 0 的第一次 I/O 请求：记录带 * 的完成时刻、RUN:io_done 的处理时刻，以及第二次 RUN:io 的发起时刻。哪组先发起第二次请求？两组总时间有什么不同？'],
    ['四组使用同一个 Python 种子，生成的指令相同，只比较 -S、-I 的四种组合。', '选同一次 I/O 发起或完成，比较之后是谁运行，再比较总时间。若结果相同，说明这些规则在本次指令下为何选中了相同的进程。'],
  ];
  const answerFormats = [
    '两组总时间与 CPU 利用率：__\nRUN:cpu 且 I/O 列非零的时间行：__\nI/O 等待时计算能否执行：__\nCPU 空闲时间和总时间为何不同：__',
    '计算进程首次出现 RUN:cpu 的时刻：__\n它已就绪时，CPU 是否运行它：__\n两种 -S 规则的选择与原因：__',
    '第一次 I/O 完成与 RUN:io_done 的时刻：__\n两组第二次 RUN:io 的时刻：__\n第二次请求与总时间的比较及原因：__',
    '比较的同一次 I/O 发起或完成：__\n四种规则之后运行的进程：__\n总时间相同或不同的原因：__',
  ];
  const generateIntegrated = seed => {
    const templates = generate(seed);
    const reuse = {taskId: 'process-01', fieldId: 'run-1-output'};
    const groups = [
      [templates[2].runs[1], templates[2].runs[0]],
      [{...templates[4].runs[0], label: '发起 I/O 后切换（实验 1 的对照结果）', reuse}, templates[4].runs[1]],
      templates[6].runs,
      templates[7].runs.slice(0, 4),
    ];
    return groups.map((runs, index) => ({
      id: `process-${String(index + 1).padStart(2, '0')}`, title: integratedTitles[index],
      question: integratedQuestions[index], layout: 'integrated', optional: index === 3,
      conditions: integratedRequirements[index][0],
      runs,
      fields: [...runs.map((run, runIndex) => ({
        id: `run-${runIndex}-output`, label: `${run.label} · 原始输出`, section: run.label,
        multiline: true, help: '', placeholder: '粘贴本次完整运行输出，包括时间表和末尾统计', ...(run.reuse ? {reuse: run.reuse} : {}),
      })), {id: 'analysis', label: '比较与解释', section: '回答', multiline: true, help: '', placeholder: answerFormats[index]}],
      evidenceHint: '',
    }));
  };
  const describeFields = task => {
    const fields = task.fields.map(field => describeField(task, field));
    if (task.layout !== 'integrated') return fields;
    if (task.id !== 'process-01') {
      const index = Number(task.id.slice(-2)) - 1;
      const metrics = index === 1 ? [['first-cpu','计算进程首次 RUN:cpu 的时刻']] : index === 2 ? [['io-complete','第一次 I/O 完成时刻（*）'],['io-handled','第一次 RUN:io_done 时刻'],['next-io','第二次 RUN:io 时刻'],['total','总时间（模拟时间单位）']] : [['total','总时间（模拟时间单位）'],['event-runner','所选事件之后运行的进程']];
      const comparison = task.runs.flatMap((run, runIndex) => metrics.map(([id,label])=>({id:`run-${runIndex}-${id}`,label,section:run.label,kind:'comparison'})));
      const evidence = {id:'event-evidence',label:index===1?'阻塞期间的运行记录':index===2?'I/O 完成前后的运行记录':'同一事件在四种规则下的记录',section:'回答',multiline:true,rows:3,help:index===1?'注明 I/O 阻塞的时间行、计算进程的状态与 CPU 动作。':index===2?'分别保留第一次 *、之后 RUN:io_done 与第二次 RUN:io 附近的时间行。':'注明同一次 I/O 发起或完成事件；分别记录四种规则之后是谁运行。'};
      const help = index===1?'说明计算进程已就绪时 CPU 是否运行它，并结合两种 -S 规则解释。':index===2?'哪组先发起第二次请求？结合完成后 CPU 选择与总时间说明原因。':'结合相同事件后的进程选择与总时间解释差异；结果相同时，也说明为什么。';
      return [...fields.filter(field=>field.kind!=='comparison'&&field.id!=='analysis'&&field.id!=='event-evidence'),...comparison,evidence,...fields.filter(field=>field.id==='analysis').map(field=>({...field,label:'原因解释',rows:3,placeholder:'',help}))];
    }
    const comparison = task.runs.flatMap((run, index) => [
      {id: `run-${index}-total`, label: '总时间（模拟时间单位）', section: run.label, kind: 'comparison'},
      {id: `run-${index}-cpu-rate`, label: 'CPU 利用率（%）', section: run.label, kind: 'comparison'},
    ]);
    const evidence = {id: 'overlap-evidence', label: '运行记录', section: '回答', multiline: true, rows: 3, help: '分别注明两组中 RUN:cpu 且 I/O 列非零的时间行；没有重叠时写“无重叠”。'};
    return [...fields.filter(field => field.id !== 'analysis'), ...comparison.filter(field => !fields.some(existing => existing.id === field.id)), ...(fields.some(field => field.id === evidence.id) ? [] : [evidence]), ...fields.filter(field => field.id === 'analysis').map(field => ({...field, label: '原因解释', rows: 3, placeholder: '', help: '说明 I/O 等待时计算能否执行，以及重叠或空闲区间怎样影响总时间和 CPU 利用率。'}))];
  };
  return {
    scope: {project: 'oslab', chapterId: 'process', assignmentId: 'process-homework'},
    version: 'process-homework-v2', generationVersion: 'process-integrated-xorshift32-v2',
    chapterTitle: '进程', assignmentTitle: '进程作业', titles: integratedTitles, questions: integratedQuestions, requirements: integratedRequirements, describeField, describeFields,
    describeExperiment: tasks => {
      const length = tasks[0].runs[0].command.match(/(?:^|\s)-L (\d+)(?:\s|$)/)[1];
      return [
        ['CPU 执行条件', '单核：每个时间单位只允许一个进程执行 CPU 动作。'],
        ['I/O 服务时间（-L）', `${length} 个模拟时间单位。发起请求和处理完成都还需要 CPU 时间，不算在这段服务时间里。`],
        ['进程操作数量（-l X:Y）', 'X 统计计算指令和 I/O 请求的数量；每次 I/O 请求另外附加一次占用 CPU 的完成处理动作。'],
      ];
    },
    generationRule: '网页用随机 32 位种子和 xorshift32 选择模板参数。I/O 长度 3–5；配对计算长度比 I/O 长度多 1–2；连续 I/O 操作数 3–4，其余计算长度各 5–7。三组必做共五次新运行，第二组复用第一组相同命令的输出。选做使用 Python 种子 1、3、7 中的一个，比较四种策略组合。保存实际命令；不假定网页生成器与 Python 随机数相同。',
    program: {name: 'process-run.py', version: 'OSTEP cpu-intro / commit 4c290a92a5ab86bc45512957c91cb24dc7845fc0 / Python 3', source: 'https://github.com/remzi-arpacidusseau/ostep-homework/tree/master/cpu-intro', download: 'https://raw.githubusercontent.com/remzi-arpacidusseau/ostep-homework/4c290a92a5ab86bc45512957c91cb24dc7845fc0/cpu-intro/process-run.py', sha256: '1d87ed7af6d8768b30df2043e2bed7cccb419ff132db8a54a033a4a89370b861', verifiedLocalSha256: '02ab36a6d99d66feecdb013618cbd3fe0a6bdcef8e624abfebde4f2afe748d61', runtime: 'Python 3；当前核对环境为 Ubuntu 22.04 / Python 3.10.12'},
    generate: generateIntegrated,
  };
})();