globalThis.OSLabSchedulingHomework = (() => {
  const conditions = [
    '三个作业等长，同一个输入分别使用 FIFO 与 SJF。',
    '同一组三种长度分别按从短到长、从长到短输入，每种顺序各使用 FIFO 与 SJF。',
    '保持 SJF 和长度比例 1:2:3，第二、三组长度分别为第一组的 2 倍、4 倍。',
    '两组都使用 RR 和相同时间片，输入分别为三个等长作业和三个不同长度的作业。',
    '保持作业长度、队列顺序和 RR 不变，只改变时间片；另用自选作业数量验证队尾作业的首次响应。',
    '同一组长度按两种顺序输入，各使用 FIFO 与 SJF；另验证等长列表和非递减列表。',
    '对同一输入比较 SJF 与不同时间片的 RR，再比较等长作业；用自选输入检验所得条件，再改变顺序或时间片比较不满足条件的结果。',
  ];
  const questions = [
    'FIFO 与 SJF 的执行顺序和各项时间是否相同？等长作业的输入顺序怎样影响选择？',
    '哪些长度的作业先获得 CPU？输入顺序改变后，FIFO 与 SJF 的平均响应、周转时间怎样变化？',
    '作业长度成倍增加时，平均响应时间怎样变化？后面的作业在首次运行前等待了哪些 CPU 工作？',
    '首次获得 CPU 较早是否意味着较早完成？比较两组响应、周转与后续排队等待。',
    '时间片怎样影响队尾作业的首次响应？写明队尾响应上界的前提，并用自选列表验证。',
    '什么作业长度和输入顺序能使 FIFO 与 SJF 的周转时间相同？分别比较单个作业、平均值和全部完成时间。',
    '什么输入顺序和时间片能使 SJF 与 RR 的响应时间相同？用首次运行时刻检验你的条件。',
  ];
  const formats = [
    '两种策略的执行顺序：__\n各作业的响应、周转、等待时间比较：__\n等长作业的选择依据：__',
    '按作业长度识别的执行顺序：__\n四组平均响应与周转时间：__\n输入顺序对两种策略的影响：__',
    '三组作业首次运行的时刻：__\n平均响应时间与长度放大比例：__\n后续作业等待的 CPU 工作：__',
    '第一轮各作业首次运行的时刻：__\n完成时刻与累计等待的比较：__\n首次响应与后续排队的区别：__',
    '四种时间片下队尾的首次响应：__\n响应上界及适用前提：__\n自选列表的实际结果与验证：__',
    '逐作业周转时间与平均值的比较：__\n结果相同的长度和顺序条件：__\n全部完成时间相同是否足够：__',
    '逐作业响应时间与平均值的比较：__\n结果相同的输入和时间片条件：__\n自选验证与不满足条件的例子：__',
  ];
  const createLegacyDefinition = groups => {
    const specifications = groups.flatMap(group => group.tasks);
    const generate = seed => {
      if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid experiment seed');
      const factor = 1 + seed % 3;
      return specifications.map((task, index) => {
        const runs = task.commands.map(args => {
          const input = args.match(/-l ([\d,]+)/)[1].split(',').map(value => Number(value) * factor).join(',');
          const policy = args.match(/-p (FIFO|SJF|RR)/)[1];
          const quantum = args.match(/-q (\d+)/);
          const actual = args.replace(/-l [\d,]+/, `-l ${input}`).replace(/-q (\d+)/, (_, value) => `-q ${Number(value) * factor}`);
          const command = `python3 scheduler.py ${actual}`;
          return {label: `${policy} · ${input}${quantum ? ` · q=${Number(quantum[1]) * factor}` : ''}`, input, command, predictionCommand: command, pythonSeed: null};
        });
        const field = (id, label, section, placeholder, kind) => ({id, label, section, placeholder, kind, multiline: true, help: ''});
        return {
          id: `scheduling-${task.number}`, title: task.title, question: questions[index], conditions: conditions[index],
          layout: 'integrated', inputLabel: 'CPU 需求列表', answerTitle: '比较与解释', runs,
          fields: [
            ...runs.map((run, runIndex) => field(`run-${runIndex}-output`, `${run.label} · 原始输出`, run.label,
              '粘贴本次执行轨迹与最终统计\n长轨迹保留首次运行、完成附近的片段\n注明截取的时间范围', 'output')),
            ...(index >= 4 ? [
              field('extra-command', '自选验证的命令', '补充验证', '粘贴自选验证所用的完整命令\n保留作业列表、策略和时间片', 'command'),
              field('extra-output', '自选验证的输出', '补充验证', '粘贴自选验证的轨迹与最终统计\n注明命令与各次运行的对应关系', 'output'),
            ] : []),
            field('analysis', '比较与解释', '回答', formats[index], 'analysis'),
          ],
        };
      });
    };
    const source = 'https://github.com/remzi-arpacidusseau/ostep-homework/tree/4c290a92a5ab86bc45512957c91cb24dc7845fc0/cpu-sched';
    return {
      scope: {project: 'oslab', chapterId: 'scheduling-basics', assignmentId: 'scheduling-homework'},
      version: 'scheduling-homework-v1', generationVersion: 'scheduling-inputs-v1',
      chapterTitle: 'CPU 调度基础', assignmentTitle: 'CPU 调度基础作业',
      generationRule: '网页保存随机 32 位种子，按 1 + seed mod 3 选择统一时长倍数；模板中的全部 CPU 需求与 RR 时间片同步乘以该倍数，保持相对长度、顺序和时间片对照。实际命令随记录保存，恢复时不重新生成。',
      program: {name: 'scheduler.py', version: 'OSTEP cpu-sched / commit 4c290a92a5ab86bc45512957c91cb24dc7845fc0', source, download: source, runtime: 'Ubuntu 22.04 / Python 3'},
      describeField: (task, field) => /^run-\d+-output$/.test(field.id)
        ? {...field, label: '运行输出', placeholder: '粘贴执行轨迹和最终统计\n长轨迹可摘录，并注明时间范围'}
        : field,
      describeExperiment: () => [
        ['CPU 与到达条件', '单核，全部作业在时刻 0 到达；作业只需要 CPU，不发起 I/O。'],
        ['切换与时间', '切换开销取零；输入时长和输出中的时间属于模拟时间，不是运行命令所花的实际秒数。'],
        ['作业编号与策略', '编号按本组输入位置从 0 开始；FIFO、SJF、RR 决定执行顺序。交换列表后，比较同一长度的作业，而非直接比较同一编号。'],
      ],
      generate,
    };
  };
  const createDefinition = () => {
    const answerFormats = ['FIFO 与 SJF 的运行顺序：__\n各作业完成时刻与平均周转时间：__\n短作业先运行对完成时刻的影响：__', '各作业第一次运行和完成的时刻：__\n较早获得 CPU 是否也较早完成：__\n大时间片 RR 与 FIFO 的运行顺序：__'];
    const comparisonFormat = '各作业在 FIFO 和 SJF 下的周转时间：__\n两次平均周转时间及是否相同：__\n两种策略在此输入下的运行顺序与原因：__';
    const generate = seed => {
      if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid experiment seed');
      const factor = 1 + seed % 3;
      const input = [6, 2, 4].map(length => length * factor).join(',');
      const run = (policy, quantum, jobInput = input) => {
        const command = `python3 scheduler.py -l ${jobInput} -p ${policy}${quantum ? ` -q ${quantum}` : ''}`;
        return {label: `${policy}${quantum ? ` · q=${quantum}` : ''}`, input: jobInput, command, predictionCommand: command, pythonSeed: null};
      };
      const field = (id, label, section, placeholder, kind) => ({id, label, section, placeholder, kind, multiline: true, help: ''});
      const build = (id, title, conditions, question, runs, placeholder) => ({id, title, conditions, question, layout: 'integrated', inputLabel: 'CPU 需求列表', answerTitle: '比较与解释', runs,
        fields: [...runs.map((item, index) => field(`run-${index}-output`, '运行输出', item.label, '粘贴完整执行轨迹和最终统计', 'output')), field('analysis', '比较与解释', '回答', placeholder, 'analysis')]});
      const first = build('scheduling-01', '执行顺序与完成时间', '两次使用相同列表和输入顺序，一次用 FIFO，一次用 SJF。',
        '列出两种策略的运行顺序和各作业完成时刻，再比较平均周转时间。短作业先运行，为什么会改变这些完成时刻？', [run('FIFO'), run('SJF')],
        answerFormats[0]);
      const second = build('scheduling-02', '时间片与首次响应', '两次使用相同列表和 RR，只改变时间片。较大的时间片足以让任一作业一次运行到完成；FIFO 输出沿用第 1 题。',
        '列出两种时间片下各作业第一次运行和完成的时刻。较早获得 CPU 的作业是否也较早完成？再比较大时间片 RR 与第 1 题 FIFO 的运行顺序。', [run('RR', factor), run('RR', 6 * factor)],
        answerFormats[1]);
      second.fields.splice(2, 0, {...field('reference-fifo', '实验 1 的 FIFO 对照输出', '已有对照', '', 'reference'), reuse: {taskId: 'scheduling-01', fieldId: 'run-0-output'}});
      const optional = {...build('scheduling-03', '输入已按时长排序时的周转时间（选做）', '作业 0、1、2 分别需要 2、4、6 个时间单位，全部在时刻 0 到达。两次保持这一输入顺序，分别使用 FIFO 和 SJF。',
        '从两次最终统计中，按相同作业编号逐一比较周转时间，再比较平均周转时间。结果是否相同？说明两种策略在这个输入下按什么顺序运行作业。',
        [run('FIFO', null, '2,4,6'), run('SJF', null, '2,4,6')], comparisonFormat), optional: true};
      return [first, second, optional];
    };
    const source = 'https://github.com/remzi-arpacidusseau/ostep-homework/tree/4c290a92a5ab86bc45512957c91cb24dc7845fc0/cpu-sched';
    return {scope: {project: 'oslab', chapterId: 'scheduling-basics', assignmentId: 'scheduling-homework'}, version: 'scheduling-homework-v3', generationVersion: 'scheduling-compact-v3', chapterTitle: 'CPU 调度基础', assignmentTitle: 'CPU 调度基础作业',
      generationRule: '网页保存 32 位种子；按 1 + seed mod 3 将必做输入 6,2,4 与时间片 1,6 同步缩放。两题必做共四次运行，第二题引用第一题的 FIFO 输出。选做固定输入 2,4,6，分别使用 FIFO 与 SJF，共两次运行。实际命令随记录保存，恢复时不重新生成。',
      program: {name: 'scheduler.py', version: 'OSTEP cpu-sched / commit 4c290a92a5ab86bc45512957c91cb24dc7845fc0', source, download: source, runtime: 'Ubuntu 22.04 / Python 3'},
      describeField: (task, item) => {
        const format = task.id === 'scheduling-03' ? comparisonFormat : answerFormats[Number(task.id.slice(-2)) - 1];
        return item.id === 'analysis' && format ? {...item, placeholder: format} : item;
      },
      describeExperiment: () => [['CPU 与到达条件', '单核，全部作业在时刻 0 到达；只有 CPU 工作，没有 I/O，切换开销取零。'], ['时间与编号', '时间是按输入计算的模拟时间；编号按本组列表位置从 0 开始，不表示作业长短。']],
      generate,
    };
  };
  return {createDefinition, createLegacyDefinition};
})();